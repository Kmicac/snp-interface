"use client"

import Layout from "@/components/kokonutui/layout"
import { Badge } from "@/components/ui/badge"
import { LayoutGrid, Users2, ClipboardList } from "lucide-react"

// Mock zones data
const mockZones = [
  { id: "z-1", name: "TATAMI 1", type: "Competition", capacity: 200, staffCount: 8, workOrdersCount: 12 },
  { id: "z-2", name: "TATAMI 2", type: "Competition", capacity: 200, staffCount: 6, workOrdersCount: 10 },
  { id: "z-3", name: "TATAMI 3", type: "Competition", capacity: 200, staffCount: 6, workOrdersCount: 8 },
  { id: "z-4", name: "WARM-UP", type: "Athletes", capacity: 100, staffCount: 2, workOrdersCount: 4 },
  { id: "z-5", name: "MEDICAL", type: "Support", capacity: 20, staffCount: 4, workOrdersCount: 3 },
  { id: "z-6", name: "VIP", type: "Hospitality", capacity: 50, staffCount: 3, workOrdersCount: 5 },
  { id: "z-7", name: "ENTRANCE", type: "Access", capacity: null, staffCount: 8, workOrdersCount: 6 },
  { id: "z-8", name: "BACKSTAGE", type: "Operations", capacity: 30, staffCount: 5, workOrdersCount: 7 },
  { id: "z-9", name: "SPONSORS AREA", type: "Partners", capacity: 40, staffCount: 2, workOrdersCount: 4 },
]

export default function ZonesPage() {
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Competition: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      Athletes: "bg-green-500/20 text-green-400 border-green-500/30",
      Support: "bg-red-500/20 text-red-400 border-red-500/30",
      Hospitality: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      Access: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      Operations: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      Partners: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    }
    return colors[type] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LayoutGrid className="w-6 h-6" />
            Zones & Layout
          </h1>
          <p className="text-gray-500 mt-1">Event zones and their current status</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockZones.map((zone) => (
            <div
              key={zone.id}
              className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23] hover:border-[#2B2B30] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{zone.name}</h3>
                <Badge className={getTypeColor(zone.type)}>{zone.type}</Badge>
              </div>

              {zone.capacity && (
                <p className="text-sm text-gray-500 mb-4">Capacity: {zone.capacity}</p>
              )}

              <div className="flex items-center gap-4 pt-4 border-t border-[#1F1F23]">
                <div className="flex items-center gap-2 text-sm">
                  <Users2 className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">{zone.staffCount} staff</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ClipboardList className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">{zone.workOrdersCount} WOs</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
