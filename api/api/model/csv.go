package model

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// CSV sends rows as a downloadable CSV file named "<name>-YYYY-MM-DD.csv".
// A UTF-8 byte-order mark goes first so Excel shows non-ASCII text (₦, é)
// correctly.
func CSV(c *gin.Context, name string, rows [][]string) {
	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s-%s.csv"`, name, time.Now().UTC().Format("2006-01-02")))
	c.Status(http.StatusOK)
	_, _ = c.Writer.Write([]byte("\xEF\xBB\xBF"))
	w := csv.NewWriter(c.Writer)
	_ = w.WriteAll(rows)
}
