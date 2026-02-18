"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
  ListTodo,
} from "lucide-react"
import type { WorkOrderStatus, SlaStatus } from "@/lib/types"
import { useAuth } from "@/lib/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useTasksBoard } from "@/lib/context/tasks-board-context"
import {
  CreateWorkOrderDialog,
  type CreateWorkOrderPayload,
} from "@/components/work-orders/create-work-order-dialog"
import { TaskDialog, type TaskDialogValues } from "@/components/tasks/task-dialog"
import {
  workOrdersClient,
  type ProviderServiceApiResponse,
  type WorkOrderApiResponse,
  type WorkOrderStatusApi,
} from "@/lib/api/modules/work-orders-client"
import { staffClient } from "@/lib/api/modules/staff-client"
import { invalidateQueryKeys, subscribeInvalidation } from "@/lib/data/query-invalidation"
import { queryKeys } from "@/lib/data/query-keys"

interface WorkOrderListItem {
  id: string
  title: string
  description?: string
  providerServiceId: string
  provider: string
  category: string
  zoneId: string | null
  zone: string
  status: WorkOrderStatus
  statusApi: WorkOrderStatusApi
  slaStatus: SlaStatus
  scheduledStart: string
  scheduledEnd: string
}

interface StaffAssigneeOption {
  id: string
  name: string
  avatarUrl?: string
}

const formStatusFromApi: Record<WorkOrderStatusApi, CreateWorkOrderPayload["status"]> = {
  SCHEDULED: "SCHEDULED",
  ACCEPTED: "SCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  DELAYED: "DELAYED",
  CANCELED: "CANCELED",
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

function mapStatus(status: WorkOrderStatusApi): WorkOrderStatus {
  switch (status) {
    case "IN_PROGRESS":
      return "in_progress"
    case "COMPLETED":
      return "completed"
    case "DELAYED":
      return "delayed"
    case "CANCELED":
      return "cancelled"
    case "ACCEPTED":
    case "SCHEDULED":
    default:
      return "scheduled"
  }
}

function mapSlaStatus(item: WorkOrderApiResponse): SlaStatus {
  if (item.status === "DELAYED") return "breached"
  if (typeof item.delayMinutes === "number" && item.delayMinutes > 0) return "breached"

  const scheduledEnd = item.scheduledEndAt ? new Date(item.scheduledEndAt).getTime() : null
  if (scheduledEnd && item.status !== "COMPLETED" && item.status !== "CANCELED") {
    const now = Date.now()
    if (now > scheduledEnd) return "breached"
    if (scheduledEnd - now <= 30 * 60 * 1000) return "at_risk"
  }

  return "on_time"
}

function mapWorkOrder(item: WorkOrderApiResponse): WorkOrderListItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? undefined,
    providerServiceId: item.providerServiceId,
    provider: item.providerService?.provider?.name ?? "Provider",
    category: item.providerService?.category ?? "OTHER",
    zoneId: item.zoneId,
    zone: item.zone?.name ?? "UNASSIGNED",
    status: mapStatus(item.status),
    statusApi: item.status,
    slaStatus: mapSlaStatus(item),
    scheduledStart: item.scheduledStartAt ?? "",
    scheduledEnd: item.scheduledEndAt ?? "",
  }
}

