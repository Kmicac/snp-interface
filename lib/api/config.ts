import { env } from "@/lib/env"

export const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, "")

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  login: '/auth/login',
  me: '/auth/me',

  // Organizations
  orgs: '/orgs',

  // Events
  events: (orgId: string) => `/orgs/${orgId}/events`,
  event: (orgId: string, eventId: string) => `/orgs/${orgId}/events/${eventId}`,
  eventResources: (orgId: string, eventId: string) => `/orgs/${orgId}/events/${eventId}/resources`,
  eventZones: (orgId: string, eventId: string) => `/orgs/${orgId}/events/${eventId}/zones`,

  // Tasks
  tasks: (orgId: string) => `/orgs/${orgId}/tasks`,
  task: (orgId: string, taskId: string) => `/orgs/${orgId}/tasks/${taskId}`,
  taskMove: (orgId: string, taskId: string) => `/orgs/${orgId}/tasks/${taskId}/move`,
  taskComments: (orgId: string, taskId: string) => `/orgs/${orgId}/tasks/${taskId}/comments`,
  taskActivity: (orgId: string, taskId: string) => `/orgs/${orgId}/tasks/${taskId}/activity`,
  taskChecklist: (orgId: string, taskId: string) => `/orgs/${orgId}/tasks/${taskId}/checklist`,
  taskChecklistItem: (orgId: string, taskId: string, itemId: string) =>
    `/orgs/${orgId}/tasks/${taskId}/checklist/${itemId}`,

  // Providers & Services
  providers: (orgId: string) => `/orgs/${orgId}/providers`,
  services: (orgId: string, eventId: string) => `/orgs/${orgId}/events/${eventId}/services`,

  // Work Orders
  workOrders: (orgId: string, eventId: string) => `/orgs/${orgId}/events/${eventId}/work-orders`,

  // Staff & Access
  staff: (orgId: string) => `/orgs/${orgId}/staff`,
  assignments: (orgId: string, eventId: string) => `/orgs/${orgId}/events/${eventId}/assignments`,
  credentials: (orgId: string, eventId: string) => `/orgs/${orgId}/events/${eventId}/credentials`,

  // Incidents & Improvements
  incidents: (orgId: string, eventId: string) => `/orgs/${orgId}/events/${eventId}/incidents`,
  improvements: (orgId: string) => `/orgs/${orgId}/improvements`,

  // Inventory
  assets: (orgId: string) => `/orgs/${orgId}/assets`,
  asset: (orgId: string, assetId: string) => `/orgs/${orgId}/assets/${assetId}`,
  assetCheckout: (orgId: string, eventId: string, assetId: string) =>
    `/orgs/${orgId}/events/${eventId}/assets/${assetId}/checkout`,
  assetReturn: (orgId: string, eventId: string, usageId: string) =>
    `/orgs/${orgId}/events/${eventId}/assets-usage/${usageId}/return`,
  assetCategories: (orgId: string) => `/orgs/${orgId}/asset-categories`,
  inventoryDashboardStats: (orgId: string) => `/orgs/${orgId}/inventory/dashboard/stats`,
  inventoryMovements: (orgId: string) => `/orgs/${orgId}/inventory/movements`,
  inventoryMovementExport: (orgId: string) => `/orgs/${orgId}/inventory/reports/movements/export`,
  inventoryKits: (orgId: string) => `/orgs/${orgId}/inventory/kits`,
  inventoryKit: (orgId: string, kitId: string) => `/orgs/${orgId}/inventory/kits/${kitId}`,
  inventoryApplyKit: (orgId: string, eventId: string, kitId: string) =>
    `/orgs/${orgId}/events/${eventId}/inventory/apply-kit/${kitId}`,
  inventoryChecklists: (orgId: string) => `/orgs/${orgId}/inventory/checklists`,
  inventoryChecklist: (orgId: string, checklistId: string) => `/orgs/${orgId}/inventory/checklists/${checklistId}`,
  inventoryChecklistVerifyItem: (orgId: string, checklistId: string) =>
    `/orgs/${orgId}/inventory/checklists/${checklistId}/verify-item`,
  inventoryChecklistSign: (orgId: string, checklistId: string) =>
    `/orgs/${orgId}/inventory/checklists/${checklistId}/sign`,
  inventoryChecklistExportPdf: (orgId: string, checklistId: string) =>
    `/orgs/${orgId}/inventory/reports/checklists/${checklistId}/export-pdf`,
  inventoryAssetQr: (orgId: string, assetId: string) => `/orgs/${orgId}/inventory/assets/${assetId}/qr`,
  inventoryScan: (orgId: string, qrData: string) => `/orgs/${orgId}/inventory/scan/${encodeURIComponent(qrData)}`,

  // Partners & Sponsors
  brands: (orgId: string) => `/public/orgs/${orgId}/brands`,
  sponsorsByTier: (orgId: string, eventId: string) => `/public/orgs/${orgId}/events/${eventId}/sponsors-by-tier`,
  sponsorKpis: (orgId: string, eventId: string) => `/orgs/${orgId}/events/${eventId}/sponsors/kpis`,

  // Referees & Trainings
  referees: (orgId: string) => `/orgs/${orgId}/referees`,
  tatamis: (orgId: string, eventId: string) => `/orgs/${orgId}/events/${eventId}/tatamis`,
  trainings: (orgId: string) => `/orgs/${orgId}/trainings`,
  eventTrainings: (orgId: string, eventId: string) => `/orgs/${orgId}/events/${eventId}/trainings`,

  // KPIs
  kpisSummary: (orgId: string, eventId: string) => `/orgs/${orgId}/events/${eventId}/kpis/summary`,
  kpisOverdue: (orgId: string, eventId: string) => `/orgs/${orgId}/events/${eventId}/kpis/overdue`,
  kpisSlaBreaches: (orgId: string, eventId: string) => `/orgs/${orgId}/events/${eventId}/kpis/sla-breaches`,

  // Files
  filesUpload: (orgId: string) => `/orgs/${orgId}/files/upload`,
}
