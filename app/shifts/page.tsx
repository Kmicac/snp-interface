"use client"

import { useMemo, useState } from "react"
import Layout from "@/components/kokonutui/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Users2, MapPin, Plus } from "lucide-react"
import { useAuth } from "@/lib/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { CreateShiftDialog, type CreateShiftPayload } from "@/components/shifts/create-shift-dialog"

interface AssignmentItem {
  id: string
  staffName: string
  zone: string
  shift: string
  role: string
}

interface ShiftItem {
  id: string
  eventId: string
  name: string
  startsAt: string
  endsAt: string
  notes?: string
}

const initialAssignments: AssignmentItem[] = [
  { id: "as-1", staffName: "Carlos Mendez", zone: "ENTRANCE", shift: "06:00 - 14:00", role: "Security" },
  { id: "as-2", staffName: "Maria Silva", zone: "BACKSTAGE", shift: "06:00 - 14:00", role: "Logistics" },
  { id: "as-3", staffName: "Juan Perez", zone: "TATAMI 1", shift: "08:00 - 18:00", role: "Referee" },
  { id: "as-4", staffName: "Ana Garcia", zone: "MEDICAL", shift: "07:00 - 19:00", role: "Medical" },
  { id: "as-5", staffName: "Pedro Rojas", zone: "TATAMI 2", shift: "08:00 - 16:00", role: "Cleaning" },
  { id: "as-6", staffName: "Roberto Alves", zone: "TATAMI 1", shift: "08:00 - 18:00", role: "Referee" },
  { id: "as-7", staffName: "Diego Torres", zone: "TATAMI 2", shift: "08:00 - 18:00", role: "Referee" },
  { id: "as-8", staffName: "Felipe Soto", zone: "VIP", shift: "10:00 - 22:00", role: "Security" },
]

const initialShifts: ShiftItem[] = [
  {
    id: "shift-1",
    eventId: "evt-1",
    name: "Morning Shift",
    startsAt: "2025-03-15T06:00",
    endsAt: "2025-03-15T14:00",
    notes: "Core venue setup and access control",
  },
  {
    id: "shift-2",
    eventId: "evt-1",
    name: "Competition Block A",
    startsAt: "2025-03-15T08:00",
    endsAt: "2025-03-15T18:00",
    notes: "Tatami operations and referee rotations",
  },
  {
    id: "shift-3",
    eventId: "evt-1",
    name: "Evening Shift",
    startsAt: "2025-03-15T14:00",
    endsAt: "2025-03-15T22:00",
    notes: "Breakdown and close-out",
  },
]

export default function ShiftsPage() {
  const { events, currentEvent } = useAuth()
  const { toast } = useToast()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [assignments] = useState<AssignmentItem[]>(initialAssignments)
  const [shifts, setShifts] = useState<ShiftItem[]>(initialShifts)

  const assignmentsByZone = useMemo(
    () =>
      assignments.reduce(
        (acc, assignment) => {
          if (!acc[assignment.zone]) {
            acc[assignment.zone] = []
          }
          acc[assignment.zone].push(assignment)
          return acc
        },
        {} as Record<string, AssignmentItem[]>
      ),
    [assignments]
  )

  const handleCreateShift = (payload: CreateShiftPayload) => {
    console.log("Create Shift payload", payload)

    const nextShift: ShiftItem = {
      id: `shift-${Date.now()}`,
      eventId: payload.eventId,
      name: payload.name,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
      notes: payload.notes,
    }

    setShifts((prev) => [nextShift, ...prev])

    toast({
      title: "Shift created",
      description: `${payload.name} was added to local mock data.`,
    })
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      Security: "bg-red-500/20 text-red-400 border-red-500/30",
      Logistics: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      Referee: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      Medical: "bg-green-500/20 text-green-400 border-green-500/30",
      Cleaning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    }
    return <Badge className={colors[role] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}>{role}</Badge>
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Shifts & Assignments
            </h1>
            <p className="text-gray-500 mt-1">Staff assignments and shift schedules for the current event</p>
            {!currentEvent && <p className="mt-2 text-sm text-amber-400">Select an event to create shifts.</p>}
          </div>
          <Button onClick={() => setIsCreateOpen(true)} disabled={events.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Create Shift
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{assignments.length}</p>
                <p className="text-sm text-gray-500">Total Assignments</p>
              </div>
            </div>
          </div>
          <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{Object.keys(assignmentsByZone).length}</p>
                <p className="text-sm text-gray-500">Zones Covered</p>
              </div>
            </div>
          </div>
          <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{shifts.length}</p>
                <p className="text-sm text-gray-500">Active Shifts</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
          <h2 className="text-lg font-semibold text-white mb-4">Shift Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shifts.map((shift) => (
              <div key={shift.id} className="rounded-lg border border-[#2B2B30] bg-[#1A1A1F] p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">{shift.name}</h3>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    {new Date(shift.startsAt).toLocaleDateString("es-CL")}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  {new Date(shift.startsAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })} -{" "}
                  {new Date(shift.endsAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                </p>
                {shift.notes && <p className="mt-2 text-xs text-gray-500">{shift.notes}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(assignmentsByZone).map(([zone, zoneAssignments]) => (
            <div key={zone} className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                {zone}
                <Badge className="bg-[#1A1A1F] text-gray-400 border-[#2B2B30] ml-auto">
                  {zoneAssignments.length} staff
                </Badge>
              </h3>
              <div className="space-y-3">
                {zoneAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 bg-[#1A1A1F] rounded-lg"
                  >
                    <div>
                      <span className="text-white font-medium">{assignment.staffName}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-sm text-gray-400">{assignment.shift}</span>
                      </div>
                    </div>
                    {getRoleBadge(assignment.role)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateShiftDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        events={events.map((event) => ({ id: event.id, name: event.name }))}
        selectedEventId={currentEvent?.id}
        onCreate={handleCreateShift}
      />
    </Layout>
  )
}
