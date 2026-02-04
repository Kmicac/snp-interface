"use client"

import Layout from "@/components/kokonutui/layout"
import { Badge } from "@/components/ui/badge"
import {
  BarChart2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  TrendingUp,
} from "lucide-react"
import { mockKpisSummary, mockWorkOrders } from "@/lib/mock-data"

// Mock overdue work orders
const overdueWorkOrders = [
  { id: "wo-4", code: "WO-004", title: "Medical station setup", provider: "MedTeam", hoursOverdue: 2 },
  { id: "wo-5", code: "WO-005", title: "VIP lounge preparation", provider: "EventCatering", hoursOverdue: 4 },
]

// Mock SLA breaches
const slaBreaches = [
  { id: "sla-1", workOrderCode: "WO-005", provider: "EventCatering", category: "Hospitality", breachType: "Late completion" },
]

export default function KPIsPage() {
  const kpis = mockKpisSummary

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6" />
            Operations KPIs
          </h1>
          <p className="text-gray-500 mt-1">Key performance indicators for the current event</p>
        </div>

        {/* Main KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{kpis.totalWorkOrders}</p>
                <p className="text-sm text-gray-500">Total Work Orders</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-400">{kpis.completedWorkOrders} completed</span>
              <span className="text-gray-500">|</span>
              <span className="text-yellow-400">{kpis.totalWorkOrders - kpis.completedWorkOrders} pending</span>
            </div>
          </div>

          <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{kpis.onTimePercentage}%</p>
                <p className="text-sm text-gray-500">On-Time Completion</p>
              </div>
            </div>
            <div className="w-full bg-[#1A1A1F] rounded-full h-2">
              <div
                className="h-2 rounded-full bg-green-500"
                style={{ width: `${kpis.onTimePercentage}%` }}
              />
            </div>
          </div>

          <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{kpis.totalIncidents}</p>
                <p className="text-sm text-gray-500">Total Incidents</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-red-400">{kpis.incidentsBySeverity.critical} critical</span>
              <span className="text-gray-500">|</span>
              <span className="text-orange-400">{kpis.incidentsBySeverity.high} high</span>
            </div>
          </div>

          <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{overdueWorkOrders.length}</p>
                <p className="text-sm text-gray-500">Overdue Tasks</p>
              </div>
            </div>
            <div className="text-sm text-red-400">Requires attention</div>
          </div>
        </div>

        {/* Incident Severity Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
            <h2 className="text-lg font-bold text-white mb-4">Incidents by Severity</h2>
            <div className="space-y-4">
              {Object.entries(kpis.incidentsBySeverity).map(([severity, count]) => {
                const colors: Record<string, string> = {
                  low: "bg-gray-500",
                  medium: "bg-yellow-500",
                  high: "bg-orange-500",
                  critical: "bg-red-500",
                }
                const maxCount = Math.max(...Object.values(kpis.incidentsBySeverity))
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0

                return (
                  <div key={severity}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300 capitalize">{severity}</span>
                      <span className="text-sm text-white font-medium">{count}</span>
                    </div>
                    <div className="w-full bg-[#1A1A1F] rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${colors[severity]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Overdue Work Orders */}
          <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Overdue Work Orders
            </h2>
            <div className="space-y-3">
              {overdueWorkOrders.map((wo) => (
                <div
                  key={wo.id}
                  className="p-4 bg-[#1A1A1F] rounded-lg border border-red-500/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-mono text-white">{wo.code}</span>
                      <p className="text-sm text-gray-400 mt-1">{wo.title}</p>
                      <p className="text-xs text-gray-500">{wo.provider}</p>
                    </div>
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      {wo.hoursOverdue}h overdue
                    </Badge>
                  </div>
                </div>
              ))}
              {overdueWorkOrders.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No overdue work orders</p>
              )}
            </div>
          </div>
        </div>

        {/* SLA Breaches */}
        <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
          <h2 className="text-lg font-bold text-white mb-4">SLA Breaches</h2>
          {slaBreaches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase border-b border-[#1F1F23]">
                    <th className="pb-3 font-medium">Work Order</th>
                    <th className="pb-3 font-medium">Provider</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Breach Type</th>
                  </tr>
                </thead>
                <tbody>
                  {slaBreaches.map((breach) => (
                    <tr key={breach.id} className="border-b border-[#1F1F23]">
                      <td className="py-3 text-sm font-mono text-white">{breach.workOrderCode}</td>
                      <td className="py-3 text-sm text-gray-300">{breach.provider}</td>
                      <td className="py-3 text-sm text-gray-300">{breach.category}</td>
                      <td className="py-3">
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          {breach.breachType}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No SLA breaches</p>
          )}
        </div>
      </div>
    </Layout>
  )
}
