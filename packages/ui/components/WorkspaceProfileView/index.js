'use client'

/**
 * WorkspaceProfileView — shared read-only profile page for CRM / PM / Accounts.
 *
 * Each app passes its own PageHeader component (CRMPageHeader, etc.) so the
 * header keeps app-specific notification + search wiring.
 */

import {
  Building2,
  Mail,
  Shield,
  User as UserIcon,
} from 'lucide-react'
import {
  flattenUser,
  resolveUserDisplayName,
  resolveUserInitials,
  resolveUserRole,
  useAuth,
} from '@webfudge/auth'
import { Avatar } from '../Avatar'
import { Badge } from '../Badge'
import { Card } from '../Card'
import { InfoRow, InfoSection } from '../EntityDetailLayout'
import { LoadingSpinner } from '../../feedback'

function formatValue(value) {
  if (value === null || value === undefined) return '—'
  const str = String(value).trim()
  return str || '—'
}

function formatRoleLabel(role) {
  return String(role || 'User')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * @param {{ PageHeader: React.ComponentType<Record<string, unknown>> }} props
 */
export function WorkspaceProfileView({ PageHeader }) {
  const { user, currentOrg, loading } = useAuth()
  const flat = flattenUser(user)
  const displayName = resolveUserDisplayName(user)
  const initials = resolveUserInitials(user)
  const email = flat?.email || ''
  const username = flat?.username || ''
  const userId = flat?.id ?? flat?.documentId ?? null
  const firstName = flat?.firstName || ''
  const lastName = flat?.lastName || ''

  const activeRole =
    currentOrg?.role ||
    currentOrg?.roleName ||
    currentOrg?.roleCode ||
    resolveUserRole(user) ||
    'User'
  const roleLabel = formatRoleLabel(activeRole)
  const orgName = currentOrg?.name || 'Active workspace'
  const accessLevel = currentOrg?.accessLevel
    ? formatRoleLabel(currentOrg.accessLevel)
    : null
  const joinedAt = currentOrg?.joinedAt
    ? new Date(currentOrg.joinedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  if (loading && !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <LoadingSpinner message="Loading profile…" />
      </div>
    )
  }

  return (
    <div className="min-h-full space-y-6 bg-white p-4 md:p-6">
      <PageHeader
        title="View Profile"
        subtitle="Your account details for this workspace"
        breadcrumb={[{ label: 'Profile', href: '/profile' }]}
        showSearch={false}
        showActions={false}
      />

      <Card variant="elevated" className="overflow-hidden border border-gray-200/80 p-0">
        <div className="flex flex-col gap-4 border-b border-gray-100 bg-gradient-to-br from-brand-indigo/[0.06] via-white to-brand-primary/[0.05] p-6 sm:flex-row sm:items-center sm:gap-5">
          <Avatar
            fallback={initials}
            alt={displayName}
            size="xl"
            className="bg-gradient-to-br from-brand-indigo to-brand-midnight border-2 border-white text-lg font-bold text-white shadow-lg"
          />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold text-brand-foreground">
              {displayName}
            </h2>
            <p className="mt-0.5 truncate text-sm text-brand-text-light">
              {email || 'No email on file'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="success" size="sm">
                {roleLabel}
              </Badge>
              <span className="text-sm font-medium text-brand-text-light">•</span>
              <span className="truncate text-sm font-medium text-brand-foreground">
                {orgName}
              </span>
            </div>
            <p className="mt-2 text-xs text-brand-text-light">
              Account access synced from workspace role
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border border-gray-200 p-6">
          <InfoSection title="Personal" icon={UserIcon} isFirst>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <InfoRow label="Full name" value={displayName} />
              <InfoRow label="First name" value={formatValue(firstName)} />
              <InfoRow label="Last name" value={formatValue(lastName)} />
              <InfoRow label="Username" value={formatValue(username)} />
              <InfoRow
                label="Email"
                value={formatValue(email)}
                icon={Mail}
                className="sm:col-span-2"
              />
              <InfoRow label="User ID" value={formatValue(userId)} />
            </div>
          </InfoSection>
        </Card>

        <Card className="border border-gray-200 p-6">
          <InfoSection title="Workspace access" icon={Building2} isFirst>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <InfoRow label="Organization" value={orgName} className="sm:col-span-2" />
              <InfoRow label="Role" value={roleLabel} icon={Shield} emphasize />
              <InfoRow label="Access level" value={formatValue(accessLevel)} />
              <InfoRow label="Member since" value={formatValue(joinedAt)} />
            </div>
            <p className="mt-5 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-brand-text-light">
              Permissions for CRM, Project Management, and Accounts follow your
              organization role. Contact a workspace admin if something looks wrong.
            </p>
          </InfoSection>
        </Card>
      </div>
    </div>
  )
}

export default WorkspaceProfileView
