import { apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/config"
import type {
  Asset,
  AssetCategory,
  AssetQrResponse,
  AssetStatus,
  CreateAssetDto,
  CreateChecklistDto,
  CreateKitDto,
  InventoryChecklist,
  InventoryChecklistItem,
  InventoryChecklistItemCondition,
  InventoryChecklistListItem,
  InventoryDashboardCategorySummary,
  InventoryDashboardStats,
  InventoryKit,
  InventoryKitItem,
  InventoryMovement,
  InventoryMovementsResponse,
  SignChecklistDto,
  UpdateAssetDto,
  UpdateKitDto,
  VerifyChecklistItemDto,
} from "./types"

function buildQuery(params?: Record<string, string | number | undefined>): string {
  if (!params) return ""
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue
    query.set(key, String(value))
  }
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ""
}

function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function normalizeAsset(source: Record<string, unknown>): Asset {
  return {
    id: String(source.id ?? ""),
    orgId: typeof source.organizationId === "string" ? source.organizationId : undefined,
    categoryId: typeof source.categoryId === "string" ? source.categoryId : null,
    category: source.category && typeof source.category === "object"
      ? {
          id: String((source.category as Record<string, unknown>).id ?? ""),
          name: String((source.category as Record<string, unknown>).name ?? ""),
          description: typeof (source.category as Record<string, unknown>).description === "string"
            ? (source.category as Record<string, unknown>).description as string
            : null,
        }
      : null,
    name: String(source.name ?? ""),
    assetTag: typeof source.assetTag === "string" ? source.assetTag : null,
    serialNumber: typeof source.serialNumber === "string" ? source.serialNumber : null,
    quantity: parseNumber(source.quantity, 0),
    status: String(source.status ?? "IN_STORAGE") as AssetStatus,
    condition: String(source.condition ?? "GOOD") as Asset["condition"],
    location: typeof source.location === "string" ? source.location : null,
    notes: typeof source.notes === "string" ? source.notes : null,
    imageUrl: typeof source.imageUrl === "string" ? source.imageUrl : null,
    imageKey: typeof source.imageKey === "string" ? source.imageKey : null,
    createdAt: typeof source.createdAt === "string" ? source.createdAt : undefined,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : undefined,
  }
}

function normalizeKitItem(source: Record<string, unknown>): InventoryKitItem {
  return {
    id: typeof source.id === "string" ? source.id : undefined,
    assetId: typeof source.assetId === "string" ? source.assetId : null,
    categoryId: typeof source.categoryId === "string" ? source.categoryId : null,
    name: String(source.name ?? ""),
    quantity: parseNumber(source.quantity, 1),
    asset: source.asset && typeof source.asset === "object"
      ? normalizeAsset(source.asset as Record<string, unknown>)
      : null,
    category: source.category && typeof source.category === "object"
      ? {
          id: String((source.category as Record<string, unknown>).id ?? ""),
          name: String((source.category as Record<string, unknown>).name ?? ""),
          description: typeof (source.category as Record<string, unknown>).description === "string"
            ? (source.category as Record<string, unknown>).description as string
            : null,
        }
      : null,
  }
}

function normalizeKit(source: Record<string, unknown>): InventoryKit {
  const rawItems = Array.isArray(source.items) ? source.items : []
  return {
    id: String(source.id ?? ""),
    orgId: typeof source.organizationId === "string" ? source.organizationId : undefined,
    name: String(source.name ?? ""),
    description: typeof source.description === "string" ? source.description : null,
    eventType: typeof source.eventType === "string" ? source.eventType : null,
    items: rawItems.map((item) => normalizeKitItem(item as Record<string, unknown>)),
    createdAt: typeof source.createdAt === "string" ? source.createdAt : undefined,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : undefined,
  }
}

function normalizeMovement(source: Record<string, unknown>): InventoryMovement {
  const movementType = String(source.movementType ?? source.type ?? "CHECK_OUT") as InventoryMovement["movementType"]
  const createdAt = String(source.timestamp ?? source.createdAt ?? new Date().toISOString())
  const rawId =
    (typeof source.id === "string" && source.id.trim()) ||
    (typeof source.movementId === "string" && source.movementId.trim()) ||
    ""
  const syntheticId = [
    String(source.assetId ?? ""),
    String(source.eventId ?? ""),
    createdAt,
    movementType,
    String(source.quantity ?? ""),
    String(source.performedByUserId ?? ""),
  ].join(":")

  return {
    id: rawId || syntheticId,
    assetId: String(source.assetId ?? ""),
    assetName: typeof source.assetName === "string" ? source.assetName : undefined,
    eventId: typeof source.eventId === "string" ? source.eventId : null,
    eventName: typeof source.eventName === "string" ? source.eventName : null,
    movementType,
    type: movementType,
    quantity: parseNumber(source.quantity, 0),
    notes: typeof source.notes === "string" ? source.notes : null,
    performedByUserId: typeof source.performedByUserId === "string" ? source.performedByUserId : null,
    performedBy: typeof source.performedBy === "string" ? source.performedBy : null,
    timestamp: createdAt,
    createdAt,
  }
}

