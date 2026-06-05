// Package upload handles file upload to the configured object storage provider.
package upload

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	apiModel "github.com/wearegravitylabs/silo/api/api/model"
	siloErrors "github.com/wearegravitylabs/silo/api/errors"
	"github.com/wearegravitylabs/silo/api/pkg/contexts"
	"github.com/wearegravitylabs/silo/api/pkg/environment"
	"github.com/wearegravitylabs/silo/api/pkg/helpers"
	objectStorage "github.com/wearegravitylabs/silo/api/thirdparty/storage"
)

const (
	serviceName    = "upload"
	defaultMaxSize = 50 << 20 // 50 MB
)

// allowedMIMETypes lists the MIME prefixes and exact types accepted for upload.
var allowedMIMETypes = []string{
	"image/",
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument",
	"application/vnd.ms-excel",
	"text/plain",
}

// UploadResponse is returned on a successful upload.
type UploadResponse struct {
	URL         string `json:"url"`
	Key         string `json:"key"`
	Size        int64  `json:"size"`
	ContentType string `json:"content_type"`
}

type handler struct {
	storage objectStorage.ObjectStorage
	bucket  string
	maxSize int64
}

// New registers the POST /upload route on the given router group.
func New(r *gin.RouterGroup, store objectStorage.ObjectStorage, env *environment.Env) {
	maxSize := int64(env.GetInt("STORAGE_MAX_UPLOAD_BYTES"))
	if maxSize == 0 {
		maxSize = defaultMaxSize
	}

	h := &handler{
		storage: store,
		bucket:  env.GetWithDefault("STORAGE_BUCKET", "silo"),
		maxSize: maxSize,
	}
	r.POST("/upload", h.upload)
}

// upload godoc
//
//	@Summary	Upload a file and receive its public URL
//	@Tags		upload
//	@Accept		multipart/form-data
//	@Produce	json
//	@Param		file	formData	file	true	"File to upload"
//	@Success	200		{object}	UploadResponse
//	@Router		/upload [post]
func (h *handler) upload(c *gin.Context) {
	callerID, ok := c.Request.Context().Value(contexts.ContextKeyUserID).(uuid.UUID)
	if !ok {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrUnauthorized)
		return
	}

	// Limit request body size before parsing.
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, h.maxSize)

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		if strings.Contains(err.Error(), "request body too large") {
			apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrFileTooLarge)
			return
		}
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrInvalidRequest)
		return
	}
	defer file.Close()

	// Validate MIME type by reading the first 512 bytes.
	buf := make([]byte, 512)
	n, _ := file.Read(buf)
	contentType := http.DetectContentType(buf[:n])

	if !isAllowedType(contentType) {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrUnsupportedFileType)
		return
	}

	// Seek back to the start after sniffing.
	if _, err := file.Seek(0, 0); err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrGenericErr)
		return
	}

	// Build storage key: {userID}/{uuid}.{ext}
	ext := filepath.Ext(header.Filename)
	key := fmt.Sprintf("%s/%s%s", callerID.String(), uuid.New().String(), ext)

	url, err := h.storage.Upload(c.Request.Context(), h.bucket, key, file, header.Size)
	if err != nil {
		apiModel.HandleErrorResponse(c, serviceName, siloErrors.ErrStorageUploadFailed)
		return
	}

	c.JSON(http.StatusOK, apiModel.APIResponse{
		Code:    http.StatusOK,
		Data:    UploadResponse{URL: url, Key: key, Size: header.Size, ContentType: contentType},
		Message: helpers.StringPtr("file uploaded"),
		Error:   nil,
	})
}

// isAllowedType checks whether the detected MIME type is permitted.
func isAllowedType(contentType string) bool {
	for _, allowed := range allowedMIMETypes {
		if strings.HasPrefix(contentType, allowed) {
			return true
		}
	}
	return false
}
