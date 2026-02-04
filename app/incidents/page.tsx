"use client"

import { useState } from "react"
import Layout from "@/components/kokonutui/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, MapPin, Clock, Plus } from "lucide-react"
import { mockIncidents } from "@/lib/mock-data"
import type { IncidentSeverity, IncidentStatus, Incident } from "@/lib/types"
import { useAuth } from "@/lib/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  ReportIncidentDialog,
  type ReportIncidentPayload,
} from "@/components/incidents/report-incident-dialog"

type IncidentListItem = Incident & {
  reporter?: string
  eventId?: string
}

const initialIncidents: IncidentListItem[] = [
  ...mockIncidents,
  {
    id: "inc-4",
    title: "Power outage - Sponsor area",
    description: "Temporary power loss affecting sponsor booths",
    severity: "high",
    status: "in_progress",
    zone: "SPONSORS AREA",
    reportedAt: "2025-03-15T10:00:00",
  },
  {
    id: "inc-5",
    title: "Minor injury - Warm-up zone",
    description: "Athlete reported minor ankle sprain",
    severity: "low",
    status: "resolved",
    zone: "WARM-UP",
    reportedAt: "2025-03-15T09:30:00",
    resolvedAt: "2025-03-15T09:45:00",
  },
]

const severityMap: Record<ReportIncidentPayload["severity"], IncidentSeverity> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
}

const zoneOptions = ["TATAMI 1", "TATAMI 2", "TATAMI 3", "WARM-UP", "BACKSTAGE", "VIP", "ENTRANCE", "MEDICAL"]

export default function IncidentsPage() {
  const { events, currentEvent, user } = useAuth()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [incidents, setIncidents] = useState<IncidentListItem[]>(initialIncidents)

  const handleCreateIncident = (payload: ReportIncidentPayload) => {
    console.log("Create Incident payload", payload)

    const nextIncident: IncidentListItem = {
      id: `inc-${Date.now()}`,
      title: payload.title,
      description: payload.description,
      severity: severityMap[payload.severity],
      status: "open",
      zone: payload.zone ?? "UNASSIGNED",
      reportedAt: payload.occurredAt,
      reporter: payload.reporter,
      eventId: payload.eventId,
    }

    setIncidents((prev) => [nextIncident, ...prev])

    toast({
      title: "Incident reported",
      description: `${payload.title} was added to local mock data.`,
    })
  }

  const getSeverityBadge = (severity: IncidentSeverity) => {
    const config = {
      low: { className: "bg-gray-500/20 text-gray-400 border-gray-500/30", label: "Low" },
      medium: { className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Medium" },
      high: { className: "bg-orange-500/20 text-orange-400 border-orange-500/30", label: "High" },
      critical: { className: "bg-red-500/20 text-red-400 border-red-500/30", label: "Critical" },
    }

    return <Badge className={config[severity].className}>{config[severity].label}</Badge>
  }

  const getStatusBadge = (status: IncidentStatus) => {
    const config = {
      open: { className: "bg-red-500/20 text-red-400 border-red-500/30", label: "Open" },
      in_progress: {
        className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        label: "In Progress",
      },
      resolved: { className: "bg-green-500/20 text-green-400 border-green-500/30", label: "Resolved" },
      closed: { className: "bg-gray-500/20 text-gray-400 border-gray-500/30", label: "Closed" },
    }

    return <Badge className={config[status].className}>{config[status].label}</Badge>
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Incidents
            </h1>
            <p className="text-gray-500 mt-1">Track and manage incidents for the current event</p>
            {!currentEvent && (
              <p className="mt-2 text-sm text-amber-400">Select an event to report incidents.</p>
            )}
          </div>
          <Button onClick={() => setIsDialogOpen(true)} disabled={events.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Report Incident
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(["open", "in_progress", "resolved", "closed"] as IncidentStatus[]).map((status) => {
            const count = incidents.filter((incident) => incident.status === status).length
            return (
              <div key={status} className="bg-[#0F0F12] rounded-xl p-4 border border-[#1F1F23]">
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="text-sm text-gray-500 capitalize">{status.replace("_", " ")}</p>
              </div>
            )
          })}
        </div>

        <div className="space-y-4">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23] hover:border-[#2B2B30] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{incident.title}</h3>
                  {incident.description && <p className="text-sm text-gray-400 mt-1">{incident.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {getSeverityBadge(incident.severity)}
                  {getStatusBadge(incident.status)}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{incident.zone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Reported: {new Date(incident.reportedAt).toLocaleString("es-CL")}</span>
                </div>
                {incident.reporter && <span>Reporter: {incident.reporter}</span>}
                {incident.resolvedAt && (
                  <span className="text-green-400">
                    Resolved: {new Date(incident.resolvedAt).toLocaleString("es-CL")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ReportIncidentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        events={events.map((event) => ({ id: event.id, name: event.name }))}
        selectedEventId={currentEvent?.id}
        zones={zoneOptions}
        reporterName={user?.name}
        onCreate={handleCreateIncident}
      />
    </Layout>
  )
}
