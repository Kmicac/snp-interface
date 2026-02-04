"use client"

import { useMemo, useState } from "react"
import Layout from "@/components/kokonutui/layout"
import { Button } from "@/components/ui/button"
import { FolderTree, Package, Plus } from "lucide-react"
import { mockAssets } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import {
  CreateAssetCategoryDialog,
  type CreateAssetCategoryPayload,
} from "@/components/inventory/create-asset-category-dialog"

interface CategorySummary {
  id: string
  name: string
  description?: string
}

const initialCategories: CategorySummary[] = Array.from(new Set(mockAssets.map((asset) => asset.category))).map(
  (name, index) => ({
    id: `cat-${index + 1}`,
    name,
  })
)

export default function CategoriesPage() {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [categories, setCategories] = useState<CategorySummary[]>(initialCategories)

  const summaryByCategory = useMemo(
    () =>
      categories.map((category) => {
        const assetsInCategory = mockAssets.filter((asset) => asset.category === category.name)

        return {
          ...category,
          assetCount: assetsInCategory.length,
          totalQuantity: assetsInCategory.reduce((total, asset) => total + asset.quantity, 0),
        }
      }),
    [categories]
  )

  const handleCreateCategory = (payload: CreateAssetCategoryPayload) => {
    console.log("Create Asset Category payload", payload)

    const nextCategory: CategorySummary = {
      id: `cat-${Date.now()}`,
      name: payload.name,
      description: payload.description,
    }

    setCategories((prev) => [nextCategory, ...prev])

    toast({
      title: "Category added",
      description: `${payload.name} was added to local mock data.`,
    })
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FolderTree className="w-6 h-6" />
              Asset Categories
            </h1>
            <p className="text-gray-500 mt-1">View asset categories and counts</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {summaryByCategory.map((category) => (
            <div
              key={category.id}
              className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23] hover:border-[#2B2B30] transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                  {category.description && <p className="mt-1 text-xs text-gray-500">{category.description}</p>}
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-400">
                      <span className="text-white font-medium">{category.assetCount}</span> asset types
                    </p>
                    <p className="text-sm text-gray-400">
                      <span className="text-white font-medium">{category.totalQuantity}</span> total items
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateAssetCategoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCreate={handleCreateCategory}
      />
    </Layout>
  )
}
