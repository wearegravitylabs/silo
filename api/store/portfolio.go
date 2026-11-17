package store

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

//go:generate mockgen -source portfolio.go -destination ./mock/mock_portfolio.go -package mock PortfolioDatabase

// PortfolioDatabase defines all persistence operations for portfolios.
type PortfolioDatabase interface {
	CreatePortfolio(ctx context.Context, portfolio model.Portfolio) (model.Portfolio, error)
	GetPortfolioByID(ctx context.Context, id, callerID uuid.UUID) (model.Portfolio, error)
	// GetPortfolio loads a portfolio without checking membership. Use it only
	// where the caller's access has already been checked (route middleware).
	GetPortfolio(ctx context.Context, id uuid.UUID) (model.Portfolio, error)
	ListPortfoliosByUser(ctx context.Context, userID uuid.UUID) ([]model.Portfolio, error)
	ListPortfoliosFiltered(ctx context.Context, userID uuid.UUID, filter model.ListPortfoliosFilter, page model.Page) ([]model.Portfolio, model.PageInfo, error)
	UpdatePortfolio(ctx context.Context, portfolio model.Portfolio) (model.Portfolio, error)
	SoftDeletePortfolio(ctx context.Context, id uuid.UUID) error
	CountOwners(ctx context.Context, portfolioID uuid.UUID) (int64, error)
	AddMember(ctx context.Context, member model.PortfolioMember) error
	RemoveMember(ctx context.Context, portfolioID, userID uuid.UUID) error
	// GetMember returns an active member: the access check. Someone who was
	// invited but hasn't accepted is not found.
	GetMember(ctx context.Context, portfolioID, userID uuid.UUID) (model.PortfolioMember, error)
	// GetMembership returns the member row whatever its status.
	GetMembership(ctx context.Context, portfolioID, userID uuid.UUID) (model.PortfolioMember, error)
	UpdateMember(ctx context.Context, member model.PortfolioMember) error
	// ListMembers returns active and invited members, with their users.
	ListMembers(ctx context.Context, portfolioID uuid.UUID) ([]model.PortfolioMember, error)
	// ListInvitesForUser returns the user's not-yet-accepted invites.
	ListInvitesForUser(ctx context.Context, userID uuid.UUID) ([]model.PortfolioMember, error)
	// ListLiveIDs returns the id of every portfolio that is not deleted, for
	// scheduled jobs that run over all portfolios.
	ListLiveIDs(ctx context.Context) ([]uuid.UUID, error)
	// RowBelongsTo reports whether the row with the given id in table has
	// column = parentID. table and column must come from code, never a request.
	RowBelongsTo(ctx context.Context, table, column string, id, parentID uuid.UUID) (bool, error)
}

type portfolioStore struct{ storage *Store }

// NewPortfolioStore returns a PortfolioDatabase backed by the given Store.
func NewPortfolioStore(s *Store) PortfolioDatabase { return &portfolioStore{storage: s} }

func (p *portfolioStore) CreatePortfolio(ctx context.Context, portfolio model.Portfolio) (model.Portfolio, error) {
	if err := p.storage.DB.WithContext(ctx).Create(&portfolio).Error; err != nil {
		return model.Portfolio{}, siloErrors.ErrGenericErr
	}
	return portfolio, nil
}

// GetPortfolioByID fetches a portfolio and its members, but only when callerID is an
// active member of that portfolio. This enforces ownership at the query level so that
// even if middleware is bypassed, a caller can never read another user's portfolio.
func (p *portfolioStore) GetPortfolioByID(ctx context.Context, id, callerID uuid.UUID) (model.Portfolio, error) {
	var portfolio model.Portfolio
	err := p.storage.DB.WithContext(ctx).
		Joins("JOIN portfolio_members pm ON pm.portfolio_id = portfolios.id AND pm.user_id = ? AND pm.status = 'active'", callerID).
		Preload("Members").
		Where("portfolios.id = ? AND portfolios.deleted_at IS NULL", id).
		First(&portfolio).Error
	if err == gorm.ErrRecordNotFound {
		return model.Portfolio{}, siloErrors.ErrPortfolioNotFound
	}
	if err != nil {
		return model.Portfolio{}, siloErrors.ErrGenericErr
	}
	return portfolio, nil
}

