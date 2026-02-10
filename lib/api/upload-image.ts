import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api/config"

export type UploadFolder = "staff" | "brands" | "sponsors" | "events" | (string & {})

export interface UploadResponse {
  url: string
  key: string
  size: number
  mimeType: string
}

export interface UploadImageParams {
  file: File
  folder: UploadFolder
  entityId?: string
}

export async function uploadImage({ file, folder, entityId }: UploadImageParams): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("folder", folder)
  if (entityId) formData.append("entityId", entityId)

  const headers: HeadersInit = {}
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("snp_token")
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.filesUpload}`, {
    method: "POST",
    body: formData,
    headers,
  })

  if (!response.ok) {
    throw new Error(`File upload failed: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<UploadResponse>
}
