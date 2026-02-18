import type { OrgRole, User } from '@/lib/types'

const WRITER_ROLES = new Set<OrgRole>(["SUPER_ADMIN", "EVENT_DIRECTOR", "TECH_SYSTEMS", "GUADA"])
const READER_ROLES = new Set<OrgRole>([
  "SUPER_ADMIN",
  "HR",
  "EVENT_DIRECTOR",
  "HEAD_REFEREE",
  "TECH_SYSTEMS",
  "GUADA",
])

function getOrgRole(user: User | null | undefined, orgId?: string | null): OrgRole | null {
  if (!user || !orgId) return null
  const membership = user.memberships.find((item) => item.orgId === orgId)
  return membership?.role ?? null
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
