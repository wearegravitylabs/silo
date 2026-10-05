export function CoinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" fill="#EEF2FF" />
      <path fillRule="evenodd" clipRule="evenodd" d="M8 3.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm-.75 2.25a.75.75 0 0 1 1.5 0v.3c.64.18 1.25.7 1.25 1.45 0 .87-.74 1.4-1.5 1.53v1.47a.75.75 0 0 1-1.5 0v-.3C6.36 10.02 5.75 9.5 5.75 8.75c0-.87.74-1.4 1.5-1.53V5.75Zm.75 1.6c-.3.06-.5.22-.5.4s.2.34.5.4V7.35Zm0 1.9v.75c.3-.06.5-.22.5-.4s-.2-.34-.5-.4Z" fill="#033AB8" />
    </svg>
  )
}

export function PieIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5A6.5 6.5 0 1 0 14.5 8H8V1.5Z" fill="#033AB8" opacity="0.2" />
      <path d="M9.5 1.75V8H14.5A6.51 6.51 0 0 0 9.5 1.75Z" fill="#033AB8" />
    </svg>
  )
}

export function TrendingUpIcon({ color = '#29AF0B' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1.5 11L5 7.5l3 3 5.5-6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 4h4v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TrendingDownIcon({ color = '#F03722' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1.5 5L5 8.5l3-3 5.5 6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 12h4V8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CreditCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M1.5 4.5A1.5 1.5 0 0 1 3 3h10A1.5 1.5 0 0 1 14.5 4.5v7A1.5 1.5 0 0 1 13 13H3A1.5 1.5 0 0 1 1.5 11.5v-7ZM3 4.5V6H13V4.5H3ZM3 7.5v4H13v-4H3Z" fill="#F03722" />
    </svg>
  )
}

export function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M9 3h4v4M7 13H3V9M13 7v6M3 9V3" stroke="#6E738C" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
