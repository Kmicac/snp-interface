import { apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/config"

export interface StaffMemberApiResponse {
  id: string
  fullName: string
  email?: string | null
  phone?: string | null
  notes?: string | null
}

export interface StaffAssignmentApiResponse {
  id: string
  eventId: string
  staffMemberId: string
  role: string
  zoneId: string | null
  shiftId: string | null
  startsAt: string | null
  endsAt: string | null
  staffMember?: {
    id: string
    fullName: string
    email?: string | null
  } | null
}

export const staffClient = {
  listStaffMembers(orgId: string) {
    return apiClient.get<StaffMemberApiResponse[]>(API_ENDPOINTS.staff(orgId))
  },

  listAssignments(orgId: string, eventId: string) {
    return apiClient.get<StaffAssignmentApiResponse[]>(API_ENDPOINTS.assignments(orgId, eventId))
  },
}
