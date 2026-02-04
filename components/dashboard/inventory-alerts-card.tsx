"use client"

import { Package, AlertTriangle, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { mockAssets } from "@/lib/mock-data"
import type { AssetStatus } from "@/lib/types"

export default function InventoryAlertsCard() {
  // Filter assets that need attention
  const alertAssets = mockAssets.filter(
    (asset) => asset.status === "damaged" || asset.status === "under_repair"
  )

  const getStatusBadge = (status: AssetStatus) => {
    const config: Record<AssetStatus, { className: string; icon: typeof AlertTriangle }> = {
      damaged: { className: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertTriangle },
      under_repair: { className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Wrench },
      in_storage: { className: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: Package },
      in_use: { className: "bg-green-500/20 text-green-400 border-green-500/30", icon: Package },
      disposed: { className: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: Package },
    }

    const { className, icon: Icon } = config[status]
    return (
      <Badge className={`${className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.replace("_", " ")}
      </Badge>
    )
  }

  return (
    <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Package className="w-4 h-4" />
          Inventory Alerts
        </h2>
        <Link href="/inventory/assets">
          <Button variant="outline" size="sm" className="text-xs bg-transparent border-[#2B2B30] hover:bg-[#1A1A1F] text-gray-300">
            View all
          </Button>
        </Link>
      </div>

      {alertAssets.length > 0 ? (
        <div className="space-y-3">
          {alertAssets.map((asset) => (
            <div
              key={asset.id}
              className="p-3 rounded-lg bg-[#1A1A1F] hover:bg-[#252529] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white">{asset.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {asset.category} | {asset.location}
                  </p>
                </div>
                {getStatusBadge(asset.status)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Package className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No inventory alerts</p>
        </div>
      )}
    </div>
  )
}
