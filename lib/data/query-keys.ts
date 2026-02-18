export const queryKeys = {
  events: (orgId: string) => ["events", orgId] as const,
  event: (orgId: string, eventId: string) => ["event", orgId, eventId] as const,
  zones: (eventId: string) => ["zones", eventId] as const,
  eventResources: (eventId: string) => ["eventResources", eventId] as const,

  tasks: (orgId: string, filters: string = "all") => ["tasks", orgId, filters] as const,
  task: (taskId: string) => ["task", taskId] as const,
  taskActivity: (taskId: string) => ["taskActivity", taskId] as const,

  workOrders: (eventId: string) => ["workOrders", eventId] as const,
  workOrder: (workOrderId: string) => ["workOrder", workOrderId] as const,

  assets: (orgId: string, filters: string = "all") => ["assets", orgId, filters] as const,
  kits: (orgId: string) => ["kits", orgId] as const,
  checklists: (orgId: string, eventId: string = "all") => ["checklists", orgId, eventId] as const,
  movements: (orgId: string, filters: string = "all") => ["movements", orgId, filters] as const,
  dashboard: (orgId: string, eventId: string = "all") => ["dashboard", orgId, eventId] as const,

  staffMembers: (orgId: string) => ["staffMembers", orgId] as const,
  assignments: (eventId: string) => ["assignments", eventId] as const,
  credentials: (eventId: string) => ["credentials", eventId] as const,
} as const

export type QueryKey = readonly unknown[]
