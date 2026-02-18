"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { FolderTree, Package, Plus } from "lucide-react"

import { CreateAssetCategoryDialog, type CreateAssetCategoryPayload } from "@/components/inventory/create-asset-category-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/context/auth-context"
import { invalidateQueryKeys, subscribeInvalidation } from "@/lib/data/query-invalidation"
import { queryKeys } from "@/lib/data/query-keys"
import { canAccessInventory, canWriteInventory } from "@/lib/inventory/permissions"
import type { Asset, AssetCategory } from "@/lib/inventory/types"
import { createAssetCategory, listAssetCategories, listAssets } from "@/lib/inventory/utils"

type CategorySummary = AssetCategory & {
  assetCount: number
  totalQuantity: number
}

export default function CategoriesPage() {
  const { toast } = useToast()
  const { user, currentOrg } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<AssetCategory[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [reloadTick, setReloadTick] = useState(0)

  const hasAccess = canAccessInventory(user, currentOrg?.id)
  const canWrite = canWriteInventory(user, currentOrg?.id)

  const loadCategoryData = useCallback(async () => {
    if (!currentOrg?.id || !hasAccess) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const [categoriesResponse, assetsResponse] = await Promise.all([
        listAssetCategories(currentOrg.id),
        listAssets(currentOrg.id),
      ])

      setCategories(categoriesResponse)
      setAssets(assetsResponse)
    } catch (error) {
      setCategories([])
      setAssets([])
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No fue posible cargar categorias.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentOrg?.id, hasAccess, toast])

  useEffect(() => {
    void loadCategoryData()
  }, [loadCategoryData, reloadTick])

  useEffect(() => {
    if (!currentOrg?.id) return

    const keys = [
      queryKeys.assets(currentOrg.id),
      queryKeys.kits(currentOrg.id),
      queryKeys.dashboard(currentOrg.id),
      queryKeys.checklists(currentOrg.id),
    ] as Array<readonly unknown[]>

    return subscribeInvalidation(keys, () => {
      setReloadTick((value) => value + 1)
    })
  }, [currentOrg?.id])

  const summaryByCategory = useMemo<CategorySummary[]>(
    () =>
      [...categories]
        .map((category) => {
          const assetsInCategory = assets.filter((asset) => {
            if (asset.categoryId === category.id) return true
            if (asset.category?.id === category.id) return true
            if (asset.category?.name === category.name) return true
            return false
          })

          return {
            ...category,
            assetCount: assetsInCategory.length,
            totalQuantity: assetsInCategory.reduce((total, asset) => total + (asset.quantity || 0), 0),
          }
        })
        .sort((a, b) => b.totalQuantity - a.totalQuantity || a.name.localeCompare(b.name)),
    [assets, categories]
  )

  const handleCreateCategory = async (payload: CreateAssetCategoryPayload) => {
    if (!currentOrg?.id) return false

    setIsCreating(true)
    try {
      await createAssetCategory(currentOrg.id, payload)
      invalidateQueryKeys(
        queryKeys.assets(currentOrg.id),
        queryKeys.kits(currentOrg.id),
        queryKeys.dashboard(currentOrg.id),
      )
      await loadCategoryData()
      toast({
        title: "Categoria agregada",
        description: `${payload.name} se agrego correctamente.`,
      })
      return true
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No fue posible crear la categoria.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsCreating(false)
    }
  }

  if (!currentOrg) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
        Selecciona una organizacion para continuar.
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
        No tienes permisos para inventario.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <FolderTree className="h-6 w-6" />
            Asset Categories
          </h1>
          <p className="mt-1 text-sm text-gray-400">Categorias y cantidades del inventario real.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} disabled={!canWrite}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 9 }).map((_, index) => (
              <div key={`category-skeleton-${index}`} className="rounded-xl border border-[#1F1F23] bg-[#0F121A]/50 p-5">
                <Skeleton className="mb-4 h-10 w-10 bg-[#20242E]" />
                <Skeleton className="mb-3 h-5 w-2/3 bg-[#20242E]" />
                <Skeleton className="mb-2 h-4 w-1/2 bg-[#20242E]" />
                <Skeleton className="h-4 w-1/3 bg-[#20242E]" />
              </div>
            ))
          : summaryByCategory.map((category) => (
              <div
                key={category.id}
                className="rounded-xl border border-[#1F1F23] bg-[#0F121A]/50 p-5 transition-colors hover:border-[#2B2B30]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
                    <Package className="h-5 w-5 text-blue-300" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                    {category.description ? <p className="mt-1 text-xs text-gray-500">{category.description}</p> : null}
                    <p className="mt-2 text-sm text-gray-300">
                      <span className="font-semibold text-white">{category.assetCount}</span> asset types
                    </p>
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold text-white">{category.totalQuantity}</span> total items
                    </p>
                  </div>
                </div>
              </div>
            ))}
      </div>

      <CreateAssetCategoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCreate={handleCreateCategory}
        isSubmitting={isCreating}
      />
    </div>
  )
}