func (p *portfolioStore) GetPortfolio(ctx context.Context, id uuid.UUID) (model.Portfolio, error) {
	var portfolio model.Portfolio
	err := p.storage.DB.WithContext(ctx).
		Where("id = ? AND deleted_at IS NULL", id).
		First(&portfolio).Error
	if err == gorm.ErrRecordNotFound {
		return model.Portfolio{}, siloErrors.ErrPortfolioNotFound
	}
	if err != nil {
		return model.Portfolio{}, siloErrors.ErrGenericErr
	}
	return portfolio, nil
}

func (p *portfolioStore) ListPortfoliosByUser(ctx context.Context, userID uuid.UUID) ([]model.Portfolio, error) {
	var portfolios []model.Portfolio
	err := p.storage.DB.WithContext(ctx).
		Joins("JOIN portfolio_members ON portfolio_members.portfolio_id = portfolios.id").
		Where("portfolio_members.user_id = ? AND portfolio_members.status = 'active' AND portfolios.deleted_at IS NULL", userID).
		Find(&portfolios).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return portfolios, nil
}

func (p *portfolioStore) UpdatePortfolio(ctx context.Context, portfolio model.Portfolio) (model.Portfolio, error) {
	if err := p.storage.DB.WithContext(ctx).Save(&portfolio).Error; err != nil {
		return model.Portfolio{}, siloErrors.ErrGenericErr
	}
	return portfolio, nil
}

func (p *portfolioStore) SoftDeletePortfolio(ctx context.Context, id uuid.UUID) error {
	return p.storage.DB.WithContext(ctx).
		Model(&model.Portfolio{}).
		Where("id = ?", id).
		Update("deleted_at", gorm.Expr("NOW()")).Error
}

func (p *portfolioStore) AddMember(ctx context.Context, member model.PortfolioMember) error {
	if err := p.storage.DB.WithContext(ctx).Create(&member).Error; err != nil {
		return siloErrors.ErrMemberAlreadyExists
	}
	return nil
}

func (p *portfolioStore) RemoveMember(ctx context.Context, portfolioID, userID uuid.UUID) error {
	return p.storage.DB.WithContext(ctx).
		Where("portfolio_id = ? AND user_id = ?", portfolioID, userID).
		Delete(&model.PortfolioMember{}).Error
}

func (p *portfolioStore) GetMember(ctx context.Context, portfolioID, userID uuid.UUID) (model.PortfolioMember, error) {
	var member model.PortfolioMember
	err := p.storage.DB.WithContext(ctx).
		Where("portfolio_id = ? AND user_id = ? AND status = ?", portfolioID, userID, model.MemberStatusActive).
		First(&member).Error
	if err == gorm.ErrRecordNotFound {
		return model.PortfolioMember{}, siloErrors.ErrRecordNotFound
	}
	return member, err
}

func (p *portfolioStore) GetMembership(ctx context.Context, portfolioID, userID uuid.UUID) (model.PortfolioMember, error) {
	var member model.PortfolioMember
	err := p.storage.DB.WithContext(ctx).
		Where("portfolio_id = ? AND user_id = ?", portfolioID, userID).
		First(&member).Error
	if err == gorm.ErrRecordNotFound {
		return model.PortfolioMember{}, siloErrors.ErrRecordNotFound
	}
	if err != nil {
		return model.PortfolioMember{}, siloErrors.ErrGenericErr
	}
	return member, nil
}

