import type {
  WorkOrder,
  Incident,
  Improvement,
  Sponsor,
  SponsorsByTier,
  Staff,
  Asset,
  Referee,
  Tatami,
  KpisSummary,
} from "./types"

// Mock Work Orders
export const mockWorkOrders: WorkOrder[] = [
  {
    id: "wo-1",
    code: "WO-001",
    title: "Setup tatami mats - Zone A",
    provider: "LogiEvents",
    category: "Logistics",
    zone: "TATAMI 1",
    status: "completed",
    slaStatus: "on_time",
    scheduledStart: "2025-03-15T06:00:00",
    scheduledEnd: "2025-03-15T08:00:00",
  },
  {
    id: "wo-2",
    code: "WO-002",
    title: "Security perimeter check",
    provider: "SecurePro",
    category: "Security",
    zone: "ENTRANCE",
    status: "in_progress",
    slaStatus: "on_time",
    scheduledStart: "2025-03-15T07:00:00",
    scheduledEnd: "2025-03-15T09:00:00",
  },
  {
    id: "wo-3",
    code: "WO-003",
    title: "Clean athlete warm-up area",
    provider: "CleanMax",
    category: "Cleaning",
    zone: "WARM-UP",
    status: "scheduled",
    slaStatus: "on_time",
    scheduledStart: "2025-03-15T08:00:00",
    scheduledEnd: "2025-03-15T09:30:00",
  },
  {
    id: "wo-4",
    code: "WO-004",
    title: "Medical station setup",
    provider: "MedTeam",
    category: "Medical",
    zone: "MEDICAL",
    status: "delayed",
    slaStatus: "at_risk",
    scheduledStart: "2025-03-15T06:30:00",
    scheduledEnd: "2025-03-15T07:30:00",
  },
  {
    id: "wo-5",
    code: "WO-005",
    title: "VIP lounge preparation",
    provider: "EventCatering",
    category: "Hospitality",
    zone: "VIP",
    status: "in_progress",
    slaStatus: "breached",
    scheduledStart: "2025-03-15T05:00:00",
    scheduledEnd: "2025-03-15T07:00:00",
  },
]

// Mock Incidents
export const mockIncidents: Incident[] = [
  {
    id: "inc-1",
    title: "Water leak in restroom B",
    description: "Minor water leak detected",
    severity: "medium",
    status: "in_progress",
    zone: "RESTROOM B",
    reportedAt: "2025-03-15T08:30:00",
  },
  {
    id: "inc-2",
    title: "Sound system malfunction - Tatami 3",
    severity: "high",
    status: "open",
    zone: "TATAMI 3",
    reportedAt: "2025-03-15T09:15:00",
  },
  {
    id: "inc-3",
    title: "Unauthorized access attempt",
    severity: "critical",
    status: "resolved",
    zone: "BACKSTAGE",
    reportedAt: "2025-03-15T07:45:00",
    resolvedAt: "2025-03-15T08:00:00",
  },
]

// Mock Improvements
export const mockImprovements: Improvement[] = [
  {
    id: "imp-1",
    title: "Digital check-in system",
    description: "Implement QR-based check-in for faster credential validation",
    type: "innovation",
    status: "approved",
    createdAt: "2025-02-01",
  },
  {
    id: "imp-2",
    title: "Referee rotation schedule optimization",
    type: "process",
    status: "in_progress",
    createdAt: "2025-02-15",
  },
  {
    id: "imp-3",
    title: "Sponsor visibility tracking",
    type: "improvement",
    status: "proposed",
    createdAt: "2025-03-01",
  },
]

// Mock Sponsors by Tier
export const mockSponsorsByTier: SponsorsByTier = {
  title: [
    { id: "sp-1", brandId: "br-1", brandName: "ADCC", tier: "title", logo: "/sponsors/adcc.png" },
  ],
  gold: [
    { id: "sp-2", brandId: "br-2", brandName: "Braus", tier: "gold", website: "https://braus.com" },
    { id: "sp-3", brandId: "br-3", brandName: "Shoyoroll", tier: "gold" },
  ],
  silver: [
    { id: "sp-4", brandId: "br-4", brandName: "Tatami", tier: "silver" },
    { id: "sp-5", brandId: "br-5", brandName: "Scramble", tier: "silver" },
    { id: "sp-6", brandId: "br-6", brandName: "RVCA", tier: "silver" },
  ],
  bronze: [
    { id: "sp-7", brandId: "br-7", brandName: "Hayabusa", tier: "bronze" },
    { id: "sp-8", brandId: "br-8", brandName: "Venum", tier: "bronze" },
  ],
  support: [
    { id: "sp-9", brandId: "br-9", brandName: "Gatorade", tier: "support" },
    { id: "sp-10", brandId: "br-10", brandName: "Red Bull", tier: "support" },
  ],
}

