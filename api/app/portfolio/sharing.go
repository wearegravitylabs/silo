package portfolio

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wearegravitylabs/silo/api/app"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	modelEnv "github.com/wearegravitylabs/silo/api/model/env"
	"github.com/wearegravitylabs/silo/api/pkg/crypto"
	siloLogger "github.com/wearegravitylabs/silo/api/pkg/logger"
	messagingModel "github.com/wearegravitylabs/silo/api/thirdparty/messaging/model"
	"github.com/wearegravitylabs/silo/api/thirdparty/messaging/templates"
)

// Sharing covers members, invites, invite links, access requests and public
// links. Every method that changes who can see a portfolio expects the
// caller to be an owner; the routes check that.
type Sharing interface {
	ListMembers(ctx context.Context, portfolioID uuid.UUID) ([]model.PortfolioMember, error)
	UpdateMember(ctx context.Context, portfolioID, targetUserID uuid.UUID, req model.UpdateMemberRequest) (model.PortfolioMember, error)
	ResendInvite(ctx context.Context, portfolioID, callerID, targetUserID uuid.UUID) error
	Leave(ctx context.Context, portfolioID, userID uuid.UUID) error

	ListMyInvites(ctx context.Context, userID uuid.UUID) ([]model.InvitePreview, error)
	AcceptInvite(ctx context.Context, portfolioID, userID uuid.UUID) error
	DeclineInvite(ctx context.Context, portfolioID, userID uuid.UUID) error

	GetInviteLink(ctx context.Context, portfolioID uuid.UUID) (model.InviteLink, error)
	CreateInviteLink(ctx context.Context, portfolioID, callerID uuid.UUID, role model.PortfolioMemberRole) (model.InviteLink, error)
	RevokeInviteLink(ctx context.Context, portfolioID uuid.UUID) error
	PreviewInviteLink(ctx context.Context, token string) (model.InvitePreview, error)
	RequestAccess(ctx context.Context, token string, userID uuid.UUID) (model.AccessRequest, error)
	ListAccessRequests(ctx context.Context, portfolioID uuid.UUID) ([]model.AccessRequest, error)
	ApproveAccessRequest(ctx context.Context, portfolioID, requestID, callerID uuid.UUID, req model.DecideAccessRequest) (model.PortfolioMember, error)
	DeclineAccessRequest(ctx context.Context, portfolioID, requestID, callerID uuid.UUID) error

	GetPublicLink(ctx context.Context, portfolioID uuid.UUID) (model.PublicLink, error)
	CreatePublicLink(ctx context.Context, portfolioID, callerID uuid.UUID, sections model.Sections) (model.PublicLink, error)
	RevokePublicLink(ctx context.Context, portfolioID uuid.UUID) error
	// PublicLinkByToken returns the link a public URL points at, if it still
	// works (not revoked, and the owner allows public links).
	PublicLinkByToken(ctx context.Context, token string) (model.PublicLink, model.Portfolio, error)
}

// NewSharing returns the Sharing service.
func NewSharing(dp app.Dependency) Sharing { return &service{dp: dp} }

// ─── Members ─────────────────────────────────────────────────────────────────

func (s *service) ListMembers(ctx context.Context, portfolioID uuid.UUID) ([]model.PortfolioMember, error) {
	return s.dp.PortfolioStore.ListMembers(ctx, portfolioID)
}

