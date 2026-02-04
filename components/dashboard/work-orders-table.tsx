"use client"

import { ClipboardList, Clock, AlertCircle, CheckCircle2, Timer, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { mockWorkOrders } from "@/lib/mock-data"
import type { WorkOrderStatus, SlaStatus } from "@/lib/types"

export default function WorkOrdersTable() {
  const getStatusBadge = (status: WorkOrderStatus) => {
    const config = {
      scheduled: { className: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
      in_progress: { className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Timer },
      completed: { className: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle2 },
      delayed: { className: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: AlertCircle },
      cancelled: { className: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: XCircle },
    }

    const { className, icon: Icon } = config[status]
    return (
      <Badge className={`${className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.replace("_", " ")}
      </Badge>
    )
  }

  const getSlaIcon = (slaStatus: SlaStatus) => {
    switch (slaStatus) {
      case "on_time":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case "at_risk":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case "breached":
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  return (
    <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          Work Orders (Today)
        </h2>
        <Link href="/work-orders">
          <Button variant="outline" size="sm" className="text-xs bg-transparent border-[#2B2B30] hover:bg-[#1A1A1F] text-gray-300">
            View all
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase border-b border-[#1F1F23]">
              <th className="pb-3 font-medium">Code</th>
              <th className="pb-3 font-medium">Provider</th>
              <th className="pb-3 font-medium">Zone</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-center">SLA</th>
            </tr>
          </thead>
          <tbody>
            {mockWorkOrders.slice(0, 5).map((wo) => (
              <tr key={wo.id} className="border-b border-[#1F1F23] hover:bg-[#1A1A1F] transition-colors">
                <td className="py-3">
                  <div>
                    <span className="text-sm font-mono text-gray-200">{wo.code}</span>
                    <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[150px]">{wo.title}</p>
                  </div>
                </td>
                <td className="py-3">
                  <div>
                    <span className="text-sm text-gray-200">{wo.provider}</span>
                    <p className="text-xs text-gray-500">{wo.category}</p>
                  </div>
                </td>
                <td className="py-3">
                  <span className="text-sm text-gray-300">{wo.zone}</span>
                </td>
                <td className="py-3">{getStatusBadge(wo.status)}</td>
                <td className="py-3 text-center">{getSlaIcon(wo.slaStatus)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
