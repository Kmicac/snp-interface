"use client"

import { useMemo, useState } from "react"
import Layout from "@/components/kokonutui/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Package, Search, MapPin, Plus } from "lucide-react"
import { mockAssets } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import {
  CreateAssetDialog,
  type CreateAssetPayload,
  type AssetStatusFormValue,
  type AssetConditionFormValue,
} from "@/components/inventory/create-asset-dialog"

interface AssetListItem {
  id: string
  name: string
  category: string
  status: AssetStatusFormValue
  condition: AssetConditionFormValue
  quantity: number
  location: string
  assetTag?: string
  serialNumber?: string
  notes?: string
}

const statusFromMock: Record<string, AssetStatusFormValue> = {
  in_storage: "IN_STORAGE",
  in_use: "IN_USE",
  damaged: "DAMAGED",
  under_repair: "UNDER_REPAIR",
  disposed: "RETIRED",
}

const conditionFromMock: Record<string, AssetConditionFormValue> = {
  new: "NEW",
  good: "GOOD",
  fair: "FAIR",
  poor: "POOR",
}

const initialAssets: AssetListItem[] = mockAssets.map((asset) => ({
  id: asset.id,
  name: asset.name,
  category: asset.category,
  status: statusFromMock[asset.status],
  condition: conditionFromMock[asset.condition],
  quantity: asset.quantity,
  location: asset.location,
}))

export default function AssetsPage() {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [assets, setAssets] = useState<AssetListItem[]>(initialAssets)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const categories = useMemo(() => [...new Set(assets.map((asset) => asset.category))], [assets])

  const filteredAssets = useMemo(
    () =>
      assets.filter((asset) => {
        const matchesStatus = statusFilter === "all" || asset.status === statusFilter
        const matchesSearch =
          searchQuery === "" ||
          asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.category.toLowerCase().includes(searchQuery.toLowerCase())

        return matchesStatus && matchesSearch
      }),
    [assets, statusFilter, searchQuery]
  )

  const handleCreateAsset = (payload: CreateAssetPayload) => {
    console.log("Create Asset payload", payload)

    const nextAsset: AssetListItem = {
      id: `as-${Date.now()}`,
      name: payload.name,
      category: payload.category,
      status: payload.status,
      condition: payload.condition,
      quantity: payload.quantity,
      location: payload.location,
      assetTag: payload.assetTag,
      serialNumber: payload.serialNumber,
      notes: payload.notes,
    }

    setAssets((prev) => [nextAsset, ...prev])

    toast({
      title: "Asset added",
      description: `${payload.name} was added to local mock data.`,
    })
  }

  const getStatusBadge = (status: AssetStatusFormValue) => {
    const config: Record<AssetStatusFormValue, string> = {
      IN_STORAGE: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      IN_USE: "bg-green-500/20 text-green-400 border-green-500/30",
      DAMAGED: "bg-red-500/20 text-red-400 border-red-500/30",
      UNDER_REPAIR: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      LOST: "bg-red-700/20 text-red-300 border-red-700/30",
      RETIRED: "bg-gray-700/20 text-gray-500 border-gray-700/30",
    }
    return <Badge className={config[status]}>{status.replaceAll("_", " ")}</Badge>
  }

  const getConditionBadge = (condition: AssetConditionFormValue) => {
    const config: Record<AssetConditionFormValue, string> = {
      NEW: "bg-green-500/20 text-green-400 border-green-500/30",
      GOOD: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      FAIR: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      POOR: "bg-red-500/20 text-red-400 border-red-500/30",
      BROKEN: "bg-red-700/20 text-red-300 border-red-700/30",
    }
    return <Badge className={config[condition]}>{condition}</Badge>
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Package className="w-6 h-6" />
              Assets
            </h1>
            <p className="text-gray-500 mt-1">Manage inventory assets</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} disabled={categories.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </div>

        <div className="bg-[#0F0F12] rounded-xl p-4 border border-[#1F1F23]">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1A1A1F] border-[#2B2B30] text-white placeholder:text-gray-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-[#1A1A1F] border-[#2B2B30] text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1F] border-[#2B2B30]">
                <SelectItem value="all" className="text-white focus:bg-[#2B2B30] focus:text-white">
                  All Statuses
                </SelectItem>
                <SelectItem value="IN_STORAGE" className="text-white focus:bg-[#2B2B30] focus:text-white">
                  In Storage
                </SelectItem>
                <SelectItem value="IN_USE" className="text-white focus:bg-[#2B2B30] focus:text-white">
                  In Use
                </SelectItem>
                <SelectItem value="DAMAGED" className="text-white focus:bg-[#2B2B30] focus:text-white">
                  Damaged
                </SelectItem>
                <SelectItem value="UNDER_REPAIR" className="text-white focus:bg-[#2B2B30] focus:text-white">
                  Under Repair
                </SelectItem>
                <SelectItem value="LOST" className="text-white focus:bg-[#2B2B30] focus:text-white">
                  Lost
                </SelectItem>
                <SelectItem value="RETIRED" className="text-white focus:bg-[#2B2B30] focus:text-white">
                  Retired
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-[#0F0F12] rounded-xl border border-[#1F1F23] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b border-[#1F1F23] bg-[#1A1A1F]">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Condition</th>
                  <th className="px-6 py-4 font-medium">Qty</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="border-b border-[#1F1F23] hover:bg-[#1A1A1F] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-white">{asset.name}</span>
                      {(asset.assetTag || asset.serialNumber) && (
                        <p className="mt-1 text-xs text-gray-500">
                          {[asset.assetTag, asset.serialNumber].filter(Boolean).join(" • ")}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{asset.category}</span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(asset.status)}</td>
                    <td className="px-6 py-4">{getConditionBadge(asset.condition)}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-white">{asset.quantity}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin className="w-3 h-3" />
                        {asset.location}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredAssets.length === 0 && <div className="text-center py-12 text-gray-500">No assets found</div>}
        </div>
      </div>

      <CreateAssetDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        categories={categories}
        onCreate={handleCreateAsset}
      />
    </Layout>
  )
}