// UpdateMember changes a member's role or sections. The last owner can't be
// made something else.
func (s *service) UpdateMember(ctx context.Context, portfolioID, targetUserID uuid.UUID, req model.UpdateMemberRequest) (model.PortfolioMember, error) {
	member, err := s.dp.PortfolioStore.GetMembership(ctx, portfolioID, targetUserID)
	if err != nil {
		return model.PortfolioMember{}, siloErrors.ErrNotFound
	}
	if req.Role != nil && *req.Role != member.Role {
		if member.Role == model.RoleOwner && member.Status == model.MemberStatusActive {
			if n, _ := s.dp.PortfolioStore.CountOwners(ctx, portfolioID); n <= 1 {
				return model.PortfolioMember{}, siloErrors.ErrLastOwner
			}
		}
		member.Role = *req.Role
	}
	if req.Sections != nil {
		if !req.Sections.Valid() {
			return model.PortfolioMember{}, siloErrors.ErrInvalidRequest
		}
		member.Sections = *req.Sections
	}
	member.User = nil
	if err := s.dp.PortfolioStore.UpdateMember(ctx, member); err != nil {
		return model.PortfolioMember{}, err
	}
	return member, nil
}

// ResendInvite emails an invited (not yet active) member again.
func (s *service) ResendInvite(ctx context.Context, portfolioID, callerID, targetUserID uuid.UUID) error {
	member, err := s.dp.PortfolioStore.GetMembership(ctx, portfolioID, targetUserID)
	if err != nil || member.Status != model.MemberStatusInvited {
		return siloErrors.ErrNotFound
	}
	return s.sendInvite(ctx, portfolioID, callerID, member)
}

// Leave removes the caller from a portfolio. The last owner can't leave.
func (s *service) Leave(ctx context.Context, portfolioID, userID uuid.UUID) error {
	member, err := s.dp.PortfolioStore.GetMember(ctx, portfolioID, userID)
	if err != nil {
		return siloErrors.ErrNotFound
	}
	if member.Role == model.RoleOwner {
		if n, _ := s.dp.PortfolioStore.CountOwners(ctx, portfolioID); n <= 1 {
			return siloErrors.ErrLastOwner
		}
	}
	return s.dp.PortfolioStore.RemoveMember(ctx, portfolioID, userID)
}

// ─── Email invites ───────────────────────────────────────────────────────────

// sendInvite emails the invite to the member's address.
func (s *service) sendInvite(ctx context.Context, portfolioID, callerID uuid.UUID, member model.PortfolioMember) error {
	portfolio, err := s.dp.PortfolioStore.GetPortfolio(ctx, portfolioID)
	if err != nil {
		return err
	}
	invitee, err := s.dp.UserStore.GetUserByID(ctx, member.UserID)
	if err != nil {
		return err
	}
	if err := s.dp.EmailingService.SendEmail(ctx, messagingModel.EmailPayload{
		To:      invitee.Email,
		Subject: "You're invited to " + portfolio.Name + " on Silo",
		Body:    templates.InviteEmail(s.nameOf(ctx, callerID), portfolio.Name, string(member.Role), s.appURL("/invites")),
	}); err != nil {
		log := siloLogger.FromCtx(ctx)
		log.Error().Err(err).Msg("failed to send invite email")
		return siloErrors.ErrGenericErr
	}
	return nil
}

func (s *service) ListMyInvites(ctx context.Context, userID uuid.UUID) ([]model.InvitePreview, error) {
	invites, err := s.dp.PortfolioStore.ListInvitesForUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]model.InvitePreview, 0, len(invites))
	for _, m := range invites {
		p, err := s.dp.PortfolioStore.GetPortfolio(ctx, m.PortfolioID)
		if err != nil {
			continue
		}
		out = append(out, model.InvitePreview{
			PortfolioID: p.ID, PortfolioName: p.Name, ImageURL: p.ImageURL,
			InvitedBy: s.nameOf(ctx, m.InvitedBy), Role: m.Role, Sections: m.Sections, InvitedAt: m.CreatedAt,
		})
	}
	return out, nil
}

func (s *service) AcceptInvite(ctx context.Context, portfolioID, userID uuid.UUID) error {
	member, err := s.dp.PortfolioStore.GetMembership(ctx, portfolioID, userID)
	if err != nil || member.Status != model.MemberStatusInvited {
		return siloErrors.ErrNotFound
	}
	now := time.Now().UTC()
	member.Status, member.JoinedAt = model.MemberStatusActive, &now
	if err := s.dp.PortfolioStore.UpdateMember(ctx, member); err != nil {
		return err
	}
	if err := s.dp.UserStore.IncrementPortfolioCount(ctx, userID); err != nil {
		log := siloLogger.FromCtx(ctx)
		log.Error().Err(err).Msg("failed to increment portfolio_count")
	}
	return nil
}