export default function WorkOrdersPage() {
  const { events, currentEvent, currentOrg } = useAuth()
  const { toast } = useToast()
  const { createTask } = useTasksBoard()
  const canEdit = true

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrderListItem | null>(null)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [taskPrefill, setTaskPrefill] = useState<Partial<TaskDialogValues> | undefined>(undefined)

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [workOrders, setWorkOrders] = useState<WorkOrderListItem[]>([])
  const [providerServices, setProviderServices] = useState<ProviderServiceApiResponse[]>([])
  const [zones, setZones] = useState<Array<{ id: string; name: string }>>([])
  const [assignees, setAssignees] = useState<StaffAssigneeOption[]>([])

  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const categories = useMemo(
    () => [...new Set(workOrders.map((workOrder) => workOrder.category))],
    [workOrders]
  )

  const providerServiceOptions = useMemo(
    () =>
      providerServices.map((service) => ({
        id: service.id,
        label: `${service.category} - ${service.provider?.name ?? "Provider"} - ${service.name}`,
      })),
    [providerServices]
  )

  const filteredWorkOrders = useMemo(
    () =>
      workOrders.filter((workOrder) => {
        const matchesStatus = statusFilter === "all" || workOrder.status === statusFilter
        const matchesCategory = categoryFilter === "all" || workOrder.category === categoryFilter
        const matchesSearch =
          searchQuery === "" ||
          workOrder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          workOrder.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          workOrder.provider.toLowerCase().includes(searchQuery.toLowerCase())

        return matchesStatus && matchesCategory && matchesSearch
      }),
    [workOrders, statusFilter, categoryFilter, searchQuery]
  )

  const loadData = useCallback(async () => {
    if (!currentOrg?.id || !currentEvent?.id) {
      setWorkOrders([])
      setProviderServices([])
      setZones([])
      setAssignees([])
      return
    }

    setIsLoading(true)

    try {
      const [workOrdersResponse, providerServicesResponse, zonesResponse, assignmentsResponse] = await Promise.all([
        workOrdersClient.list(currentOrg.id, currentEvent.id),
        workOrdersClient.listProviderServices(currentOrg.id, currentEvent.id),
        workOrdersClient.listZones(currentOrg.id, currentEvent.id),
        staffClient.listAssignments(currentOrg.id, currentEvent.id),
      ])

      setWorkOrders(workOrdersResponse.map(mapWorkOrder))
      setProviderServices(providerServicesResponse)
      setZones(zonesResponse.map((zone) => ({ id: zone.id, name: zone.name })))

      const mappedAssignees = assignmentsResponse
        .map((assignment) => ({
          id: assignment.staffMemberId,
          name: assignment.staffMember?.fullName ?? assignment.staffMemberId,
        }))
        .filter((entry) => entry.id && entry.name)

      const uniqueAssignees = Array.from(new Map(mappedAssignees.map((entry) => [entry.id, entry])).values())
      setAssignees(uniqueAssignees)
    } catch (error) {
      setWorkOrders([])
      setProviderServices([])
      setZones([])
      setAssignees([])
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No fue posible cargar work orders.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentEvent?.id, currentOrg?.id, toast])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (!currentOrg?.id || !currentEvent?.id) return

    const keys = [
      queryKeys.workOrders(currentEvent.id),
      queryKeys.event(currentOrg.id, currentEvent.id),
      queryKeys.events(currentOrg.id),
      queryKeys.eventResources(currentEvent.id),
      queryKeys.zones(currentEvent.id),
      queryKeys.tasks(currentOrg.id),
      queryKeys.assignments(currentEvent.id),
    ] as Array<readonly unknown[]>

    return subscribeInvalidation(keys, () => {
      void loadData()
    })
  }, [currentEvent?.id, currentOrg?.id, loadData])

  const handleCreateWorkOrder = async (payload: CreateWorkOrderPayload) => {
    if (!currentOrg?.id || !currentEvent?.id) return

    setIsSaving(true)
    try {
      const created = await workOrdersClient.create(currentOrg.id, currentEvent.id, payload.providerServiceId, {
        title: payload.title,
        description: payload.description,
        zoneId: payload.zoneId ?? undefined,
        scheduledStartAt: payload.scheduledStart,
        scheduledEndAt: payload.scheduledEnd,
      })

      if (payload.status !== "SCHEDULED") {
        await workOrdersClient.updateStatus(currentOrg.id, currentEvent.id, created.id, payload.status)
      }

      invalidateQueryKeys(
        queryKeys.workOrders(currentEvent.id),
        queryKeys.event(currentOrg.id, currentEvent.id),
        queryKeys.events(currentOrg.id),
      )

      toast({
        title: "Work order created",
        description: `${payload.title} creada correctamente.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No fue posible crear work order.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditWorkOrder = async (payload: CreateWorkOrderPayload) => {
    if (!currentOrg?.id || !currentEvent?.id || !editingWorkOrder) return

    setIsSaving(true)
    try {
      await workOrdersClient.update(currentOrg.id, currentEvent.id, editingWorkOrder.id, {
        title: payload.title,
        description: payload.description,
        zoneId: payload.zoneId,
        providerServiceId: payload.providerServiceId,
        scheduledStartAt: payload.scheduledStart,
        scheduledEndAt: payload.scheduledEnd,
      })

      const nextStatus = payload.status
      if (nextStatus !== formStatusFromApi[editingWorkOrder.statusApi]) {
        await workOrdersClient.updateStatus(currentOrg.id, currentEvent.id, editingWorkOrder.id, nextStatus)
      }

      setEditingWorkOrder(null)

      invalidateQueryKeys(
        queryKeys.workOrders(currentEvent.id),
        queryKeys.workOrder(editingWorkOrder.id),
        queryKeys.event(currentOrg.id, currentEvent.id),
      )

      toast({
        title: "Work order updated",
        description: `${payload.title} actualizada correctamente.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No fue posible actualizar work order.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateTaskFromWorkOrder = (workOrder: WorkOrderListItem) => {
    const contextPayload: Partial<TaskDialogValues> = {
      title: `Follow up: ${workOrder.title}`,
      description: workOrder.description,
      status: "TODO",
      priority: workOrder.status === "delayed" ? "HIGH" : "MEDIUM",
      type: "WORK_ORDER",
      eventId: currentEvent?.id ?? events[0]?.id ?? null,
      relatedWorkOrderId: workOrder.id,
      relatedLabel: `${workOrder.provider} - ${workOrder.title}`,
    }

    setTaskPrefill(contextPayload)
    setIsTaskDialogOpen(true)
  }

  const handleSubmitTask = async (payload: TaskDialogValues) => {
    try {
      const eventId = payload.eventId ?? currentEvent?.id ?? null
      const createdTask = await createTask({
        ...payload,
        orgId: currentOrg?.id,
        eventId,
      })

      if (currentOrg?.id && eventId) {
        invalidateQueryKeys(
          queryKeys.tasks(currentOrg.id),
          queryKeys.task(createdTask.id),
          queryKeys.workOrders(eventId),
          queryKeys.event(currentOrg.id, eventId),
        )
      }

      toast({
        title: "Task created",
        description: "Task guardada correctamente.",
      })
      setTaskPrefill(undefined)
      return true
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No fue posible crear task.",
        variant: "destructive",
      })
      return false
    }
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
          <Button
            onClick={() => setIsCreateOpen(true)}
            disabled={events.length === 0 || providerServiceOptions.length === 0 || isSaving}
          >
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
                  <SelectItem value="cancelled" className="text-white focus:bg-[#2B2B30] focus:text-white">
                    Cancelled
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[170px] bg-[#1A1A1F] border-[#2B2B30] text-white">
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
                  <th className="px-6 py-4 font-medium">ID</th>
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
                {!isLoading &&
                  filteredWorkOrders.map((workOrder) => (
                    <tr
                      key={workOrder.id}
                      className="border-b border-[#1F1F23] hover:bg-[#1A1A1F] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-white">{workOrder.id.slice(0, 12)}</span>
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
                          {workOrder.scheduledStart && workOrder.scheduledEnd ? (
                            <>
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
                            </>
                          ) : (
                            <span className="text-gray-500">Not scheduled</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(workOrder.status)}</td>
                      <td className="px-6 py-4 text-center">{getSlaIcon(workOrder.slaStatus)}</td>
                      {canEdit && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleCreateTaskFromWorkOrder(workOrder)}>
                              <ListTodo className="mr-2 h-3.5 w-3.5" />
                              Create task
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditingWorkOrder(workOrder)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {isLoading && <div className="text-center py-12 text-gray-500">Loading work orders...</div>}
          {!isLoading && filteredWorkOrders.length === 0 && (
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
        providerServices={providerServiceOptions}
        zones={zones}
        onCreate={(payload) => {
          void handleCreateWorkOrder(payload)
        }}
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
                providerServiceId: editingWorkOrder.providerServiceId,
                zoneId: editingWorkOrder.zoneId,
                title: editingWorkOrder.title,
                description: editingWorkOrder.description || "",
                scheduledStart: toDateTimeInput(editingWorkOrder.scheduledStart),
                scheduledEnd: toDateTimeInput(editingWorkOrder.scheduledEnd),
                status: formStatusFromApi[editingWorkOrder.statusApi],
              }
            : undefined
        }
        events={events.map((event) => ({ id: event.id, name: event.name }))}
        selectedEventId={currentEvent?.id}
        providerServices={providerServiceOptions}
        zones={zones}
        onCreate={(payload) => {
          void handleEditWorkOrder(payload)
        }}
      />
      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={(open) => {
          setIsTaskDialogOpen(open)
          if (!open) setTaskPrefill(undefined)
        }}
        mode="create"
        initialValues={taskPrefill}
        events={events.map((event) => ({ id: event.id, name: event.name }))}
        assignees={assignees}
        onSubmit={handleSubmitTask}
      />
    </Layout>
  )
}
