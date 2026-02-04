"use client"

import { useState } from "react"
import Layout from "@/components/kokonutui/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dumbbell, Calendar, Users2, AlertCircle, Plus, MapPin, Clock, Pencil } from "lucide-react"
import { useAuth } from "@/lib/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  CreateTrainingDialog,
  type CreateTrainingPayload,
} from "@/components/trainings/create-training-dialog"

interface TrainingItem {
  id: string
  title: string
  description?: string
  dateTime: string
  mandatory: boolean
  eventId?: string
  attendeesCount: number
  attendedCount: number
  location: string
  capacity?: number
}

const initialTrainings: TrainingItem[] = [
  {
    id: "tr-1",
    title: "Referee Certification Workshop",
    description: "Rules interpretation and conflict resolution simulations",
    dateTime: "2025-03-10T09:00",
    mandatory: true,
    eventId: "evt-1",
    attendeesCount: 15,
    attendedCount: 12,
    location: "Dojo Norte",
  },
  {
    id: "tr-2",
    title: "Safety & Emergency Procedures",
    description: "Medical escalation and emergency response protocols",
    dateTime: "2025-03-12T14:00",
    mandatory: true,
    eventId: "evt-1",
    attendeesCount: 30,
    attendedCount: 28,
    location: "Meeting room A",
  },
  {
    id: "tr-3",
    title: "Scoring System Training",
    description: "Live simulation for scorekeepers and table operators",
    dateTime: "2025-03-13T10:00",
    mandatory: false,
    eventId: "evt-1",
    attendeesCount: 20,
    attendedCount: 18,
    location: "Control room",
  },
  {
    id: "tr-4",
    title: "Staff Onboarding",
    description: "General operations briefing for newly onboarded staff",
    dateTime: "2025-03-14T08:00",
    mandatory: true,
    eventId: "evt-1",
    attendeesCount: 45,
    attendedCount: 40,
    location: "Main hall",
  },
]

export default function TrainingsPage() {
  const { currentOrg, events } = useAuth()
  const { toast } = useToast()
  const canEdit = true

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTraining, setEditingTraining] = useState<TrainingItem | null>(null)
  const [trainings, setTrainings] = useState<TrainingItem[]>(initialTrainings)

  const handleCreateTraining = (payload: CreateTrainingPayload) => {
    console.log("Create Training payload", payload)

    const nextTraining: TrainingItem = {
      id: `tr-${Date.now()}`,
      title: payload.title,
      description: payload.description,
      dateTime: payload.dateTime,
      mandatory: payload.mandatory,
      eventId: payload.relatedEventId ?? undefined,
      attendeesCount: payload.capacity ?? 0,
      attendedCount: 0,
      location: payload.location,
      capacity: payload.capacity,
    }

    setTrainings((prev) => [nextTraining, ...prev])

    toast({
      title: "Training created",
      description: `${payload.title} was added to local mock data.`,
    })
  }

  const handleEditTraining = (payload: CreateTrainingPayload) => {
    if (!editingTraining) return

    console.log("Edit Training payload", payload)

    setTrainings((prev) =>
      prev.map((training) =>
        training.id === editingTraining.id
          ? {
              ...training,
              title: payload.title,
              description: payload.description,
              dateTime: payload.dateTime,
              location: payload.location,
              mandatory: payload.mandatory,
              eventId: payload.relatedEventId ?? undefined,
              capacity: payload.capacity,
              attendeesCount: payload.capacity ?? training.attendeesCount,
            }
          : training
      )
    )

    setEditingTraining(null)
    toast({
      title: "Training updated",
      description: `${payload.title} was updated in local mock data.`,
    })
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-6 h-6" />
              Trainings
            </h1>
            <p className="text-gray-500 mt-1">Training sessions and attendance tracking</p>
            {!currentOrg && <p className="mt-2 text-sm text-amber-400">Select an organization to create trainings.</p>}
          </div>
          <Button onClick={() => setIsDialogOpen(true)} disabled={!currentOrg}>
            <Plus className="mr-2 h-4 w-4" />
            Create Training
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trainings.map((training) => {
            const attendanceRate =
              training.attendeesCount > 0
                ? Math.round((training.attendedCount / training.attendeesCount) * 100)
                : 0

            return (
              <div
                key={training.id}
                className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23] hover:border-[#2B2B30] transition-colors"
              >
                {canEdit && (
                  <div className="mb-3 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditingTraining(training)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{training.title}</h3>
                  {training.mandatory && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Mandatory
                    </Badge>
                  )}
                </div>

                {training.description && <p className="text-sm text-gray-400 mb-4">{training.description}</p>}

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(training.dateTime).toLocaleDateString("es-CL", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(training.dateTime).toLocaleTimeString("es-CL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{training.location}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1F1F23]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Users2 className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">
                        {training.attendedCount} / {training.attendeesCount} attended
                      </span>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        attendanceRate >= 90 ? "text-green-400" : attendanceRate >= 70 ? "text-yellow-400" : "text-red-400"
                      }`}
                    >
                      {attendanceRate}%
                    </span>
                  </div>
                  <div className="w-full bg-[#1A1A1F] rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        attendanceRate >= 90 ? "bg-green-500" : attendanceRate >= 70 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${attendanceRate}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <CreateTrainingDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        organizationId={currentOrg?.id}
        organizationName={currentOrg?.name}
        events={events.map((event) => ({ id: event.id, name: event.name }))}
        onCreate={handleCreateTraining}
      />
      <CreateTrainingDialog
        open={editingTraining !== null}
        onOpenChange={(open) => {
          if (!open) setEditingTraining(null)
        }}
        mode="edit"
        organizationId={currentOrg?.id}
        organizationName={currentOrg?.name}
        initialValues={
          editingTraining
            ? {
                organizationId: currentOrg?.id ?? "",
                relatedEventId: editingTraining.eventId ?? null,
                title: editingTraining.title,
                description: editingTraining.description ?? "",
                dateTime: editingTraining.dateTime,
                location: editingTraining.location,
                mandatory: editingTraining.mandatory,
                capacity: editingTraining.capacity,
              }
            : undefined
        }
        events={events.map((event) => ({ id: event.id, name: event.name }))}
        onCreate={handleEditTraining}
      />
    </Layout>
  )
}