func (s *service) DeclineInvite(ctx context.Context, portfolioID, userID uuid.UUID) error {
	member, err := s.dp.PortfolioStore.GetMembership(ctx, portfolioID, userID)
	if err != nil || member.Status != model.MemberStatusInvited {
		return siloErrors.ErrNotFound
	}
	return s.dp.PortfolioStore.RemoveMember(ctx, portfolioID, userID)
}

// ─── Invite link and access requests ─────────────────────────────────────────

func (s *service) GetInviteLink(ctx context.Context, portfolioID uuid.UUID) (model.InviteLink, error) {
	link, err := s.dp.SharingStore.ActiveInviteLink(ctx, portfolioID)
	if err != nil {
		return model.InviteLink{}, err
	}
	link.URL = s.appURL("/join/" + link.Token)
	return link, nil
}

// CreateInviteLink makes a new link, replacing the old one (which stops working).
func (s *service) CreateInviteLink(ctx context.Context, portfolioID, callerID uuid.UUID, role model.PortfolioMemberRole) (model.InviteLink, error) {
	if role == "" {
		role = model.RoleViewer
	}
	token, err := crypto.GenerateRandomKey(16)
	if err != nil {
		return model.InviteLink{}, siloErrors.ErrGenericErr
	}
	link, err := s.dp.SharingStore.ReplaceInviteLink(ctx, model.InviteLink{
		PortfolioID: portfolioID, Token: token, Role: role, CreatedBy: callerID, CreatedAt: time.Now().UTC(),
	})
	if err != nil {
		return model.InviteLink{}, err
	}
	link.URL = s.appURL("/join/" + link.Token)
	return link, nil
}

func (s *service) RevokeInviteLink(ctx context.Context, portfolioID uuid.UUID) error {
	return s.dp.SharingStore.RevokeInviteLink(ctx, portfolioID)
}

// PreviewInviteLink is what the link's page shows before someone asks to join.
func (s *service) PreviewInviteLink(ctx context.Context, token string) (model.InvitePreview, error) {
	link, err := s.dp.SharingStore.InviteLinkByToken(ctx, token)
	if err != nil {
		return model.InvitePreview{}, siloErrors.ErrInvalidLink
	}
	p, err := s.dp.PortfolioStore.GetPortfolio(ctx, link.PortfolioID)
	if err != nil {
		return model.InvitePreview{}, siloErrors.ErrInvalidLink
	}
	return model.InvitePreview{
		PortfolioID: p.ID, PortfolioName: p.Name, ImageURL: p.ImageURL,
		InvitedBy: s.nameOf(ctx, link.CreatedBy), Role: link.Role, InvitedAt: link.CreatedAt,
	}, nil
}

// RequestAccess records that a signed-in user asked to join through the link
// and emails the owners.
func (s *service) RequestAccess(ctx context.Context, token string, userID uuid.UUID) (model.AccessRequest, error) {
	link, err := s.dp.SharingStore.InviteLinkByToken(ctx, token)
	if err != nil {
		return model.AccessRequest{}, siloErrors.ErrInvalidLink
	}
	if m, err := s.dp.PortfolioStore.GetMembership(ctx, link.PortfolioID, userID); err == nil {
		if m.Status == model.MemberStatusActive {
			return model.AccessRequest{}, siloErrors.ErrMemberAlreadyExists
		}
	}
	req, err := s.dp.SharingStore.CreateAccessRequest(ctx, model.AccessRequest{
		PortfolioID: link.PortfolioID, UserID: userID, Role: link.Role,
		Status: model.AccessRequestPending, CreatedAt: time.Now().UTC(),
	})
	if err != nil {
		return model.AccessRequest{}, siloErrors.ErrMemberAlreadyExists
	}

	p, _ := s.dp.PortfolioStore.GetPortfolio(ctx, link.PortfolioID)
	requester := s.nameOf(ctx, userID)
	members, _ := s.dp.PortfolioStore.ListMembers(ctx, link.PortfolioID)
	for _, m := range members {
		if m.Role == model.RoleOwner && m.Status == model.MemberStatusActive && m.User != nil {
			_ = s.dp.EmailingService.SendEmail(ctx, messagingModel.EmailPayload{
				To:      m.User.Email,
				Subject: requester + " asked to join " + p.Name,
				Body:    templates.AccessRequestEmail(requester, p.Name, s.appURL("/portfolios/"+p.ID.String()+"/members")),
			})
		}
	}
	return req, nil
}