func (p *portfolioStore) UpdateMember(ctx context.Context, member model.PortfolioMember) error {
	if err := p.storage.DB.WithContext(ctx).Save(&member).Error; err != nil {
		return siloErrors.ErrGenericErr
	}
	return nil
}

func (p *portfolioStore) ListMembers(ctx context.Context, portfolioID uuid.UUID) ([]model.PortfolioMember, error) {
	var members []model.PortfolioMember
	err := p.storage.DB.WithContext(ctx).
		Preload("User").
		Where("portfolio_id = ?", portfolioID).
		Order("created_at ASC").
		Find(&members).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return members, nil
}

func (p *portfolioStore) ListInvitesForUser(ctx context.Context, userID uuid.UUID) ([]model.PortfolioMember, error) {
	var members []model.PortfolioMember
	err := p.storage.DB.WithContext(ctx).
		Joins("JOIN portfolios ON portfolios.id = portfolio_members.portfolio_id AND portfolios.deleted_at IS NULL").
		Where("portfolio_members.user_id = ? AND portfolio_members.status = ?", userID, model.MemberStatusInvited).
		Order("portfolio_members.created_at DESC").
		Find(&members).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return members, nil
}

// ListPortfoliosFiltered returns a paginated and filtered list of portfolios for a user.
func (p *portfolioStore) ListPortfoliosFiltered(ctx context.Context, userID uuid.UUID, filter model.ListPortfoliosFilter, page model.Page) ([]model.Portfolio, model.PageInfo, error) {
	page.Normalise()

	q := p.storage.DB.WithContext(ctx).
		Model(&model.Portfolio{}).
		Joins("JOIN portfolio_members pm ON pm.portfolio_id = portfolios.id").
		Where("pm.user_id = ? AND pm.status = 'active' AND portfolios.deleted_at IS NULL", userID)

	if filter.Name != "" {
		q = q.Where("LOWER(portfolios.name) LIKE ?", "%"+strings.ToLower(filter.Name)+"%")
	}
	if filter.Currency != "" {
		q = q.Where("LOWER(portfolios.base_currency) = ?", strings.ToLower(filter.Currency))
	}
	if filter.Role != "" {
		q = q.Where("pm.role = ?", filter.Role)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, model.PageInfo{}, siloErrors.ErrGenericErr
	}

	dir := page.SortDirection()
	var portfolios []model.Portfolio
	err := q.
		Order("portfolios." + page.SortBy + " " + dir).
		Limit(page.Size).
		Offset(page.Offset()).
		Find(&portfolios).Error
	if err != nil {
		return nil, model.PageInfo{}, siloErrors.ErrGenericErr
	}

	return portfolios, model.BuildPageInfo(total, page), nil
}

// CountOwners returns how many owner-role members a portfolio has.
func (p *portfolioStore) CountOwners(ctx context.Context, portfolioID uuid.UUID) (int64, error) {
	var count int64
	err := p.storage.DB.WithContext(ctx).
		Model(&model.PortfolioMember{}).
		Where("portfolio_id = ? AND role = ? AND status = ?", portfolioID, model.RoleOwner, model.MemberStatusActive).
		Count(&count).Error
	return count, err
}

func (p *portfolioStore) RowBelongsTo(ctx context.Context, table, column string, id, parentID uuid.UUID) (bool, error) {
	var n int64
	err := p.storage.DB.WithContext(ctx).
		Table(table).
		Where("id = ? AND "+column+" = ?", id, parentID).
		Count(&n).Error
	if err != nil {
		return false, siloErrors.ErrGenericErr
	}
	return n > 0, nil
}

func (p *portfolioStore) ListLiveIDs(ctx context.Context) ([]uuid.UUID, error) {
	var ids []uuid.UUID
	err := p.storage.DB.WithContext(ctx).
		Model(&model.Portfolio{}).
		Where("deleted_at IS NULL").
		Pluck("id", &ids).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return ids, nil
}
