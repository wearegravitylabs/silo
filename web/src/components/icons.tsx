// Small UI icons shared across features. Feature-specific icons live in that feature.

export function SearchIcon({ size = 16, color = '#6E738C' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 2a5 5 0 1 0 3.17 8.87l2.47 2.47a.75.75 0 1 0 1.06-1.06L11.23 9.8A5 5 0 0 0 7 2Zm-3.5 5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z"
        fill={color}
      />
    </svg>
  )
}

export function RefreshIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M10 2.5A4.5 4.5 0 1 0 10.97 7" stroke="#6E738C" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M9 1.5l1 1-1 1" stroke="#6E738C" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronDownIcon({ size = 12, color = '#6E738C' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CloseIcon({ color = '#6E738C', size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4L4 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function PlusCircleIcon({ color = '#033AB8', size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 1.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM6.25 4.75a.75.75 0 0 1 1.5 0V6.25H9.25a.75.75 0 0 1 0 1.5H7.75V9.25a.75.75 0 0 1-1.5 0V7.75H4.75a.75.75 0 0 1 0-1.5H6.25V4.75Z"
        fill={color}
      />
    </svg>
  )
}

export function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="4" cy="8" r="1.2" fill="#6E738C" />
      <circle cx="8" cy="8" r="1.2" fill="#6E738C" />
      <circle cx="12" cy="8" r="1.2" fill="#6E738C" />
    </svg>
  )
}

export function EyeIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <path d="M1 6.5C1 6.5 3 2.5 6.5 2.5S12 6.5 12 6.5 10 10.5 6.5 10.5 1 6.5 1 6.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="6.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.1"/>
    </svg>
  )
}

export function EyeOffIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <path d="M1.5 1.5l10 10M5.5 5.6A1.5 1.5 0 0 0 7.4 7.5M3.2 3.3C2 4.2 1 6.5 1 6.5s2 4 5.5 4c1.1 0 2-.3 2.8-.8M10 9.8C11.1 8.9 12 6.5 12 6.5S10 2.5 6.5 2.5c-.9 0-1.7.2-2.4.6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  )
}
