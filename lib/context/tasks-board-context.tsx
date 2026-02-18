"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

import { tasksClient, type TaskApiResponse, type TaskChecklistApi, type TaskCommentApi } from "@/lib/api/modules/tasks-client"
import { useAuth } from "@/lib/context/auth-context"
import { invalidateQueryKeys, subscribeInvalidation } from "@/lib/data/query-invalidation"
import { queryKeys } from "@/lib/data/query-keys"
import type { Task, TaskChecklistItem, TaskComment, TaskPriority, TaskStatus, TaskType } from "@/lib/types"

export interface TaskMutationInput {
  orgId?: string
  eventId?: string | null
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  type: TaskType
  assigneeId?: string | null
  assigneeName?: string
  assigneeAvatarUrl?: string
  dueDate?: string
  relatedIncidentId?: string
  relatedWorkOrderId?: string
  relatedSponsorshipId?: string
  relatedLabel?: string
  imageUrl?: string | null
  imageKey?: string | null
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

interface AddCommentOptions {
  imageUrl?: string
}

interface TasksBoardContextValue {
  tasks: Task[]
  isLoading: boolean
  errorMessage: string | null
  reloadTasks: () => Promise<void>
  createTask: (input: TaskMutationInput) => Promise<Task>
  updateTask: (taskId: string, input: Partial<TaskMutationInput>) => Promise<Task>
  moveTask: (taskId: string, newStatus: TaskStatus, options?: MoveTaskOptions) => Promise<Task>
  addComment: (taskId: string, message: string, author: TaskCommentAuthor, options?: AddCommentOptions) => Promise<Task>
  toggleChecklistItem: (taskId: string, itemId: string) => Promise<Task>
  addChecklistItem: (taskId: string, text: string) => Promise<Task>
}

const TasksBoardContext = createContext<TasksBoardContextValue | undefined>(undefined)

function mapTaskComment(source: TaskCommentApi): TaskComment {
  return {
    id: source.id,
    authorId: source.authorId,
    authorName: source.authorName,
    authorAvatarUrl: source.authorAvatarUrl ?? undefined,
    kind: source.kind ?? undefined,
    message: source.message,
    imageUrl: source.imageUrl ?? undefined,
    createdAt: source.createdAt,
  }
}

function mapTaskChecklistItem(source: TaskChecklistApi): TaskChecklistItem {
  return {
    id: source.id,
    text: source.text,
    done: source.done,
  }
}

function mapTask(source: TaskApiResponse): Task {
  const checklist = Array.isArray(source.checklist)
    ? source.checklist.map(mapTaskChecklistItem)
    : []
  const comments = Array.isArray(source.comments)
    ? source.comments.map(mapTaskComment)
    : []

  return {
    id: source.id,
    orgId: source.orgId ?? source.organizationId ?? "",
    eventId: source.eventId ?? undefined,
    title: source.title,
    description: source.description ?? undefined,
    status: source.status,
    priority: source.priority,
    type: source.type,
    assigneeId: source.assigneeId ?? undefined,
    assigneeName: source.assigneeName ?? undefined,
    assigneeAvatarUrl: source.assigneeAvatarUrl ?? undefined,
    dueDate: source.dueDate ?? undefined,
    comments,
    checklist,
    commentsCount: source.commentsCount ?? comments.length,
    checklistDone: source.checklistDone ?? checklist.filter((item) => item.done).length,
    checklistTotal: source.checklistTotal ?? checklist.length,
    relatedWorkOrderId: source.relatedWorkOrderId ?? undefined,
    relatedIncidentId: source.relatedIncidentId ?? undefined,
    relatedSponsorshipId: source.relatedSponsorshipId ?? undefined,
    relatedLabel: source.relatedLabel ?? undefined,
    position: source.position ?? undefined,
    imageUrl: source.imageUrl ?? undefined,
    imageKey: source.imageKey ?? undefined,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  }
}

function sortTasks(items: Task[]): Task[] {
  const statusOrder: Record<TaskStatus, number> = {
    TODO: 0,
    IN_PROGRESS: 1,
    BLOCKED: 2,
    DONE: 3,
  }

  return [...items].sort((left, right) => {
    const laneDiff = statusOrder[left.status] - statusOrder[right.status]
    if (laneDiff !== 0) return laneDiff

    const leftPosition = typeof left.position === "number" ? left.position : Number.MAX_SAFE_INTEGER
    const rightPosition = typeof right.position === "number" ? right.position : Number.MAX_SAFE_INTEGER
    if (leftPosition !== rightPosition) return leftPosition - rightPosition

    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  })
}

function normalizeTaskList(response: unknown): Task[] {
  if (!Array.isArray(response)) return []
  const mapped = response
    .filter((item): item is TaskApiResponse => Boolean(item && typeof item === "object"))
    .map(mapTask)
  return sortTasks(mapped)
}

function upsertTask(items: Task[], updated: Task): Task[] {
  const index = items.findIndex((task) => task.id === updated.id)
  if (index < 0) return sortTasks([updated, ...items])

  const next = [...items]
  next[index] = updated
  return sortTasks(next)
}

function applyOptimisticMove(
  items: Task[],
  taskId: string,
  newStatus: TaskStatus,
  overTaskId?: string,
): Task[] {
  const movingTask = items.find((item) => item.id === taskId)
  if (!movingTask) return items

  const laneTasks = (status: TaskStatus) =>
    sortTasks(items.filter((task) => task.status === status && task.id !== taskId))

  const sourceStatus = movingTask.status
  const sourceLane = laneTasks(sourceStatus)
  const destinationLane = sourceStatus === newStatus ? sourceLane : laneTasks(newStatus)

  let insertIndex = destinationLane.length
  if (overTaskId) {
    const overIndex = destinationLane.findIndex((task) => task.id === overTaskId)
    if (overIndex >= 0) {
      insertIndex = overIndex
    }
  }

  destinationLane.splice(insertIndex, 0, {
    ...movingTask,
    status: newStatus,
  })

  const byId = new Map(items.map((item) => [item.id, { ...item }]))

  if (sourceStatus !== newStatus) {
    sourceLane.forEach((task, index) => {
      const current = byId.get(task.id)
      if (!current) return
      byId.set(task.id, {
        ...current,
        position: index,
      })
    })
  }

  destinationLane.forEach((task, index) => {
    const current = byId.get(task.id)
    if (!current) return
    byId.set(task.id, {
      ...current,
      status: newStatus,
      position: index,
    })
  })

  return sortTasks(Array.from(byId.values()))
}

function buildStatusChangeUpdateComment(from: TaskStatus, to: TaskStatus): TaskComment {
  const now = new Date().toISOString()
  return {
    id: `task-update-${Date.now()}-${Math.round(Math.random() * 10000)}`,
    authorId: "system",
    authorName: "System",
    message: `Moved from ${from} to ${to}`,
    kind: "UPDATE",
    createdAt: now,
  }
}

function appendStatusChangeComment(task: Task, fromStatus?: TaskStatus): Task {
  if (!fromStatus || fromStatus === task.status) return task

  const message = `Moved from ${fromStatus} to ${task.status}`
  const currentComments = task.comments ?? []
  const duplicate = currentComments.some((entry) => entry.kind === "UPDATE" && entry.message === message)
  if (duplicate) {
    return {
      ...task,
      commentsCount: currentComments.length,
    }
  }

  const comments = [...currentComments, buildStatusChangeUpdateComment(fromStatus, task.status)]
  return {
    ...task,
    comments,
    commentsCount: comments.length,
  }
}

function isLocalStatusUpdateComment(comment: TaskComment): boolean {
  return comment.kind === "UPDATE" && comment.authorId === "system" && comment.message.startsWith("Moved from ")
}

function mergeLocalStatusUpdateComments(previousTask: Task | undefined, nextTask: Task): Task {
  if (!previousTask?.comments?.length) return nextTask

  const localUpdates = previousTask.comments.filter(isLocalStatusUpdateComment)
  if (localUpdates.length === 0) return nextTask

  const mergedComments = [...(nextTask.comments ?? [])]
  let changed = false

  for (const update of localUpdates) {
    const duplicate = mergedComments.some((comment) =>
      comment.kind === "UPDATE" && comment.message === update.message,
    )
    if (!duplicate) {
      mergedComments.push(update)
      changed = true
    }
  }

  if (!changed) return nextTask

  mergedComments.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())