function normalizeChecklistItem(source: Record<string, unknown>): InventoryChecklistItem {
  return {
    id: String(source.id ?? ""),
    assetId: String(source.assetId ?? ""),
    assetName: String(source.assetName ?? ""),
    assetCodeOrTag: String(source.assetCodeOrTag ?? source.assetId ?? ""),
    quantityExpected: parseNumber(source.quantityExpected, 0),
    quantityVerified: parseNumber(source.quantityVerified, 0),
    verified: Boolean(source.verified),
    verifiedAt: typeof source.verifiedAt === "string" ? source.verifiedAt : null,
    verifiedBy: typeof source.verifiedBy === "string" ? source.verifiedBy : null,
    condition: String(source.condition ?? "GOOD") as InventoryChecklistItemCondition,
    notes: typeof source.notes === "string" ? source.notes : null,
  }
}

function normalizeChecklistListItem(source: Record<string, unknown>): InventoryChecklistListItem {
  const event = source.event && typeof source.event === "object" ? source.event as Record<string, unknown> : null
  return {
    id: String(source.id ?? ""),
    orgId: typeof source.organizationId === "string" ? source.organizationId : undefined,
    eventId: typeof source.eventId === "string" ? source.eventId : undefined,
    eventName: event && typeof event.name === "string" ? event.name : undefined,
    checklistNumber: String(source.checklistNumber ?? source.id ?? ""),
    checklistType: String(source.checklistType ?? "RETURN") as InventoryChecklistListItem["checklistType"],
    responsibleName: typeof source.responsibleName === "string" ? source.responsibleName : null,
    notes: typeof source.notes === "string" ? source.notes : null,
    status: String(source.status ?? "PENDING") as InventoryChecklistListItem["status"],
    totalItems: parseNumber(source.totalItems, 0),
    verifiedItems: parseNumber(source.verifiedItems, 0),
    missingItems: parseNumber(source.missingItems, 0),
    signedBy: typeof source.signedBy === "string" ? source.signedBy : null,
    signedAt: typeof source.signedAt === "string" ? source.signedAt : null,
    createdAt: String(source.createdAt ?? new Date().toISOString()),
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : undefined,
  }
}

function normalizeChecklist(source: Record<string, unknown>): InventoryChecklist {
  const base = normalizeChecklistListItem(source)
  return {
    ...base,
    items: Array.isArray(source.items)
      ? source.items.map((item) => normalizeChecklistItem(item as Record<string, unknown>))
      : [],
  }
}

function normalizeDashboardStats(source: Record<string, unknown>): InventoryDashboardStats {
  const byCategory: InventoryDashboardCategorySummary[] = Array.isArray(source.byCategory)
    ? source.byCategory
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const row = item as Record<string, unknown>
          return {
            categoryId: typeof row.categoryId === "string" ? row.categoryId : null,
            categoryName: String(row.categoryName ?? "Uncategorized"),
            totalQuantity: parseNumber(row.count ?? row.totalQuantity, 0),
            inStorageQuantity: parseNumber(row.inStorageQuantity, 0),
            inUseQuantity: parseNumber(row.inUseQuantity, 0),
          }
        })
    : []

  const recentMovements = Array.isArray(source.recentMovements)
    ? source.recentMovements
        .filter((item) => item && typeof item === "object")
        .map((item) => normalizeMovement(item as Record<string, unknown>))
    : []

  return {
    totalAssets: parseNumber(source.totalAssets, 0),
    availableAssets: parseNumber(source.inStorageCount, 0),
    inUseAssets: parseNumber(source.inUseCount, 0),
    damagedAssets: parseNumber(source.damagedCount, 0),
    lostAssets: parseNumber(source.lostCount, 0),
    lowStockAssets: 0,
    totalUnits: parseNumber(source.totalAssets, 0),
    totalValue: 0,
    byCategory,
    categories: byCategory,
    recentMovements,
  }
}

export function assetStatusLabel(status: AssetStatus): string {
  return status.replaceAll("_", " ")
}

export function assetStatusClassName(status: AssetStatus): string {
  const styles: Record<AssetStatus, string> = {
    IN_STORAGE: "border-gray-500/30 bg-gray-500/20 text-gray-300",
    IN_USE: "border-emerald-500/30 bg-emerald-500/20 text-emerald-300",
    DAMAGED: "border-red-500/30 bg-red-500/20 text-red-300",
    UNDER_REPAIR: "border-amber-500/30 bg-amber-500/20 text-amber-300",
    LOST: "border-rose-500/30 bg-rose-500/20 text-rose-300",
    RETIRED: "border-zinc-500/30 bg-zinc-500/20 text-zinc-300",
  }
  return styles[status] || styles.IN_STORAGE
}

