"use client"

import { createContext, useContext, useMemo, useState } from "react"
import { mockTasks } from "@/lib/mock-data"
import type { Task, TaskChecklistItem, TaskComment, TaskPriority, TaskStatus, TaskType } from "@/lib/types"
import { useAuth } from "@/lib/context/auth-context"

export interface TaskMutationInput {
  orgId?: string
  eventId?: string | null
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  type: TaskType
  assigneeId?: string
  assigneeName?: string
  assigneeAvatarUrl?: string
  dueDate?: string
  relatedIncidentId?: string
  relatedWorkOrderId?: string
  relatedSponsorshipId?: string
  relatedLabel?: string
  checklist?: TaskChecklistItem[]
  comments?: TaskComment[]
}

interface MoveTaskOptions {
  reason?: string
  source?: string
  overTaskId?: string
}

interface TaskCommentAuthor {
  id: string
  name: string
  avatarUrl?: string
}

interface TasksBoardContextValue {
  tasks: Task[]
  createTask: (input: TaskMutationInput) => Task
  updateTask: (taskId: string, input: Partial<TaskMutationInput>) => void
  moveTask: (taskId: string, newStatus: TaskStatus, options?: MoveTaskOptions) => void
  addComment: (taskId: string, message: string, author: TaskCommentAuthor) => void
  toggleChecklistItem: (taskId: string, itemId: string) => void
  addChecklistItem: (taskId: string, text: string) => void
}

const TasksBoardContext = createContext<TasksBoardContextValue | undefined>(undefined)

function deriveTaskCounters(task: Task): Task {
  const checklistTotal = task.checklist ? task.checklist.length : (task.checklistTotal ?? 0)
  const checklistDone = task.checklist
    ? task.checklist.filter((item) => item.done).length
    : (task.checklistDone ?? 0)
  const commentsCount = task.comments ? task.comments.length : task.commentsCount

  return {
    ...task,
    checklistTotal,
    checklistDone,
    commentsCount,
  }
}

function insertTaskAtStatusEnd(tasks: Task[], task: Task, status: TaskStatus): Task[] {
  let lastStatusIndex = -1

  for (let index = 0; index < tasks.length; index += 1) {
    if (tasks[index].status === status) {
      lastStatusIndex = index
    }
  }

  if (lastStatusIndex === -1) {
    return [...tasks, task]
  }

  const next = [...tasks]
  next.splice(lastStatusIndex + 1, 0, task)
  return next
}

export function TasksBoardProvider({ children }: { children: React.ReactNode }) {
  const { currentOrg, currentEvent } = useAuth()
  const [tasks, setTasks] = useState<Task[]>(() => mockTasks.map((task) => deriveTaskCounters(task)))

  const value = useMemo<TasksBoardContextValue>(
    () => ({
      tasks,
      createTask: (input) => {
        const now = new Date().toISOString()
        const nextTask: Task = {
          id: `tsk-${Date.now()}`,
          orgId: input.orgId || currentOrg?.id || "org-1",
          eventId: input.eventId ?? currentEvent?.id ?? undefined,
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          type: input.type,
          assigneeId: input.assigneeId,
          assigneeName: input.assigneeName,
          assigneeAvatarUrl: input.assigneeAvatarUrl,
          dueDate: input.dueDate,
          checklist: input.checklist ?? [],
          comments: input.comments ?? [],
          commentsCount: input.comments?.length ?? 0,
          checklistDone: input.checklist?.filter((item) => item.done).length ?? 0,
          checklistTotal: input.checklist?.length ?? 0,
          relatedIncidentId: input.relatedIncidentId,
          relatedWorkOrderId: input.relatedWorkOrderId,
          relatedSponsorshipId: input.relatedSponsorshipId,
          relatedLabel: input.relatedLabel,
          createdAt: now,
          updatedAt: now,
        }

        const normalizedTask = deriveTaskCounters(nextTask)
        console.log("Create Task payload", normalizedTask)
        setTasks((prev) => [normalizedTask, ...prev])
        return normalizedTask
      },
      updateTask: (taskId, input) => {
        console.log("Update Task payload", { taskId, ...input })
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? deriveTaskCounters({
                  ...task,
                  ...input,
                  eventId: input.eventId === null ? undefined : (input.eventId ?? task.eventId),
                  updatedAt: new Date().toISOString(),
                })
              : task
          )
        )
      },
      moveTask: (taskId, newStatus, options) => {
        console.log("Move Task payload", { taskId, newStatus, ...options })
        setTasks((prev) => {
          const activeIndex = prev.findIndex((task) => task.id === taskId)
          if (activeIndex === -1) return prev

          const activeTask = prev[activeIndex]
          const updatedTask = deriveTaskCounters({
            ...activeTask,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          })

          const tasksWithoutActive = prev.filter((task) => task.id !== taskId)
          const overTaskId = options?.overTaskId

          if (overTaskId && overTaskId !== taskId) {
            const overIndex = tasksWithoutActive.findIndex((task) => task.id === overTaskId)

            if (overIndex !== -1 && tasksWithoutActive[overIndex].status === newStatus) {
              const reordered = [...tasksWithoutActive]
              reordered.splice(overIndex, 0, updatedTask)
              return reordered
            }
          }

          return insertTaskAtStatusEnd(tasksWithoutActive, updatedTask, newStatus)
        })
      },
      addComment: (taskId, message, author) => {
        const trimmedMessage = message.trim()
        if (!trimmedMessage) return

        setTasks((prev) =>
          prev.map((task) => {
            if (task.id !== taskId) return task

            const nextComments: TaskComment[] = [
              ...(task.comments ?? []),
              {
                id: `cmt-${Date.now()}`,
                authorId: author.id,
                authorName: author.name,
                authorAvatarUrl: author.avatarUrl,
                message: trimmedMessage,
                createdAt: new Date().toISOString(),
              },
            ]

            return deriveTaskCounters({
              ...task,
              comments: nextComments,
              updatedAt: new Date().toISOString(),
            })
          })
        )
      },
      toggleChecklistItem: (taskId, itemId) => {
        setTasks((prev) =>
          prev.map((task) => {
            if (task.id !== taskId || !task.checklist?.length) return task

            const nextChecklist = task.checklist.map((item) =>
              item.id === itemId ? { ...item, done: !item.done } : item
            )

            return deriveTaskCounters({
              ...task,
              checklist: nextChecklist,
              updatedAt: new Date().toISOString(),
            })
          })
        )
      },
      addChecklistItem: (taskId, text) => {
        const trimmedText = text.trim()
        if (!trimmedText) return

        setTasks((prev) =>
          prev.map((task) => {
            if (task.id !== taskId) return task

            const nextChecklist: TaskChecklistItem[] = [
              ...(task.checklist ?? []),
              {
                id: `chk-${Date.now()}`,
                text: trimmedText,
                done: false,
              },
            ]

            return deriveTaskCounters({
              ...task,
              checklist: nextChecklist,
              updatedAt: new Date().toISOString(),
            })
          })
        )
      },
    }),
    [tasks, currentOrg, currentEvent]
  )

  return <TasksBoardContext.Provider value={value}>{children}</TasksBoardContext.Provider>
}

export function useTasksBoard() {
  const context = useContext(TasksBoardContext)
  if (!context) {
    throw new Error("useTasksBoard must be used within a TasksBoardProvider")
  }
  return context
}
