"use client"

import { useMemo, useState } from "react"
import Layout from "@/components/kokonutui/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ClipboardList,
  Search,
  Clock,
  AlertCircle,
  CheckCircle2,
  Timer,
  XCircle,
  Filter,
  Plus,
  Pencil,
} from "lucide-react"
import { mockWorkOrders } from "@/lib/mock-data"
import type { WorkOrderStatus, SlaStatus, WorkOrder } from "@/lib/types"
import { useAuth } from "@/lib/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  CreateWorkOrderDialog,
  type CreateWorkOrderPayload,
} from "@/components/work-orders/create-work-order-dialog"

const initialWorkOrders: WorkOrder[] = [
  ...mockWorkOrders,
  {
    id: "wo-6",
    code: "WO-006",
    title: "Scoreboards installation",
    provider: "TechEvents",
    category: "Electronics",
    zone: "TATAMI 1",
    status: "completed",
    slaStatus: "on_time",
    scheduledStart: "2025-03-15T05:00:00",
    scheduledEnd: "2025-03-15T06:30:00",
  },
  {
    id: "wo-7",
    code: "WO-007",
    title: "Catering setup - VIP area",
    provider: "EventCatering",
    category: "Hospitality",
    zone: "VIP",
    status: "scheduled",
    slaStatus: "on_time",
    scheduledStart: "2025-03-15T10:00:00",
    scheduledEnd: "2025-03-15T11:00:00",
  },
  {
    id: "wo-8",
    code: "WO-008",
    title: "Barrier setup - Main entrance",
    provider: "SecurePro",
    category: "Security",
    zone: "ENTRANCE",
    status: "in_progress",
    slaStatus: "at_risk",
    scheduledStart: "2025-03-15T06:00:00",
    scheduledEnd: "2025-03-15T07:30:00",
  },
]

const providerServices = [
  "Logistics - LogiEvents",
  "Security - SecurePro",
  "Cleaning - CleanMax",
  "Medical - MedTeam",
  "Hospitality - EventCatering",
  "Electronics - TechEvents",
]

const zones = ["TATAMI 1", "TATAMI 2", "TATAMI 3", "ENTRANCE", "VIP", "WARM-UP", "MEDICAL", "BACKSTAGE"]

const statusMap: Record<CreateWorkOrderPayload["status"], WorkOrderStatus> = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  DELAYED: "delayed",
  CANCELED: "cancelled",
}

