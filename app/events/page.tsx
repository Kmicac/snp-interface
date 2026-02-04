"use client"

import { useMemo, useState } from "react"
import Layout from "@/components/kokonutui/layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, ClipboardList, AlertTriangle, Trophy, Plus, Pencil } from "lucide-react"
import Link from "next/link"
import type { Event } from "@/lib/types"
import { useAuth } from "@/lib/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { CreateEventDialog, type CreateEventPayload } from "@/components/events/create-event-dialog"

type EventListItem = Event & {
  workOrdersCount: number
  incidentsCount: number
  sponsorsCount: number
}

const initialEvents: EventListItem[] = [
  {
    id: "evt-1",
    name: "ADCC LATAM 2025",
    code: "ADCC_LATAM_2025",
    startDate: "2025-03-15",
    endDate: "2025-03-16",
    venue: "Movistar Arena, Santiago",
    status: "upcoming",
    workOrdersCount: 45,
    incidentsCount: 0,
    sponsorsCount: 12,
  },
  {
    id: "evt-2",
    name: "Open Chile 2025",
    code: "OPEN_CHILE_2025",
    startDate: "2025-04-20",
    endDate: "2025-04-21",
    venue: "Centro de Eventos, Valparaiso",
    status: "upcoming",
    workOrdersCount: 28,
    incidentsCount: 0,
    sponsorsCount: 8,
  },
  {
    id: "evt-3",
    name: "Nacional BJJ 2024",
    code: "NACIONAL_BJJ_2024",
    startDate: "2024-11-10",
    endDate: "2024-11-11",
    venue: "Estadio Nacional, Santiago",
    status: "past",
    workOrdersCount: 52,
    incidentsCount: 3,
    sponsorsCount: 15,
  },
  {
    id: "evt-4",
    name: "Copa Sur 2024",
    code: "COPA_SUR_2024",
    startDate: "2024-09-15",
    endDate: "2024-09-15",
    venue: "Gimnasio Municipal, Concepcion",
    status: "past",
    workOrdersCount: 20,
    incidentsCount: 1,
    sponsorsCount: 5,
  },
]

function resolveEventStatus(startDate: string, endDate: string): Event["status"] {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (now >= start && now <= end) {
    return "live"
  }

  return now < start ? "upcoming" : "past"
}

function toDateTimeInput(value: string): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 16)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(
    2,
    "0"
  )}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

export default function EventsPage() {
  const { currentOrg } = useAuth()
  const { toast } = useToast()
  const canEdit = true
  const [createOpen, setCreateOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventListItem | null>(null)
  const [events, setEvents] = useState<EventListItem[]>(initialEvents)

  const upcomingEvents = useMemo(
    () => events.filter((event) => event.status === "upcoming" || event.status === "live"),
    [events]
  )

  const pastEvents = useMemo(() => events.filter((event) => event.status === "past"), [events])

  const handleCreateEvent = (payload: CreateEventPayload) => {
    console.log("Create Event payload", payload)

    const nextEvent: EventListItem = {
      id: `evt-${Date.now()}`,
      name: payload.name,
      code: payload.code,
      startDate: payload.startDate,
      endDate: payload.endDate,
      venue: payload.venue,
      status: resolveEventStatus(payload.startDate, payload.endDate),
      workOrdersCount: 0,
      incidentsCount: 0,
      sponsorsCount: 0,
    }

    setEvents((prev) => [nextEvent, ...prev])

    toast({
      title: "Event created",
      description: `${payload.name} was added to local mock data.`,
    })
  }

  const handleEditEvent = (payload: CreateEventPayload) => {
    if (!editingEvent) return

    console.log("Edit Event payload", payload)

    setEvents((prev) =>
      prev.map((event) =>
        event.id === editingEvent.id
          ? {
              ...event,
              name: payload.name,
              startDate: payload.startDate,
              endDate: payload.endDate,
              venue: payload.venue,
              status: resolveEventStatus(payload.startDate, payload.endDate),
            }
          : event
      )
    )

    setEditingEvent(null)
    toast({
      title: "Event updated",
      description: `${payload.name} was updated in local mock data.`,
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Live</Badge>
      case "upcoming":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Upcoming</Badge>
      case "past":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Completed</Badge>
      default:
        return null
    }
  }

  const EventCard = ({ event }: { event: EventListItem }) => (
    <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23] hover:border-[#2B2B30] transition-colors">
      <div className="flex items-start justify-end gap-2 mb-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/events/${event.id}`}>View</Link>
        </Button>
        {canEdit && (
          <Button variant="ghost" size="sm" onClick={() => setEditingEvent(event)}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      </div>
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{event.name}</h3>
            <p className="text-sm text-gray-500 font-mono">{event.code}</p>
          </div>
          {getStatusBadge(event.status)}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(event.startDate).toLocaleDateString("es-CL", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {event.endDate !== event.startDate && (
                <>
                  {" - "}
                  {new Date(event.endDate).toLocaleDateString("es-CL", {
                    day: "numeric",
                    month: "short",
                  })}
                </>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{event.venue}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-[#1F1F23]">
          <div className="flex items-center gap-1 text-sm">
            <ClipboardList className="w-4 h-4 text-blue-400" />
            <span className="text-gray-300">{event.workOrdersCount}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-gray-300">{event.incidentsCount}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-300">{event.sponsorsCount}</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Events</h1>
            <p className="text-gray-500 mt-1">Manage and view all your events</p>
            {!currentOrg && (
              <p className="mt-2 text-sm text-amber-400">Select an organization to create events.</p>
            )}
          </div>
          <Button onClick={() => setCreateOpen(true)} disabled={!currentOrg}>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="bg-[#1A1A1F] border border-[#2B2B30]">
            <TabsTrigger
              value="upcoming"
              className="data-[state=active]:bg-[#2B2B30] text-gray-300 data-[state=active]:text-white"
            >
              Upcoming / Active ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="data-[state=active]:bg-[#2B2B30] text-gray-300 data-[state=active]:text-white"
            >
              Past ({pastEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            {upcomingEvents.length === 0 && (
              <div className="text-center py-12 text-gray-500">No upcoming events</div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            {pastEvents.length === 0 && <div className="text-center py-12 text-gray-500">No past events</div>}
          </TabsContent>
        </Tabs>
      </div>

      <CreateEventDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        organizationId={currentOrg?.id}
        organizationName={currentOrg?.name}
        onCreate={handleCreateEvent}
      />
      <CreateEventDialog
        open={editingEvent !== null}
        onOpenChange={(open) => {
          if (!open) setEditingEvent(null)
        }}
        mode="edit"
        organizationId={currentOrg?.id}
        organizationName={currentOrg?.name}
        initialValues={
          editingEvent
            ? {
                organizationId: currentOrg?.id ?? "",
                code: editingEvent.code,
                name: editingEvent.name,
                startDate: toDateTimeInput(editingEvent.startDate),
                endDate: toDateTimeInput(editingEvent.endDate),
                venue: editingEvent.venue,
              }
            : undefined
        }
        onCreate={handleEditEvent}
      />
    </Layout>
  )
}
