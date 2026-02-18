import { ApiError, apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/config"
import type { TaskPriority, TaskStatus, TaskType } from "@/lib/types"

export interface TaskChecklistApi {
  id: string
  text: string
  done: boolean
}

export interface TaskCommentApi {
  id: string
  authorId: string
  authorName: string
  authorAvatarUrl?: string | null
  kind?: "COMMENT" | "UPDATE" | null
  message: string
  imageUrl?: string | null
  imageKey?: string | null
  createdAt: string
}

export interface TaskApiResponse {
  id: string
  orgId?: string
  organizationId?: string
  eventId?: string | null
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  type: TaskType
  assigneeId?: string | null
  assigneeName?: string | null
  assigneeAvatarUrl?: string | null
  dueDate?: string | null
  relatedWorkOrderId?: string | null
  relatedIncidentId?: string | null
  relatedSponsorshipId?: string | null
  relatedLabel?: string | null
  position?: number | null
  imageUrl?: string | null
  imageKey?: string | null
  commentsCount?: number
  checklistDone?: number
  checklistTotal?: number
  comments?: TaskCommentApi[]
  checklist?: TaskChecklistApi[]
  createdAt: string
  updatedAt: string
}

export interface CreateTaskInput {
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  type: TaskType
  labels?: string[]
  assigneeId?: string | null
  eventId?: string | null
  dueDate?: string
  relatedIncidentId?: string
  relatedWorkOrderId?: string
  relatedSponsorshipId?: string
  relatedLabel?: string
  imageUrl?: string | null
  imageKey?: string | null
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {}

export interface MoveTaskInput {
  status: TaskStatus
  overTaskId?: string
}

export interface AddTaskCommentInput {
  message: string
  imageUrl?: string
}

export const tasksClient = {
  list(orgId: string) {
    return apiClient.get<unknown>(API_ENDPOINTS.tasks(orgId))
  },

  create(orgId: string, payload: CreateTaskInput) {
    return apiClient.post<TaskApiResponse>(API_ENDPOINTS.tasks(orgId), payload)
  },

  update(orgId: string, taskId: string, payload: UpdateTaskInput) {
    return apiClient.patch<TaskApiResponse>(API_ENDPOINTS.task(orgId, taskId), payload)
  },

  async move(orgId: string, taskId: string, payload: MoveTaskInput) {
    const endpoint = API_ENDPOINTS.taskMove(orgId, taskId)

    try {
      return await apiClient.patch<TaskApiResponse>(endpoint, payload)
    } catch (error) {
      const shouldRetryWithPost =
        !(error instanceof ApiError) || error.status === 404 || error.status === 405

      if (!shouldRetryWithPost) {
        throw error
      }

      return apiClient.post<TaskApiResponse>(endpoint, payload)
    }
  },

  addComment(orgId: string, taskId: string, payload: AddTaskCommentInput) {
    return apiClient.post<TaskApiResponse>(API_ENDPOINTS.taskComments(orgId, taskId), payload)
  },

  toggleChecklistItem(orgId: string, taskId: string, itemId: string) {
    return apiClient.patch<TaskApiResponse>(API_ENDPOINTS.taskChecklistItem(orgId, taskId, itemId))
  },

  addChecklistItem(orgId: string, taskId: string, text: string) {
    return apiClient.post<TaskApiResponse>(API_ENDPOINTS.taskChecklist(orgId, taskId), { text })
  },
}
