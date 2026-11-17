// Package sharing handles members, invites, invite links, access requests
// and public links.
package sharing

import (
	"context"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	appAsset "github.com/wearegravitylabs/silo/api/app/asset"
	appDashboard "github.com/wearegravitylabs/silo/api/app/dashboard"
	appDebt "github.com/wearegravitylabs/silo/api/app/debt"
	appPortfolio "github.com/wearegravitylabs/silo/api/app/portfolio"
	appProjection "github.com/wearegravitylabs/silo/api/app/projection"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/model"
	"github.com/wearegravitylabs/silo/api/pkg/contexts"
	"github.com/wearegravitylabs/silo/api/pkg/middleware"
)

const serviceName = "sharing"

// Views are the read services a public link shows data from.
type Views struct {
	Dashboard  appDashboard.Dashboard
	Assets     appAsset.Asset
	Debts      appDebt.Debt
	Projection appProjection.Projection
}

type handler struct {
	svc   appPortfolio.Sharing
	views Views
}

// New registers the sharing routes on the three route tiers.
func New(public, verified, onboarded *gin.RouterGroup, svc appPortfolio.Sharing, views Views, mid *middleware.Middleware) {
	h := &handler{svc: svc, views: views}

	// Anyone with the link.
	public.GET("/invite-links/:token", h.previewInviteLink)
	public.GET("/public/:token", h.publicView)

	// Signed in (new users may not have finished onboarding yet).
	verified.POST("/invite-links/:token/request", h.requestAccess)
	verified.GET("/users/me/invites", h.myInvites)
	verified.POST("/users/me/invites/:portfolioID/accept", h.acceptInvite)
	verified.POST("/users/me/invites/:portfolioID/decline", h.declineInvite)

	p := onboarded.Group("/portfolios/:portfolioID")
	p.GET("/members", mid.RequirePortfolioMember(), h.listMembers)
	p.POST("/leave", mid.RequirePortfolioMember(), h.leave)

	owner := p.Group("", mid.RequirePortfolioOwner())
	owner.PATCH("/members/:userID", h.updateMember)
	owner.POST("/members/:userID/resend", h.resendInvite)
	owner.GET("/invite-link", h.getInviteLink)
	owner.POST("/invite-link", h.createInviteLink)
	owner.DELETE("/invite-link", h.revokeInviteLink)
	owner.GET("/access-requests", h.listAccessRequests)
	owner.POST("/access-requests/:requestID/approve", h.approve)
	owner.POST("/access-requests/:requestID/decline", h.decline)
	owner.GET("/public-link", h.getPublicLink)
	owner.POST("/public-link", h.createPublicLink)
	owner.DELETE("/public-link", h.revokePublicLink)
}

// ─── Members ─────────────────────────────────────────────────────────────────

func (h *handler) listMembers(c *gin.Context) {
	members, err := h.svc.ListMembers(c.Request.Context(), id(c, "portfolioID"))
	respond(c, "members", members, err)
}

func (h *handler) updateMember(c *gin.Context) {
	var req model.UpdateMemberRequest
	if !bind(c, &req) {
		return
	}
	m, err := h.svc.UpdateMember(c.Request.Context(), id(c, "portfolioID"), id(c, "userID"), req)
	respond(c, "member updated", m, err)
}

func (h *handler) resendInvite(c *gin.Context) {
	err := h.svc.ResendInvite(c.Request.Context(), id(c, "portfolioID"), caller(c), id(c, "userID"))
	respond(c, "invite sent", nil, err)
}

func (h *handler) leave(c *gin.Context) {
	err := h.svc.Leave(c.Request.Context(), id(c, "portfolioID"), caller(c))
	respond(c, "left portfolio", nil, err)
}

// ─── Email invites ───────────────────────────────────────────────────────────

func (h *handler) myInvites(c *gin.Context) {
	invites, err := h.svc.ListMyInvites(c.Request.Context(), caller(c))
	respond(c, "invites", invites, err)
}

func (h *handler) acceptInvite(c *gin.Context) {
	err := h.svc.AcceptInvite(c.Request.Context(), id(c, "portfolioID"), caller(c))
	respond(c, "invite accepted", nil, err)
}

func (h *handler) declineInvite(c *gin.Context) {
	err := h.svc.DeclineInvite(c.Request.Context(), id(c, "portfolioID"), caller(c))
	respond(c, "invite declined", nil, err)
}

// ─── Invite link and access requests ─────────────────────────────────────────

func (h *handler) getInviteLink(c *gin.Context) {
	link, err := h.svc.GetInviteLink(c.Request.Context(), id(c, "portfolioID"))
	if siloErrors.IsNotFound(err) {
		apiModel.OK(c, "invite link", nil)
		return
	}
	respond(c, "invite link", link, err)
}

func (h *handler) createInviteLink(c *gin.Context) {
	var req model.InviteLinkRequest
	if c.Request.ContentLength > 0 && !bind(c, &req) {
		return
	}
	link, err := h.svc.CreateInviteLink(c.Request.Context(), id(c, "portfolioID"), caller(c), req.Role)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.Created(c, "invite link created", link)
}

