"use client"

import { useState } from "react"
import Layout from "@/components/kokonutui/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Lightbulb, Calendar, Plus } from "lucide-react"
import { mockImprovements, mockIncidents } from "@/lib/mock-data"
import type { Improvement } from "@/lib/types"
import { useAuth } from "@/lib/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  CreateImprovementDialog,
  type CreateImprovementPayload,
} from "@/components/improvements/create-improvement-dialog"

type ImprovementListItem = Improvement & {
  relatedEventId?: string | null
  relatedIncidentId?: string | null
  priority?: number
}

const improvementTypeMap: Record<CreateImprovementPayload["type"], Improvement["type"]> = {
  IMPROVEMENT: "improvement",
  INNOVATION: "innovation",
  PROCESS: "process",
}

export default function ImprovementsPage() {
  const { currentOrg, events } = useAuth()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [improvements, setImprovements] = useState<ImprovementListItem[]>(mockImprovements)

  const handleCreateImprovement = (payload: CreateImprovementPayload) => {
    console.log("Create Improvement payload", payload)

    const nextImprovement: ImprovementListItem = {
      id: `imp-${Date.now()}`,
      title: payload.title,
      description: payload.description,
      type: improvementTypeMap[payload.type],
      status: "proposed",
      createdAt: new Date().toISOString(),
      relatedEventId: payload.relatedEventId,
      relatedIncidentId: payload.relatedIncidentId,
      priority: payload.priority,
    }

    setImprovements((prev) => [nextImprovement, ...prev])

    toast({
      title: "Improvement created",
      description: `${payload.title} was added to local mock data.`,
    })
  }

  const getTypeBadge = (type: Improvement["type"]) => {
    const config: Record<Improvement["type"], string> = {
      improvement: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      innovation: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      process: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    }
    return <Badge className={config[type]}>{type}</Badge>
  }

  const getStatusBadge = (status: Improvement["status"]) => {
    const config: Record<Improvement["status"], string> = {
      proposed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      approved: "bg-green-500/20 text-green-400 border-green-500/30",
      in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      implemented: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    }
    return <Badge className={config[status]}>{status.replace("_", " ")}</Badge>
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-6 h-6" />
              Improvements
            </h1>
            <p className="text-gray-500 mt-1">Track improvement proposals and innovations</p>
            {!currentOrg && (
              <p className="mt-2 text-sm text-amber-400">Select an organization to create improvements.</p>
            )}
          </div>
          <Button onClick={() => setIsDialogOpen(true)} disabled={!currentOrg}>
            <Plus className="mr-2 h-4 w-4" />
            New Improvement
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {improvements.map((improvement) => (
            <div
              key={improvement.id}
              className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23] hover:border-[#2B2B30] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{improvement.title}</h3>
                {getTypeBadge(improvement.type)}
              </div>
              {improvement.description && <p className="text-sm text-gray-400 mb-4">{improvement.description}</p>}
              <div className="flex items-center justify-between pt-4 border-t border-[#1F1F23]">
                <div className="flex items-center gap-2">
                  {getStatusBadge(improvement.status)}
                  {typeof improvement.priority === "number" && (
                    <Badge className="bg-[#1A1A1F] text-gray-300 border-[#2B2B30]">P{improvement.priority}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  {new Date(improvement.createdAt).toLocaleDateString("es-CL")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateImprovementDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        organizationId={currentOrg?.id}
        organizationName={currentOrg?.name}
        events={events.map((event) => ({ id: event.id, name: event.name }))}
        incidents={mockIncidents.map((incident) => ({ id: incident.id, title: incident.title }))}
        onCreate={handleCreateImprovement}
      />
    </Layout>
  )
}
