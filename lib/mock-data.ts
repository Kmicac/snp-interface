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
  Task,
  Event,
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

// Mock Events
export const mockEvents: Event[] = [
  {
    id: "evt-1",
    name: "ADCC LATAM 2025",
    code: "ADCC_LATAM_2025",
    startDate: "2025-03-15T09:00:00",
    endDate: "2025-03-16T20:00:00",
    venue: "Movistar Arena, Santiago, Chile",
    status: "PLANNED",
    description: "Regional ADCC event with top talent from across LATAM.",
    imageUrl:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
    imageKey: "events/adcc-latam-2025",
  },
  {
    id: "evt-2",
    name: "Open Chile 2025",
    code: "OPEN_CHILE_2025",
    startDate: "2025-04-20T08:30:00",
    endDate: "2025-04-21T19:00:00",
    venue: "Centro de Eventos, Valparaiso, Chile",
    status: "PLANNED",
    description: "Open circuit tournament focused on grassroots and academy teams.",
    imageUrl:
      "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80",
    imageKey: "events/open-chile-2025",
  },
  {
    id: "evt-3",
    name: "Nacional BJJ 2024",
    code: "NACIONAL_BJJ_2024",
    startDate: "2024-11-10T09:00:00",
    endDate: "2024-11-11T18:00:00",
    venue: "Estadio Nacional, Santiago, Chile",
    status: "COMPLETED",
    description: "National championship finals and federation ranking closeout.",
    imageUrl:
      "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&w=1200&q=80",
    imageKey: "events/nacional-bjj-2024",
  },
  {
    id: "evt-4",
    name: "ADCC Trials South 2024",
    code: "ADCC_TRIALS_SUR_2024",
    startDate: "2024-09-15T10:00:00",
    endDate: "2024-09-15T20:00:00",
    venue: "Gimnasio Municipal, Concepcion, Chile",
    status: "COMPLETED",
    description: "ADCC trials with qualifying brackets across pro divisions.",
  },
  {
    id: "evt-5",
    name: "SNP Winter Open 2026",
    code: "SNP_WINTER_OPEN_2026",
    startDate: "2026-02-09T08:30:00",
    endDate: "2026-02-12T21:00:00",
    venue: "Arena Metropolitana, Santiago, Chile",
    status: "IN_PROGRESS",
    description: "Active operational window used to validate live event assignments.",
    imageUrl:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
    imageKey: "events/snp-winter-open-2026",
  },
]