  return {
    ...nextTask,
    comments: mergedComments,
    commentsCount: mergedComments.length,
  }
}

function mergeReloadedTasks(previous: Task[], next: Task[]): Task[] {
  const previousById = new Map(previous.map((task) => [task.id, task]))
  return sortTasks(
    next.map((task) => mergeLocalStatusUpdateComments(previousById.get(task.id), task)),
  )
}

function invalidateTaskRelatedKeys(orgId: string, task: Task) {
  const keys = [
    queryKeys.tasks(orgId),
    queryKeys.task(task.id),
    queryKeys.taskActivity(task.id),
    queryKeys.staffMembers(orgId),
    queryKeys.assets(orgId),
    queryKeys.kits(orgId),
    queryKeys.movements(orgId),
    queryKeys.dashboard(orgId, task.eventId ?? "all"),
    queryKeys.checklists(orgId, task.eventId ?? "all"),
  ] as const

  const mutableKeys: Array<readonly unknown[]> = [...keys]

  if (task.eventId) {
    mutableKeys.push(queryKeys.event(orgId, task.eventId))
    mutableKeys.push(queryKeys.eventResources(task.eventId))
    mutableKeys.push(queryKeys.zones(task.eventId))
    mutableKeys.push(queryKeys.workOrders(task.eventId))
    mutableKeys.push(queryKeys.assignments(task.eventId))
    mutableKeys.push(queryKeys.credentials(task.eventId))
  }

  if (task.relatedWorkOrderId) {
    mutableKeys.push(queryKeys.workOrder(task.relatedWorkOrderId))
  }

  invalidateQueryKeys(...mutableKeys)
}