const formStatusFromWorkOrder: Record<WorkOrderStatus, CreateWorkOrderPayload["status"]> = {
  scheduled: "SCHEDULED",
  in_progress: "IN_PROGRESS",
  completed: "COMPLETED",
  delayed: "DELAYED",
  cancelled: "CANCELED",
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

export default function WorkOrdersPage() {
  const { events, currentEvent } = useAuth()
  const { toast } = useToast()
  const canEdit = true

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null)
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(initialWorkOrders)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const categories = useMemo(
    () => [...new Set(workOrders.map((workOrder) => workOrder.category))],
    [workOrders]
  )

  const filteredWorkOrders = useMemo(
    () =>
      workOrders.filter((workOrder) => {
        const matchesStatus = statusFilter === "all" || workOrder.status === statusFilter
        const matchesCategory = categoryFilter === "all" || workOrder.category === categoryFilter
        const matchesSearch =
          searchQuery === "" ||
          workOrder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          workOrder.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          workOrder.provider.toLowerCase().includes(searchQuery.toLowerCase())

        return matchesStatus && matchesCategory && matchesSearch
      }),
    [workOrders, statusFilter, categoryFilter, searchQuery]
  )

  const handleCreateWorkOrder = (payload: CreateWorkOrderPayload) => {
    console.log("Create Work Order payload", payload)

    const [categoryPart, providerPart] = payload.providerService.split(" - ")

    const nextWorkOrder: WorkOrder = {
      id: `wo-${Date.now()}`,
      code: `WO-${String(workOrders.length + 1).padStart(3, "0")}`,
      title: payload.title,
      description: payload.description,
      provider: providerPart ?? payload.providerService,
      category: categoryPart ?? "General",
      zone: payload.zone ?? "UNASSIGNED",
      status: statusMap[payload.status],
      slaStatus: "on_time",
      scheduledStart: payload.scheduledStart,
      scheduledEnd: payload.scheduledEnd,
    }

    setWorkOrders((prev) => [nextWorkOrder, ...prev])

    toast({
      title: "Work order created",
      description: `${payload.title} was added to local mock data.`,
    })
  }

  const handleEditWorkOrder = (payload: CreateWorkOrderPayload) => {
    if (!editingWorkOrder) return

    console.log("Edit Work Order payload", payload)

    const [categoryPart, providerPart] = payload.providerService.split(" - ")

    setWorkOrders((prev) =>
      prev.map((workOrder) =>
        workOrder.id === editingWorkOrder.id
          ? {
              ...workOrder,
              title: payload.title,
              description: payload.description,
              provider: providerPart ?? payload.providerService,
              category: categoryPart ?? workOrder.category,
              zone: payload.zone ?? "UNASSIGNED",
              scheduledStart: payload.scheduledStart,
              scheduledEnd: payload.scheduledEnd,
              status: statusMap[payload.status],
            }
          : workOrder
      )
    )

    setEditingWorkOrder(null)
    toast({
      title: "Work order updated",
      description: `${payload.title} was updated in local mock data.`,
    })
  }

  const getStatusBadge = (status: WorkOrderStatus) => {
    const config = {
      scheduled: {
        className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        icon: Clock,
        label: "Scheduled",
      },
      in_progress: {
        className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        icon: Timer,
        label: "In Progress",
      },
      completed: {
        className: "bg-green-500/20 text-green-400 border-green-500/30",
        icon: CheckCircle2,
        label: "Completed",
      },
      delayed: {
        className: "bg-orange-500/20 text-orange-400 border-orange-500/30",
        icon: AlertCircle,
        label: "Delayed",
      },
      cancelled: {
        className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
        icon: XCircle,
        label: "Cancelled",
      },
    }

    const { className, icon: Icon, label } = config[status]
    return (
      <Badge className={`${className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    )
  }

  const getSlaIcon = (slaStatus: SlaStatus) => {
    switch (slaStatus) {
      case "on_time":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "at_risk":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case "breached":
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return null
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-6 h-6" />
              Work Orders
            </h1>
            <p className="text-gray-500 mt-1">Manage operations tasks for the current event</p>
            {!currentEvent && (
              <p className="mt-2 text-sm text-amber-400">Select an event to create work orders.</p>
            )}
          </div>
          <Button onClick={() => setIsCreateOpen(true)} disabled={events.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Create Work Order
          </Button>
        </div>

        <div className="bg-[#0F0F12] rounded-xl p-4 border border-[#1F1F23]">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search work orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1A1A1F] border-[#2B2B30] text-white placeholder:text-gray-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-[#1A1A1F] border-[#2B2B30] text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectItem value="all" className="text-white focus:bg-[#2B2B30] focus:text-white">
                    All Statuses
                  </SelectItem>
                  <SelectItem value="scheduled" className="text-white focus:bg-[#2B2B30] focus:text-white">
                    Scheduled
                  </SelectItem>
                  <SelectItem value="in_progress" className="text-white focus:bg-[#2B2B30] focus:text-white">
                    In Progress
                  </SelectItem>
                  <SelectItem value="completed" className="text-white focus:bg-[#2B2B30] focus:text-white">
                    Completed
                  </SelectItem>
                  <SelectItem value="delayed" className="text-white focus:bg-[#2B2B30] focus:text-white">
                    Delayed
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px] bg-[#1A1A1F] border-[#2B2B30] text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectItem value="all" className="text-white focus:bg-[#2B2B30] focus:text-white">
                    All Categories
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem
                      key={category}
                      value={category}
                      className="text-white focus:bg-[#2B2B30] focus:text-white"
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-[#0F0F12] rounded-xl border border-[#1F1F23] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b border-[#1F1F23] bg-[#1A1A1F]">
                  <th className="px-6 py-4 font-medium">Code</th>
                  <th className="px-6 py-4 font-medium">Title</th>
                  <th className="px-6 py-4 font-medium">Provider</th>
                  <th className="px-6 py-4 font-medium">Zone</th>
                  <th className="px-6 py-4 font-medium">Scheduled</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-center">SLA</th>
                  {canEdit && <th className="px-6 py-4 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredWorkOrders.map((workOrder) => (
                  <tr
                    key={workOrder.id}
                    className="border-b border-[#1F1F23] hover:bg-[#1A1A1F] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-white">{workOrder.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-200">{workOrder.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-sm text-gray-200">{workOrder.provider}</span>
                        <p className="text-xs text-gray-500">{workOrder.category}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{workOrder.zone}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="text-gray-300">
                          {new Date(workOrder.scheduledStart).toLocaleTimeString("es-CL", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-gray-500"> - </span>
                        <span className="text-gray-300">
                          {new Date(workOrder.scheduledEnd).toLocaleTimeString("es-CL", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(workOrder.status)}</td>
                    <td className="px-6 py-4 text-center">{getSlaIcon(workOrder.slaStatus)}</td>
                    {canEdit && (
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setEditingWorkOrder(workOrder)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredWorkOrders.length === 0 && (
            <div className="text-center py-12 text-gray-500">No work orders found</div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(["scheduled", "in_progress", "completed", "delayed", "cancelled"] as WorkOrderStatus[]).map(
            (status) => {
              const count = workOrders.filter((workOrder) => workOrder.status === status).length
              return (
                <div
                  key={status}
                  className="bg-[#0F0F12] rounded-lg p-4 border border-[#1F1F23] text-center"
                >
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-xs text-gray-500 capitalize mt-1">{status.replace("_", " ")}</p>
                </div>
              )
            }
          )}
        </div>
      </div>

      <CreateWorkOrderDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        events={events.map((event) => ({ id: event.id, name: event.name }))}
        selectedEventId={currentEvent?.id}
        providerServices={providerServices}
        zones={zones}
        onCreate={handleCreateWorkOrder}
      />
      <CreateWorkOrderDialog
        open={editingWorkOrder !== null}
        onOpenChange={(open) => {
          if (!open) setEditingWorkOrder(null)
        }}
        mode="edit"
        initialValues={
          editingWorkOrder
            ? {
                eventId: currentEvent?.id || events[0]?.id || "",
                providerService: `${editingWorkOrder.category} - ${editingWorkOrder.provider}`,
                zone: editingWorkOrder.zone === "UNASSIGNED" ? null : editingWorkOrder.zone,
                title: editingWorkOrder.title,
                description: editingWorkOrder.description || "",
                scheduledStart: toDateTimeInput(editingWorkOrder.scheduledStart),
                scheduledEnd: toDateTimeInput(editingWorkOrder.scheduledEnd),
                status: formStatusFromWorkOrder[editingWorkOrder.status],
              }
            : undefined
        }
        events={events.map((event) => ({ id: event.id, name: event.name }))}
        selectedEventId={currentEvent?.id}
        providerServices={providerServices}
        zones={zones}
        onCreate={handleEditWorkOrder}
      />
    </Layout>
  )
}
