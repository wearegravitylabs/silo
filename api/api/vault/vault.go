package vault

import (
	"github.com/gin-gonic/gin"
	appVault "github.com/wearegravitylabs/silo/api/app/vault"
)

type handler struct{ svc appVault.Vault }

// New registers vault routes.
func New(r *gin.RouterGroup, svc appVault.Vault) {
	h := &handler{svc: svc}
	g := r.Group("/portfolios/:portfolioID/vault")
	g.POST("/documents", h.upload)
	g.GET("/documents", h.listDocuments)
	g.GET("/documents/:id/download-url", h.downloadURL)
	g.DELETE("/documents/:id", h.deleteDocument)
}

func (h *handler) upload(c *gin.Context)       { /* TODO */ }
func (h *handler) listDocuments(c *gin.Context) { /* TODO */ }
func (h *handler) downloadURL(c *gin.Context)  { /* TODO */ }
func (h *handler) deleteDocument(c *gin.Context) { /* TODO */ }
