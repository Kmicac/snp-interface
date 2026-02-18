import { ApiError, apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/config"
import { ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB, isAllowedImageMimeType } from "@/lib/media/attachments"

export type UploadFolder =
  | "partners"
  | "assets"
  | "assets-qr"
  | "inventory-qr"
  | "tasks"
  | "tasks-comments"
  | `orgs/${string}`
  | `events/${string}`

export interface UploadResponse {
  url: string
  key: string
  mimetype?: string
  size?: number
}

export interface UploadImageParams {
  orgId: string
  file: File
  folder: UploadFolder
  entityId?: string
}

export async function uploadImage({ orgId, file, folder, entityId }: UploadImageParams) {
  if (!isAllowedImageMimeType(file.type)) {
    throw new Error(
      `Unsupported file type (${file.type || "unknown"}). Use JPEG, PNG, or WEBP.`
    )
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error(`File is too large (${MAX_UPLOAD_SIZE_MB}MB max).`)
  }

  const formData = new FormData()
  formData.append("file", file)
  formData.append("folder", folder)
  if (entityId) formData.append("entityId", entityId)

  try {
    return await apiClient.post<UploadResponse>(API_ENDPOINTS.filesUpload(orgId), formData)
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(`File upload failed: ${error.message}`)
    }
    throw error instanceof Error ? error : new Error("File upload failed")
  }
}
