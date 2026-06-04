package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// AssetType is the granular classification of an asset (what it actually is).
type AssetType string

const (
	AssetTypeStockTicker  AssetType = "stock_ticker"  // auto-priced via Yahoo Finance
	AssetTypeStockManual  AssetType = "stock_manual"   // user-valued stock (ETFs, etc.)
	AssetTypeCryptoTicker AssetType = "crypto_ticker"  // auto-priced via CoinGecko
	AssetTypeCryptoManual AssetType = "crypto_manual"  // user-valued crypto
	AssetTypeRealEstate   AssetType = "real_estate"
	AssetTypeDomain       AssetType = "domain"
	AssetTypePhysical     AssetType = "physical"  // gold, jewellery, vehicles, art
	AssetTypeVC           AssetType = "vc"         // venture capital / angel investment
	AssetTypeBusiness     AssetType = "business"
	AssetTypeBank         AssetType = "bank"   // cash account (Plaid or manual)
	AssetTypeManual       AssetType = "manual" // catch-all user-defined asset
)

// Investability classifies an asset by liquidity.
// Values for some asset types are preset (see pkg/assetclass); manual and domain
// types are user-editable.
type Investability string

const (
	InvestabilityCash       Investability = "cash"          // checking, savings, stablecoins
	InvestabilityInvestable Investability = "investable"    // stocks, crypto
	InvestabilityNonInvest  Investability = "non_investable" // real estate, business, VC
)

// JSONB is a map that serialises to/from PostgreSQL JSONB.
type JSONB map[string]any

// Value implements driver.Valuer for GORM.
func (j JSONB) Value() (driver.Value, error) { return json.Marshal(j) }

// Scan implements sql.Scanner for GORM.
func (j *JSONB) Scan(value any) error {
	b, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(b, j)
}

// Asset represents any financial holding tracked within a portfolio.
type Asset struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	PortfolioID uuid.UUID  `gorm:"type:uuid;not null;index"                         json:"portfolio_id"`
	FolderID    *uuid.UUID `gorm:"type:uuid;index"                                  json:"folder_id"`
	Name        string     `gorm:"not null"                                         json:"name"`
	AssetType   AssetType  `gorm:"not null"                                         json:"asset_type"`

	// Ticker / price-feed fields (populated for ticker-based assets)
	Ticker        string  `json:"ticker"`
	Quantity      float64 `gorm:"type:numeric(28,10)"                              json:"quantity"`
	PurchasePrice float64 `gorm:"type:numeric(28,10)"                              json:"purchase_price"`
	CurrentPrice  float64 `gorm:"type:numeric(28,10)"                              json:"current_price"`

	// Common fields
	Currency  string        `gorm:"not null;default:'USD'"                           json:"currency"`
	// OwnershipPct is always editable — default 100, range 0–100.
	OwnershipPct float64    `gorm:"type:numeric(6,4);default:100"                    json:"ownership_pct"`
	// Investability is preset for most asset types; editable for manual and domain.
	Investability Investability `json:"investability"`

	// AssetClass is the user-facing group code written on insert from pkg/assetclass.
	// Stored for query performance; single source of truth is the Go registry.
	AssetClass string `json:"asset_class"`
	// LogoURL is the company logo for ticker-based assets (auto-fetched from Yahoo Finance).
	LogoURL string `json:"logo_url"`

	Location        string     `json:"location"`
	Metadata        JSONB      `gorm:"type:jsonb"                                       json:"metadata,omitempty"`
	LastPriceSync   *time.Time `json:"last_price_sync"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	DeletedAt       *time.Time `gorm:"index"                                            json:"-"`

	// Lots is populated on explicit Preload only.
	Lots []AssetLot `gorm:"foreignKey:AssetID" json:"lots,omitempty"`

	// ── Computed fields (not stored, gorm:"-") ────────────────────────────────

	// Icon is the inline SVG for this asset's class, populated at query time.
	Icon string `gorm:"-" json:"icon"`
	// InvestabilityEditable reports whether the user can change the investability.
	InvestabilityEditable bool `gorm:"-" json:"investability_editable"`
}

// ─── Request types ────────────────────────────────────────────────────────────

// CreateAssetRequest is the payload for POST /portfolios/:id/assets.
type CreateAssetRequest struct {
	FolderID  *uuid.UUID `json:"folder_id"`
	AssetType AssetType  `json:"asset_type" binding:"required"`

	// For stock_ticker / crypto_ticker: provide ticker only.
	// Name, logo, and current price are fetched automatically.
	Ticker string `json:"ticker"`

	// For manual types: provide name (and optionally image_url).
	Name     string  `json:"name"`
	ImageURL *string `json:"image_url"`

	// Currency is optional — portfolio base_currency is used when empty.
	Currency string `json:"currency"`
	// OwnershipPct defaults to 100 when omitted or zero.
	OwnershipPct float64 `json:"ownership_pct"`
	// Investability is applied automatically for preset types; required for manual/domain.
	Investability Investability `json:"investability"`

	Location string `json:"location"`
	Metadata JSONB  `json:"metadata"`

	// Lots records one or more purchase tranches.
	// For ticker types, acquisition_price is optional — fetched from Yahoo Finance.
	// For manual types, acquisition_price is required.
	Lots []CreateLotRequest `json:"lots" binding:"required,min=1"`
}

// UpdateAssetRequest is the payload for PATCH /portfolios/:id/assets/:id.
// All fields are optional; omitted fields are not changed.
type UpdateAssetRequest struct {
	FolderID      *uuid.UUID     `json:"folder_id"`
	Name          *string        `json:"name"`
	Quantity      *float64       `json:"quantity"`
	CurrentPrice  *float64       `json:"current_price"`
	// OwnershipPct is always accepted — any asset type.
	OwnershipPct  *float64       `json:"ownership_pct"`
	// Investability is silently ignored for asset types with a preset value.
	Investability *Investability  `json:"investability"`
	Location      *string         `json:"location"`
	Metadata      JSONB           `json:"metadata"`
}