export async function createAssetCategory(orgId: string, payload: { name: string; description?: string }): Promise<AssetCategory> {
  const response = await apiClient.post<Record<string, unknown>>(API_ENDPOINTS.assetCategories(orgId), payload)
  return {
    id: String(response.id ?? ""),
    name: String(response.name ?? payload.name),
    description: typeof response.description === "string" ? response.description : null,
    createdAt: typeof response.createdAt === "string" ? response.createdAt : undefined,
    updatedAt: typeof response.updatedAt === "string" ? response.updatedAt : undefined,
  }
}

export async function listAssetCategories(orgId: string): Promise<AssetCategory[]> {
  const response = await apiClient.get<Array<Record<string, unknown>>>(API_ENDPOINTS.assetCategories(orgId))
  return response.map((item) => ({
    id: String(item.id ?? ""),
    name: String(item.name ?? ""),
    description: typeof item.description === "string" ? item.description : null,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : undefined,
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : undefined,
  }))
}

interface ListAssetsParams {
  categoryId?: string
  status?: AssetStatus
  search?: string
}

export async function listAssets(orgId: string, params?: ListAssetsParams): Promise<Asset[]> {
  const query = buildQuery({
    categoryId: params?.categoryId,
    status: params?.status,
  })
  const response = await apiClient.get<Array<Record<string, unknown>>>(`${API_ENDPOINTS.assets(orgId)}${query}`)
  const assets = response.map(normalizeAsset)

  if (!params?.search?.trim()) return assets
  const q = params.search.trim().toLowerCase()
  return assets.filter((asset) => {
    const source = [asset.name, asset.assetTag, asset.serialNumber].filter(Boolean).join(" ").toLowerCase()
    return source.includes(q)
  })
}

export async function createAsset(orgId: string, payload: CreateAssetDto): Promise<Asset> {
  const requestBody: Record<string, unknown> = {
    name: payload.name,
    quantity: payload.quantity,
    condition: payload.condition,
    assetTag: payload.assetTag,
    serialNumber: payload.serialNumber,
    location: payload.location,
    notes: payload.notes,
    imageUrl: payload.imageUrl,
    imageKey: payload.imageKey,
  }
  if (payload.categoryId) {
    requestBody.categoryId = payload.categoryId
  }
  const response = await apiClient.post<Record<string, unknown>>(API_ENDPOINTS.assets(orgId), requestBody)
  return normalizeAsset(response)
}

export async function updateAsset(orgId: string, assetId: string, payload: UpdateAssetDto): Promise<Asset> {
  const requestBody: Record<string, unknown> = { ...payload }
  if (payload.categoryId === "") {
    requestBody.categoryId = ""
  }
  const response = await apiClient.patch<Record<string, unknown>>(API_ENDPOINTS.asset(orgId, assetId), requestBody)
  return normalizeAsset(response)
}

export async function deleteAsset(orgId: string, assetId: string): Promise<void> {
  await apiClient.delete<void>(API_ENDPOINTS.asset(orgId, assetId))
}

export async function getInventoryDashboardStats(orgId: string): Promise<InventoryDashboardStats> {
  const response = await apiClient.get<Record<string, unknown>>(API_ENDPOINTS.inventoryDashboardStats(orgId))
  return normalizeDashboardStats(response)
}