func (s *service) ListAccessRequests(ctx context.Context, portfolioID uuid.UUID) ([]model.AccessRequest, error) {
	return s.dp.SharingStore.ListPendingAccessRequests(ctx, portfolioID)
}

// ApproveAccessRequest makes the requester an active member. The owner may
// change the role and pick sections (default: everything but the vault).
func (s *service) ApproveAccessRequest(ctx context.Context, portfolioID, requestID, callerID uuid.UUID, d model.DecideAccessRequest) (model.PortfolioMember, error) {
	req, err := s.pendingRequest(ctx, portfolioID, requestID)
	if err != nil {
		return model.PortfolioMember{}, err
	}
	role, sections := req.Role, model.DefaultMemberSections
	if d.Role != nil {
		role = *d.Role
	}
	if d.Sections != nil {
		if !d.Sections.Valid() {
			return model.PortfolioMember{}, siloErrors.ErrInvalidRequest
		}
		sections = *d.Sections
	}
	now := time.Now().UTC()
	member := model.PortfolioMember{
		PortfolioID: portfolioID, UserID: req.UserID, Role: role, Status: model.MemberStatusActive,
		InvitedBy: callerID, JoinedAt: &now, Sections: sections, CreatedAt: now,
	}
	// Someone who was also invited by email: activate that row instead.
	if existing, err := s.dp.PortfolioStore.GetMembership(ctx, portfolioID, req.UserID); err == nil {
		member.ID, member.CreatedAt = existing.ID, existing.CreatedAt
		err = s.dp.PortfolioStore.UpdateMember(ctx, member)
		if err != nil {
			return model.PortfolioMember{}, err
		}
	} else if err := s.dp.PortfolioStore.AddMember(ctx, member); err != nil {
		return model.PortfolioMember{}, err
	}
	_ = s.dp.UserStore.IncrementPortfolioCount(ctx, req.UserID)

	req.Status, req.DecidedBy, req.DecidedAt = model.AccessRequestApproved, &callerID, &now
	if err := s.dp.SharingStore.UpdateAccessRequest(ctx, req); err != nil {
		return model.PortfolioMember{}, err
	}
	if req.User != nil {
		p, _ := s.dp.PortfolioStore.GetPortfolio(ctx, portfolioID)
		_ = s.dp.EmailingService.SendEmail(ctx, messagingModel.EmailPayload{
			To:      req.User.Email,
			Subject: "You can now see " + p.Name,
			Body:    templates.AccessApprovedEmail(p.Name, s.appURL("/portfolios/"+portfolioID.String())),
		})
	}
	return member, nil
}

func (s *service) DeclineAccessRequest(ctx context.Context, portfolioID, requestID, callerID uuid.UUID) error {
	req, err := s.pendingRequest(ctx, portfolioID, requestID)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	req.Status, req.DecidedBy, req.DecidedAt = model.AccessRequestDeclined, &callerID, &now
	return s.dp.SharingStore.UpdateAccessRequest(ctx, req)
}

