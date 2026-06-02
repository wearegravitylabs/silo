package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// AssetType categorises an asset.
type AssetType string

const (
	AssetTypeStockTicker  AssetType = "stock_ticker"
	AssetTypeStockManual  AssetType = "stock_manual"
	AssetTypeCryptoTicker AssetType = "crypto_ticker"
	AssetTypeCryptoManual AssetType = "crypto_manual"
	AssetTypeRealEstate   AssetType = "real_estate"
	AssetTypeDomain       AssetType = "domain"
	AssetTypePhysical     AssetType = "physical"    // gold, jewelry, vehicles, art
	AssetTypeVC           AssetType = "vc"           // venture capital
	AssetTypeBusiness     AssetType = "business"
	AssetTypeBank         AssetType = "bank"
	AssetTypeManual       AssetType = "manual"
)

// Investability classifies an asset by liquidity.
type Investability string

const (
	InvestabilityCash        Investability = "cash"        // checking, savings, stablecoins
	InvestabilityInvestable  Investability = "investable"  // stocks, crypto
	InvestabilityNonInvest   Investability = "non_investable" // real estate, business, VC
)

// JSONB is a map that serialises to/from PostgreSQL JSONB.
type JSONB map[string]any

func (j JSONB) Value() (driver.Value, error) {
	return json.Marshal(j)
}

func (j *JSONB) Scan(value any) error {
	b, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(b, j)
}

// Asset represents any holding in a portfolio.
type Asset struct {
	ID              uuid.UUID     `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	PortfolioID     uuid.UUID     `gorm:"type:uuid;not null;index" json:"portfolio_id"`
	Name            string        `gorm:"not null" json:"name"`
	AssetType       AssetType     `gorm:"not null" json:"asset_type"`
	Ticker          string        `json:"ticker"`
	Quantity        float64       `gorm:"type:numeric(28,10)" json:"quantity"`
	PurchasePrice   float64       `gorm:"type:numeric(28,10)" json:"purchase_price"`
	CurrentPrice    float64       `gorm:"type:numeric(28,10)" json:"current_price"`
	Currency        string        `gorm:"not null;default:'USD'" json:"currency"`
	OwnershipPct    float64       `gorm:"type:numeric(6,4);default:100" json:"ownership_pct"`
	Investability   Investability `json:"investability"`
	Location        string        `json:"location"`
	Metadata        JSONB         `gorm:"type:jsonb" json:"metadata,omitempty"`
	LastPriceSync   *time.Time    `json:"last_price_sync"`
	AcquisitionDate *time.Time    `json:"acquisition_date"`
	CreatedAt       time.Time     `json:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at"`
	DeletedAt       *time.Time    `gorm:"index" json:"-"`
}

// CreateAssetRequest is the input for adding an asset.
type CreateAssetRequest struct {
	Name            string     `json:"name" binding:"required"`
	AssetType       AssetType  `json:"asset_type" binding:"required"`
	Ticker          string     `json:"ticker"`
	Quantity        float64    `json:"quantity"`
	PurchasePrice   float64    `json:"purchase_price"`
	CurrentValue    float64    `json:"current_value"`
	Currency        string     `json:"currency"`
	OwnershipPct    float64    `json:"ownership_pct"`
	Location        string     `json:"location"`
	Metadata        JSONB      `json:"metadata"`
	AcquisitionDate *time.Time `json:"acquisition_date"`
}

// UpdateAssetRequest is the input for modifying an asset.
type UpdateAssetRequest struct {
	Name          *string    `json:"name"`
	Quantity      *float64   `json:"quantity"`
	CurrentPrice  *float64   `json:"current_price"`
	OwnershipPct  *float64   `json:"ownership_pct"`
	Location      *string    `json:"location"`
	Metadata      JSONB      `json:"metadata"`
}
