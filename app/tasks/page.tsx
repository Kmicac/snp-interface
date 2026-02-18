"use client"

import { useEffect, useMemo, useState } from "react"
import { DndContext, type DragEndEvent, type DragOverEvent, type DragStartEvent, DragOverlay, PointerSensor, KeyboardSensor, closestCorners, useSensor, useSensors, type UniqueIdentifier } from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, Eye, Plus, SlidersHorizontal, SquareKanban } from "lucide-react"

import Layout from "@/components/kokonutui/layout"
import { TaskDialog, type TaskDialogValues } from "@/components/tasks/task-dialog"
import { TaskDetailsDialog } from "@/components/tasks/task-details-dialog"
import { TaskCard } from "@/components/tasks/task-card"
import { TaskColumn } from "@/components/tasks/task-column"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAuth } from "@/lib/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { uploadImage } from "@/lib/api/upload-image"
import { staffClient } from "@/lib/api/modules/staff-client"
import { useTasksBoard } from "@/lib/context/tasks-board-context"
import type { Task, TaskStatus, TaskType } from "@/lib/types"

const boardColumns: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: "Backlog" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "BLOCKED", label: "Blocked" },
  { status: "DONE", label: "Done" },
]

const TASK_FILTERS_STORAGE_KEY = "snp_tasks_filters_v1"

const statusFilterOptions: Array<{ value: TaskStatus; label: string }> = [
  { value: "TODO", label: "Planned" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "BLOCKED", label: "Under review" },
  { value: "DONE", label: "Done" },
]

const typeFilterOptions: Array<{ value: TaskType; label: string }> = [
  { value: "GENERAL", label: "Improvements" },
  { value: "WORK_ORDER", label: "Work order" },
  { value: "INCIDENT", label: "Incidents" },
  { value: "REFEREE", label: "Referees" },
  { value: "SPONSORSHIP", label: "Seminar" },
  { value: "INVENTORY", label: "Security" },
]

const labelFilterOptions = [
  { value: "improvements", label: "Improvements" },
  { value: "work-order", label: "Work order" },
  { value: "incidents", label: "Incidents" },
  { value: "training", label: "Training" },
  { value: "seminar", label: "Seminar" },
  { value: "referees", label: "Referees" },
  { value: "docs", label: "Docs" },
  { value: "security", label: "Security" },
  { value: "accessibility", label: "Accessibility" },
] as const

type TaskLabelFilter = (typeof labelFilterOptions)[number]["value"]
type FilterGroup = "status" | "type" | "labels"

