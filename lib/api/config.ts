// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'

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
  eventZones: (orgId: string, eventId: string) => `/orgs/${orgId}/events/${eventId}/zones`,
  
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
  assetCategories: (orgId: string) => `/orgs/${orgId}/asset-categories`,
  
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
}
