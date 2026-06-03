package model

// Page carries pagination and sorting parameters for list requests.
// It is bound from query parameters (form tags) on GET endpoints.
type Page struct {
	// Number is the 1-indexed page number. Defaults to 1.
	Number int `form:"page"     json:"page"`
	// Size is the number of items per page. Defaults to 20, max 100.
	Size int `form:"size"     json:"size"`
	// SortBy is the column name to order by. Defaults to "created_at".
	SortBy string `form:"sort_by"  json:"sort_by"`
	// SortDirectionDesc orders results descending when true (default).
	SortDirectionDesc bool `form:"sort_desc" json:"sort_desc"`
}

// PageInfo is returned inside every paginated API response.
type PageInfo struct {
	Number          int   `json:"page"`
	Size            int   `json:"size"`
	TotalCount      int64 `json:"total_count"`
	HasNextPage     bool  `json:"has_next_page"`
	HasPreviousPage bool  `json:"has_previous_page"`
}

// DefaultPage returns a Page with sensible defaults applied.
func DefaultPage() Page {
	return Page{
		Number:            1,
		Size:              20,
		SortBy:            "created_at",
		SortDirectionDesc: true,
	}
}

// Normalise applies defaults and clamps values to safe ranges.
func (p *Page) Normalise() {
	if p.Number < 1 {
		p.Number = 1
	}
	if p.Size < 1 {
		p.Size = 20
	}
	if p.Size > 100 {
		p.Size = 100
	}
	if p.SortBy == "" {
		p.SortBy = "created_at"
	}
}

// Offset returns the SQL OFFSET value for the current page.
func (p Page) Offset() int {
	return (p.Number - 1) * p.Size
}

// SortDirection returns the SQL sort direction string ("ASC" or "DESC").
func (p Page) SortDirection() string {
	if p.SortDirectionDesc {
		return "DESC"
	}
	return "ASC"
}

// BuildPageInfo constructs a PageInfo from the total row count and the request page.
func BuildPageInfo(total int64, p Page) PageInfo {
	return PageInfo{
		Number:          p.Number,
		Size:            p.Size,
		TotalCount:      total,
		HasNextPage:     int64(p.Number*p.Size) < total,
		HasPreviousPage: p.Number > 1,
	}
}
