package store

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
)

// SharingDatabase persists invite links, access requests and public links.
type SharingDatabase interface {
	// ActiveInviteLink returns the portfolio's current invite link.
	ActiveInviteLink(ctx context.Context, portfolioID uuid.UUID) (model.InviteLink, error)
	// ReplaceInviteLink revokes the current link (if any) and stores a new one.
	ReplaceInviteLink(ctx context.Context, link model.InviteLink) (model.InviteLink, error)
	RevokeInviteLink(ctx context.Context, portfolioID uuid.UUID) error
	InviteLinkByToken(ctx context.Context, token string) (model.InviteLink, error)

	// CreateAccessRequest stores a pending request; a second pending request
	// from the same user for the same portfolio is ErrDuplicateRecord.
	CreateAccessRequest(ctx context.Context, req model.AccessRequest) (model.AccessRequest, error)
	GetAccessRequest(ctx context.Context, id uuid.UUID) (model.AccessRequest, error)
	ListPendingAccessRequests(ctx context.Context, portfolioID uuid.UUID) ([]model.AccessRequest, error)
	UpdateAccessRequest(ctx context.Context, req model.AccessRequest) error

	ActivePublicLink(ctx context.Context, portfolioID uuid.UUID) (model.PublicLink, error)
	ReplacePublicLink(ctx context.Context, link model.PublicLink) (model.PublicLink, error)
	RevokePublicLink(ctx context.Context, portfolioID uuid.UUID) error
	PublicLinkByToken(ctx context.Context, token string) (model.PublicLink, error)
}

type sharingStore struct{ storage *Store }

// NewSharingStore returns a SharingDatabase backed by the given Store.
func NewSharingStore(s *Store) SharingDatabase { return &sharingStore{storage: s} }

func notFoundOr(err error) error {
	if err == gorm.ErrRecordNotFound {
		return siloErrors.ErrRecordNotFound
	}
	return siloErrors.ErrGenericErr
}

func (s *sharingStore) ActiveInviteLink(ctx context.Context, portfolioID uuid.UUID) (model.InviteLink, error) {
	var link model.InviteLink
	err := s.storage.DB.WithContext(ctx).
		Where("portfolio_id = ? AND revoked_at IS NULL", portfolioID).
		Order("created_at DESC").First(&link).Error
	if err != nil {
		return model.InviteLink{}, notFoundOr(err)
	}
	return link, nil
}

func (s *sharingStore) ReplaceInviteLink(ctx context.Context, link model.InviteLink) (model.InviteLink, error) {
	err := s.storage.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&model.InviteLink{}).
			Where("portfolio_id = ? AND revoked_at IS NULL", link.PortfolioID).
			Update("revoked_at", time.Now().UTC()).Error; err != nil {
			return err
		}
		return tx.Create(&link).Error
	})
	if err != nil {
		return model.InviteLink{}, siloErrors.ErrGenericErr
	}
	return link, nil
}

func (s *sharingStore) RevokeInviteLink(ctx context.Context, portfolioID uuid.UUID) error {
	return s.storage.DB.WithContext(ctx).Model(&model.InviteLink{}).
		Where("portfolio_id = ? AND revoked_at IS NULL", portfolioID).
		Update("revoked_at", time.Now().UTC()).Error
}

func (s *sharingStore) InviteLinkByToken(ctx context.Context, token string) (model.InviteLink, error) {
	var link model.InviteLink
	err := s.storage.DB.WithContext(ctx).
		Joins("JOIN portfolios ON portfolios.id = portfolio_invite_links.portfolio_id AND portfolios.deleted_at IS NULL").
		Where("portfolio_invite_links.token = ? AND portfolio_invite_links.revoked_at IS NULL", token).
		First(&link).Error
	if err != nil {
		return model.InviteLink{}, notFoundOr(err)
	}
	return link, nil
}

func (s *sharingStore) CreateAccessRequest(ctx context.Context, req model.AccessRequest) (model.AccessRequest, error) {
	if err := s.storage.DB.WithContext(ctx).Create(&req).Error; err != nil {
		return model.AccessRequest{}, siloErrors.ErrDuplicateRecord
	}
	return req, nil
}

func (s *sharingStore) GetAccessRequest(ctx context.Context, id uuid.UUID) (model.AccessRequest, error) {
	var req model.AccessRequest
	if err := s.storage.DB.WithContext(ctx).Preload("User").Where("id = ?", id).First(&req).Error; err != nil {
		return model.AccessRequest{}, notFoundOr(err)
	}
	return req, nil
}

func (s *sharingStore) ListPendingAccessRequests(ctx context.Context, portfolioID uuid.UUID) ([]model.AccessRequest, error) {
	var reqs []model.AccessRequest
	err := s.storage.DB.WithContext(ctx).Preload("User").
		Where("portfolio_id = ? AND status = ?", portfolioID, model.AccessRequestPending).
		Order("created_at ASC").Find(&reqs).Error
	if err != nil {
		return nil, siloErrors.ErrGenericErr
	}
	return reqs, nil
}

func (s *sharingStore) UpdateAccessRequest(ctx context.Context, req model.AccessRequest) error {
	req.User = nil
	if err := s.storage.DB.WithContext(ctx).Save(&req).Error; err != nil {
		return siloErrors.ErrGenericErr
	}
	return nil
}

func (s *sharingStore) ActivePublicLink(ctx context.Context, portfolioID uuid.UUID) (model.PublicLink, error) {
	var link model.PublicLink
	err := s.storage.DB.WithContext(ctx).
		Where("portfolio_id = ? AND revoked_at IS NULL", portfolioID).
		Order("created_at DESC").First(&link).Error
	if err != nil {
		return model.PublicLink{}, notFoundOr(err)
	}
	return link, nil
}

func (s *sharingStore) ReplacePublicLink(ctx context.Context, link model.PublicLink) (model.PublicLink, error) {
	err := s.storage.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&model.PublicLink{}).
			Where("portfolio_id = ? AND revoked_at IS NULL", link.PortfolioID).
			Update("revoked_at", time.Now().UTC()).Error; err != nil {
			return err
		}
		return tx.Create(&link).Error
	})
	if err != nil {
		return model.PublicLink{}, siloErrors.ErrGenericErr
	}
	return link, nil
}

func (s *sharingStore) RevokePublicLink(ctx context.Context, portfolioID uuid.UUID) error {
	return s.storage.DB.WithContext(ctx).Model(&model.PublicLink{}).
		Where("portfolio_id = ? AND revoked_at IS NULL", portfolioID).
		Update("revoked_at", time.Now().UTC()).Error
}

func (s *sharingStore) PublicLinkByToken(ctx context.Context, token string) (model.PublicLink, error) {
	var link model.PublicLink
	err := s.storage.DB.WithContext(ctx).
		Joins("JOIN portfolios ON portfolios.id = portfolio_public_links.portfolio_id AND portfolios.deleted_at IS NULL").
		Where("portfolio_public_links.token = ? AND portfolio_public_links.revoked_at IS NULL", token).
		First(&link).Error
	if err != nil {
		return model.PublicLink{}, notFoundOr(err)
	}
	return link, nil
}
