"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { FolderTree, Package, Plus } from "lucide-react"

import { CreateAssetCategoryDialog, type CreateAssetCategoryPayload } from "@/components/inventory/create-asset-category-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/context/auth-context"
import { canAccessInventory, canWriteInventory } from "@/lib/inventory/permissions"
import type { Asset, AssetCategory } from "@/lib/inventory/types"
import { listAssetCategories, listAssets } from "@/lib/inventory/utils"

const FALLBACK_CATEGORIES: AssetCategory[] = [
  { id: "cat-competition-equipment", name: "Competition Equipment" },
  { id: "cat-electronics", name: "Electronics" },
  { id: "cat-medical", name: "Medical" },
  { id: "cat-security", name: "Security" },
  { id: "cat-broadcast", name: "Broadcast" },
  { id: "cat-lighting", name: "Lighting" },
  { id: "cat-logistics", name: "Logistics" },
  { id: "cat-hospitality", name: "Hospitality" },
  { id: "cat-staff-uniforms", name: "Staff Uniforms" },
  { id: "cat-it-networking", name: "IT & Networking" },
]

type CategorySummary = AssetCategory & {
  assetCount: number
  totalQuantity: number
}

export default function CategoriesPage() {
  const { toast } = useToast()
  const { user, currentOrg } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<AssetCategory[]>(FALLBACK_CATEGORIES)
  const [assets, setAssets] = useState<Asset[]>([])

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

      setCategories(categoriesResponse.length > 0 ? categoriesResponse : FALLBACK_CATEGORIES)
      setAssets(assetsResponse)
    } catch {
      setCategories(FALLBACK_CATEGORIES)
      setAssets([])
    } finally {
      setIsLoading(false)
    }
  }, [currentOrg?.id, hasAccess])

  useEffect(() => {
    void loadCategoryData()
  }, [loadCategoryData])

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

  const handleCreateCategory = (payload: CreateAssetCategoryPayload) => {
    const nextCategory: AssetCategory = {
      id: `cat-${Date.now()}`,
      name: payload.name,
      description: payload.description,
    }

    setCategories((prev) => [nextCategory, ...prev])
    toast({
      title: "Categoria agregada",
      description: `${payload.name} se agrego en modo demo.`,
    })
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
          <p className="mt-1 text-sm text-gray-400">Categorias y cantidades visibles en modo demo para Inventario.</p>
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
      />
    </div>
  )
}
