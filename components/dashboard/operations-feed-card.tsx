"use client"

import { Activity, ClipboardList, AlertTriangle, Trophy, QrCode, Package, Users2 } from "lucide-react"
import { mockOperationsFeed } from "@/lib/mock-data"

export default function OperationsFeedCard() {
  const getIcon = (type: string) => {
    switch (type) {
      case "work_order":
        return <ClipboardList className="w-4 h-4 text-blue-400" />
      case "incident":
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      case "sponsor":
        return <Trophy className="w-4 h-4 text-yellow-400" />
      case "credential":
        return <QrCode className="w-4 h-4 text-green-400" />
      case "asset":
        return <Package className="w-4 h-4 text-purple-400" />
      case "staff":
        return <Users2 className="w-4 h-4 text-cyan-400" />
      default:
        return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23] h-full">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Live Operations Feed
      </h2>

      <div className="space-y-1">
        {mockOperationsFeed.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#1A1A1F] transition-colors"
          >
            <div className="mt-0.5">{getIcon(item.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200">{item.message}</p>
              <p className="text-xs text-gray-500 mt-1">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
