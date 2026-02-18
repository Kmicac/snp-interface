"use client"

import { Calendar, CalendarDays, MapPin, Package, Pencil, Users2 } from "lucide-react"
import Link from "next/link"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Event } from "@/lib/types"
import { cn } from "@/lib/utils"

interface EventCardData extends Event {
  workOrdersCount: number
  incidentsCount: number
  sponsorsCount: number
  staffAssignedCount: number
  assetsAssignedCount: number
}

interface EventCardProps {
  event: EventCardData
  canEdit?: boolean
  onOpen: () => void
  onEdit?: () => void
  onManageAssignments?: () => void
}

function formatEventDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Date unavailable"
  }

  const startText = start.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
  const endText = end.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
  if (startText === endText) return startText
  return `${startText} - ${endText}`
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

function getEventTypeBadge(event: Event) {
  const source = `${event.name} ${event.code}`.toLowerCase()

  if (source.includes("trial")) {
    return <Badge className="border-red-500/30 bg-red-500/20 text-red-300">Trials</Badge>
  }

  if (source.includes("open")) {
    return <Badge className="border-amber-500/30 bg-amber-500/20 text-amber-300">Open</Badge>
  }

  return null
}

function getCityLabel(venue: string) {
  const parts = venue.split(",").map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2) return parts[1]
  return parts[0] || "Unknown city"
}

export function EventCard({ event, canEdit = false, onOpen, onEdit, onManageAssignments }: EventCardProps) {
  const eventTypeBadge = getEventTypeBadge(event)
  const cityLabel = getCityLabel(event.venue || "Venue not set")

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(eventKey) => {
        if (eventKey.key === "Enter" || eventKey.key === " ") {
          eventKey.preventDefault()
          onOpen()
        }
      }}
      className={cn(
        "group overflow-hidden rounded-xl border border-[#1F1F23] bg-[#0F1015] text-white",
        "shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-all duration-150 ease-out",
        "hover:-translate-y-0.5 hover:scale-[1.01] hover:border-[#2E3139] hover:shadow-[0_10px_22px_rgba(0,0,0,0.45)]"
      )}
    >
      <AspectRatio ratio={16 / 9} className="overflow-hidden border-b border-[#1F1F23] bg-[#101216]">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={`${event.name} flyer`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#161923] via-[#12151F] to-[#0E1018]">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Calendar className="h-3.5 w-3.5" />
              No flyer uploaded
            </div>
          </div>
        )}

        <div className="absolute left-3 top-3 flex items-center gap-2">
          {getStatusBadge(event.status)}
          {eventTypeBadge}
        </div>

        {canEdit && (onEdit || onManageAssignments) ? (
          <div className="absolute right-2 top-2">
            <div className="flex items-center gap-1">
              {onManageAssignments ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-xs text-gray-200 hover:bg-black/45 hover:text-white"
                  onClick={(clickEvent) => {
                    clickEvent.preventDefault()
                    clickEvent.stopPropagation()
                    onManageAssignments()
                  }}
                >
                  Assign
                </Button>
              ) : null}
              {onEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-xs text-gray-200 hover:bg-black/45 hover:text-white"
                  onClick={(clickEvent) => {
                    clickEvent.preventDefault()
                    clickEvent.stopPropagation()
                    onEdit()
                  }}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </AspectRatio>

      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <h3 className="truncate text-base font-semibold text-white lg:text-sm">{event.name}</h3>
          <p className="truncate text-xs text-gray-400">{event.venue}</p>
          <p className="truncate text-[11px] font-mono text-gray-500">{event.code}</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-300">
          <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
          <span>{formatEventDateRange(event.startDate, event.endDate)}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{event.workOrdersCount} work orders</span>
          <span>{event.incidentsCount} incidents</span>
          <span>{event.sponsorsCount} sponsors</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-300">
          <div className="inline-flex items-center gap-1 rounded-md border border-[#2A2D35] bg-[#171A22] px-2 py-1">
            <Users2 className="h-3.5 w-3.5 text-blue-300" />
            <span>{event.staffAssignedCount} staff</span>
          </div>
          <div className="inline-flex items-center gap-1 rounded-md border border-[#2A2D35] bg-[#171A22] px-2 py-1">
            <Package className="h-3.5 w-3.5 text-emerald-300" />
            <span>{event.assetsAssignedCount} assets</span>
          </div>
        </div>

        <div className="border-t border-[#1F1F23] pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-300">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              <span>{cityLabel}</span>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs text-gray-300 hover:bg-[#1C202B] hover:text-white"
              onClick={(clickEvent) => clickEvent.stopPropagation()}
            >
              <Link href={`/events/${event.id}`}>Open</Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
