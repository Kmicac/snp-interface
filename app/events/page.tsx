"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import Layout from "@/components/kokonutui/layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { EventCard } from "@/components/events/event-card"
import { CreateEventDialog, type CreateEventPayload } from "@/components/events/create-event-dialog"
import { EventResourcesDialog } from "@/components/events/event-resources-dialog"
import { apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/config"
import { uploadImage } from "@/lib/api/upload-image"
import { useAuth } from "@/lib/context/auth-context"
import { invalidateQueryKeys } from "@/lib/data/query-invalidation"
import { queryKeys } from "@/lib/data/query-keys"
import { useToast } from "@/hooks/use-toast"
import type { Event } from "@/lib/types"

type EventListItem = Event & {
  workOrdersCount: number
  incidentsCount: number
  sponsorsCount: number
  staffAssignedCount: number
  assetsAssignedCount: number
}

interface EventApiResponse {
  id: string
  code: string
  name: string
  description: string | null
  startDate: string | null
  endDate: string | null
  venue: string | null
  status: Event["status"]
  imageUrl: string | null
  imageKey: string | null
  workOrdersCount: number
  incidentsCount: number
  sponsorsCount: number
  staffAssignedCount: number
  assetsAssignedCount: number
}

interface EventResourcesResponse {
  staffIds: string[]
  assetIds: string[]
}

interface StaffOptionResponse {
  id: string
  fullName: string
  email?: string | null
}

interface AssetOptionResponse {
  id: string
  name: string
  categoryId?: string | null
  location?: string | null
}

function mapEvent(source: EventApiResponse): EventListItem {
  const startDate = source.startDate ?? ""
  const endDate = source.endDate ?? source.startDate ?? ""

  return {
    id: source.id,
    code: source.code,
    name: source.name,
    description: source.description ?? undefined,
    startDate,
    endDate,
    venue: source.venue ?? "Venue not set",
    status: source.status,
    imageUrl: source.imageUrl ?? undefined,
    imageKey: source.imageKey ?? undefined,
    workOrdersCount: source.workOrdersCount,
    incidentsCount: source.incidentsCount,
    sponsorsCount: source.sponsorsCount,
    staffAssignedCount: source.staffAssignedCount,
    assetsAssignedCount: source.assetsAssignedCount,
  }
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
  const router = useRouter()
  const { currentOrg } = useAuth()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [events, setEvents] = useState<EventListItem[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventListItem | null>(null)
  const [assigningEvent, setAssigningEvent] = useState<EventListItem | null>(null)
  const [isSavingEvent, setIsSavingEvent] = useState(false)
  const [isSavingResources, setIsSavingResources] = useState(false)
  const [staffOptions, setStaffOptions] = useState<Array<{ id: string; name: string; email?: string | null }>>([])
  const [assetOptions, setAssetOptions] = useState<Array<{ id: string; name: string; categoryName?: string | null; location?: string | null }>>([])
  const [resourceSelection, setResourceSelection] = useState<{ staffIds: string[]; assetIds: string[] }>({
    staffIds: [],
    assetIds: [],
  })

  const loadEvents = useCallback(async () => {
    if (!currentOrg?.id) {
      setEvents([])
      setErrorMessage(null)
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    try {
      const response = await apiClient.get<EventApiResponse[]>(API_ENDPOINTS.events(currentOrg.id))
      setEvents(response.map(mapEvent))
    } catch (error) {
      setEvents([])
      const message = error instanceof Error ? error.message : "No fue posible cargar eventos."
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrg?.id])

  const loadResourceOptions = useCallback(async () => {
    if (!currentOrg?.id) {
      setStaffOptions([])
      setAssetOptions([])
      return
    }

    try {
      const [staffResponse, assetsResponse] = await Promise.all([
        apiClient.get<StaffOptionResponse[]>(API_ENDPOINTS.staff(currentOrg.id)),
        apiClient.get<AssetOptionResponse[]>(API_ENDPOINTS.assets(currentOrg.id)),
      ])

      setStaffOptions(
        staffResponse.map((staff) => ({
          id: staff.id,
          name: staff.fullName,
          email: staff.email ?? null,
        }))
      )

      setAssetOptions(
        assetsResponse.map((asset) => ({
          id: asset.id,
          name: asset.name,
          categoryName: asset.categoryId ?? null,
          location: asset.location ?? null,
        }))
      )
    } catch {
      setStaffOptions([])
      setAssetOptions([])
    }
  }, [currentOrg?.id])

  useEffect(() => {
    void loadEvents()
    void loadResourceOptions()
  }, [loadEvents, loadResourceOptions])

  useEffect(() => {
    if (!assigningEvent || !currentOrg?.id) {
      setResourceSelection({ staffIds: [], assetIds: [] })
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const response = await apiClient.get<EventResourcesResponse>(
          API_ENDPOINTS.eventResources(currentOrg.id, assigningEvent.id)
        )
        if (!cancelled) {
          setResourceSelection({
            staffIds: response.staffIds ?? [],
            assetIds: response.assetIds ?? [],
          })
        }
      } catch {
        if (!cancelled) {
          setResourceSelection({ staffIds: [], assetIds: [] })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [assigningEvent, currentOrg?.id])

  const upcomingEvents = useMemo(
    () => events.filter((event) => event.status === "PLANNED" || event.status === "IN_PROGRESS"),
    [events]
  )

  const pastEvents = useMemo(() => events.filter((event) => event.status === "COMPLETED"), [events])

  const handleCreateEvent = async (payload: CreateEventPayload) => {
    if (!currentOrg?.id) return false

    setIsSavingEvent(true)
    try {
      let imageUrl = payload.imageUrl
      let imageKey = payload.imageKey

      if (payload.imageFile) {
        const upload = await uploadImage({
          orgId: currentOrg.id,
          file: payload.imageFile,
          folder: `orgs/${currentOrg.id}/events`,
          entityId: payload.code,
        })
        imageUrl = upload.url
        imageKey = upload.key
      }

      await apiClient.post<EventApiResponse>(API_ENDPOINTS.events(currentOrg.id), {
        code: payload.code,
        name: payload.name,
        startDate: payload.startDate,
        endDate: payload.endDate,
        venue: payload.venue,
        imageUrl,
        imageKey,
      })

      invalidateQueryKeys(queryKeys.events(currentOrg.id))
      await loadEvents()
      toast({
        title: "Event created",
        description: `${payload.name} created successfully.`,
      })
      return true
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not create event.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSavingEvent(false)
    }
  }

  const handleEditEvent = async (payload: CreateEventPayload) => {
    if (!editingEvent || !currentOrg?.id) return false

    setIsSavingEvent(true)
    try {
      let imageUrl: string | null | undefined = payload.imageUrl
      let imageKey: string | null | undefined = payload.imageKey

      if (payload.clearedImage) {
        imageUrl = null
        imageKey = null
      }

      if (payload.imageFile) {
        const upload = await uploadImage({
          orgId: currentOrg.id,
          file: payload.imageFile,
          folder: `orgs/${currentOrg.id}/events`,
          entityId: editingEvent.id,
        })
        imageUrl = upload.url
        imageKey = upload.key
      }

      await apiClient.patch<EventApiResponse>(API_ENDPOINTS.event(currentOrg.id, editingEvent.id), {
        name: payload.name,
        startDate: payload.startDate,
        endDate: payload.endDate,
        venue: payload.venue,
        imageUrl,
        imageKey,
      })

      invalidateQueryKeys(
        queryKeys.events(currentOrg.id),
        queryKeys.event(currentOrg.id, editingEvent.id),
      )
      setEditingEvent(null)
      await loadEvents()
      toast({
        title: "Event updated",
        description: `${payload.name} updated successfully.`,
      })
      return true
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not update event.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSavingEvent(false)
    }
  }

  const handleSaveEventAssignments = async (payload: { staffIds: string[]; assetIds: string[] }) => {
    if (!assigningEvent || !currentOrg?.id) return false

    setIsSavingResources(true)
    try {
      await apiClient.put<EventResourcesResponse>(
        API_ENDPOINTS.eventResources(currentOrg.id, assigningEvent.id),
        {
          staffIds: payload.staffIds,
          assetIds: payload.assetIds,
        }
      )

      invalidateQueryKeys(
        queryKeys.events(currentOrg.id),
        queryKeys.event(currentOrg.id, assigningEvent.id),
        queryKeys.eventResources(assigningEvent.id),
        queryKeys.zones(assigningEvent.id),
        queryKeys.assignments(assigningEvent.id),
        queryKeys.assets(currentOrg.id),
        queryKeys.staffMembers(currentOrg.id),
      )
      await loadEvents()
      toast({
        title: "Resources assigned",
        description: `${payload.staffIds.length} staff and ${payload.assetIds.length} assets assigned to ${assigningEvent.name}.`,
      })
      return true
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not update event resources.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSavingResources(false)
    }
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

        {isLoading ? (
          <div className="rounded-xl border border-[#1F1F23] bg-[#0F0F12] p-4 text-sm text-gray-300">Loading events...</div>
        ) : null}
        {errorMessage ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{errorMessage}</div>
        ) : null}

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
                  canEdit
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
                  canEdit
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
        isSubmitting={isSavingEvent}
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
        isSubmitting={isSavingEvent}
        onCreate={handleEditEvent}
      />

      <EventResourcesDialog
        open={assigningEvent !== null}
        onOpenChange={(open) => {
          if (!open) setAssigningEvent(null)
        }}
        eventName={assigningEvent?.name}
        staffOptions={staffOptions}
        assetOptions={assetOptions}
        initialStaffIds={resourceSelection.staffIds}
        initialAssetIds={resourceSelection.assetIds}
        isSubmitting={isSavingResources}
        onSave={handleSaveEventAssignments}
      />
    </Layout>
  )
}
