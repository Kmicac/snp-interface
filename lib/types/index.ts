// Auth Types
export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  avatar?: string
  memberships: Membership[]
}

export interface Membership {
  orgId: string
  orgName: string
  role: string
}

export interface LoginResponse {
  token: string
  user: User
}

// Organization Types
export interface Organization {
  id: string
  name: string
  slug: string
  logo?: string
}

// Event Types
export interface Event {
  id: string
  name: string
  code: string
  startDate: string
  endDate: string
  venue: string
  status: 'upcoming' | 'live' | 'past'
  description?: string
}

export interface Zone {
  id: string
  name: string
  type: string
  capacity?: number
}

// Work Order Types
export type WorkOrderStatus = 'scheduled' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'
export type SlaStatus = 'on_time' | 'at_risk' | 'breached'

export interface WorkOrder {
  id: string
  code: string
  title: string
  description?: string
  provider: string
  category: string
  zone: string
  status: WorkOrderStatus
  slaStatus: SlaStatus
  scheduledStart: string
  scheduledEnd: string
  actualStart?: string
  actualEnd?: string
}

// Staff Types
export type StaffRole = 'security' | 'logistics' | 'referee' | 'medical' | 'cleaning' | 'admin' | 'volunteer'

export interface Staff {
  id: string
  name: string
  email: string
  phone?: string
  roles: StaffRole[]
  notes?: string
  avatarUrl?: string
  avatar?: string
}

export interface Assignment {
  id: string
  staffId: string
  staffName: string
  eventId: string
  zone: string
  shift: string
  role: StaffRole
}

export interface Credential {
  id: string
  staffId: string
  staffName: string
  status: 'active' | 'revoked' | 'expired'
  issuedAt: string
  revokedAt?: string
  qrCode?: string
}

// Incident Types
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'
export type IncidentStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface Incident {
  id: string
  title: string
  description?: string
  severity: IncidentSeverity
  status: IncidentStatus
  zone: string
  reportedAt: string
  resolvedAt?: string
}

export interface Improvement {
  id: string
  title: string
  description?: string
  type: 'improvement' | 'innovation' | 'process'
  status: 'proposed' | 'approved' | 'in_progress' | 'implemented' | 'rejected'
  createdAt: string
}

// Inventory Types
export type AssetStatus = 'in_storage' | 'in_use' | 'damaged' | 'under_repair' | 'disposed'
export type AssetCondition = 'new' | 'good' | 'fair' | 'poor'

export interface Asset {
  id: string
  name: string
  category: string
  status: AssetStatus
  condition: AssetCondition
  quantity: number
  location: string
}

export interface AssetCategory {
  id: string
  name: string
  description?: string
  assetCount: number
}

// Sponsor Types
export type SponsorTier = 'title' | 'gold' | 'silver' | 'bronze' | 'support'

export interface Brand {
  id: string
  name: string
  logoUrl?: string
  logo?: string
  website?: string
  instagram?: string
  isPartner: boolean
  isSponsor: boolean
}

export interface Sponsor {
  id: string
  brandId: string
  brandName: string
  logoUrl?: string
  imageUrl?: string
  logo?: string
  tier: SponsorTier
  website?: string
}

export interface SponsorsByTier {
  title: Sponsor[]
  gold: Sponsor[]
  silver: Sponsor[]
  bronze: Sponsor[]
  support: Sponsor[]
}

export interface SponsorKpis {
  totalCashValue: number
  totalInKindValue: number
  sponsorsByTier: {
    title: number
    gold: number
    silver: number
    bronze: number
    support: number
  }
}

// Referee Types
export type RefereeLevel = 'junior' | 'intermediate' | 'senior' | 'master'

export interface Referee {
  id: string
  staffId: string
  name: string
  level: RefereeLevel
  certifications: string[]
  eventsRefereed: number
}

export interface Tatami {
  id: string
  number: number
  name: string
  assignedReferees: {
    refereeId: string
    refereeName: string
    role: 'center' | 'side'
  }[]
}

export interface Training {
  id: string
  title: string
  date: string
  time: string
  mandatory: boolean
  eventId?: string
  attendeesCount: number
  attendedCount: number
}

// KPI Types
export interface KpisSummary {
  totalWorkOrders: number
  completedWorkOrders: number
  onTimePercentage: number
  totalIncidents: number
  incidentsBySeverity: {
    low: number
    medium: number
    high: number
    critical: number
  }
  activeStaff: number
  activeCredentials: number
}

export interface OverdueWorkOrder {
  id: string
  code: string
  title: string
  provider: string
  scheduledEnd: string
  hoursOverdue: number
}

export interface SlaBreach {
  id: string
  workOrderId: string
  workOrderCode: string
  provider: string
  category: string
  breachType: string
  breachedAt: string
}
