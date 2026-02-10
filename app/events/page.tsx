"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import Layout from "@/components/kokonutui/layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { EventCard } from "@/components/events/event-card"
import type { Event } from "@/lib/types"
import { useAuth } from "@/lib/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { mockAssets, mockEvents, mockStaff } from "@/lib/mock-data"
import { CreateEventDialog, type CreateEventPayload } from "@/components/events/create-event-dialog"
import { EventResourcesDialog } from "@/components/events/event-resources-dialog"

type EventListItem = Event & {
  workOrdersCount: number
  incidentsCount: number
  sponsorsCount: number
  staffAssignedCount: number
  assetsAssignedCount: number
}

type EventAssignmentsState = Record<
  string,
  {
    staffIds: string[]
    assetIds: string[]
  }
>

const eventMetricsById: Record<string, Pick<EventListItem, "workOrdersCount" | "incidentsCount" | "sponsorsCount">> = {
  "evt-1": { workOrdersCount: 45, incidentsCount: 0, sponsorsCount: 12 },
  "evt-2": { workOrdersCount: 28, incidentsCount: 0, sponsorsCount: 8 },
  "evt-3": { workOrdersCount: 52, incidentsCount: 3, sponsorsCount: 15 },
  "evt-4": { workOrdersCount: 20, incidentsCount: 1, sponsorsCount: 5 },
}

const initialEventAssignments: EventAssignmentsState = {
  "evt-1": { staffIds: ["st-1", "st-2", "st-4"], assetIds: ["as-1", "as-3", "as-5"] },
  "evt-2": { staffIds: ["st-2", "st-3"], assetIds: ["as-1", "as-4"] },
  "evt-3": { staffIds: ["st-1", "st-3", "st-5"], assetIds: ["as-2", "as-3", "as-5"] },
  "evt-4": { staffIds: ["st-5"], assetIds: ["as-4"] },
}

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

const initialEvents: EventListItem[] = mockEvents.map((event) => ({
  ...event,
  status: resolveEventStatus(event.startDate, event.endDate),
  workOrdersCount: eventMetricsById[event.id]?.workOrdersCount ?? 0,
  incidentsCount: eventMetricsById[event.id]?.incidentsCount ?? 0,
  sponsorsCount: eventMetricsById[event.id]?.sponsorsCount ?? 0,
  staffAssignedCount: initialEventAssignments[event.id]?.staffIds.length ?? 0,
  assetsAssignedCount: initialEventAssignments[event.id]?.assetIds.length ?? 0,
}))

