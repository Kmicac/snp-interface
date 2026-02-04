"use client"

import { AlertTriangle, Lightbulb } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { mockIncidents, mockImprovements } from "@/lib/mock-data"
import type { IncidentSeverity, IncidentStatus } from "@/lib/types"

export default function IncidentsCard() {
  const getSeverityBadge = (severity: IncidentSeverity) => {
    const config = {
      low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      critical: "bg-red-500/20 text-red-400 border-red-500/30",
    }
    return <Badge className={config[severity]}>{severity}</Badge>
  }

  const getStatusBadge = (status: IncidentStatus) => {
    const config = {
      open: "bg-red-500/20 text-red-400 border-red-500/30",
      in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      resolved: "bg-green-500/20 text-green-400 border-green-500/30",
      closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    }
    return <Badge className={config[status]}>{status.replace("_", " ")}</Badge>
  }

  const getImprovementTypeBadge = (type: string) => {
    const config: Record<string, string> = {
      improvement: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      innovation: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      process: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    }
    return <Badge className={config[type]}>{type}</Badge>
  }

  return (
    <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
      <Tabs defaultValue="incidents" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-[#1A1A1F] border border-[#2B2B30]">
            <TabsTrigger value="incidents" className="data-[state=active]:bg-[#2B2B30] text-gray-300 data-[state=active]:text-white">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Incidents
            </TabsTrigger>
            <TabsTrigger value="improvements" className="data-[state=active]:bg-[#2B2B30] text-gray-300 data-[state=active]:text-white">
              <Lightbulb className="w-4 h-4 mr-2" />
              Improvements
            </TabsTrigger>
          </TabsList>
          <Link href="/incidents">
            <Button variant="outline" size="sm" className="text-xs bg-transparent border-[#2B2B30] hover:bg-[#1A1A1F] text-gray-300">
              View all
            </Button>
          </Link>
        </div>

        <TabsContent value="incidents" className="mt-0">
          <div className="space-y-3">
            {mockIncidents.map((incident) => (
              <div
                key={incident.id}
                className="p-3 rounded-lg bg-[#1A1A1F] hover:bg-[#252529] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">{incident.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">Zone: {incident.zone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(incident.severity)}
                    {getStatusBadge(incident.status)}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(incident.reportedAt).toLocaleString("es-CL")}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="improvements" className="mt-0">
          <div className="space-y-3">
            {mockImprovements.map((improvement) => (
              <div
                key={improvement.id}
                className="p-3 rounded-lg bg-[#1A1A1F] hover:bg-[#252529] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">{improvement.title}</h4>
                    {improvement.description && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{improvement.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getImprovementTypeBadge(improvement.type)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