func (h *handler) revokeInviteLink(c *gin.Context) {
	err := h.svc.RevokeInviteLink(c.Request.Context(), id(c, "portfolioID"))
	respond(c, "invite link turned off", nil, err)
}

func (h *handler) previewInviteLink(c *gin.Context) {
	preview, err := h.svc.PreviewInviteLink(c.Request.Context(), c.Param("token"))
	respond(c, "invite", preview, err)
}

func (h *handler) requestAccess(c *gin.Context) {
	req, err := h.svc.RequestAccess(c.Request.Context(), c.Param("token"), caller(c))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.Created(c, "access requested", req)
}

func (h *handler) listAccessRequests(c *gin.Context) {
	reqs, err := h.svc.ListAccessRequests(c.Request.Context(), id(c, "portfolioID"))
	respond(c, "access requests", reqs, err)
}

func (h *handler) approve(c *gin.Context) {
	var req model.DecideAccessRequest
	if c.Request.ContentLength > 0 && !bind(c, &req) {
		return
	}
	m, err := h.svc.ApproveAccessRequest(c.Request.Context(), id(c, "portfolioID"), id(c, "requestID"), caller(c), req)
	respond(c, "access approved", m, err)
}

func (h *handler) decline(c *gin.Context) {
	err := h.svc.DeclineAccessRequest(c.Request.Context(), id(c, "portfolioID"), id(c, "requestID"), caller(c))
	respond(c, "access declined", nil, err)
}

// ─── Public link ─────────────────────────────────────────────────────────────

func (h *handler) getPublicLink(c *gin.Context) {
	link, err := h.svc.GetPublicLink(c.Request.Context(), id(c, "portfolioID"))
	if siloErrors.IsNotFound(err) {
		apiModel.OK(c, "public link", nil)
		return
	}
	respond(c, "public link", link, err)
}

func (h *handler) createPublicLink(c *gin.Context) {
	var req model.PublicLinkRequest
	if !bind(c, &req) {
		return
	}
	link, err := h.svc.CreatePublicLink(c.Request.Context(), id(c, "portfolioID"), caller(c), req.Sections)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.Created(c, "public link created", link)
}

func (h *handler) revokePublicLink(c *gin.Context) {
	err := h.svc.RevokePublicLink(c.Request.Context(), id(c, "portfolioID"))
	respond(c, "public link turned off", nil, err)
}

// publicView shows the sections a public link allows, read-only.
func (h *handler) publicView(c *gin.Context) {
	ctx := c.Request.Context()
	link, p, err := h.svc.PublicLinkByToken(ctx, c.Param("token"))
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	view, err := h.build(ctx, p, link.Sections)
	respond(c, "public portfolio", view, err)
}

func (h *handler) build(ctx context.Context, p model.Portfolio, sections model.Sections) (model.PublicView, error) {
	view := model.PublicView{PortfolioName: p.Name, ImageURL: p.ImageURL, Currency: p.BaseCurrency, Sections: sections}
	if sections.Has(model.SectionDashboard) {
		d, err := h.views.Dashboard.Get(ctx, p.ID, uuid.Nil, "1Y")
		if err != nil {
			return model.PublicView{}, err
		}
		view.Dashboard = &d
	}
	if sections.Has(model.SectionAssets) {
		a, err := h.views.Assets.ListByPortfolio(ctx, p.ID, uuid.Nil, model.ListAssetsFilter{})
		if err != nil {
			return model.PublicView{}, err
		}
		view.Assets = a
	}
	if sections.Has(model.SectionDebts) {
		d, err := h.views.Debts.ListByPortfolio(ctx, p.ID, model.ListDebtsFilter{})
		if err != nil {
			return model.PublicView{}, err
		}
		view.Debts = d
	}
	if sections.Has(model.SectionProjections) {
		s, err := h.views.Projection.ListScenarios(ctx, p.ID)
		if err != nil {
			return model.PublicView{}, err
		}
		view.Projections = s
		for _, sc := range s {
			chart, err := h.views.Projection.Chart(ctx, sc.ID, p.ID, model.ChartRequest{YearsAhead: 10})
			if err != nil {
				return model.PublicView{}, err
			}
			view.ProjectionCharts = append(view.ProjectionCharts, chart)
		}
	}
	return view, nil
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func caller(c *gin.Context) uuid.UUID {
	id, _ := c.Request.Context().Value(contexts.ContextKeyUserID).(uuid.UUID)
	return id
}

// id reads a uuid from the URL; a bad one becomes uuid.Nil, which no row has.
func id(c *gin.Context, param string) uuid.UUID {
	v, _ := uuid.Parse(c.Param(param))
	return v
}

func bind(c *gin.Context, v any) bool {
	if err := c.ShouldBindJSON(v); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return false
	}
	return true
}

func respond(c *gin.Context, msg string, data any, err error) {
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, err)
		return
	}
	apiModel.OK(c, msg, data)
}
