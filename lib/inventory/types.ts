export type InventoryRole = 'admin' | 'manager' | 'member' | 'viewer'

export type AssetStatus = 'IN_STORAGE' | 'IN_USE' | 'DAMAGED' | 'UNDER_REPAIR' | 'LOST' | 'RETIRED'
export type AssetCondition = 'NEW' | 'GOOD' | 'FAIR' | 'POOR' | 'BROKEN'

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
  categoryId?: string | null
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
}

export interface UpdateAssetDto {
  categoryId?: string | null
  name?: string
  assetTag?: string | null
  serialNumber?: string | null
  quantity?: number
  status?: AssetStatus
  condition?: AssetCondition
  location?: string | null
  notes?: string | null
  imageUrl?: string | null
  imageKey?: string | null
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
  categoryId?: string
  categoryName: string
  totalQuantity: number
  inStorageQuantity?: number
  inUseQuantity?: number
}

export type MovementType = 'CHECKOUT' | 'RETURN' | 'TRANSFER' | 'ADJUSTMENT' | 'KIT_APPLIED'

export interface InventoryMovement {
  id: string
  orgId?: string
  assetId: string
  assetName?: string
  eventId?: string | null
  eventName?: string | null
  type: MovementType
  quantity: number
  fromLocation?: string | null
  toLocation?: string | null
  notes?: string | null
  createdBy?: string | null
  createdByName?: string | null
  createdAt: string
}

export interface InventoryMovementsResponse {
  items: InventoryMovement[]
  total: number
  limit: number
  offset: number
}

export interface InventoryKitItem {
  id?: string
  assetId: string
  quantity: number
  asset?: Asset | null
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
  eventType?: string | null
  items: Array<{
    assetId: string
    quantity: number
  }>
}

export interface UpdateKitDto {
  name?: string
  description?: string | null
  eventType?: string | null
  items?: Array<{
    assetId: string
    quantity: number
  }>
}

export type ChecklistType = 'CHECKOUT' | 'RETURN'
export type ChecklistStatus = 'OPEN' | 'SIGNED' | 'CLOSED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'

export interface InventoryChecklistItem {
  id: string
  assetId: string
  assetName: string
  expectedQty: number
  checkedQty?: number
  verified?: boolean
  condition?: AssetCondition | null
  notes?: string | null
}

export interface InventoryChecklist {
  id: string
  orgId?: string
  eventId?: string | null
  eventName?: string | null
  type: ChecklistType
  status: ChecklistStatus
  notes?: string | null
  items: InventoryChecklistItem[]
  signedBy?: string | null
  signedAt?: string | null
  createdAt: string
  updatedAt?: string
}

export interface CreateChecklistDto {
  eventId?: string | null
  type: ChecklistType
  notes?: string | null
  items: Array<{
    assetId: string
    expectedQty: number
  }>
}

export interface VerifyChecklistItemDto {
  itemId: string
  checkedQty: number
  condition?: AssetCondition | null
  notes?: string | null
}

export interface SignChecklistDto {
  signatureDataUrl: string
  signerName?: string | null
}

export interface AssetQrResponse {
  assetId: string
  qrData: string
  qrImageUrl?: string
}
