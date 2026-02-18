const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogg"] as const
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg", ".avif"] as const

export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
export const ACCEPTED_IMAGE_INPUT_VALUE = ALLOWED_IMAGE_MIME_TYPES.join(",")
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024
export const MAX_UPLOAD_SIZE_MB = MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)

export type AttachmentMediaKind = "image" | "video" | "unknown"

function normalizeAssetUrl(url: string): string {
  const noHash = url.split("#")[0] ?? url
  return noHash.split("?")[0] ?? noHash
}

function hasKnownExtension(path: string, extensions: readonly string[]): boolean {
  const normalized = path.toLowerCase()
  return extensions.some((extension) => normalized.endsWith(extension))
}

export function isAllowedImageMimeType(mimeType: string | null | undefined): boolean {
  if (!mimeType) return false
  return ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])
}

export function getAttachmentMediaKind(value: string | null | undefined): AttachmentMediaKind {
  if (!value?.trim()) return "unknown"

  const normalized = normalizeAssetUrl(value.trim())
  const lower = normalized.toLowerCase()

  if (lower.startsWith("data:video/")) return "video"
  if (lower.startsWith("data:image/")) return "image"

  if (hasKnownExtension(lower, VIDEO_EXTENSIONS)) return "video"
  if (hasKnownExtension(lower, IMAGE_EXTENSIONS)) return "image"

  return "unknown"
}