interface ListMovementsParams {
  eventId?: string
  assetId?: string
  movementType?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

export async function listMovements(orgId: string, params?: ListMovementsParams): Promise<InventoryMovementsResponse> {
  const query = buildQuery({
    eventId: params?.eventId,
    assetId: params?.assetId,
    movementType: params?.movementType,
    from: params?.from,
    to: params?.to,
    limit: params?.limit,
    offset: params?.offset,
  })
  const response = await apiClient.get<Record<string, unknown>>(`${API_ENDPOINTS.inventoryMovements(orgId)}${query}`)
  const items = Array.isArray(response.data)
    ? response.data
        .filter((item) => item && typeof item === "object")
        .map((item) => normalizeMovement(item as Record<string, unknown>))
    : []

  return {
    items,
    total: parseNumber(response.total, items.length),
    limit: parseNumber(response.limit, params?.limit ?? items.length),
    offset: parseNumber(response.offset, params?.offset ?? 0),
  }
}

export async function exportMovementsReport(orgId: string, params?: Record<string, string | number | undefined>) {
  const query = buildQuery(params)
  return apiClient.getBlob(`${API_ENDPOINTS.inventoryMovementExport(orgId)}${query}`)
}

export async function listKits(orgId: string): Promise<InventoryKit[]> {
  const response = await apiClient.get<Array<Record<string, unknown>>>(API_ENDPOINTS.inventoryKits(orgId))
  return response.map(normalizeKit)
}

export async function getKit(orgId: string, kitId: string): Promise<InventoryKit> {
  const response = await apiClient.get<Record<string, unknown>>(API_ENDPOINTS.inventoryKit(orgId, kitId))
  return normalizeKit(response)
}

export async function createKit(orgId: string, payload: CreateKitDto): Promise<InventoryKit> {
  const response = await apiClient.post<Record<string, unknown>>(API_ENDPOINTS.inventoryKits(orgId), payload)
  return normalizeKit(response)
}

export async function updateKit(orgId: string, kitId: string, payload: UpdateKitDto): Promise<InventoryKit> {
  const response = await apiClient.patch<Record<string, unknown>>(API_ENDPOINTS.inventoryKit(orgId, kitId), payload)
  return normalizeKit(response)
}

export async function deleteKit(orgId: string, kitId: string): Promise<void> {
  await apiClient.delete<void>(API_ENDPOINTS.inventoryKit(orgId, kitId))
}

export interface ApplyKitToEventResponse {
  assignedCount: number
  missingItems: Array<{
    name: string
    categoryId?: string
    quantity: number
  }>
}

export async function applyKitToEvent(orgId: string, eventId: string, kitId: string): Promise<ApplyKitToEventResponse> {
  return apiClient.post<ApplyKitToEventResponse>(API_ENDPOINTS.inventoryApplyKit(orgId, eventId, kitId))
}

interface ListChecklistsParams {
  eventId?: string
  status?: string
  limit?: number
  offset?: number
}

export async function listChecklists(orgId: string, params?: ListChecklistsParams): Promise<InventoryChecklistListItem[]> {
  const query = buildQuery({
    eventId: params?.eventId,
    status: params?.status,
    limit: params?.limit,
    offset: params?.offset,
  })
  const response = await apiClient.get<Record<string, unknown>>(`${API_ENDPOINTS.inventoryChecklists(orgId)}${query}`)
  const rows = Array.isArray(response.data) ? response.data : []
  return rows
    .filter((item) => item && typeof item === "object")
    .map((item) => normalizeChecklistListItem(item as Record<string, unknown>))
}

export async function getChecklist(orgId: string, checklistId: string): Promise<InventoryChecklist> {
  const response = await apiClient.get<Record<string, unknown>>(API_ENDPOINTS.inventoryChecklist(orgId, checklistId))
  return normalizeChecklist(response)
}

export async function createChecklist(orgId: string, payload: CreateChecklistDto): Promise<InventoryChecklist> {
  const response = await apiClient.post<Record<string, unknown>>(API_ENDPOINTS.inventoryChecklists(orgId), payload)
  return normalizeChecklist(response)
}

export async function verifyChecklistItem(
  orgId: string,
  checklistId: string,
  payload: VerifyChecklistItemDto,
): Promise<InventoryChecklist> {
  const response = await apiClient.put<Record<string, unknown>>(API_ENDPOINTS.inventoryChecklistVerifyItem(orgId, checklistId), payload)
  return normalizeChecklist(response)
}

export async function signChecklist(orgId: string, checklistId: string, payload: SignChecklistDto): Promise<InventoryChecklist> {
  const response = await apiClient.put<Record<string, unknown>>(API_ENDPOINTS.inventoryChecklistSign(orgId, checklistId), payload)
  return normalizeChecklist(response)
}

export async function deleteChecklist(orgId: string, checklistId: string): Promise<void> {
  await apiClient.delete<void>(API_ENDPOINTS.inventoryChecklist(orgId, checklistId))
}

export async function exportChecklistPdf(orgId: string, checklistId: string) {
  return apiClient.getBlob(API_ENDPOINTS.inventoryChecklistExportPdf(orgId, checklistId))
}

export async function getAssetQr(orgId: string, assetId: string): Promise<AssetQrResponse> {
  const response = await apiClient.get<Record<string, unknown>>(API_ENDPOINTS.inventoryAssetQr(orgId, assetId))
  return {
    id: String(response.id ?? assetId),
    qrContent: String(response.qrContent ?? ""),
    qrImage: typeof response.qrImage === "string" ? response.qrImage : null,
  }
}

export async function scanInventoryQr(orgId: string, qrData: string): Promise<Asset | null> {
  const response = await apiClient.get<Record<string, unknown>>(API_ENDPOINTS.inventoryScan(orgId, qrData))
  if (!response || response.type !== "asset") return null
  if (!response.data || typeof response.data !== "object") return null
  const data = response.data as Record<string, unknown>
  return {
    id: String(data.id ?? ""),
    name: String(data.name ?? ""),
    quantity: 0,
    status: String(data.status ?? "IN_STORAGE") as AssetStatus,
    condition: "GOOD",
  }
}
