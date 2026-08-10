// ─── Avatar variants matching Figma "Onboarding - 39" face icons ─────────────
export const AVATAR_VARIANTS = [
  { id: 'lime',   bg: '#E5F7A0', accent: '#BBE03B', hair: 'rect'     },
  { id: 'red',    bg: '#FAC1BA', accent: '#F03722', hair: 'diagonal' },
  { id: 'orange', bg: '#FAD7BA', accent: '#F07F22', hair: 'circle'   },
  { id: 'green',  bg: '#C7F6BC', accent: '#29AF0B', hair: 'puffs'    },
] as const

export type AvatarId = (typeof AVATAR_VARIANTS)[number]['id']

// ─── Hair shapes (all within viewBox 0 0 104 104) ─────────────────────────────
function Hair({ shape, accent }: { shape: string; accent: string }) {
  if (shape === 'rect') {
    // Horizontal block filling the top of the face
    return <rect x="-1" y="26" width="106" height="78" fill={accent} />
  }
  if (shape === 'diagonal') {
    // Rotated rectangle (-45°) crossing the top half
    return (
      <rect
        x="-20"
        y="0"
        width="144"
        height="54"
        fill={accent}
        transform="rotate(-45 52 48)"
      />
    )
  }
  if (shape === 'circle') {
    // Large circle sitting at the top of the head
    return <circle cx="53" cy="24" r="34" fill={accent} />
  }
  if (shape === 'puffs') {
    // Two puff circles (hair buns) at the top
    return (
      <>
        <circle cx="28" cy="23" r="22" fill={accent} />
        <circle cx="76" cy="23" r="22" fill={accent} />
      </>
    )
  }
  return null
}

// ─── Core face SVG ────────────────────────────────────────────────────────────
// Uses a div with overflow:hidden + border-radius:50% to clip cleanly without
// needing SVG clipPath IDs (which would conflict when multiple faces render).
export function AvatarFace({
  bg,
  accent,
  hair,
  size = 104,
}: {
  bg: string
  accent: string
  hair: string
  size?: number
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        overflow: 'hidden',
        flexShrink: 0,
        display: 'block',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 104 104"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Hair decoration */}
        <Hair shape={hair} accent={accent} />

        {/* ── Left eye ── */}
        {/* Sclera */}
        <circle cx="30" cy="62" r="14" fill="white" />
        {/* Pupil */}
        <circle cx="34" cy="58" r="8.5" fill="#040103" />
        {/* Catchlight */}
        <circle cx="30.5" cy="55" r="3.5" fill="white" />

        {/* ── Right eye ── */}
        <circle cx="74" cy="62" r="14" fill="white" />
        <circle cx="78" cy="58" r="8.5" fill="#040103" />
        <circle cx="74.5" cy="55" r="3.5" fill="white" />

        {/* ── Mouth (dark rounded oval) ── */}
        <ellipse cx="52" cy="83" rx="13.5" ry="9" fill="#040103" />
      </svg>
    </div>
  )
}

// ─── Picker component matching Figma Frame 16 ─────────────────────────────────
// Layout: [104×104 large preview] [space] [4×44 thumbnails row + "Edit" btn]
// Dimensions: 343×136px card, padding 16px, justify-content: space-between

const EDIT_BTN_SHADOW =
  '0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.1)'

interface AvatarPickerProps {
  selected: AvatarId
  onChange: (id: AvatarId) => void
}

export function AvatarPicker({ selected, onChange }: AvatarPickerProps) {
  const current =
    AVATAR_VARIANTS.find((v) => v.id === selected) ?? AVATAR_VARIANTS[0]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '343px',
        height: '136px',
        padding: '16px',
        background: '#FFFFFF',
        border: '1px solid #EFF0F5',
        borderRadius: '12px',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Left: large preview ── */}
      <AvatarFace
        bg={current.bg}
        accent={current.accent}
        hair={current.hair}
        size={104}
      />

      {/* ── Right: thumbnail row + edit button ── */}
      <div
        style={{
          width: '176px',
          height: '104px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        {/* 4 thumbnails — 44px each × 4 = 176px, no gap */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            width: '176px',
            height: '44px',
          }}
        >
          {AVATAR_VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onChange(v.id)}
              aria-label={`Select ${v.id} avatar`}
              aria-pressed={v.id === selected}
              style={{
                width: '44px',
                height: '44px',
                padding: '2px',
                borderRadius: '40px',
                // Blue ring only on the selected one; transparent preserves layout
                border:
                  v.id === selected
                    ? '1px solid #033AB8'
                    : '1px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease',
                flexShrink: 0,
              }}
            >
              <AvatarFace
                bg={v.bg}
                accent={v.accent}
                hair={v.hair}
                size={40}
              />
            </button>
          ))}
        </div>

        {/* "Edit" — placeholder for future custom image upload */}
        <button
          type="button"
          disabled
          style={{
            width: '54px',
            height: '28px',
            padding: '8px 10px',
            borderRadius: '6px',
            background:
              'linear-gradient(180deg, #FFFFFF 0%, #F9F9FB 65%, #EFF0F5 100%)',
            boxShadow: EDIT_BTN_SHADOW,
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            fontWeight: 600,
            color: '#2C2E35',
            opacity: 0.5,
            cursor: 'not-allowed',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Edit
        </button>
      </div>
    </div>
  )
}
