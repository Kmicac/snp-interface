export type AssetStatus = "IN_STORAGE" | "IN_USE" | "DAMAGED" | "UNDER_REPAIR" | "LOST" | "RETIRED"
export type AssetCondition = "NEW" | "GOOD" | "FAIR" | "POOR" | "BROKEN"

export interface AssetCategory {
  id: string
  name: string
  description?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Asset {
  id: string
  orgId?: string
  categoryId?: string | null
  category?: AssetCategory | null
  name: string
  assetTag?: string | null
  serialNumber?: string | null
  quantity: number
  status: AssetStatus
  condition: AssetCondition
  location?: string | null
  notes?: string | null
  imageUrl?: string | null
  imageKey?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface CreateAssetDto {
  categoryId?: string
  name: string
  assetTag?: string
  serialNumber?: string
  quantity: number
  condition: AssetCondition
  location?: string
  notes?: string
  imageUrl?: string
  imageKey?: string
}

export interface UpdateAssetDto {
  categoryId?: string
  name?: string
  assetTag?: string
  serialNumber?: string
  quantity?: number
  status?: AssetStatus
  condition?: AssetCondition
  location?: string
  notes?: string
  imageUrl?: string
  imageKey?: string
}

export interface InventoryDashboardStats {
  totalAssets: number
  availableAssets: number
  inUseAssets: number
  damagedAssets: number
  lowStockAssets: number
  lostAssets?: number
  totalUnits?: number
  totalValue?: number
  byCategory?: InventoryDashboardCategorySummary[]
  categories?: InventoryDashboardCategorySummary[]
  recentMovements?: InventoryMovement[]
}

export interface InventoryDashboardCategorySummary {
  categoryId?: string | null
  categoryName: string
  totalQuantity: number
  inStorageQuantity?: number
  inUseQuantity?: number
}

export type MovementType = "CHECK_OUT" | "CHECK_IN" | "MAINTENANCE" | "ADJUSTMENT"

export interface InventoryMovement {
  id: string
  orgId?: string
  assetId: string
  assetName?: string
  eventId?: string | null
  eventName?: string | null
  movementType: MovementType
  type?: MovementType
  quantity: number
  fromLocation?: string | null
  toLocation?: string | null
  notes?: string | null
  performedByUserId?: string | null
  performedBy?: string | null
  createdAt: string
  timestamp?: string
}

export interface InventoryMovementsResponse {
  items: InventoryMovement[]
  total: number
  limit: number
  offset: number
}

export interface InventoryKitItem {
  id?: string
  assetId?: string | null
  categoryId?: string | null
  name: string
  quantity: number
  asset?: Asset | null
  category?: AssetCategory | null
}

export interface InventoryKit {
  id: string
  orgId?: string
  name: string
  description?: string | null
  eventType?: string | null
  items: InventoryKitItem[]
  createdAt?: string
  updatedAt?: string
}

export interface CreateKitDto {
  name: string
  description?: string | null
  eventType: string
  items: Array<{
    assetId?: string
    categoryId?: string
    name: string
    quantity: number
  }>
}

export interface UpdateKitDto {
  name?: string
  description?: string | null
  eventType?: string | null
  items?: Array<{
    assetId?: string
    categoryId?: string
    name: string
    quantity: number
  }>
}

export type ChecklistType = "LOADING" | "UNLOADING" | "RETURN"
export type ChecklistStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SIGNED"
export type InventoryChecklistItemCondition = "GOOD" | "DAMAGED" | "MISSING"

export interface InventoryChecklistItem {
  id: string
  assetId: string
  assetName: string
  assetCodeOrTag: string
  quantityExpected: number
  quantityVerified: number
  verified: boolean
  verifiedAt?: string | null
  verifiedBy?: string | null
  condition: InventoryChecklistItemCondition
  notes?: string | null
}

export interface InventoryChecklistListItem {
  id: string
  orgId?: string
  eventId?: string
  eventName?: string
  checklistNumber: string
  checklistType: ChecklistType
  responsibleName?: string | null
  notes?: string | null
  status: ChecklistStatus
  totalItems: number
  verifiedItems: number
  missingItems: number
  signedBy?: string | null
  signedAt?: string | null
  createdAt: string
  updatedAt?: string
}

export interface InventoryChecklist extends InventoryChecklistListItem {
  items: InventoryChecklistItem[]
}

export interface CreateChecklistDto {
  eventId: string
  checklistType: ChecklistType
  responsibleName?: string
  notes?: string
}

export interface VerifyChecklistItemDto {
  assetId: string
  verified: boolean
  quantityVerified: number
  verifiedBy: string
  condition: InventoryChecklistItemCondition
  notes?: string
}

export interface SignChecklistDto {
  signedBy: string
  signatureData: string
}

export interface AssetQrResponse {
  id: string
  qrContent: string
  qrImage?: string | null
}
