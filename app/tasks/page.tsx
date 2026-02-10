"use client"

import { useMemo, useState } from "react"
import { DndContext, type DragEndEvent, type DragOverEvent, type DragStartEvent, DragOverlay, PointerSensor, KeyboardSensor, closestCorners, useSensor, useSensors, type UniqueIdentifier } from "@dnd-kit/core"
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { Eye, Plus, SlidersHorizontal, SquareKanban } from "lucide-react"

import Layout from "@/components/kokonutui/layout"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useTasksBoard } from "@/lib/context/tasks-board-context"
import { mockStaff } from "@/lib/mock-data"
import type { Task, TaskStatus } from "@/lib/types"
import { TaskDialog, type TaskDialogValues } from "@/components/tasks/task-dialog"
import { TaskDetailsDialog } from "@/components/tasks/task-details-dialog"
import { TaskCard } from "@/components/tasks/task-card"
import { TaskColumn } from "@/components/tasks/task-column"

const boardColumns: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: "Backlog" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "BLOCKED", label: "Blocked" },
  { status: "DONE", label: "Done" },
]

export default function TasksPage() {
  const { currentOrg, currentEvent, events } = useAuth()
  const { toast } = useToast()
  const { tasks, createTask, moveTask } = useTasksBoard()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [activeDropStatus, setActiveDropStatus] = useState<TaskStatus | null>(null)

  const assignees = useMemo(
    () =>
      mockStaff.map((staff) => ({
        id: staff.id,
        name: staff.name,
        avatarUrl: staff.avatarUrl || staff.avatar,
      })),
    []
  )

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

  const tasksByStatus = useMemo(
    () =>
      boardColumns.reduce(
        (acc, column) => {
          acc[column.status] = visibleTasks.filter((task) => task.status === column.status)
          return acc
        },
        {} as Record<TaskStatus, Task[]>
      ),
    [visibleTasks]
  )

  const taskById = useMemo(() => new Map(visibleTasks.map((task) => [task.id, task])), [visibleTasks])

  const statusByColumnId = useMemo(
    () =>
      Object.fromEntries(boardColumns.map((column) => [`column-${column.status}`, column.status])) as Record<
        string,
        TaskStatus
      >,
    []
  )

  const activeTask = useMemo(
    () => (activeTaskId ? taskById.get(activeTaskId) ?? null : null),
    [activeTaskId, taskById]
  )

  const selectedTaskLive = useMemo(
    () => (selectedTask ? taskById.get(selectedTask.id) ?? selectedTask : null),
    [selectedTask, taskById]
  )

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

    return taskById.get(id)?.status ?? null
  }

  const handleDragStart = (event: DragStartEvent) => {
    const nextTaskId = String(event.active.id)
    const sourceStatus = getStatusFromDndId(event.active.id)
    setActiveTaskId(nextTaskId)
    setActiveDropStatus(sourceStatus)
  }

  const handleDragOver = (event: DragOverEvent) => {
    setActiveDropStatus(getStatusFromDndId(event.over?.id))
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
    const overTaskId = overId && taskById.has(overId) ? overId : undefined

    if (sourceStatus && destinationStatus && (sourceStatus !== destinationStatus || (overTaskId && overTaskId !== taskId))) {
      moveTask(taskId, destinationStatus, {
        source: "tasks_board_dnd",
        reason: "column_drop",
        overTaskId,
      })
    }

    resetDragState()
  }

  const handleViewOnlyClick = () => {
    console.log("View only clicked")
  }

  const handleFilterClick = () => {
    console.log("Filter clicked")
  }

  const handleCreateTask = (payload: TaskDialogValues) => {
    const createdTask = createTask({
      ...payload,
      orgId: currentOrg?.id || "org-1",
      eventId: payload.eventId ?? currentEvent?.id ?? null,
    })

    toast({
      title: "Task created",
      description: `${createdTask.title} was added to local mock data.`,
    })
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleFilterClick}
                className="h-8 border-[#2C2F39] bg-[#14161D] px-3 text-sm text-gray-200 hover:bg-[#1B1E25]"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="h-8 px-3 text-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                New Task
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragCancel={resetDragState}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={visibleTasks.map((task) => task.id)} strategy={rectSortingStrategy}>
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
              </SortableContext>

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
        onSubmit={handleCreateTask}
      />

      <TaskDetailsDialog
        task={selectedTaskLive}
        open={selectedTaskLive !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null)
        }}
      />
    </Layout>
  )
}
