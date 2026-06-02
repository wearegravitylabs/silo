package model

// PaginationQuery holds common query parameters for paginated list endpoints.
type PaginationQuery struct {
	Page  int `form:"page,default=1" binding:"min=1"`
	Limit int `form:"limit,default=20" binding:"min=1,max=100"`
}

// Offset returns the SQL OFFSET value for the given page and limit.
func (p PaginationQuery) Offset() int {
	if p.Page < 1 {
		return 0
	}
	return (p.Page - 1) * p.Limit
}

// PaginatedResponse wraps a list result with pagination metadata.
type PaginatedResponse struct {
	Items any   `json:"items"`
	Total int64 `json:"total"`
	Page  int   `json:"page"`
	Limit int   `json:"limit"`
}