export default function EventsPage() {
  const router = useRouter()
  const { currentOrg } = useAuth()
  const { toast } = useToast()
  const canEdit = true
  const [createOpen, setCreateOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventListItem | null>(null)
  const [assigningEvent, setAssigningEvent] = useState<EventListItem | null>(null)
  const [events, setEvents] = useState<EventListItem[]>(initialEvents)
  const [eventAssignments, setEventAssignments] = useState<EventAssignmentsState>(initialEventAssignments)
  const previewUrlsRef = useRef<string[]>([])

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const upcomingEvents = useMemo(
    () => events.filter((event) => event.status === "upcoming" || event.status === "live"),
    [events]
  )

  const pastEvents = useMemo(() => events.filter((event) => event.status === "past"), [events])

  const handleCreateEvent = (payload: CreateEventPayload) => {
    console.log("Create Event payload", { ...payload, imageFile: payload.imageFile })

    const createdAt = Date.now()
    const imageSource = payload.imageFile ? URL.createObjectURL(payload.imageFile) : payload.imageUrl
    if (payload.imageFile && imageSource) {
      previewUrlsRef.current.push(imageSource)
    }

    const nextEvent: EventListItem = {
      id: `evt-${createdAt}`,
      name: payload.name,
      code: payload.code,
      startDate: payload.startDate,
      endDate: payload.endDate,
      venue: payload.venue,
      status: resolveEventStatus(payload.startDate, payload.endDate),
      imageUrl: imageSource ?? undefined,
      imageKey: payload.imageFile
        ? `events/mock-${createdAt}-${payload.imageFile.name}`
        : (payload.imageKey ?? undefined),
      workOrdersCount: 0,
      incidentsCount: 0,
      sponsorsCount: 0,
      staffAssignedCount: 0,
      assetsAssignedCount: 0,
    }

    setEvents((prev) => [nextEvent, ...prev])
    setEventAssignments((prev) => ({
      ...prev,
      [nextEvent.id]: {
        staffIds: [],
        assetIds: [],
      },
    }))

    toast({
      title: "Event created",
      description: `${payload.name} was added to local mock data.`,
    })
  }

  const handleEditEvent = (payload: CreateEventPayload) => {
    if (!editingEvent) return

    console.log("Update Event payload", {
      ...payload,
      imageFile: payload.imageFile,
      clearedImage: Boolean(payload.clearedImage),
    })

    const updatedAt = Date.now()
    let imageSource = payload.imageUrl

    if (payload.imageFile) {
      imageSource = URL.createObjectURL(payload.imageFile)
      previewUrlsRef.current.push(imageSource)
    }

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
              imageUrl: payload.clearedImage ? undefined : (imageSource ?? undefined),
              imageKey: payload.clearedImage
                ? undefined
                : payload.imageFile
                  ? `events/mock-${updatedAt}-${payload.imageFile.name}`
                  : (payload.imageKey ?? event.imageKey),
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

  const handleSaveEventAssignments = (payload: { staffIds: string[]; assetIds: string[] }) => {
    if (!assigningEvent) return

    console.log("Update Event resource assignments", {
      eventId: assigningEvent.id,
      staffIds: payload.staffIds,
      assetIds: payload.assetIds,
    })

    setEventAssignments((prev) => ({
      ...prev,
      [assigningEvent.id]: {
        staffIds: payload.staffIds,
        assetIds: payload.assetIds,
      },
    }))

    setEvents((prev) =>
      prev.map((event) =>
        event.id === assigningEvent.id
          ? {
              ...event,
              staffAssignedCount: payload.staffIds.length,
              assetsAssignedCount: payload.assetIds.length,
            }
          : event
      )
    )

    toast({
      title: "Resources assigned",
      description: `${payload.staffIds.length} staff and ${payload.assetIds.length} assets assigned to ${assigningEvent.name}.`,
    })
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Events</h1>
            <p className="mt-1 text-gray-500">Manage and view all your events</p>
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
          <TabsList className="border border-[#2B2B30] bg-[#1A1A1F]">
            <TabsTrigger
              value="upcoming"
              className="text-gray-300 data-[state=active]:bg-[#2B2B30] data-[state=active]:text-white"
            >
              Upcoming / Active ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="text-gray-300 data-[state=active]:bg-[#2B2B30] data-[state=active]:text-white"
            >
              Past ({pastEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  canEdit={canEdit}
                  onOpen={() => router.push(`/events/${event.id}`)}
                  onEdit={() => setEditingEvent(event)}
                  onManageAssignments={() => setAssigningEvent(event)}
                />
              ))}
            </div>
            {upcomingEvents.length === 0 && (
              <div className="py-12 text-center text-gray-500">No upcoming events</div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {pastEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  canEdit={canEdit}
                  onOpen={() => router.push(`/events/${event.id}`)}
                  onEdit={() => setEditingEvent(event)}
                  onManageAssignments={() => setAssigningEvent(event)}
                />
              ))}
            </div>
            {pastEvents.length === 0 && <div className="py-12 text-center text-gray-500">No past events</div>}
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
                imageUrl: editingEvent.imageUrl,
                imageKey: editingEvent.imageKey,
              }
            : undefined
        }
        onCreate={handleEditEvent}
      />

      <EventResourcesDialog
        open={assigningEvent !== null}
        onOpenChange={(open) => {
          if (!open) setAssigningEvent(null)
        }}
        eventName={assigningEvent?.name}
        staffOptions={mockStaff}
        assetOptions={mockAssets}
        initialStaffIds={assigningEvent ? eventAssignments[assigningEvent.id]?.staffIds ?? [] : []}
        initialAssetIds={assigningEvent ? eventAssignments[assigningEvent.id]?.assetIds ?? [] : []}
        onSave={handleSaveEventAssignments}
      />
    </Layout>
  )
}
