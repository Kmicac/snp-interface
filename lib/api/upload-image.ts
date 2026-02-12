import { ApiError, apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/config"

export type UploadFolder = "staff" | "brands" | "sponsors" | "events" | "assets" | (string & {})

export interface UploadResponse {
  url: string
  key: string
  mimetype?: string
  size?: number
}

export interface UploadImageParams {
  file: File
  folder: UploadFolder
  entityId?: string
}

export async function uploadImage({ file, folder, entityId }: UploadImageParams) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("folder", folder)
  if (entityId) formData.append("entityId", entityId)

  try {
    return await apiClient.post<UploadResponse>(API_ENDPOINTS.filesUpload, formData)
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(`File upload failed: ${error.message}`)
    }
    throw error instanceof Error ? error : new Error("File upload failed")
  }
}
