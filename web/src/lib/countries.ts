import { COUNTRY_DIAL_CODES } from './country-data'

export interface Country {
  code: string // ISO 3166-1 alpha-2, e.g. "NG"
  dialCode: string // e.g. "+234"
  name: string // English display name
  minDigits: number
  maxDigits: number
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

export const ALL_COUNTRIES: Country[] = COUNTRY_DIAL_CODES.map(([code, dial, minDigits, maxDigits]) => ({
  code,
  dialCode: `+${dial}`,
  name: regionNames.of(code) ?? code,
  minDigits,
  maxDigits,
})).sort((a, b) => a.name.localeCompare(b.name))

export function findCountry(code: string): Country | undefined {
  return ALL_COUNTRIES.find((c) => c.code === code)
}

// Dial codes several countries share resolve to the one most users mean.
const PRIMARY_FOR_DIAL_CODE: Record<string, string> = { '+1': 'US', '+7': 'RU', '+44': 'GB' }

/** The country for a stored dial code ("+234" → Nigeria). */
export function findCountryByDialCode(dialCode: string): Country | undefined {
  const primary = PRIMARY_FOR_DIAL_CODE[dialCode]
  return (primary && findCountry(primary)) || ALL_COUNTRIES.find((c) => c.dialCode === dialCode)
}

/** National number digits, without a leading trunk "0" (e.g. "0801…" in NG → "801…"). */
export function normalizeNationalNumber(national: string): string {
  return national.replace(/\D/g, '').replace(/^0/, '')
}

/**
 * Length check against the country's possible national-number lengths.
 * Lighter than full libphonenumber validation; the API is the final validator.
 */
export function validatePhoneNumber(national: string, country: Country): boolean {
  const digits = normalizeNationalNumber(national)
  return digits.length >= country.minDigits && digits.length <= country.maxDigits
}
