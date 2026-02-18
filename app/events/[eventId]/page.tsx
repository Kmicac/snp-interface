"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Calendar, MapPin, Package, Users2 } from "lucide-react"

import Layout from "@/components/kokonutui/layout"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/config"
import { useAuth } from "@/lib/context/auth-context"
import { subscribeInvalidation } from "@/lib/data/query-invalidation"
import { queryKeys } from "@/lib/data/query-keys"
import type { Event } from "@/lib/types"

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

interface StaffResponse {
  id: string
  fullName: string
  email?: string | null
}

interface AssetResponse {
  id: string
  name: string
  assetTag?: string | null
  location?: string | null
}

function getStatusBadge(status: Event["status"]) {
  switch (status) {
    case "IN_PROGRESS":
      return <Badge className="border-green-500/30 bg-green-500/20 text-green-300">IN_PROGRESS</Badge>
    case "COMPLETED":
      return <Badge className="border-slate-500/30 bg-slate-500/20 text-slate-300">COMPLETED</Badge>
    default:
      return <Badge className="border-blue-500/30 bg-blue-500/20 text-blue-300">PLANNED</Badge>
  }
}

export default function EventDetailPage() {
  const params = useParams<{ eventId: string }>()
  const eventId = params?.eventId
  const { currentOrg } = useAuth()

  const [event, setEvent] = useState<EventApiResponse | null>(null)
  const [resources, setResources] = useState<EventResourcesResponse>({ staffIds: [], assetIds: [] })
  const [staff, setStaff] = useState<StaffResponse[]>([])
  const [assets, setAssets] = useState<AssetResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!currentOrg?.id || !eventId) {
      setEvent(null)
      setResources({ staffIds: [], assetIds: [] })
      return
    }

    let cancelled = false
    setIsLoading(true)
    setErrorMessage(null)

    void (async () => {
      try {
        const [eventResponse, resourcesResponse, staffResponse, assetsResponse] = await Promise.all([
          apiClient.get<EventApiResponse>(API_ENDPOINTS.event(currentOrg.id, eventId)),
          apiClient.get<EventResourcesResponse>(API_ENDPOINTS.eventResources(currentOrg.id, eventId)),
          apiClient.get<StaffResponse[]>(API_ENDPOINTS.staff(currentOrg.id)),
          apiClient.get<AssetResponse[]>(API_ENDPOINTS.assets(currentOrg.id)),
        ])

        if (cancelled) return
        setEvent(eventResponse)
        setResources({
          staffIds: resourcesResponse.staffIds ?? [],
          assetIds: resourcesResponse.assetIds ?? [],
        })
        setStaff(staffResponse)
        setAssets(assetsResponse)
      } catch (error) {
        if (!cancelled) {
          setEvent(null)
          setResources({ staffIds: [], assetIds: [] })
          setStaff([])
          setAssets([])
          setErrorMessage(error instanceof Error ? error.message : "Could not load event.")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [currentOrg?.id, eventId])

  useEffect(() => {
    if (!currentOrg?.id || !eventId) return

    const keys = [
      queryKeys.events(currentOrg.id),
      queryKeys.event(currentOrg.id, eventId),
      queryKeys.eventResources(eventId),
      queryKeys.zones(eventId),
      queryKeys.workOrders(eventId),
      queryKeys.tasks(currentOrg.id),
      queryKeys.assignments(eventId),
      queryKeys.credentials(eventId),
      queryKeys.assets(currentOrg.id),
      queryKeys.staffMembers(currentOrg.id),
    ] as Array<readonly unknown[]>

    return subscribeInvalidation(keys, () => {
      setIsLoading(true)
      setErrorMessage(null)
      void (async () => {
        try {
          const [eventResponse, resourcesResponse, staffResponse, assetsResponse] = await Promise.all([
            apiClient.get<EventApiResponse>(API_ENDPOINTS.event(currentOrg.id, eventId)),
            apiClient.get<EventResourcesResponse>(API_ENDPOINTS.eventResources(currentOrg.id, eventId)),
            apiClient.get<StaffResponse[]>(API_ENDPOINTS.staff(currentOrg.id)),
            apiClient.get<AssetResponse[]>(API_ENDPOINTS.assets(currentOrg.id)),
          ])

          setEvent(eventResponse)
          setResources({
            staffIds: resourcesResponse.staffIds ?? [],
            assetIds: resourcesResponse.assetIds ?? [],
          })
          setStaff(staffResponse)
          setAssets(assetsResponse)
        } catch (error) {
          setEvent(null)
          setResources({ staffIds: [], assetIds: [] })
          setStaff([])
          setAssets([])
          setErrorMessage(error instanceof Error ? error.message : "Could not load event.")
        } finally {
          setIsLoading(false)
        }
      })()
    })
  }, [currentOrg?.id, eventId])

  const assignedStaff = useMemo(
    () => staff.filter((member) => resources.staffIds.includes(member.id)),
    [resources.staffIds, staff]
  )
  const assignedAssets = useMemo(
    () => assets.filter((asset) => resources.assetIds.includes(asset.id)),
    [assets, resources.assetIds]
  )

  if (!currentOrg) {
    return (
      <Layout>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          Select an organization to continue.
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Link href="/events">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </Link>

        {isLoading ? (
          <div className="rounded-xl border border-[#1F1F23] bg-[#0F0F12] p-4 text-sm text-gray-300">Loading event...</div>
        ) : null}
        {errorMessage ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{errorMessage}</div>
        ) : null}

        {event ? (
          <>
            <div className="overflow-hidden rounded-xl border border-[#1F1F23] bg-[#0F0F12]">
              <AspectRatio ratio={21 / 9}>
                {event.imageUrl ? (
                  <img src={event.imageUrl} alt={`${event.name} flyer`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#161923] via-[#12151F] to-[#0E1018] text-gray-400">
                    No flyer uploaded
                  </div>
                )}
              </AspectRatio>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{event.name}</h1>
                {getStatusBadge(event.status)}
              </div>
              <p className="mt-1 text-sm font-mono text-gray-500">{event.code}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    {event.startDate ? new Date(event.startDate).toLocaleString() : "No start date"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{event.venue || "Venue not set"}</span>
                </div>
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="border border-[#2B2B30] bg-[#1A1A1F]">
                <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:bg-[#2B2B30] data-[state=active]:text-white">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="resources" className="text-gray-300 data-[state=active]:bg-[#2B2B30] data-[state=active]:text-white">
                  Resources
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-[#1F1F23] bg-[#0F0F12] p-4">
                  <p className="text-sm text-gray-400">Description</p>
                  <p className="mt-2 text-sm text-gray-200">{event.description || "No description available."}</p>
                </div>
                <div className="rounded-xl border border-[#1F1F23] bg-[#0F0F12] p-4">
                  <p className="text-sm text-gray-400">Operational counters</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-gray-200">
                    <div className="rounded-md border border-[#2A2D35] bg-[#171A22] p-2">{event.workOrdersCount} work orders</div>
                    <div className="rounded-md border border-[#2A2D35] bg-[#171A22] p-2">{event.incidentsCount} incidents</div>
                    <div className="rounded-md border border-[#2A2D35] bg-[#171A22] p-2">{event.sponsorsCount} sponsors</div>
                    <div className="rounded-md border border-[#2A2D35] bg-[#171A22] p-2">{event.assetsAssignedCount} assets assigned</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="resources" className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-[#1F1F23] bg-[#0F0F12] p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm text-gray-300">
                    <Users2 className="h-4 w-4 text-blue-300" />
                    <span>{assignedStaff.length} staff assigned</span>
                  </div>
                  <div className="space-y-2">
                    {assignedStaff.length > 0 ? (
                      assignedStaff.map((member) => (
                        <div key={member.id} className="rounded-md border border-[#2A2D35] bg-[#171A22] px-3 py-2 text-sm text-gray-200">
                          <div>{member.fullName}</div>
                          {member.email ? <div className="text-xs text-gray-400">{member.email}</div> : null}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-md border border-dashed border-[#2A2D35] bg-[#151821] p-3 text-xs text-gray-400">
                        No staff assigned.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-[#1F1F23] bg-[#0F0F12] p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm text-gray-300">
                    <Package className="h-4 w-4 text-emerald-300" />
                    <span>{assignedAssets.length} assets assigned</span>
                  </div>
                  <div className="space-y-2">
                    {assignedAssets.length > 0 ? (
                      assignedAssets.map((asset) => (
                        <div key={asset.id} className="rounded-md border border-[#2A2D35] bg-[#171A22] px-3 py-2 text-sm text-gray-200">
                          <div>{asset.name}</div>
                          <div className="text-xs text-gray-400">
                            {asset.assetTag || asset.id} - {asset.location || "No location"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-md border border-dashed border-[#2A2D35] bg-[#151821] p-3 text-xs text-gray-400">
                        No assets assigned.
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </div>
    </Layout>
  )
}
