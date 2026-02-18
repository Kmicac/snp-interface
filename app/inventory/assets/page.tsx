"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Package, Plus, QrCode, Search, SquarePen, Trash2 } from "lucide-react"

import { AssetFormDialog } from "@/components/inventory/asset-form-dialog"
import { AssetQrDialog } from "@/components/inventory/asset-qr-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { uploadImage } from "@/lib/api/upload-image"
import { useAuth } from "@/lib/context/auth-context"
import { invalidateQueryKeys, subscribeInvalidation } from "@/lib/data/query-invalidation"
import { queryKeys } from "@/lib/data/query-keys"
import { canAccessInventory, canWriteInventory } from "@/lib/inventory/permissions"
import type { Asset, AssetCategory, AssetQrResponse, CreateAssetDto, UpdateAssetDto } from "@/lib/inventory/types"
import { assetStatusClassName, assetStatusLabel, createAsset, deleteAsset, getAssetQr, listAssetCategories, listAssets, updateAsset } from "@/lib/inventory/utils"

const ASSET_IMAGE_PLACEHOLDER =
  "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=300&q=80"

export default function InventoryAssetsPage() {
  const { user, currentOrg } = useAuth()
  const { toast } = useToast()

  const [assets, setAssets] = useState<Asset[]>([])
  const [categories, setCategories] = useState<AssetCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null)

  const [qrAsset, setQrAsset] = useState<Asset | null>(null)
  const [qrData, setQrData] = useState<AssetQrResponse | null>(null)
  const [qrError, setQrError] = useState<string | null>(null)
  const [isQrLoading, setIsQrLoading] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)

  const hasAccess = canAccessInventory(user, currentOrg?.id)
  const canWrite = canWriteInventory(user, currentOrg?.id)

  const loadCategories = useCallback(async () => {
    if (!currentOrg?.id) return

    try {
      const response = await listAssetCategories(currentOrg.id)
      setCategories(response)
    } catch (err) {
      setCategories([])
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No fue posible cargar categorías.",
        variant: "destructive",
      })
    }
  }, [currentOrg?.id, toast])

  const loadAssets = useCallback(async () => {
    if (!currentOrg?.id || !hasAccess) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const response = await listAssets(currentOrg.id, {
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        status: statusFilter !== "all" ? (statusFilter as Asset["status"]) : undefined,
      })
      setAssets(response)
    } catch (err) {
      setAssets([])
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No fue posible cargar assets.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [categoryFilter, currentOrg?.id, hasAccess, statusFilter, toast])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  useEffect(() => {
    void loadAssets()
  }, [loadAssets, reloadTick])

  useEffect(() => {
    if (!currentOrg?.id) return

    const keys = [
      queryKeys.assets(currentOrg.id),
      queryKeys.kits(currentOrg.id),
      queryKeys.movements(currentOrg.id),
      queryKeys.dashboard(currentOrg.id),
      queryKeys.checklists(currentOrg.id),
      queryKeys.events(currentOrg.id),
      ["event"],
      ["eventResources"],
    ] as Array<readonly unknown[]>

    return subscribeInvalidation(keys, () => {
      setReloadTick((value) => value + 1)
    })
  }, [currentOrg?.id])

  const filteredAssets = useMemo(() => {
    const byCategory =
      categoryFilter === "all"
        ? assets
        : assets.filter((asset) => {
            return (asset.categoryId || "") === categoryFilter
          })

    const byStatus =
      statusFilter === "all"
        ? byCategory
        : byCategory.filter((asset) => {
            return asset.status === statusFilter
          })

    const query = searchQuery.trim().toLowerCase()
    if (!query) return byStatus

    return byStatus.filter((asset) => {
      const source = [asset.name, asset.assetTag, asset.serialNumber].filter(Boolean).join(" ").toLowerCase()
      return source.includes(query)
    })
  }, [assets, categoryFilter, searchQuery, statusFilter])

  const categoryById = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories])
  const totalQuantity = useMemo(() => filteredAssets.reduce((acc, item) => acc + (Number.isFinite(item.quantity) ? item.quantity : 0), 0), [filteredAssets])

  const handleSaveAsset = async (payload: CreateAssetDto | UpdateAssetDto, imageFile: File | null, assetId?: string): Promise<boolean> => {
    if (!currentOrg?.id) return false

    setIsSaving(true)
    try {
      let imageUrl = payload.imageUrl
      let imageKey = payload.imageKey

      if (imageFile) {
        try {
          const upload = await uploadImage({
            orgId: currentOrg.id,
            file: imageFile,
            folder: `orgs/${currentOrg.id}/assets`,
            entityId: assetId,
          })
          imageUrl = upload.url
          imageKey = upload.key
        } catch (err) {
          toast({
            title: "No se pudo subir la imagen",
            description: err instanceof Error ? err.message : "El asset se guardara sin imagen.",
            variant: "destructive",
          })
        }
      }

      if (assetId) {
        await updateAsset(currentOrg.id, assetId, {
          ...payload,
          imageUrl,
          imageKey,
        })
        toast({ title: "Asset actualizado", description: "Los cambios se guardaron correctamente." })
      } else {
        const normalizedName = payload.name?.trim()
        if (!normalizedName) {
          throw new Error("El nombre del asset es obligatorio.")
        }

        await createAsset(currentOrg.id, {
          ...payload,
          name: normalizedName,
          quantity: payload.quantity ?? 1,
          condition: payload.condition ?? "GOOD",
          imageUrl,
          imageKey,
        } as CreateAssetDto)
        toast({ title: "Asset creado", description: "El asset fue agregado a inventario." })
      }

      invalidateQueryKeys(
        queryKeys.assets(currentOrg.id),
        queryKeys.kits(currentOrg.id),
        queryKeys.movements(currentOrg.id),
        queryKeys.dashboard(currentOrg.id),
        queryKeys.checklists(currentOrg.id),
      )
      await loadAssets()
      return true
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No fue posible guardar el asset.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAsset = async () => {
    if (!currentOrg?.id || !deletingAsset) return

    setIsSaving(true)
    try {
      await deleteAsset(currentOrg.id, deletingAsset.id)
      toast({ title: "Asset eliminado", description: "El asset fue eliminado correctamente." })
      setDeletingAsset(null)
      invalidateQueryKeys(
        queryKeys.assets(currentOrg.id),
        queryKeys.kits(currentOrg.id),
        queryKeys.movements(currentOrg.id),
        queryKeys.dashboard(currentOrg.id),
        queryKeys.checklists(currentOrg.id),
      )
      await loadAssets()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No fue posible eliminar el asset.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const openQr = async (asset: Asset) => {
    if (!currentOrg?.id) return

    setQrAsset(asset)
    setQrData(null)
    setQrError(null)
    setIsQrLoading(true)

    try {
      const response = await getAssetQr(currentOrg.id, asset.id)
      setQrData(response)
    } catch (err) {
      setQrData(null)
      setQrError(err instanceof Error ? err.message : "No fue posible generar el QR.")
    } finally {
      setIsQrLoading(false)
    }
  }

  if (!currentOrg) {
    return <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">Selecciona una organizacion para ver assets.</div>
  }

  if (!hasAccess) {
    return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">No tienes permisos para inventario.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Package className="h-6 w-6" />
            Inventario (Assets)
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {filteredAssets.length} assets listados - {totalQuantity} unidades totales
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} disabled={!canWrite}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Asset
        </Button>
      </div>

      <div className="rounded-xl border border-[#1F1F23] bg-[#0F0F12] p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Buscar por nombre, tag o serial"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="border-[#2B2B30] bg-[#1A1A1F] pl-10 text-white"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full border-[#2B2B30] bg-[#1A1A1F] text-white md:w-[220px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full border-[#2B2B30] bg-[#1A1A1F] text-white md:w-[190px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="IN_STORAGE">IN_STORAGE</SelectItem>
              <SelectItem value="IN_USE">IN_USE</SelectItem>
              <SelectItem value="DAMAGED">DAMAGED</SelectItem>
              <SelectItem value="UNDER_REPAIR">UNDER_REPAIR</SelectItem>
              <SelectItem value="LOST">LOST</SelectItem>
              <SelectItem value="RETIRED">RETIRED</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#1F1F23] bg-[#0F0F12]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead>
              <tr className="border-b border-[#1F1F23] bg-[#171A22] text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-3 font-medium">Imagen</th>
                <th className="px-4 py-3 font-medium">Codigo / Tag</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Cantidad</th>
                <th className="px-4 py-3 font-medium">Ubicacion</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <tr key={`asset-skeleton-${index}`} className="border-b border-[#1F1F23]">
                      <td className="px-4 py-3">
                        <Skeleton className="h-10 w-10 bg-[#20242E]" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-24 bg-[#20242E]" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-40 bg-[#20242E]" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-24 bg-[#20242E]" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-20 bg-[#20242E]" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-12 bg-[#20242E]" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-32 bg-[#20242E]" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="ml-auto h-8 w-48 bg-[#20242E]" />
                      </td>
                    </tr>
                  ))
                : filteredAssets.map((asset) => {
                    const categoryName = asset.category?.name || (asset.categoryId ? categoryById.get(asset.categoryId)?.name : null) || "-"

                    return (
                      <tr key={asset.id} className="border-b border-[#1F1F23] text-gray-300 transition-colors hover:bg-[#171A22]">
                        <td className="px-4 py-3">
                          <img
                            src={asset.imageUrl || ASSET_IMAGE_PLACEHOLDER}
                            alt={asset.name}
                            className="h-10 w-10 rounded-md border border-[#2B2B30] object-cover"
                            onError={(event) => {
                              if (event.currentTarget.src !== ASSET_IMAGE_PLACEHOLDER) {
                                event.currentTarget.src = ASSET_IMAGE_PLACEHOLDER
                              }
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-200">{asset.assetTag || asset.serialNumber || "-"}</td>
                        <td className="px-4 py-3 font-medium text-white">{asset.name}</td>
                        <td className="px-4 py-3">{categoryName}</td>
                        <td className="px-4 py-3">
                          <Badge className={assetStatusClassName(asset.status)}>{assetStatusLabel(asset.status)}</Badge>
                        </td>
                        <td className="px-4 py-3">{asset.quantity}</td>
                        <td className="px-4 py-3">{asset.location || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => void openQr(asset)}
                              className="h-8 w-8 border-[#2B2B30] bg-transparent"
                              title="Ver QR"
                              aria-label="Ver QR"
                            >
                              <QrCode className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingAsset(asset)}
                              disabled={!canWrite}
                              className="h-8 w-8 text-gray-200"
                              title="Editar"
                              aria-label="Editar"
                            >
                              <SquarePen className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingAsset(asset)}
                              disabled={!canWrite}
                              className="h-8 w-8 text-red-300 hover:text-red-200"
                              title="Eliminar"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredAssets.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">No hay assets para los filtros seleccionados.</div>
        ) : null}
      </div>

      <AssetFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        categories={categories}
        disabled={!canWrite}
        isSubmitting={isSaving}
        onSubmit={(payload, imageFile) => handleSaveAsset(payload, imageFile)}
      />

      <AssetFormDialog
        open={editingAsset !== null}
        onOpenChange={(open) => {
          if (!open) setEditingAsset(null)
        }}
        mode="edit"
        initialValues={editingAsset}
        categories={categories}
        disabled={!canWrite}
        isSubmitting={isSaving}
        onSubmit={(payload, imageFile) => {
          if (!editingAsset) return Promise.resolve(false)
          return handleSaveAsset(payload, imageFile, editingAsset.id)
        }}
      />

      <AssetQrDialog
        open={qrAsset !== null}
        onOpenChange={(open) => {
          if (!open) {
            setQrAsset(null)
            setQrData(null)
            setQrError(null)
          }
        }}
        assetName={qrAsset?.name}
        assetTag={qrAsset?.assetTag || qrAsset?.serialNumber || null}
        assetStatus={qrAsset?.status}
        qrData={qrData}
        isLoading={isQrLoading}
        error={qrError}
      />

      <AlertDialog
        open={deletingAsset !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingAsset(null)
        }}
      >
        <AlertDialogContent className="border-[#1F1F23] bg-[#0F0F12] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar asset</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Vas a eliminar <span className="font-medium text-white">{deletingAsset?.name}</span>. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#2B2B30] bg-transparent text-gray-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-500"
              onClick={(event) => {
                event.preventDefault()
                void handleDeleteAsset()
              }}
              disabled={isSaving}
            >
              {isSaving ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
