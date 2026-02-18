import type { OrgRole, User } from "@/lib/types"

export type RoleCapability =
  | "inventory:read"
  | "inventory:write"
  | "tasks:read"
  | "tasks:write"
  | "events:read"
  | "events:write"
  | "files:upload"
  | "auth:manage_users"

const READ_CAPABILITIES: RoleCapability[] = [
  "inventory:read",
  "tasks:read",
  "events:read",
]

const WRITE_CAPABILITIES: RoleCapability[] = [
  "inventory:write",
  "tasks:write",
  "events:write",
  "files:upload",
]

export const ROLE_CAPABILITIES: Record<OrgRole, RoleCapability[]> = {
  SUPER_ADMIN: [...READ_CAPABILITIES, ...WRITE_CAPABILITIES, "auth:manage_users"],
  HR: [...READ_CAPABILITIES, "tasks:write"],
  EVENT_DIRECTOR: [...READ_CAPABILITIES, ...WRITE_CAPABILITIES],
  HEAD_REFEREE: [...READ_CAPABILITIES, "tasks:write"],
  TECH_SYSTEMS: [...READ_CAPABILITIES, ...WRITE_CAPABILITIES],
  GUADA: [...READ_CAPABILITIES, ...WRITE_CAPABILITIES],
}

export function hasOrgCapability(
  user: User | null | undefined,
  orgId: string | null | undefined,
  capability: RoleCapability,
): boolean {
  if (!user || !orgId) return false
  const membership = user.memberships.find((item) => item.orgId === orgId)
  if (!membership) return false
  return ROLE_CAPABILITIES[membership.role].includes(capability)
}
