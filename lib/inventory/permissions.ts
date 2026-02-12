import type { User } from '@/lib/types'

const WRITER_ROLES = new Set(['admin', 'owner', 'manager'])
const READER_ROLES = new Set(['admin', 'owner', 'manager', 'member', 'viewer'])

function getOrgRole(user: User | null | undefined, orgId?: string | null): string | null {
  if (!user || !orgId) return null
  const membership = user.memberships.find((item) => item.orgId === orgId)
  return membership?.role?.toLowerCase() || null
}

export function canAccessInventory(user: User | null | undefined, orgId?: string | null): boolean {
  const role = getOrgRole(user, orgId)
  if (!role) return false
  return READER_ROLES.has(role)
}

export function canWriteInventory(user: User | null | undefined, orgId?: string | null): boolean {
  const role = getOrgRole(user, orgId)
  if (!role) return false
  return WRITER_ROLES.has(role)
}
