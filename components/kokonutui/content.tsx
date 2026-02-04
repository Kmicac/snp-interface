import EventOverviewCard from "@/components/dashboard/event-overview-card"
import OperationsFeedCard from "@/components/dashboard/operations-feed-card"
import WorkOrdersTable from "@/components/dashboard/work-orders-table"
import IncidentsCard from "@/components/dashboard/incidents-card"
import SponsorsCard from "@/components/dashboard/sponsors-card"
import StaffSummaryCard from "@/components/dashboard/staff-summary-card"
import InventoryAlertsCard from "@/components/dashboard/inventory-alerts-card"

export default function DashboardContent() {
  return (
    <div className="space-y-6">
      {/* Row 1 - Event Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EventOverviewCard />
        <OperationsFeedCard />
      </div>

      {/* Row 2 - Work Orders & Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkOrdersTable />
        <IncidentsCard />
      </div>

      {/* Row 3 - Sponsors, Staff & Inventory */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SponsorsCard />
        <StaffSummaryCard />
        <InventoryAlertsCard />
      </div>
    </div>
  )
}
