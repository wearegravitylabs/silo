import { useNavigate } from '@tanstack/react-router'
import { AvatarFace, AVATAR_VARIANTS } from '@/components/AvatarPicker'
import type { AvatarId } from '@/components/AvatarPicker'
import { useAuthStore } from '@/store/auth'

// ─── Design tokens ────────────────────────────────────────────────────────────
const PANEL_SHADOW =
  '0px 2px 2px -1px rgba(17,29,80,0.04), 0px 4px 2px -1px rgba(17,29,80,0.04), 0px 0px 0px 0.5px rgba(17,29,80,0.12)'

// ─── Icons ────────────────────────────────────────────────────────────────────

function HomeIcon({ active }: { active?: boolean }) {
  const c = active ? '#2C2E35' : '#6E738C'
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.59 1.44a.85.85 0 0 0-1.18 0L1.25 7.06A.85.85 0 0 0 2.44 8.3l.06-.06V14c0 .47.38.85.85.85h3.4a.85.85 0 0 0 .85-.85v-3.4h1.7V14c0 .47.38.85.85.85h3.4c.47 0 .85-.38.85-.85V8.24l.06.06a.85.85 0 0 0 1.19-1.24L8.59 1.44Z"
        fill={c}
      />
    </svg>
  )
}
function AssetsNavIcon({ active }: { active?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.5 4.5a1 1 0 0 1 1-1H6l1.5 1.5H13a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H3a1.5 1.5 0 0 1-1.5-1.5V4.5Z"
        fill={active ? '#2C2E35' : '#6E738C'}
      />
    </svg>
  )
}
function DebtsNavIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 1.5h8A1.5 1.5 0 0 1 13.5 3v9.75a.75.75 0 0 1-1.1.66L11 12.44l-1.4.97a.75.75 0 0 1-.84 0L7.4 12.44 6 13.41a.75.75 0 0 1-1.1-.66V3A1.5 1.5 0 0 0 4 1.5Zm.25 3.25A.75.75 0 0 1 5 4h6a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1-.75-.75Zm.75 2.5a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5H5Z"
        fill="#6E738C"
      />
    </svg>
  )
}
function VaultNavIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 1.5A3.25 3.25 0 0 0 4.75 4.75V6H3.5A1.5 1.5 0 0 0 2 7.5V14A1.5 1.5 0 0 0 3.5 15.5h9A1.5 1.5 0 0 0 14 14V7.5A1.5 1.5 0 0 0 12.5 6H11.25V4.75A3.25 3.25 0 0 0 8 1.5Zm1.75 4.5V4.75a1.75 1.75 0 1 0-3.5 0V6h3.5ZM8 9a1 1 0 0 1 .5 1.87V12h-1v-1.13A1 1 0 0 1 8 9Z"
        fill="#6E738C"
      />
    </svg>
  )
}
function ProjectionsNavIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 5L6.5 8l-4 3" stroke="#6E738C" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 5L12.5 8l-4 3" stroke="#6E738C" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function MenuCollapseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 3v10M3 8l4-3v6L3 8Z" stroke="#6E738C" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}
function MenuExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 3v10M13 8l-4-3v6l4-3Z" stroke="#6E738C" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}
function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="#6E738C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 1.5a6.5 6.5 0 1 0 0 13A6.5 6.5 0 0 0 8 1.5ZM7.25 6a.75.75 0 0 1 1.5 0v5a.75.75 0 0 1-1.5 0V6Zm.75-2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"
        fill="#6E738C"
      />
    </svg>
  )
}
function LogOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M10.5 11l3-3-3-3M13.5 8H6"
        stroke="#6E738C"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function ArrowUpRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3.5 8.5L8.5 3.5M8.5 3.5H5M8.5 3.5V7" stroke="#033AB8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({
  icon,
  label,
  active,
  collapsed,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  collapsed?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className="transition-colors flex items-center"
      style={{
        gap: collapsed ? 0 : '4px',
        padding: collapsed ? '5px' : '5px 8px',
        width: collapsed ? '40px' : '244px',
        height: '32px',
        borderRadius: '8px',
        background: active ? '#EFF0F5' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}
    >
      {icon}
      {!collapsed && (
        <span
          style={{
            fontSize: '14px',
            fontWeight: 500,
            lineHeight: '22px',
            letterSpacing: '0.1px',
            color: '#2C2E35',
            paddingLeft: '4px',
          }}
        >
          {label}
        </span>
      )}
    </button>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export type ActiveSection = 'dashboard' | 'assets' | 'debts' | 'vault' | 'projections'

export interface SidebarProps {
  portfolioName: string
  avatarId: AvatarId
  activeSection: ActiveSection
  collapsed: boolean
  onToggleCollapse: () => void
  onLogout: () => void
}

export function Sidebar({
  portfolioName,
  avatarId,
  activeSection,
  collapsed,
  onToggleCollapse,
  onLogout,
}: SidebarProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
    : '?'
  const variant = AVATAR_VARIANTS.find((v) => v.id === avatarId) ?? AVATAR_VARIANTS[0]

  return (
    <div
      style={{
        width: collapsed ? '64px' : '268px',
        height: '100dvh',
        background: '#F9F9FB',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}
    >
      {/* ─ Top ─ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Portfolio switcher row */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: collapsed ? '16px 12px' : '16px 12px 16px 14px',
            height: '56px',
          }}
        >
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div style={{ flexShrink: 0 }}>
                <AvatarFace
                  bg={variant.bg}
                  accent={variant.accent}
                  hair={variant.hair}
                  size={24}
                />
              </div>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#2C2E35',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '116px',
                }}
              >
                {portfolioName}
              </span>
              <ChevronDownIcon />
            </div>
          )}
          {collapsed && (
            <div style={{ margin: '0 auto' }}>
              <AvatarFace
                bg={variant.bg}
                accent={variant.accent}
                hair={variant.hair}
                size={24}
              />
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hover:opacity-60 transition-opacity flex items-center"
              style={{ flexShrink: 0 }}
            >
              <MenuCollapseIcon />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hover:opacity-60 transition-opacity flex items-center justify-center"
              style={{
                width: '40px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              <MenuExpandIcon />
            </button>
          </div>
        )}

        {/* Nav items */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            padding: '0 4px',
          }}
        >
          <NavItem
            icon={<HomeIcon active={activeSection === 'dashboard'} />}
            label="Dashboard"
            active={activeSection === 'dashboard'}
            collapsed={collapsed}
            onClick={() => navigate({ to: '/dashboard' })}
          />
          <NavItem
            icon={<AssetsNavIcon active={activeSection === 'assets'} />}
            label="Assets"
            active={activeSection === 'assets'}
            collapsed={collapsed}
            onClick={() => navigate({ to: '/assets' })}
          />
          <NavItem
            icon={<DebtsNavIcon />}
            label="Debts"
            active={activeSection === 'debts'}
            collapsed={collapsed}
            onClick={() => {}}
          />
          <NavItem
            icon={<VaultNavIcon />}
            label="Vault"
            active={activeSection === 'vault'}
            collapsed={collapsed}
            onClick={() => {}}
          />
          <NavItem
            icon={<ProjectionsNavIcon />}
            label="Projections"
            active={activeSection === 'projections'}
            collapsed={collapsed}
            onClick={() => {}}
          />
        </div>
      </div>

      {/* ─ Bottom ─ */}
      <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '0' }}>
        {/* Info card — hidden when collapsed */}
        {!collapsed && (
          <div
            style={{
              margin: '0 12px 12px',
              padding: '8px',
              background: '#FFF',
              boxShadow: PANEL_SHADOW,
              borderRadius: '12px',
            }}
          >
            <div className="flex items-start gap-2">
              <div className="flex items-center shrink-0" style={{ height: '22px' }}>
                <InfoIcon />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    lineHeight: '22px',
                    color: '#2C2E35',
                  }}
                >
                  Open source &amp; private
                </span>
                <span style={{ fontSize: '12px', lineHeight: '20px', color: '#6E738C' }}>
                  Your data is never shared. Fully open source.
                </span>
                <button
                  type="button"
                  className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                  style={{
                    padding: '4px 0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#033AB8' }}>
                    View source
                  </span>
                  <ArrowUpRightIcon />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User row */}
        <div
          className="flex items-center"
          style={{
            padding: collapsed ? '16px 0' : '16px 20px',
            height: '56px',
            justifyContent: collapsed ? 'center' : 'space-between',
          }}
        >
          <div
            className="flex items-center justify-center font-semibold text-white"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '40px',
              background: '#033AB8',
              fontSize: '9px',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          {!collapsed && (
            <button
              type="button"
              onClick={onLogout}
              title="Log out"
              className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <LogOutIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
