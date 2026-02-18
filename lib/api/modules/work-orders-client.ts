import { apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/config"

export type WorkOrderStatusApi =
  | "SCHEDULED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED"
  | "DELAYED"

export interface WorkOrderApiResponse {
  id: string
  eventId: string
  zoneId: string | null
  providerServiceId: string
  title: string
  description: string | null
  scheduledStartAt: string | null
  scheduledEndAt: string | null
  status: WorkOrderStatusApi
  acceptedAt: string | null
  startedAt: string | null
  completedAt: string | null
  delayedAt: string | null
  createdAt: string
  updatedAt: string
  delayMinutes?: number | null
  providerService?: {
    id: string
    name: string
    category: string
    provider?: {
      id: string
      name: string
    }
  } | null
  zone?: {
    id: string
    name: string
    type?: string | null
  } | null
}

export interface ProviderServiceApiResponse {
  id: string
  eventId: string
  providerId: string
  category: string
  name: string
  slaMinutes: number | null
  windowSlackMinutes: number | null
  notes: string | null
  provider?: {
    id: string
    name: string
  } | null
}

export interface CreateWorkOrderInput {
  title: string
  description?: string
  zoneId?: string
  scheduledStartAt?: string
  scheduledEndAt?: string
}

export interface UpdateWorkOrderInput {
  title?: string
  description?: string | null
  zoneId?: string | null
  providerServiceId?: string | null
  scheduledStartAt?: string | null
  scheduledEndAt?: string | null
}

export const workOrdersClient = {
  list(orgId: string, eventId: string) {
    return apiClient.get<WorkOrderApiResponse[]>(API_ENDPOINTS.workOrders(orgId, eventId))
  },

  create(
    orgId: string,
    eventId: string,
    providerServiceId: string,
    payload: CreateWorkOrderInput,
  ) {
    return apiClient.post<WorkOrderApiResponse>(
      `/orgs/${orgId}/events/${eventId}/provider-services/${providerServiceId}/work-orders`,
      payload,
    )
  },

  update(orgId: string, eventId: string, workOrderId: string, payload: UpdateWorkOrderInput) {
    return apiClient.patch<WorkOrderApiResponse>(
      `/orgs/${orgId}/events/${eventId}/work-orders/${workOrderId}`,
      payload,
    )
  },

  updateStatus(
    orgId: string,
    eventId: string,
    workOrderId: string,
    status: WorkOrderStatusApi,
    note?: string,
  ) {
    return apiClient.patch<WorkOrderApiResponse>(
      `/orgs/${orgId}/events/${eventId}/work-orders/${workOrderId}/status`,
      { status, note },
    )
  },

  listProviderServices(orgId: string, eventId: string) {
    return apiClient.get<ProviderServiceApiResponse[]>(API_ENDPOINTS.services(orgId, eventId))
  },

  listZones(orgId: string, eventId: string) {
    return apiClient.get<Array<{ id: string; name: string; type?: string | null }>>(
      API_ENDPOINTS.eventZones(orgId, eventId),
    )
  },
}
