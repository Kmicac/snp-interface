"use client"

import { Calendar, MapPin, ClipboardList, AlertTriangle, Users2, QrCode } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/context/auth-context"
import { mockKpisSummary } from "@/lib/mock-data"

export default function EventOverviewCard() {
  const { currentEvent } = useAuth()
  const kpis = mockKpisSummary

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Live</Badge>
      case "upcoming":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Upcoming</Badge>
      case "past":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Past</Badge>
      default:
        return null
    }
  }

  return (
    <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Current Event Overview
        </h2>
        {currentEvent && getStatusBadge(currentEvent.status)}
      </div>

      {currentEvent ? (
        <div className="space-y-6">
          {/* Event Info */}
          <div>
            <h3 className="text-xl font-semibold text-white">{currentEvent.name}</h3>
            <p className="text-sm text-gray-500 font-mono mt-1">{currentEvent.code}</p>
            <div className="flex items-center gap-2 mt-3 text-gray-400 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{currentEvent.venue}</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-gray-400 text-sm">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(currentEvent.startDate).toLocaleDateString("es-CL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {currentEvent.endDate !== currentEvent.startDate && (
                  <> - {new Date(currentEvent.endDate).toLocaleDateString("es-CL", {
                    day: "numeric",
                    month: "long",
                  })}</>
                )}
              </span>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1A1A1F] rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <ClipboardList className="w-4 h-4" />
                <span className="text-xs uppercase">Work Orders</span>
              </div>
              <div className="text-2xl font-bold text-white">{kpis.totalWorkOrders}</div>
              <div className="flex gap-2 mt-2 text-xs">
                <span className="text-green-400">{kpis.completedWorkOrders} done</span>
                <span className="text-gray-500">|</span>
                <span className="text-yellow-400">{kpis.totalWorkOrders - kpis.completedWorkOrders} pending</span>
              </div>
            </div>

            <div className="bg-[#1A1A1F] rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs uppercase">Open Incidents</span>
              </div>
              <div className="text-2xl font-bold text-white">{kpis.totalIncidents}</div>
              <div className="flex gap-2 mt-2 text-xs">
                <span className="text-red-400">{kpis.incidentsBySeverity.critical} critical</span>
                <span className="text-gray-500">|</span>
                <span className="text-orange-400">{kpis.incidentsBySeverity.high} high</span>
              </div>
            </div>

            <div className="bg-[#1A1A1F] rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Users2 className="w-4 h-4" />
                <span className="text-xs uppercase">Active Staff</span>
              </div>
              <div className="text-2xl font-bold text-white">{kpis.activeStaff}</div>
            </div>

            <div className="bg-[#1A1A1F] rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <QrCode className="w-4 h-4" />
                <span className="text-xs uppercase">Credentials</span>
              </div>
              <div className="text-2xl font-bold text-white">{kpis.activeCredentials}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No event selected. Please select an event from the top bar.
        </div>
      )}
    </div>
  )
}
