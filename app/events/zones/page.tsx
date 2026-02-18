"use client"

import { useEffect, useState } from "react"
import { ClipboardList, LayoutGrid } from "lucide-react"

import Layout from "@/components/kokonutui/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/context/auth-context"
import { apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/config"
import { subscribeInvalidation } from "@/lib/data/query-invalidation"
import { queryKeys } from "@/lib/data/query-keys"

interface ZoneResponse {
  id: string
  name: string
  type?: string | null
}

type ZonesApiEnvelope =
  | ZoneResponse[]
  | {
      zones?: ZoneResponse[]
      items?: ZoneResponse[]
      data?: ZoneResponse[]
    }

function normalizeZonesResponse(payload: ZonesApiEnvelope): ZoneResponse[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.zones)) return payload.zones
  if (Array.isArray(payload.items)) return payload.items
  if (Array.isArray(payload.data)) return payload.data
  return []
}

export default function ZonesPage() {
  const { currentOrg, currentEvent } = useAuth()
  const [zones, setZones] = useState<ZoneResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    if (!currentOrg?.id || !currentEvent?.id) {
      setZones([])
      setErrorMessage(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setErrorMessage(null)

    void (async () => {
      try {
        const response = await apiClient.get<ZonesApiEnvelope>(
          API_ENDPOINTS.eventZones(currentOrg.id, currentEvent.id)
        )
        if (!cancelled) {
          setZones(normalizeZonesResponse(response))
        }
      } catch (error) {
        if (!cancelled) {
          setZones([])
          setErrorMessage(error instanceof Error ? error.message : "Could not load zones.")
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
  }, [currentEvent?.id, currentOrg?.id, reloadTick])

  useEffect(() => {
    if (!currentOrg?.id || !currentEvent?.id) return

    const keys = [
      queryKeys.events(currentOrg.id),
      queryKeys.event(currentOrg.id, currentEvent.id),
      queryKeys.zones(currentEvent.id),
      queryKeys.eventResources(currentEvent.id),
      queryKeys.workOrders(currentEvent.id),
      queryKeys.tasks(currentOrg.id),
    ] as Array<readonly unknown[]>

    return subscribeInvalidation(keys, () => {
      setReloadTick((value) => value + 1)
    })
  }, [currentEvent?.id, currentOrg?.id])

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <LayoutGrid className="h-6 w-6" />
            Zones & Layout
          </h1>
          <p className="mt-1 text-gray-500">Event zones loaded from backend data</p>
          <p className="mt-1 text-xs text-gray-600">
            {currentOrg?.name ? `Organization: ${currentOrg.name}` : "Organization: not selected"}{" "}
            {currentEvent?.name ? `| Event: ${currentEvent.name}` : "| Event: not selected"}
          </p>
        </div>

        {!currentOrg || !currentEvent ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
            Select an organization and event to view zones.
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-xl border border-[#1F1F23] bg-[#0F0F12] p-4 text-sm text-gray-300">Loading zones...</div>
        ) : null}

        {errorMessage ? (
          <div className="space-y-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <p>{errorMessage}</p>
            <Button size="sm" variant="outline" onClick={() => setReloadTick((value) => value + 1)}>
              Retry
            </Button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="rounded-xl border border-[#1F1F23] bg-[#0F0F12] p-6 transition-colors hover:border-[#2B2B30]"
            >
              <div className="mb-4 flex items-start justify-between">
                <h3 className="text-lg font-semibold text-white">{zone.name}</h3>
                <Badge className="border-[#2B2B30] bg-[#171A22] text-gray-200">{zone.type || "General"}</Badge>
              </div>

              <div className="flex items-center gap-2 border-t border-[#1F1F23] pt-4 text-sm">
                <ClipboardList className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">Zone ID: {zone.id}</span>
              </div>
            </div>
          ))}
        </div>

        {!isLoading && !errorMessage && zones.length === 0 && currentOrg && currentEvent ? (
          <div className="rounded-xl border border-dashed border-[#2A2C33] bg-[#13151A] p-4 text-sm text-gray-400">
            No zones configured for this event. Create zones from backend or select another event with zones.
          </div>
        ) : null}
      </div>
    </Layout>
  )
}