function splitCsv(value: string | null): string[] {
  if (!value) return []
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function toCsv(values: string[]): string {
  return values.join(",")
}

function isTaskStatus(value: string): value is TaskStatus {
  return ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"].includes(value)
}

function isTaskType(value: string): value is TaskType {
  return ["GENERAL", "INCIDENT", "WORK_ORDER", "SPONSORSHIP", "REFEREE", "INVENTORY"].includes(value)
}

function isTaskLabelFilter(value: string): value is TaskLabelFilter {
  return labelFilterOptions.some((option) => option.value === value)
}

function toggleArrayValue<T extends string>(current: T[], value: T): T[] {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
}

function taskMatchesLabel(task: Task, label: TaskLabelFilter): boolean {
  const text = `${task.title} ${task.description || ""} ${task.relatedLabel || ""}`.toLowerCase()

  switch (label) {
    case "improvements":
      return task.type === "GENERAL" || text.includes("improvement")
    case "work-order":
      return task.type === "WORK_ORDER" || text.includes("work order")
    case "incidents":
      return task.type === "INCIDENT" || text.includes("incident")
    case "training":
      return text.includes("training")
    case "seminar":
      return text.includes("seminar")
    case "referees":
      return task.type === "REFEREE" || text.includes("referee")
    case "docs":
      return text.includes("doc")
    case "security":
      return task.type === "INVENTORY" || text.includes("security")
    case "accessibility":
      return text.includes("accessibility")
    default:
      return false
  }
}

export default function TasksPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { currentOrg, currentEvent, events } = useAuth()
  const { toast } = useToast()
  const { tasks, isLoading, errorMessage, createTask, updateTask, moveTask } = useTasksBoard()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [activeDropStatus, setActiveDropStatus] = useState<TaskStatus | null>(null)
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeFilterGroup, setActiveFilterGroup] = useState<FilterGroup | null>(null)

  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([])
  const [selectedTypes, setSelectedTypes] = useState<TaskType[]>([])
  const [selectedLabels, setSelectedLabels] = useState<TaskLabelFilter[]>([])
  const [filtersReady, setFiltersReady] = useState(false)
  const [assignees, setAssignees] = useState<Array<{ id: string; name: string; avatarUrl?: string }>>([])

  useEffect(() => {
    const queryStatuses = splitCsv(searchParams.get("status")).filter(isTaskStatus)
    const queryTypes = splitCsv(searchParams.get("types")).filter(isTaskType)
    const queryLabels = splitCsv(searchParams.get("labels")).filter(isTaskLabelFilter)
    const hasQuery = queryStatuses.length > 0 || queryTypes.length > 0 || queryLabels.length > 0

    if (hasQuery) {
      setSelectedStatuses(queryStatuses)
      setSelectedTypes(queryTypes)
      setSelectedLabels(queryLabels)
      setFiltersReady(true)
      return
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(TASK_FILTERS_STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as {
            statuses?: string[]
            types?: string[]
            labels?: string[]
          }
          setSelectedStatuses((parsed.statuses ?? []).filter(isTaskStatus))
          setSelectedTypes((parsed.types ?? []).filter(isTaskType))
          setSelectedLabels((parsed.labels ?? []).filter(isTaskLabelFilter))
        } catch {
          // Ignore invalid local cache.
        }
      }
    }

    setFiltersReady(true)
  }, [])

  useEffect(() => {
    if (!filtersReady) return

    const nextParams = new URLSearchParams(searchParams.toString())
    if (selectedStatuses.length > 0) {
      nextParams.set("status", toCsv(selectedStatuses))
    } else {
      nextParams.delete("status")
    }

    if (selectedTypes.length > 0) {
      nextParams.set("types", toCsv(selectedTypes))
    } else {
      nextParams.delete("types")
    }

    if (selectedLabels.length > 0) {
      nextParams.set("labels", toCsv(selectedLabels))
    } else {
      nextParams.delete("labels")
    }

    const nextQuery = nextParams.toString()
    const currentQuery = searchParams.toString()
    if (nextQuery !== currentQuery) {
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname
      router.replace(nextUrl, { scroll: false })
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(
        TASK_FILTERS_STORAGE_KEY,
        JSON.stringify({
          statuses: selectedStatuses,
          types: selectedTypes,
          labels: selectedLabels,
        })
      )
    }
  }, [filtersReady, pathname, router, searchParams, selectedLabels, selectedStatuses, selectedTypes])

  useEffect(() => {
    if (!currentOrg?.id || !currentEvent?.id) {
      setAssignees([])
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const response = await staffClient.listAssignments(currentOrg.id, currentEvent.id)
        if (cancelled) return

        const mapped = response
          .map((assignment) => ({
            id: assignment.staffMemberId,
            name: assignment.staffMember?.fullName ?? assignment.staffMemberId,
          }))
          .filter((entry) => entry.id && entry.name)

        setAssignees(Array.from(new Map(mapped.map((entry) => [entry.id, entry])).values()))
      } catch {
        if (!cancelled) {
          setAssignees([])
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [currentEvent?.id, currentOrg?.id])

  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const sameOrg = currentOrg ? task.orgId === currentOrg.id : true
        if (!sameOrg) return false
        if (!currentEvent) return true
        return task.eventId === currentEvent.id || !task.eventId
      }),
    [tasks, currentOrg, currentEvent]
  )

  const filteredTasks = useMemo(
    () =>
      visibleTasks.filter((task) => {
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(task.status)) return false
        if (selectedTypes.length > 0 && !selectedTypes.includes(task.type)) return false
        if (selectedLabels.length > 0 && !selectedLabels.some((label) => taskMatchesLabel(task, label))) return false
        return true
      }),
    [selectedLabels, selectedStatuses, selectedTypes, visibleTasks]
  )

  const tasksByStatus = useMemo(
    () =>
      boardColumns.reduce(
        (acc, column) => {
          acc[column.status] = filteredTasks
            .filter((task) => task.status === column.status)
            .sort((left, right) => {
              const leftPosition = typeof left.position === "number" ? left.position : Number.MAX_SAFE_INTEGER
              const rightPosition = typeof right.position === "number" ? right.position : Number.MAX_SAFE_INTEGER
              if (leftPosition !== rightPosition) return leftPosition - rightPosition
              return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
            })
          return acc
        },
        {} as Record<TaskStatus, Task[]>
      ),
    [filteredTasks]
  )

  const allVisibleTaskById = useMemo(() => new Map(visibleTasks.map((task) => [task.id, task])), [visibleTasks])
  const boardTaskById = useMemo(() => new Map(filteredTasks.map((task) => [task.id, task])), [filteredTasks])

  const statusByColumnId = useMemo(
    () =>
      Object.fromEntries(boardColumns.map((column) => [`column-${column.status}`, column.status])) as Record<
        string,
        TaskStatus
      >,
    []
  )

  const activeTask = useMemo(
    () => (activeTaskId ? boardTaskById.get(activeTaskId) ?? null : null),
    [activeTaskId, boardTaskById]
  )

  const selectedTaskLive = useMemo(
    () => (selectedTask ? allVisibleTaskById.get(selectedTask.id) ?? selectedTask : null),
    [selectedTask, allVisibleTaskById]
  )

  const selectedFiltersCount = selectedStatuses.length + selectedTypes.length + selectedLabels.length
  const selectedByGroup: Record<FilterGroup, number> = {
    status: selectedStatuses.length,
    type: selectedTypes.length,
    labels: selectedLabels.length,
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const getStatusFromDndId = (id: UniqueIdentifier | null | undefined): TaskStatus | null => {
    if (!id || typeof id !== "string") return null

    if (statusByColumnId[id]) {
      return statusByColumnId[id]
    }

    return boardTaskById.get(id)?.status ?? allVisibleTaskById.get(id)?.status ?? null
  }

  const handleDragStart = (event: DragStartEvent) => {
    const nextTaskId = String(event.active.id)
    const sourceStatus = getStatusFromDndId(event.active.id)
    setActiveTaskId(nextTaskId)
    setActiveDropStatus(sourceStatus)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const nextStatus = getStatusFromDndId(event.over?.id)
    setActiveDropStatus((current) => (current === nextStatus ? current : nextStatus))
  }

  const resetDragState = () => {
    setActiveTaskId(null)
    setActiveDropStatus(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const taskId = String(event.active.id)
    const overId = event.over?.id ? String(event.over.id) : null

    const sourceStatus =
      event.active.data.current?.status && typeof event.active.data.current.status === "string"
        ? (event.active.data.current.status as TaskStatus)
        : getStatusFromDndId(event.active.id)
    const destinationStatus = getStatusFromDndId(overId)
    const overTaskId = overId && boardTaskById.has(overId) ? overId : undefined

    if (sourceStatus && destinationStatus && (sourceStatus !== destinationStatus || (overTaskId && overTaskId !== taskId))) {
      void moveTask(taskId, destinationStatus, {
        source: "tasks_board_dnd",
        reason: "column_drop",
        overTaskId,
      }).catch((error) => {
        toast({
          title: "Could not move task",
          description: error instanceof Error ? error.message : "Try again.",
          variant: "destructive",
        })
      })
    }

    resetDragState()
  }

  const handleViewOnlyClick = () => {
    console.log("View only clicked")
  }

  const resolveTaskImage = async (payload: TaskDialogValues, entityId?: string) => {
    if (payload.clearImage) {
      return {
        imageUrl: null,
        imageKey: null,
      }
    }

    if (!payload.imageFile) {
      return {
        imageUrl: payload.imageUrl,
        imageKey: payload.imageKey,
      }
    }

    if (!currentOrg?.id) {
      throw new Error("Select an organization before uploading an image.")
    }

    const upload = await uploadImage({
      orgId: currentOrg.id,
      file: payload.imageFile,
      folder: `orgs/${currentOrg.id}/tasks`,
      entityId,
    })

    return {
      imageUrl: upload.url,
      imageKey: upload.key,
    }
  }

  const handleCreateTask = async (payload: TaskDialogValues): Promise<boolean> => {
    setIsFormSubmitting(true)
    try {
      const image = await resolveTaskImage(payload)
      const createdTask = await createTask({
        title: payload.title,
        description: payload.description,
        status: payload.status,
        priority: payload.priority,
        type: payload.type,
        assigneeId: payload.assigneeId,
        orgId: currentOrg?.id,
        eventId: payload.eventId ?? currentEvent?.id ?? null,
        relatedIncidentId: payload.relatedIncidentId,
        relatedWorkOrderId: payload.relatedWorkOrderId,
        relatedSponsorshipId: payload.relatedSponsorshipId,
        relatedLabel: payload.relatedLabel,
        dueDate: payload.dueDate,
        imageUrl: image.imageUrl,
        imageKey: image.imageKey,
      })

      toast({
        title: "Task created",
        description: `${createdTask.title} created successfully.`,
      })
      return true
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not create task.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsFormSubmitting(false)
    }
  }

  const handleUpdateTask = async (payload: TaskDialogValues): Promise<boolean> => {
    if (!editingTask) return false

    setIsFormSubmitting(true)
    try {
      const image = await resolveTaskImage(payload, editingTask.id)
      await updateTask(editingTask.id, {
        title: payload.title,
        description: payload.description,
        status: payload.status,
        priority: payload.priority,
        type: payload.type,
        assigneeId: payload.assigneeId,
        eventId: payload.eventId ?? null,
        relatedIncidentId: payload.relatedIncidentId,
        relatedWorkOrderId: payload.relatedWorkOrderId,
        relatedSponsorshipId: payload.relatedSponsorshipId,
        relatedLabel: payload.relatedLabel,
        dueDate: payload.dueDate,
        imageUrl: image.imageUrl,
        imageKey: image.imageKey,
      })

      toast({
        title: "Task updated",
        description: `${payload.title} updated successfully.`,
      })

      setEditingTask(null)
      return true
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not update task.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsFormSubmitting(false)
    }
  }

  return (
    <Layout>
      <div
        className="-m-4 flex h-[calc(100dvh-4rem)] min-h-[calc(100dvh-4rem)] flex-col overflow-hidden sm:-m-6"
        style={{
          backgroundColor: "#0B0D12",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.14) 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      >
        <div className="flex h-full min-h-0 flex-col border border-[#1F1F23] p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 border-b border-[#23252D] pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                <SquareKanban className="h-5 w-5 text-gray-300" />
                Tasks Board
              </h1>
              <p className="mt-1 text-sm text-gray-400">Kanban board for cross-module operational tracking.</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewOnlyClick}
                className="h-8 px-3 text-sm text-gray-300 hover:bg-[#1B1E25] hover:text-gray-100"
              >
                <Eye className="h-3.5 w-3.5" />
                View only
              </Button>

              <Popover
                open={isFilterOpen}
                onOpenChange={(open) => {
                  setIsFilterOpen(open)
                  if (!open) {
                    setActiveFilterGroup(null)
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="relative h-8 border-[#2C2F39] bg-[#14161D] px-3 text-sm text-gray-200 hover:bg-[#1B1E25]"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filter
                    {selectedFiltersCount > 0 ? (
                      <Badge className="ml-1 h-5 min-w-5 rounded-full border-[#38558A]/50 bg-[#38558A]/30 px-1.5 text-[11px] text-blue-200">
                        {selectedFiltersCount}
                      </Badge>
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 border-[#2C2F39] bg-[#14161D] p-3 text-gray-100">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {activeFilterGroup ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-sm font-medium text-gray-100 transition hover:text-white"
                          onClick={() => setActiveFilterGroup(null)}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          {activeFilterGroup === "status" ? "Status" : activeFilterGroup === "type" ? "Type" : "Labels"}
                        </button>
                      ) : (
                        <p className="text-sm font-medium text-gray-100">Filters</p>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-gray-400 hover:text-gray-100"
                        onClick={() => {
                          setSelectedStatuses([])
                          setSelectedTypes([])
                          setSelectedLabels([])
                        }}
                      >
                        Clear all
                      </Button>
                    </div>
                    {!activeFilterGroup ? (
                      <div className="space-y-1.5">
                        {(
                          [
                            { id: "status" as const, label: "Status" },
                            { id: "type" as const, label: "Type" },
                            { id: "labels" as const, label: "Labels" },
                          ] satisfies Array<{ id: FilterGroup; label: string }>
                        ).map((section) => (
                          <button
                            key={section.id}
                            type="button"
                            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition hover:bg-[#1B1E25]"
                            onClick={() => setActiveFilterGroup(section.id)}
                          >
                            <span className="text-sm text-gray-200">{section.label}</span>
                            <div className="flex items-center gap-2">
                              {selectedByGroup[section.id] > 0 ? (
                                <Badge className="h-5 min-w-5 rounded-full border-[#38558A]/50 bg-[#38558A]/30 px-1.5 text-[11px] text-blue-200">
                                  {selectedByGroup[section.id]}
                                </Badge>
                              ) : null}
                              <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {activeFilterGroup === "status" ? (
                      <div className="space-y-1.5">
                        {statusFilterOptions.map((option) => (
                          <label key={option.value} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#1B1E25]">
                            <Checkbox
                              checked={selectedStatuses.includes(option.value)}
                              onCheckedChange={() => setSelectedStatuses((prev) => toggleArrayValue(prev, option.value))}
                              className="border-[#3A4254] data-[state=checked]:bg-[#5A6A84]"
                            />
                            <span className="text-sm text-gray-200">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    ) : null}

                    {activeFilterGroup === "type" ? (
                      <div className="space-y-1.5">
                        {typeFilterOptions.map((option) => (
                          <label key={option.value} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#1B1E25]">
                            <Checkbox
                              checked={selectedTypes.includes(option.value)}
                              onCheckedChange={() => setSelectedTypes((prev) => toggleArrayValue(prev, option.value))}
                              className="border-[#3A4254] data-[state=checked]:bg-[#5A6A84]"
                            />
                            <span className="text-sm text-gray-200">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    ) : null}

                    {activeFilterGroup === "labels" ? (
                      <div className="space-y-1.5">
                        {labelFilterOptions.map((option) => (
                          <label key={option.value} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#1B1E25]">
                            <Checkbox
                              checked={selectedLabels.includes(option.value)}
                              onCheckedChange={() => setSelectedLabels((prev) => toggleArrayValue(prev, option.value))}
                              className="border-[#3A4254] data-[state=checked]:bg-[#5A6A84]"
                            />
                            <span className="text-sm text-gray-200">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="default"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="h-8 px-3 text-sm"
                disabled={!currentOrg}
              >
                <Plus className="h-3.5 w-3.5" />
                New Task
              </Button>
            </div>
          </div>

          {isLoading && tasks.length === 0 ? (
            <div className="mb-3 rounded-md border border-[#2A2E3A] bg-[#131722] px-3 py-2 text-xs text-gray-300">
              Loading tasks...
            </div>
          ) : null}
          {errorMessage ? (
            <div className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {errorMessage}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragCancel={resetDragState}
              onDragEnd={handleDragEnd}
            >
              <div className="flex h-full min-h-0 min-w-max gap-3.5 pb-1 pr-2">
                {boardColumns.map((column) => (
                  <TaskColumn
                    key={column.status}
                    status={column.status}
                    title={column.label}
                    count={tasksByStatus[column.status]?.length ?? 0}
                    tasks={tasksByStatus[column.status] ?? []}
                    activeDropStatus={activeDropStatus}
                    onTaskClick={setSelectedTask}
                  />
                ))}
              </div>

              <DragOverlay>
                {activeTask ? (
                  <div className="w-[300px]">
                    <TaskCard task={activeTask} onClick={() => {}} isDragOverlay />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>

      <TaskDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        mode="create"
        initialValues={{
          status: "TODO",
          priority: "MEDIUM",
          type: "GENERAL",
          eventId: currentEvent?.id ?? null,
        }}
        events={events.map((event) => ({ id: event.id, name: event.name }))}
        assignees={assignees}
        isSubmitting={isFormSubmitting}
        onSubmit={handleCreateTask}
      />

      <TaskDialog
        open={editingTask !== null}
        onOpenChange={(open) => {
          if (!open) setEditingTask(null)
        }}
        mode="edit"
        initialValues={
          editingTask
            ? {
                title: editingTask.title,
                description: editingTask.description,
                status: editingTask.status,
                priority: editingTask.priority,
                type: editingTask.type,
                assigneeId: editingTask.assigneeId,
                assigneeName: editingTask.assigneeName,
                assigneeAvatarUrl: editingTask.assigneeAvatarUrl,
                eventId: editingTask.eventId ?? null,
                relatedIncidentId: editingTask.relatedIncidentId,
                relatedWorkOrderId: editingTask.relatedWorkOrderId,
                relatedSponsorshipId: editingTask.relatedSponsorshipId,
                relatedLabel: editingTask.relatedLabel,
                dueDate: editingTask.dueDate,
                imageUrl: editingTask.imageUrl,
                imageKey: editingTask.imageKey,
              }
            : undefined
        }
        events={events.map((event) => ({ id: event.id, name: event.name }))}
        assignees={assignees}
        isSubmitting={isFormSubmitting}
        onSubmit={handleUpdateTask}
      />

      <TaskDetailsDialog
        task={selectedTaskLive}
        open={selectedTaskLive !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null)
        }}
        onEditTask={(task) => {
          setEditingTask(task)
          setSelectedTask(null)
        }}
      />
    </Layout>
  )
}
