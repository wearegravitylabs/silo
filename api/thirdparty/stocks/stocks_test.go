package stocks

import "testing"

func TestParseCountry(t *testing.T) {
	for in, want := range map[string]Country{"NG": CountryNG, "ng": CountryNG, " Us ": CountryUS, "US": CountryUS} {
		if got, ok := ParseCountry(in); !ok || got != want {
			t.Errorf("ParseCountry(%q) = %q, %v; want %q", in, got, ok, want)
		}
	}
	for _, in := range []string{"", "ZZ", "NGA", "USA"} {
		if _, ok := ParseCountry(in); ok {
			t.Errorf("ParseCountry(%q) should be rejected", in)
		}
	}
}

func TestCountryOrDefault_FallsBackToUS(t *testing.T) {
	// Assets created before country support have an empty country and were US-priced.
	if CountryOrDefault("") != CountryUS || CountryOrDefault("garbage") != CountryUS {
		t.Error("unknown/empty country must default to US")
	}
	if CountryOrDefault("ng") != CountryNG {
		t.Error("valid country must be kept")
	}
}

func TestCurrencyAndSymbolRules(t *testing.T) {
	if CountryNG.Currency() != "NGN" || CountryUS.Currency() != "USD" {
		t.Error("currency per market")
	}
	if NormalizeSymbol(CountryNG, " dangcem ") != "DANGCEM" {
		t.Error("NGX symbols are upper-cased")
	}
	if NormalizeSymbol(CountryUS, " TpC ") != "TpC" {
		t.Error("US symbols are case-sensitive and must be left as given")
	}
}
