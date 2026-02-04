"use client"

import Layout from "@/components/kokonutui/layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  MapPin,
  ArrowLeft,
  ClipboardList,
  AlertTriangle,
  Users2,
  Trophy,
  Package,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import EventOverviewCard from "@/components/dashboard/event-overview-card"
import WorkOrdersTable from "@/components/dashboard/work-orders-table"
import IncidentsCard from "@/components/dashboard/incidents-card"
import SponsorsCard from "@/components/dashboard/sponsors-card"
import StaffSummaryCard from "@/components/dashboard/staff-summary-card"
import InventoryAlertsCard from "@/components/dashboard/inventory-alerts-card"

// Mock event data
const mockEvent = {
  id: "evt-1",
  name: "ADCC LATAM 2025",
  code: "ADCC_LATAM_2025",
  startDate: "2025-03-15",
  endDate: "2025-03-16",
  venue: "Movistar Arena, Santiago",
  status: "upcoming" as const,
  description: "The largest ADCC event in Latin America featuring top grapplers from across the region.",
}

export default function EventDetailPage() {
  const params = useParams()
  const eventId = params.eventId as string
  const event = mockEvent // In production, fetch by eventId

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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link href="/events">
              <Button variant="ghost" size="sm" className="mb-2 text-gray-400 hover:text-white bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Events
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{event.name}</h1>
              {getStatusBadge(event.status)}
            </div>
            <p className="text-sm text-gray-500 font-mono mt-1">{event.code}</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(event.startDate).toLocaleDateString("es-CL", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <MapPin className="w-4 h-4" />
                <span>{event.venue}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-[#1A1A1F] border border-[#2B2B30]">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#2B2B30] text-gray-300 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="work-orders" className="data-[state=active]:bg-[#2B2B30] text-gray-300 data-[state=active]:text-white">
              <ClipboardList className="w-4 h-4 mr-2" />
              Work Orders
            </TabsTrigger>
            <TabsTrigger value="staff" className="data-[state=active]:bg-[#2B2B30] text-gray-300 data-[state=active]:text-white">
              <Users2 className="w-4 h-4 mr-2" />
              Staff
            </TabsTrigger>
            <TabsTrigger value="incidents" className="data-[state=active]:bg-[#2B2B30] text-gray-300 data-[state=active]:text-white">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Incidents
            </TabsTrigger>
            <TabsTrigger value="sponsors" className="data-[state=active]:bg-[#2B2B30] text-gray-300 data-[state=active]:text-white">
              <Trophy className="w-4 h-4 mr-2" />
              Sponsors
            </TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-[#2B2B30] text-gray-300 data-[state=active]:text-white">
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EventOverviewCard />
              <StaffSummaryCard />
            </div>
          </TabsContent>

          <TabsContent value="work-orders" className="mt-6">
            <WorkOrdersTable />
          </TabsContent>

          <TabsContent value="staff" className="mt-6">
            <StaffSummaryCard />
          </TabsContent>

          <TabsContent value="incidents" className="mt-6">
            <IncidentsCard />
          </TabsContent>

          <TabsContent value="sponsors" className="mt-6">
            <SponsorsCard />
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <InventoryAlertsCard />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}