func (s *service) pendingRequest(ctx context.Context, portfolioID, requestID uuid.UUID) (model.AccessRequest, error) {
	req, err := s.dp.SharingStore.GetAccessRequest(ctx, requestID)
	if err != nil || req.PortfolioID != portfolioID || req.Status != model.AccessRequestPending {
		return model.AccessRequest{}, siloErrors.ErrNotFound
	}
	return req, nil
}

// ─── Public link ─────────────────────────────────────────────────────────────

func (s *service) GetPublicLink(ctx context.Context, portfolioID uuid.UUID) (model.PublicLink, error) {
	link, err := s.dp.SharingStore.ActivePublicLink(ctx, portfolioID)
	if err != nil {
		return model.PublicLink{}, err
	}
	link.URL = s.appURL("/share/" + link.Token)
	return link, nil
}

// CreatePublicLink makes a new read-only link (replacing the old one) for
// the chosen sections. The vault can't be shared publicly.
func (s *service) CreatePublicLink(ctx context.Context, portfolioID, callerID uuid.UUID, sections model.Sections) (model.PublicLink, error) {
	if !sections.Valid() || len(sections) == 0 || sections.Has(model.SectionVault) {
		return model.PublicLink{}, siloErrors.ErrInvalidRequest
	}
	p, err := s.dp.PortfolioStore.GetPortfolio(ctx, portfolioID)
	if err != nil {
		return model.PublicLink{}, err
	}
	if s.viewersMustSignUp(ctx, p) {
		return model.PublicLink{}, siloErrors.ErrPublicLinksDisabled
	}
	token, err := crypto.GenerateRandomKey(16)
	if err != nil {
		return model.PublicLink{}, siloErrors.ErrGenericErr
	}
	link, err := s.dp.SharingStore.ReplacePublicLink(ctx, model.PublicLink{
		PortfolioID: portfolioID, Token: token, Sections: sections, CreatedBy: callerID, CreatedAt: time.Now().UTC(),
	})
	if err != nil {
		return model.PublicLink{}, err
	}
	link.URL = s.appURL("/share/" + link.Token)
	return link, nil
}

func (s *service) RevokePublicLink(ctx context.Context, portfolioID uuid.UUID) error {
	return s.dp.SharingStore.RevokePublicLink(ctx, portfolioID)
}

func (s *service) PublicLinkByToken(ctx context.Context, token string) (model.PublicLink, model.Portfolio, error) {
	link, err := s.dp.SharingStore.PublicLinkByToken(ctx, token)
	if err != nil {
		return model.PublicLink{}, model.Portfolio{}, siloErrors.ErrInvalidLink
	}
	p, err := s.dp.PortfolioStore.GetPortfolio(ctx, link.PortfolioID)
	if err != nil {
		return model.PublicLink{}, model.Portfolio{}, siloErrors.ErrInvalidLink
	}
	if s.viewersMustSignUp(ctx, p) {
		return model.PublicLink{}, model.Portfolio{}, siloErrors.ErrPublicLinksDisabled
	}
	return link, p, nil
}

// viewersMustSignUp reads the portfolio creator's security setting; when on,
// public links don't work.
func (s *service) viewersMustSignUp(ctx context.Context, p model.Portfolio) bool {
	owner, err := s.dp.UserStore.GetUserByID(ctx, p.UserID)
	if err != nil {
		return false
	}
	sec, _ := owner.Settings["security"].(map[string]any)
	on, _ := sec["viewers_must_sign_up"].(bool)
	return on
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// nameOf is a user's name for emails and invite cards, or their email.
func (s *service) nameOf(ctx context.Context, userID uuid.UUID) string {
	u, err := s.dp.UserStore.GetUserByID(ctx, userID)
	if err != nil {
		return "Someone"
	}
	if name := strings.TrimSpace(u.FirstName + " " + u.LastName); name != "" {
		return name
	}
	return u.Email
}

func (s *service) appURL(path string) string {
	return strings.TrimRight(s.dp.Env.Get(modelEnv.AppBaseURL), "/") + path
}