// Mock Tasks (Kanban)
export const mockTasks: Task[] = [
  {
    id: "tsk-1",
    orgId: "org-1",
    eventId: "evt-1",
    title: "Validate incident response protocol",
    description: "Review escalation tree with operations supervisors before event start.",
    status: "TODO",
    priority: "HIGH",
    type: "INCIDENT",
    assigneeId: "st-1",
    assigneeName: "Carlos Mendez",
    dueDate: "2025-03-14T16:00:00",
    commentsCount: 2,
    checklistDone: 1,
    checklistTotal: 4,
    checklist: [
      { id: "chk-1-1", text: "Review incident escalation matrix", done: true },
      { id: "chk-1-2", text: "Validate on-call security supervisor", done: false },
      { id: "chk-1-3", text: "Confirm radio communication fallback", done: false },
      { id: "chk-1-4", text: "Share protocol with medics team", done: false },
    ],
    comments: [
      {
        id: "cmt-1-1",
        authorId: "st-1",
        authorName: "Carlos Mendez",
        message: "Escalation contacts updated for Saturday shift.",
        createdAt: "2025-03-10T09:45:00",
      },
      {
        id: "cmt-1-2",
        authorId: "st-2",
        authorName: "Maria Silva",
        message: "Waiting final confirmation from medical command post.",
        createdAt: "2025-03-10T10:10:00",
      },
    ],
    relatedIncidentId: "inc-2",
    relatedLabel: "Sound system malfunction - Tatami 3",
    createdAt: "2025-03-10T09:00:00",
    updatedAt: "2025-03-10T10:15:00",
  },
  {
    id: "tsk-2",
    orgId: "org-1",
    eventId: "evt-1",
    title: "Confirm tatami setup checklist",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    type: "WORK_ORDER",
    assigneeId: "st-2",
    assigneeName: "Maria Silva",
    dueDate: "2025-03-15T07:00:00",
    commentsCount: 1,
    checklistDone: 3,
    checklistTotal: 5,
    checklist: [
      { id: "chk-2-1", text: "Tatami anchors locked", done: true },
      { id: "chk-2-2", text: "Perimeter signage installed", done: true },
      { id: "chk-2-3", text: "Warm-up area mats aligned", done: true },
      { id: "chk-2-4", text: "Backup roll stored near zone B", done: false },
      { id: "chk-2-5", text: "Referee walk-through approved", done: false },
    ],
    comments: [
      {
        id: "cmt-2-1",
        authorId: "st-2",
        authorName: "Maria Silva",
        message: "Main setup is ready, pending QA on backup mats.",
        createdAt: "2025-03-11T11:50:00",
      },
    ],
    relatedWorkOrderId: "wo-1",
    relatedLabel: "WO-001 Setup tatami mats - Zone A",
    createdAt: "2025-03-11T08:30:00",
    updatedAt: "2025-03-11T12:20:00",
  },
  {
    id: "tsk-3",
    orgId: "org-1",
    eventId: "evt-1",
    title: "Resolve sponsor power feed dependency",
    description: "Electrical contractor pending final circuit approval.",
    status: "BLOCKED",
    priority: "CRITICAL",
    type: "SPONSORSHIP",
    assigneeId: "st-4",
    assigneeName: "Ana Garcia",
    commentsCount: 4,
    checklistDone: 0,
    checklistTotal: 2,
    checklist: [
      { id: "chk-3-1", text: "Get electrician final ETA", done: false },
      { id: "chk-3-2", text: "Approve booth load distribution", done: false },
    ],
    comments: [
      {
        id: "cmt-3-1",
        authorId: "st-4",
        authorName: "Ana Garcia",
        message: "Vendor requested revised power load sheet.",
        createdAt: "2025-03-11T12:15:00",
      },
      {
        id: "cmt-3-2",
        authorId: "st-1",
        authorName: "Carlos Mendez",
        message: "Escalated with infrastructure coordinator.",
        createdAt: "2025-03-11T12:55:00",
      },
      {
        id: "cmt-3-3",
        authorId: "st-2",
        authorName: "Maria Silva",
        message: "Circuit approval expected before 16:00.",
        createdAt: "2025-03-11T13:25:00",
      },
      {
        id: "cmt-3-4",
        authorId: "st-4",
        authorName: "Ana Garcia",
        message: "Still blocked, holding sponsor activation team.",
        createdAt: "2025-03-11T14:35:00",
      },
    ],
    relatedSponsorshipId: "sp-2",
    relatedLabel: "Braus - Gold package",
    createdAt: "2025-03-11T11:00:00",
    updatedAt: "2025-03-11T14:40:00",
  },
  {
    id: "tsk-4",
    orgId: "org-1",
    eventId: "evt-1",
    title: "Publish referee briefing memo",
    status: "DONE",
    priority: "LOW",
    type: "REFEREE",
    assigneeId: "st-3",
    assigneeName: "Juan Perez",
    commentsCount: 0,
    checklistDone: 2,
    checklistTotal: 2,
    checklist: [
      { id: "chk-4-1", text: "Publish memo in staff channel", done: true },
      { id: "chk-4-2", text: "Confirm all referees acknowledged", done: true },
    ],
    comments: [],
    relatedLabel: "Tatami briefing v3",
    createdAt: "2025-03-09T16:00:00",
    updatedAt: "2025-03-10T08:10:00",
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