export function TasksBoardProvider({ children }: { children: React.ReactNode }) {
  const { currentOrg } = useAuth()

  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const tasksRef = useRef<Task[]>([])
  const skipNextInvalidationReloadRef = useRef(false)

  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  const resolveOrgId = useCallback((candidate?: string) => {
    const orgId = candidate ?? currentOrg?.id
    if (!orgId) {
      throw new Error("No organization selected")
    }
    return orgId
  }, [currentOrg?.id])

  const reloadTasks = useCallback(async () => {
    if (!currentOrg?.id) {
      setTasks([])
      setErrorMessage(null)
      setIsLoading(false)
      return
    }

    const isInitialLoad = tasksRef.current.length === 0
    if (isInitialLoad) {
      setIsLoading(true)
    }

    setErrorMessage(null)
    try {
      const response = await tasksClient.list(currentOrg.id)
      const normalized = normalizeTaskList(response)
      setTasks((previous) => mergeReloadedTasks(previous, normalized))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not load tasks")
      if (isInitialLoad) {
        setTasks([])
      }
      throw error
    } finally {
      if (isInitialLoad) {
        setIsLoading(false)
      }
    }
  }, [currentOrg?.id])

  const triggerTaskInvalidation = useCallback((orgId: string, task: Task) => {
    skipNextInvalidationReloadRef.current = true
    invalidateTaskRelatedKeys(orgId, task)
  }, [])

  useEffect(() => {
    void reloadTasks().catch(() => {
      // State already updated in reloadTasks.
    })
  }, [reloadTasks])

  useEffect(() => {
    if (!currentOrg?.id) return

    const keys = [
      queryKeys.tasks(currentOrg.id),
      ["task"],
      ["taskActivity"],
      ["workOrders"],
      ["workOrder"],
      queryKeys.events(currentOrg.id),
      ["event"],
      ["eventResources"],
      ["zones"],
      queryKeys.dashboard(currentOrg.id),
      queryKeys.assets(currentOrg.id),
      queryKeys.kits(currentOrg.id),
      queryKeys.movements(currentOrg.id),
      queryKeys.checklists(currentOrg.id),
      queryKeys.staffMembers(currentOrg.id),
      ["assignments"],
      ["credentials"],
    ] as Array<readonly unknown[]>

    return subscribeInvalidation(keys, () => {
      if (skipNextInvalidationReloadRef.current) {
        skipNextInvalidationReloadRef.current = false
        return
      }

      void reloadTasks().catch(() => {
        // State already updated in reloadTasks.
      })
    })
  }, [currentOrg?.id, reloadTasks])

  const createTask = useCallback(async (input: TaskMutationInput) => {
    const orgId = resolveOrgId(input.orgId)

    const response = await tasksClient.create(orgId, {
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      type: input.type,
      assigneeId: input.assigneeId ?? undefined,
      eventId: input.eventId ?? undefined,
      dueDate: input.dueDate,
      relatedIncidentId: input.relatedIncidentId,
      relatedWorkOrderId: input.relatedWorkOrderId,
      relatedSponsorshipId: input.relatedSponsorshipId,
      relatedLabel: input.relatedLabel,
      labels: input.relatedLabel ? [input.relatedLabel] : undefined,
      imageUrl: input.imageUrl ?? undefined,
      imageKey: input.imageKey ?? undefined,
    })

    const nextTask = mapTask(response)
    setTasks((prev) => upsertTask(prev, nextTask))
    triggerTaskInvalidation(orgId, nextTask)
    return nextTask
  }, [resolveOrgId, triggerTaskInvalidation])

  const updateTask = useCallback(async (taskId: string, input: Partial<TaskMutationInput>) => {
    const currentTask = tasksRef.current.find((item) => item.id === taskId)
    const orgId = resolveOrgId(input.orgId ?? currentTask?.orgId)

    const response = await tasksClient.update(orgId, taskId, {
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      type: input.type,
      assigneeId: input.assigneeId,
      eventId: input.eventId,
      dueDate: input.dueDate,
      relatedIncidentId: input.relatedIncidentId,
      relatedWorkOrderId: input.relatedWorkOrderId,
      relatedSponsorshipId: input.relatedSponsorshipId,
      relatedLabel: input.relatedLabel,
      labels: input.relatedLabel ? [input.relatedLabel] : undefined,
      imageUrl: input.imageUrl,
      imageKey: input.imageKey,
    })

    const nextTask = mapTask(response)
    setTasks((prev) => upsertTask(prev, nextTask))
    triggerTaskInvalidation(orgId, nextTask)
    return nextTask
  }, [resolveOrgId, triggerTaskInvalidation])

  const moveTask = useCallback(async (taskId: string, newStatus: TaskStatus, options?: MoveTaskOptions) => {
    const previousTasks = tasksRef.current
    const currentTask = previousTasks.find((item) => item.id === taskId)
    const orgId = resolveOrgId(currentTask?.orgId)

    setTasks((prev) => applyOptimisticMove(prev, taskId, newStatus, options?.overTaskId))

    try {
      const response = await tasksClient.move(orgId, taskId, {
        status: newStatus,
        overTaskId: options?.overTaskId,
      })

      const nextTask = appendStatusChangeComment(mapTask(response), currentTask?.status)
      setTasks((prev) => upsertTask(prev, nextTask))
      triggerTaskInvalidation(orgId, nextTask)
      return nextTask
    } catch (error) {
      setTasks(previousTasks)
      throw error
    }
  }, [resolveOrgId, triggerTaskInvalidation])

  const addComment = useCallback(async (taskId: string, message: string, _author: TaskCommentAuthor, options?: AddCommentOptions) => {
    const task = tasksRef.current.find((item) => item.id === taskId)
    const orgId = resolveOrgId(task?.orgId)

    const response = await tasksClient.addComment(orgId, taskId, {
      message,
      imageUrl: options?.imageUrl,
    })

    const nextTask = mapTask(response)
    setTasks((prev) => upsertTask(prev, nextTask))
    triggerTaskInvalidation(orgId, nextTask)
    return nextTask
  }, [resolveOrgId, triggerTaskInvalidation])

  const toggleChecklistItem = useCallback(async (taskId: string, itemId: string) => {
    const task = tasksRef.current.find((item) => item.id === taskId)
    const orgId = resolveOrgId(task?.orgId)

    const response = await tasksClient.toggleChecklistItem(orgId, taskId, itemId)
    const nextTask = mapTask(response)
    setTasks((prev) => upsertTask(prev, nextTask))
    triggerTaskInvalidation(orgId, nextTask)
    return nextTask
  }, [resolveOrgId, triggerTaskInvalidation])

  const addChecklistItem = useCallback(async (taskId: string, text: string) => {
    const task = tasksRef.current.find((item) => item.id === taskId)
    const orgId = resolveOrgId(task?.orgId)

    const response = await tasksClient.addChecklistItem(orgId, taskId, text)
    const nextTask = mapTask(response)
    setTasks((prev) => upsertTask(prev, nextTask))
    triggerTaskInvalidation(orgId, nextTask)
    return nextTask
  }, [resolveOrgId, triggerTaskInvalidation])

  const value = useMemo<TasksBoardContextValue>(() => ({
    tasks,
    isLoading,
    errorMessage,
    reloadTasks,
    createTask,
    updateTask,
    moveTask,
    addComment,
    toggleChecklistItem,
    addChecklistItem,
  }), [
    addChecklistItem,
    addComment,
    createTask,
    errorMessage,
    isLoading,
    moveTask,
    reloadTasks,
    tasks,
    toggleChecklistItem,
    updateTask,
  ])

  return <TasksBoardContext.Provider value={value}>{children}</TasksBoardContext.Provider>
}

export function useTasksBoard() {
  const context = useContext(TasksBoardContext)
  if (!context) {
    throw new Error("useTasksBoard must be used within a TasksBoardProvider")
  }
  return context
}
