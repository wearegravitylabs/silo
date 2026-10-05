import { COUNTRY_DIAL_CODES } from './country-data'

export interface Country {
  code: string     // ISO 3166-1 alpha-2, e.g. "NG"
  dialCode: string // e.g. "+234"
  name: string     // English display name
  flag: string     // emoji flag
  minDigits: number
  maxDigits: number
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

export function toFlagEmoji(iso2: string) {
  return [...iso2.toUpperCase()].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join('')
}

export const ALL_COUNTRIES: Country[] = COUNTRY_DIAL_CODES.map(([code, dial, minDigits, maxDigits]) => ({
  code,
  dialCode: `+${dial}`,
  name: regionNames.of(code) ?? code,
  flag: toFlagEmoji(code),
  minDigits,
  maxDigits,
})).sort((a, b) => a.name.localeCompare(b.name))

export function findCountry(code: string): Country | undefined {
  return ALL_COUNTRIES.find((c) => c.code === code)
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