// Mock Staff
export const mockStaff: Staff[] = [
  { id: "st-1", name: "Carlos Mendez", email: "carlos@snp.com", phone: "+56 9 1234 5678", roles: ["security"], notes: "Team lead" },
  { id: "st-2", name: "Maria Silva", email: "maria@snp.com", roles: ["logistics", "admin"] },
  { id: "st-3", name: "Juan Perez", email: "juan@snp.com", roles: ["referee"] },
  { id: "st-4", name: "Ana Garcia", email: "ana@snp.com", roles: ["medical"] },
  { id: "st-5", name: "Pedro Rojas", email: "pedro@snp.com", roles: ["cleaning"] },
]

// Mock Assets
export const mockAssets: Asset[] = [
  { id: "as-1", name: "Tatami Mat Set A", category: "Competition Equipment", status: "in_use", condition: "good", quantity: 10, location: "TATAMI 1" },
  { id: "as-2", name: "Scoring Display", category: "Electronics", status: "damaged", condition: "poor", quantity: 1, location: "Storage" },
  { id: "as-3", name: "First Aid Kit", category: "Medical", status: "in_use", condition: "good", quantity: 5, location: "MEDICAL" },
  { id: "as-4", name: "Barrier Fence", category: "Security", status: "under_repair", condition: "fair", quantity: 3, location: "Maintenance" },
  { id: "as-5", name: "Sound System", category: "Electronics", status: "in_use", condition: "good", quantity: 2, location: "MAIN STAGE" },
]

// Mock Referees
export const mockReferees: Referee[] = [
  { id: "ref-1", staffId: "st-3", name: "Juan Perez", level: "master", certifications: ["IBJJF", "ADCC"], eventsRefereed: 45 },
  { id: "ref-2", staffId: "st-6", name: "Roberto Alves", level: "senior", certifications: ["IBJJF"], eventsRefereed: 28 },
  { id: "ref-3", staffId: "st-7", name: "Diego Torres", level: "intermediate", certifications: ["IBJJF"], eventsRefereed: 12 },
]

// Mock Tatamis
export const mockTatamis: Tatami[] = [
  {
    id: "tat-1",
    number: 1,
    name: "Tatami 1 - Main",
    assignedReferees: [
      { refereeId: "ref-1", refereeName: "Juan Perez", role: "center" },
      { refereeId: "ref-2", refereeName: "Roberto Alves", role: "side" },
    ],
  },
  {
    id: "tat-2",
    number: 2,
    name: "Tatami 2",
    assignedReferees: [
      { refereeId: "ref-3", refereeName: "Diego Torres", role: "center" },
    ],
  },
]

// Mock KPIs Summary
export const mockKpisSummary: KpisSummary = {
  totalWorkOrders: 45,
  completedWorkOrders: 32,
  onTimePercentage: 87,
  totalIncidents: 8,
  incidentsBySeverity: {
    low: 3,
    medium: 3,
    high: 1,
    critical: 1,
  },
  activeStaff: 24,
  activeCredentials: 156,
}

// Mock Operations Feed
export const mockOperationsFeed = [
  { id: "feed-1", message: "Work Order #WO-032 moved to IN_PROGRESS", time: "2 min ago", type: "work_order" },
  { id: "feed-2", message: "Incident reported in Zone TATAMI 3", time: "5 min ago", type: "incident" },
  { id: "feed-3", message: "Sponsor Braus confirmed (GOLD)", time: "12 min ago", type: "sponsor" },
  { id: "feed-4", message: "Credential issued for Maria Silva", time: "15 min ago", type: "credential" },
  { id: "feed-5", message: "Security check completed - Zone VIP", time: "20 min ago", type: "work_order" },
  { id: "feed-6", message: "Asset 'Sound System' moved to MAIN STAGE", time: "25 min ago", type: "asset" },
  { id: "feed-7", message: "Referee Juan Perez assigned to Tatami 1", time: "30 min ago", type: "staff" },
]
