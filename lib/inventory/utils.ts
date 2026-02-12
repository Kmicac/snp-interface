import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/config'
import { mockAssets, mockEvents } from '@/lib/mock-data'
import type {
  Asset,
  AssetCategory,
  AssetCondition,
  AssetQrResponse,
  AssetStatus,
  ChecklistType,
  CreateAssetDto,
  CreateChecklistDto,
  CreateKitDto,
  InventoryChecklist,
  InventoryChecklistItem,
  InventoryDashboardCategorySummary,
  InventoryDashboardStats,
  InventoryKit,
  InventoryMovement,
  InventoryMovementsResponse,
  SignChecklistDto,
  UpdateAssetDto,
  UpdateKitDto,
  VerifyChecklistItemDto,
} from './types'

const LEGACY_STATUS_TO_ASSET_STATUS: Record<string, AssetStatus> = {
  in_storage: 'IN_STORAGE',
  in_use: 'IN_USE',
  damaged: 'DAMAGED',
  under_repair: 'UNDER_REPAIR',
  disposed: 'RETIRED',
}

const LEGACY_CONDITION_TO_ASSET_CONDITION: Record<string, AssetCondition> = {
  new: 'NEW',
  good: 'GOOD',
  fair: 'FAIR',
  poor: 'POOR',
}

function normalizeStatus(value?: string | null): AssetStatus {
  if (!value) return 'IN_STORAGE'
  if (value in LEGACY_STATUS_TO_ASSET_STATUS) {
    return LEGACY_STATUS_TO_ASSET_STATUS[value]
  }
  return value as AssetStatus
}

function normalizeCondition(value?: string | null): AssetCondition {
  if (!value) return 'GOOD'
  if (value in LEGACY_CONDITION_TO_ASSET_CONDITION) {
    return LEGACY_CONDITION_TO_ASSET_CONDITION[value]
  }
  return value as AssetCondition
}

const seedCategoryNames = [
  'Competition Equipment',
  'Electronics',
  'Medical',
  'Security',
  'Broadcast',
  'Lighting',
  'Logistics',
  'Hospitality',
  'Staff Uniforms',
  'IT & Networking',
]

