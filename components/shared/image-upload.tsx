"use client"

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { ImageIcon, UploadCloud, X } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type ImageUploadProps = {
  label?: string
  description?: string
  value?: File | null
  onChange: (file: File | null) => void
  existingImageUrl?: string | null
  onClearExisting?: () => void
  disabled?: boolean
  required?: boolean
  maxSizeMB?: number
}

const DEFAULT_MAX_SIZE_MB = 5

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export function ImageUpload({
  label,
  description,
  value = null,
  onChange,
  existingImageUrl = null,
  onClearExisting,
  disabled = false,
  required = false,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(value)
    setPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [value])

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const validateAndSetFile = (file: File | null) => {
    if (!file) {
      onChange(null)
      setError(null)
      return
    }

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.")
      return
    }

    if (file.size > maxSizeBytes) {
      setError(`Image must be ${maxSizeMB}MB or smaller.`)
      return
    }

    setError(null)
    onChange(file)
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    validateAndSetFile(nextFile)
    event.target.value = ""
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    if (disabled) return

    const nextFile = event.dataTransfer.files?.[0] ?? null
    validateAndSetFile(nextFile)
  }

  const openFileDialog = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  const displayPreviewUrl = previewUrl ?? existingImageUrl

  return (
    <div className="space-y-3">
      {label ? (
        <Label className="text-sm font-medium text-gray-200">
          {label}
          {required ? " *" : ""}
        </Label>
      ) : null}

      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleInputChange}
        disabled={disabled}
      />

      {!displayPreviewUrl ? (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={openFileDialog}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              openFileDialog()
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault()
            event.stopPropagation()
            if (!disabled) setIsDragging(true)
          }}
          onDragOver={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onDragLeave={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setIsDragging(false)
          }}
          onDrop={handleDrop}
          className={cn(
            "flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-5 transition-colors",
            "border-border bg-card/40 hover:border-primary/60 hover:bg-card/70",
            isDragging && "border-primary bg-card",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Drop an image here, or click to upload</p>
          <p className="text-xs text-muted-foreground">Accepted: image/* up to {maxSizeMB}MB</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card/60 p-3">
          <div className="flex items-start gap-3">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
              {displayPreviewUrl ? (
                <img src={displayPreviewUrl} alt={value?.name ?? "Image preview"} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="truncate text-sm font-medium text-foreground">{value?.name ?? "Current image"}</p>
              {value ? <p className="text-xs text-muted-foreground">{formatFileSize(value.size)}</p> : null}
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={openFileDialog} disabled={disabled}>
                  Change image
                </Button>
                {value ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => validateAndSetFile(null)}
                    disabled={disabled}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                ) : onClearExisting ? (
                  <Button type="button" variant="ghost" size="sm" onClick={onClearExisting} disabled={disabled}>
                    <X className="mr-1 h-4 w-4" />
                    Remove current
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {error ? (
        <Alert variant="destructive" className="border-red-500/30 bg-red-500/10 px-3 py-2">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      ) : null}

      {/* Parent flow for backend mode: upload `value` to /files/upload, store returned `url`/`key` in the entity payload. */}
    </div>
  )
}