const defaultCategories: AssetCategory[] = seedCategoryNames.map((name) => ({
  id: `cat-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  name,
}))

let mockCategoryStore: AssetCategory[] = [...defaultCategories]

const mockAssetImages = [
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1484502249930-e1da807099a5?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1529074963764-98f45c47344b?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=300&q=80',
]

const extraMockAssets = [
  { id: 'as-6', name: 'LED PAR 64 Kit', category: 'Lighting', status: 'in_storage', condition: 'good', quantity: 18, location: 'Lighting Rack', assetTag: 'LGT-064' },
  { id: 'as-7', name: 'Production Cases', category: 'Logistics', status: 'in_use', condition: 'good', quantity: 9, location: 'Dock Area', assetTag: 'LOG-009' },
  { id: 'as-8', name: 'VIP Hospitality Set', category: 'Hospitality', status: 'in_storage', condition: 'new', quantity: 16, location: 'Hospitality Room', assetTag: 'HSP-016' },
  { id: 'as-9', name: 'Staff Radio Pack', category: 'Staff Uniforms', status: 'in_storage', condition: 'good', quantity: 24, location: 'Comms Locker', assetTag: 'UNI-024' },
  { id: 'as-10', name: 'Managed Switch 24p', category: 'IT & Networking', status: 'in_use', condition: 'good', quantity: 4, location: 'Control Booth', assetTag: 'NET-024' },
]

const seedAssets = [...mockAssets, ...extraMockAssets]

let mockAssetStore: Asset[] = seedAssets.map((item, index) => {
  const category = defaultCategories.find((entry) => entry.name === item.category) || null
  const assetTag = 'assetTag' in item ? item.assetTag : undefined
  return {
    id: item.id,
    name: item.name,
    categoryId: category?.id,
    category,
    assetTag: assetTag || `${String(item.category).slice(0, 3).toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
    serialNumber: `SN-${String(index + 1).padStart(4, '0')}`,
    quantity: item.quantity,
    status: normalizeStatus(item.status),
    condition: normalizeCondition(item.condition),
    location: item.location,
    imageUrl: mockAssetImages[index % mockAssetImages.length],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
})

let mockMovementsStore: InventoryMovement[] = mockAssetStore.map((asset, index) => ({
  id: `mov-${index + 1}`,
  assetId: asset.id,
  assetName: asset.name,
  eventId: index % 2 === 0 ? mockEvents[0]?.id || null : null,
  eventName: index % 2 === 0 ? mockEvents[0]?.name || null : null,
  type: index % 2 === 0 ? 'CHECKOUT' : 'RETURN',
  quantity: Math.max(1, Math.min(2, asset.quantity)),
  fromLocation: 'Storage',
  toLocation: asset.location || 'Unknown',
  createdBy: 'System',
  createdByName: 'System',
  createdAt: new Date(Date.now() - index * 3600_000).toISOString(),
}))

let mockKitStore: InventoryKit[] = [
  {
    id: 'kit-1',
    name: 'Kit Competencia',
    description: 'Tatamis, score y seguridad para zona principal.',
    eventType: 'TOURNAMENT',
    items: mockAssetStore.slice(0, 4).map((asset) => ({
      assetId: asset.id,
      quantity: 1,
      asset,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kit-2',
    name: 'Kit Broadcast',
    description: 'Audio, camaras y conectividad para streaming.',
    eventType: 'SHOWCASE',
    items: mockAssetStore.filter((asset) => ['as-5', 'as-6', 'as-10'].includes(asset.id)).map((asset) => ({
      assetId: asset.id,
      quantity: 1,
      asset,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kit-3',
    name: 'Kit Operaciones',
    description: 'Equipamiento base para staff y logistica de soporte.',
    eventType: 'GENERAL',
    items: mockAssetStore.filter((asset) => ['as-3', 'as-7', 'as-9'].includes(asset.id)).map((asset) => ({
      assetId: asset.id,
      quantity: 2,
      asset,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

let mockChecklistStore: InventoryChecklist[] = []

function ensureChecklistForDemo() {
  if (mockChecklistStore.length > 0) return
  const baseEvent = mockEvents[0]

  const loadingItems: InventoryChecklistItem[] = mockAssetStore.slice(0, 4).map((asset, index) => ({
    id: `check-item-load-${index + 1}`,
    assetId: asset.id,
    assetName: asset.name,
    expectedQty: 1,
    checkedQty: index < 2 ? 1 : 0,
    verified: index < 2,
    condition: asset.condition,
  }))

  const returnItems: InventoryChecklistItem[] = mockAssetStore.slice(2, 6).map((asset, index) => ({
    id: `check-item-ret-${index + 1}`,
    assetId: asset.id,
    assetName: asset.name,
    expectedQty: 1,
    checkedQty: 1,
    verified: true,
    condition: index === 1 ? 'FAIR' : asset.condition,
  }))

  const signedItems: InventoryChecklistItem[] = mockAssetStore.slice(6, 9).map((asset, index) => ({
    id: `check-item-signed-${index + 1}`,
    assetId: asset.id,
    assetName: asset.name,
    expectedQty: 2,
    checkedQty: 2,
    verified: true,
    condition: asset.condition,
  }))

  mockChecklistStore.push(
    {
      id: 'check-1',
      type: 'CHECKOUT',
      status: 'IN_PROGRESS',
      eventId: baseEvent?.id || null,
      eventName: baseEvent?.name || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      signedBy: null,
      signedAt: null,
      items: loadingItems,
    },
    {
      id: 'check-2',
      type: 'RETURN',
      status: 'COMPLETED',
      eventId: baseEvent?.id || null,
      eventName: baseEvent?.name || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      signedBy: null,
      signedAt: null,
      items: returnItems,
    },
    {
      id: 'check-3',
      type: 'RETURN',
      status: 'SIGNED',
      eventId: baseEvent?.id || null,
      eventName: baseEvent?.name || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      signedBy: 'Operaciones SNP',
      signedAt: new Date().toISOString(),
      items: signedItems,
    },
  )
}

export const USE_INVENTORY_MOCKS = process.env.NEXT_PUBLIC_USE_INVENTORY_MOCKS !== 'false'

function buildQuery<T extends object>(params?: T): string {
  if (!params) return ''
  const search = new URLSearchParams()

  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    search.set(key, String(value))
  })

  const serialized = search.toString()
  return serialized ? `?${serialized}` : ''
}

function extractList<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[]
  }

  if (!value || typeof value !== 'object') {
    return []
  }

  const payload = value as Record<string, unknown>
  if (Array.isArray(payload.items)) return payload.items as T[]
  if (Array.isArray(payload.data)) return payload.data as T[]
  if (Array.isArray(payload.rows)) return payload.rows as T[]
  if (payload.result && Array.isArray((payload.result as Record<string, unknown>).items)) {
    return (payload.result as Record<string, unknown>).items as T[]
  }

  return []
}

function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function normalizeDashboardCategory(item: unknown): InventoryDashboardCategorySummary | null {
  if (!item || typeof item !== 'object') return null
  const source = item as Record<string, unknown>

  const categoryName =
    (source.categoryName as string | undefined) ||
    (source.name as string | undefined) ||
    (source.category as string | undefined) ||
    ''

  if (!categoryName) return null

  return {
    categoryId: (source.categoryId as string | undefined) || (source.id as string | undefined),
    categoryName,
    totalQuantity: parseNumber(source.totalQuantity ?? source.total ?? source.quantity ?? source.count),
    inStorageQuantity: parseNumber(source.inStorageQuantity ?? source.available ?? source.inStock ?? 0),
    inUseQuantity: parseNumber(source.inUseQuantity ?? source.inUse ?? 0),
  }
}

function normalizeDashboardStats(value: unknown): InventoryDashboardStats {
  if (!value || typeof value !== 'object') {
    return {
      totalAssets: 0,
      availableAssets: 0,
      inUseAssets: 0,
      damagedAssets: 0,
      lowStockAssets: 0,
      lostAssets: 0,
      totalUnits: 0,
      totalValue: 0,
      byCategory: [],
      categories: [],
      recentMovements: [],
    }
  }

  const source = value as Record<string, unknown>
  const categoryRaw =
    (Array.isArray(source.byCategory) ? source.byCategory : null) ||
    (Array.isArray(source.categories) ? source.categories : null) ||
    []

  const byCategory = categoryRaw
    .map((item) => normalizeDashboardCategory(item))
    .filter((item): item is InventoryDashboardCategorySummary => item !== null)

  const recentMovements = extractList<InventoryMovement>(source.recentMovements)

  return {
    totalAssets: parseNumber(source.totalAssets ?? source.totalItems),
    availableAssets: parseNumber(source.availableAssets ?? source.inStock ?? source.stockAssets),
    inUseAssets: parseNumber(source.inUseAssets ?? source.assignedAssets),
    damagedAssets: parseNumber(source.damagedAssets),
    lowStockAssets: parseNumber(source.lowStockAssets),
    lostAssets: parseNumber(source.lostAssets),
    totalUnits: parseNumber(source.totalUnits),
    totalValue: parseNumber(source.totalValue),
    byCategory,
    categories: byCategory,
    recentMovements,
  }
}

function ensureCategoryReference(asset: Asset): Asset {
  if (asset.category || !asset.categoryId) return asset
  const category = mockCategoryStore.find((item) => item.id === asset.categoryId) || null
  return {
    ...asset,
    category,
  }
}

function sortByNewest<T extends { createdAt?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return bDate - aDate
  })
}

export function assetStatusLabel(status: AssetStatus): string {
  return status.replaceAll('_', ' ')
}

export function assetStatusClassName(status: AssetStatus): string {
  const styles: Record<AssetStatus, string> = {
    IN_STORAGE: 'border-gray-500/30 bg-gray-500/20 text-gray-300',
    IN_USE: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300',
    DAMAGED: 'border-red-500/30 bg-red-500/20 text-red-300',
    UNDER_REPAIR: 'border-amber-500/30 bg-amber-500/20 text-amber-300',
    LOST: 'border-rose-500/30 bg-rose-500/20 text-rose-300',
    RETIRED: 'border-zinc-500/30 bg-zinc-500/20 text-zinc-300',
  }

  return styles[status] || styles.IN_STORAGE
}

export async function listAssetCategories(orgId: string): Promise<AssetCategory[]> {
  if (USE_INVENTORY_MOCKS) {
    return [...mockCategoryStore]
  }

  const response = await apiClient.get<unknown>(API_ENDPOINTS.assetCategories(orgId))
  return extractList<AssetCategory>(response)
}

interface ListAssetsParams {
  categoryId?: string
  status?: AssetStatus
  search?: string
}

export async function listAssets(orgId: string, params?: ListAssetsParams): Promise<Asset[]> {
  if (USE_INVENTORY_MOCKS) {
    let data = mockAssetStore.map(ensureCategoryReference)

    if (params?.categoryId) {
      data = data.filter((item) => item.categoryId === params.categoryId)
    }

    if (params?.status) {
      data = data.filter((item) => item.status === params.status)
    }

    if (params?.search) {
      const query = params.search.toLowerCase()
      data = data.filter((item) => {
        const bucket = [item.name, item.assetTag, item.serialNumber].filter(Boolean).join(' ').toLowerCase()
        return bucket.includes(query)
      })
    }

    return sortByNewest(data)
  }

  const query = buildQuery(params)
  const response = await apiClient.get<unknown>(`${API_ENDPOINTS.assets(orgId)}${query}`)
  return extractList<Asset>(response)
}

export async function createAsset(orgId: string, payload: CreateAssetDto): Promise<Asset> {
  if (USE_INVENTORY_MOCKS) {
    const category = payload.categoryId
      ? mockCategoryStore.find((item) => item.id === payload.categoryId) || null
      : null

    const created: Asset = {
      id: `as-${Date.now()}`,
      ...payload,
      category,
      imageUrl: payload.imageUrl || mockAssetImages[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockAssetStore = [created, ...mockAssetStore]

    mockMovementsStore = [
      {
        id: `mov-${Date.now()}`,
        assetId: created.id,
        assetName: created.name,
        type: 'ADJUSTMENT',
        quantity: created.quantity,
        notes: 'Asset creado',
        createdBy: 'Usuario',
        createdByName: 'Usuario',
        createdAt: new Date().toISOString(),
      },
      ...mockMovementsStore,
    ]

    return created
  }

  return apiClient.post<Asset>(API_ENDPOINTS.assets(orgId), payload)
}

export async function updateAsset(orgId: string, assetId: string, payload: UpdateAssetDto): Promise<Asset> {
  if (USE_INVENTORY_MOCKS) {
    let updatedAsset: Asset | null = null

    mockAssetStore = mockAssetStore.map((item) => {
      if (item.id !== assetId) return item

      const category = payload.categoryId
        ? mockCategoryStore.find((entry) => entry.id === payload.categoryId) || null
        : item.category || null

      updatedAsset = {
        ...item,
        ...payload,
        category,
        updatedAt: new Date().toISOString(),
      }

      return updatedAsset
    })

    if (!updatedAsset) {
      throw new Error('Asset no encontrado')
    }

    return updatedAsset
  }

  return apiClient.patch<Asset>(API_ENDPOINTS.asset(orgId, assetId), payload)
}

export async function deleteAsset(orgId: string, assetId: string): Promise<void> {
  if (USE_INVENTORY_MOCKS) {
    mockAssetStore = mockAssetStore.filter((item) => item.id !== assetId)
    return
  }

  await apiClient.delete<void>(API_ENDPOINTS.asset(orgId, assetId))
}

export async function getInventoryDashboardStats(orgId: string): Promise<InventoryDashboardStats> {
  if (USE_INVENTORY_MOCKS) {
    const totalAssets = mockAssetStore.length
    const availableAssets = mockAssetStore.filter((item) => item.status === 'IN_STORAGE').length
    const inUseAssets = mockAssetStore.filter((item) => item.status === 'IN_USE').length
    const damagedAssets = mockAssetStore.filter((item) => item.status === 'DAMAGED').length
    const lostAssets = mockAssetStore.filter((item) => item.status === 'LOST').length
    const lowStockAssets = mockAssetStore.filter((item) => item.quantity <= 2).length

    const byCategory = mockCategoryStore.map((category) => {
      const assets = mockAssetStore.filter((asset) => asset.categoryId === category.id)
      return {
        categoryId: category.id,
        categoryName: category.name,
        totalQuantity: assets.reduce((acc, item) => acc + item.quantity, 0),
        inStorageQuantity: assets.filter((item) => item.status === 'IN_STORAGE').reduce((acc, item) => acc + item.quantity, 0),
        inUseQuantity: assets.filter((item) => item.status === 'IN_USE').reduce((acc, item) => acc + item.quantity, 0),
      }
    })

    return {
      totalAssets,
      availableAssets,
      inUseAssets,
      damagedAssets,
      lostAssets,
      lowStockAssets,
      totalUnits: mockAssetStore.reduce((acc, item) => acc + item.quantity, 0),
      byCategory,
      categories: byCategory,
      recentMovements: mockMovementsStore.slice(0, 8),
    }
  }

  const response = await apiClient.get<unknown>(API_ENDPOINTS.inventoryDashboardStats(orgId))
  return normalizeDashboardStats(response)
}

interface ListMovementsParams {
  eventId?: string
  assetId?: string
  type?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

export async function listMovements(orgId: string, params?: ListMovementsParams): Promise<InventoryMovementsResponse> {
  if (USE_INVENTORY_MOCKS) {
    const limit = params?.limit ?? 20
    const offset = params?.offset ?? 0

    let data = [...mockMovementsStore]

    if (params?.eventId) {
      data = data.filter((item) => item.eventId === params.eventId)
    }

    if (params?.assetId) {
      data = data.filter((item) => item.assetId === params.assetId)
    }

    if (params?.type) {
      data = data.filter((item) => item.type === params.type)
    }

    const total = data.length
    const items = data.slice(offset, offset + limit)

    return {
      items,
      total,
      limit,
      offset,
    }
  }

  const query = buildQuery(params)
  const response = await apiClient.get<unknown>(`${API_ENDPOINTS.inventoryMovements(orgId)}${query}`)

  if (Array.isArray(response)) {
    const limit = params?.limit ?? response.length
    const offset = params?.offset ?? 0
    return {
      items: response as InventoryMovement[],
      total: response.length,
      limit,
      offset,
    }
  }

  const source = (response || {}) as Record<string, unknown>
  const items = extractList<InventoryMovement>(source)

  return {
    items,
    total: parseNumber(source.total, items.length),
    limit: parseNumber(source.limit, params?.limit ?? items.length),
    offset: parseNumber(source.offset, params?.offset ?? 0),
  }
}

export async function exportMovementsReport(orgId: string, params?: Record<string, string | number | undefined>) {
  if (USE_INVENTORY_MOCKS) {
    const header = ['Fecha', 'Tipo', 'Asset', 'Evento', 'Cantidad', 'Usuario', 'Notas']
    const rows = mockMovementsStore.slice(0, 200).map((item) => [
      item.createdAt,
      item.type,
      item.assetName || item.assetId,
      item.eventName || item.eventId || '',
      String(item.quantity),
      item.createdByName || item.createdBy || '',
      item.notes || '',
    ])
    const csv = [header, ...rows].map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    return new Blob([csv], { type: 'text/csv;charset=utf-8' })
  }

  const query = buildQuery(params)
  return apiClient.getBlob(`${API_ENDPOINTS.inventoryMovementExport(orgId)}${query}`)
}

export async function listKits(orgId: string): Promise<InventoryKit[]> {
  if (USE_INVENTORY_MOCKS) {
    return sortByNewest(mockKitStore)
  }

  const response = await apiClient.get<unknown>(API_ENDPOINTS.inventoryKits(orgId))
  return extractList<InventoryKit>(response)
}

export async function getKit(orgId: string, kitId: string): Promise<InventoryKit> {
  if (USE_INVENTORY_MOCKS) {
    const found = mockKitStore.find((item) => item.id === kitId)
    if (!found) throw new Error('Kit no encontrado')
    return found
  }

  return apiClient.get<InventoryKit>(API_ENDPOINTS.inventoryKit(orgId, kitId))
}

export async function createKit(orgId: string, payload: CreateKitDto): Promise<InventoryKit> {
  if (USE_INVENTORY_MOCKS) {
    const created: InventoryKit = {
      id: `kit-${Date.now()}`,
      name: payload.name,
      description: payload.description,
      eventType: payload.eventType,
      items: payload.items.map((entry) => ({
        ...entry,
        asset: mockAssetStore.find((asset) => asset.id === entry.assetId) || null,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockKitStore = [created, ...mockKitStore]
    return created
  }

  return apiClient.post<InventoryKit>(API_ENDPOINTS.inventoryKits(orgId), payload)
}

export async function updateKit(orgId: string, kitId: string, payload: UpdateKitDto): Promise<InventoryKit> {
  if (USE_INVENTORY_MOCKS) {
    let updated: InventoryKit | null = null

    mockKitStore = mockKitStore.map((kit) => {
      if (kit.id !== kitId) return kit
      updated = {
        ...kit,
        ...payload,
        items: payload.items
          ? payload.items.map((entry) => ({
              ...entry,
              asset: mockAssetStore.find((asset) => asset.id === entry.assetId) || null,
            }))
          : kit.items,
        updatedAt: new Date().toISOString(),
      }
      return updated
    })

    if (!updated) throw new Error('Kit no encontrado')
    return updated
  }

  return apiClient.patch<InventoryKit>(API_ENDPOINTS.inventoryKit(orgId, kitId), payload)
}

export async function deleteKit(orgId: string, kitId: string): Promise<void> {
  if (USE_INVENTORY_MOCKS) {
    mockKitStore = mockKitStore.filter((item) => item.id !== kitId)
    return
  }

  await apiClient.delete<void>(API_ENDPOINTS.inventoryKit(orgId, kitId))
}

export async function applyKitToEvent(orgId: string, eventId: string, kitId: string): Promise<unknown> {
  if (USE_INVENTORY_MOCKS) {
    const kit = mockKitStore.find((item) => item.id === kitId)
    if (!kit) throw new Error('Kit no encontrado')

    const now = new Date().toISOString()
    const additions = kit.items.map((item, index) => ({
      id: `mov-apply-${Date.now()}-${index}`,
      assetId: item.assetId,
      assetName: item.asset?.name,
      eventId,
      eventName: mockEvents.find((event) => event.id === eventId)?.name || null,
      type: 'KIT_APPLIED' as const,
      quantity: item.quantity,
      notes: `Kit aplicado: ${kit.name}`,
      createdBy: 'Usuario',
      createdByName: 'Usuario',
      createdAt: now,
    }))

    mockMovementsStore = [...additions, ...mockMovementsStore]
    return {
      applied: additions.length,
      missing: 0,
    }
  }

  return apiClient.post<unknown>(API_ENDPOINTS.inventoryApplyKit(orgId, eventId, kitId))
}

interface ListChecklistsParams {
  eventId?: string
  type?: ChecklistType
  status?: string
}

export async function listChecklists(orgId: string, params?: ListChecklistsParams): Promise<InventoryChecklist[]> {
  if (USE_INVENTORY_MOCKS) {
    ensureChecklistForDemo()
    let data = [...mockChecklistStore]

    if (params?.eventId) {
      data = data.filter((item) => item.eventId === params.eventId)
    }

    if (params?.type) {
      data = data.filter((item) => item.type === params.type)
    }

    if (params?.status) {
      data = data.filter((item) => item.status === params.status)
    }

    return sortByNewest(data)
  }

  const query = buildQuery(params)
  const response = await apiClient.get<unknown>(`${API_ENDPOINTS.inventoryChecklists(orgId)}${query}`)
  return extractList<InventoryChecklist>(response)
}

export async function getChecklist(orgId: string, checklistId: string): Promise<InventoryChecklist> {
  if (USE_INVENTORY_MOCKS) {
    ensureChecklistForDemo()
    const found = mockChecklistStore.find((item) => item.id === checklistId)
    if (!found) throw new Error('Checklist no encontrado')
    return found
  }

  return apiClient.get<InventoryChecklist>(API_ENDPOINTS.inventoryChecklist(orgId, checklistId))
}

export async function createChecklist(orgId: string, payload: CreateChecklistDto): Promise<InventoryChecklist> {
  if (USE_INVENTORY_MOCKS) {
    const created: InventoryChecklist = {
      id: `check-${Date.now()}`,
      eventId: payload.eventId,
      eventName: payload.eventId ? mockEvents.find((event) => event.id === payload.eventId)?.name || null : null,
      type: payload.type,
      status: 'OPEN',
      notes: payload.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: payload.items.map((entry, index) => {
        const asset = mockAssetStore.find((item) => item.id === entry.assetId)
        return {
          id: `check-item-${Date.now()}-${index}`,
          assetId: entry.assetId,
          assetName: asset?.name || entry.assetId,
          expectedQty: entry.expectedQty,
          checkedQty: 0,
          verified: false,
          condition: asset?.condition,
        }
      }),
    }

    mockChecklistStore = [created, ...mockChecklistStore]
    return created
  }

  return apiClient.post<InventoryChecklist>(API_ENDPOINTS.inventoryChecklists(orgId), payload)
}

export async function verifyChecklistItem(
  orgId: string,
  checklistId: string,
  payload: VerifyChecklistItemDto,
): Promise<InventoryChecklist> {
  if (USE_INVENTORY_MOCKS) {
    let updated: InventoryChecklist | null = null

    mockChecklistStore = mockChecklistStore.map((checklist) => {
      if (checklist.id !== checklistId) return checklist

      const items = checklist.items.map((item) => {
        if (item.id !== payload.itemId) return item
        return {
          ...item,
          checkedQty: payload.checkedQty,
          condition: payload.condition || item.condition,
          notes: payload.notes,
          verified: true,
        }
      })

      updated = {
        ...checklist,
        items,
        updatedAt: new Date().toISOString(),
      }

      return updated
    })

    if (!updated) throw new Error('Checklist no encontrado')
    return updated
  }

  return apiClient.put<InventoryChecklist>(API_ENDPOINTS.inventoryChecklistVerifyItem(orgId, checklistId), payload)
}

export async function signChecklist(orgId: string, checklistId: string, payload: SignChecklistDto): Promise<InventoryChecklist> {
  if (USE_INVENTORY_MOCKS) {
    let updated: InventoryChecklist | null = null

    mockChecklistStore = mockChecklistStore.map((item) => {
      if (item.id !== checklistId) return item
      updated = {
        ...item,
        status: 'SIGNED',
        signedBy: payload.signerName || 'Usuario',
        signedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return updated
    })

    if (!updated) throw new Error('Checklist no encontrado')
    return updated
  }

  return apiClient.put<InventoryChecklist>(API_ENDPOINTS.inventoryChecklistSign(orgId, checklistId), payload)
}

export async function deleteChecklist(orgId: string, checklistId: string): Promise<void> {
  if (USE_INVENTORY_MOCKS) {
    mockChecklistStore = mockChecklistStore.filter((item) => item.id !== checklistId)
    return
  }

  await apiClient.delete<void>(API_ENDPOINTS.inventoryChecklist(orgId, checklistId))
}

export async function exportChecklistPdf(orgId: string, checklistId: string) {
  if (USE_INVENTORY_MOCKS) {
    const content = `Checklist Demo ${checklistId}\nGenerated: ${new Date().toISOString()}\nOrganization: ${orgId}`
    return new Blob([content], { type: 'application/pdf' })
  }

  return apiClient.getBlob(API_ENDPOINTS.inventoryChecklistExportPdf(orgId, checklistId))
}

export async function getAssetQr(orgId: string, assetId: string): Promise<AssetQrResponse> {
  if (USE_INVENTORY_MOCKS) {
    const qrData = `snp://asset/${assetId}`
    return {
      assetId,
      qrData,
      qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrData)}`,
    }
  }

  const response = await apiClient.get<unknown>(API_ENDPOINTS.inventoryAssetQr(orgId, assetId))
  if (typeof response === 'string') {
    return {
      assetId,
      qrData: response,
    }
  }

  return response as AssetQrResponse
}

export async function scanInventoryQr(orgId: string, qrData: string): Promise<Asset | null> {
  if (USE_INVENTORY_MOCKS) {
    const parsed = qrData.split('/').pop() || qrData
    const found = mockAssetStore.find((item) => item.id === parsed)
    return found || null
  }

  const response = await apiClient.get<unknown>(API_ENDPOINTS.inventoryScan(orgId, qrData))
  if (!response) return null

  if (typeof response === 'object' && response !== null && 'asset' in (response as Record<string, unknown>)) {
    return (response as Record<string, Asset>).asset || null
  }

  return response as Asset
}
