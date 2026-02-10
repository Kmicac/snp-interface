"use client"

import { useEffect, useMemo, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ImageUpload } from "@/components/shared/image-upload"

export interface CreateEventPayload {
  organizationId: string
  code: string
  name: string
  startDate: string
  endDate: string
  venue: string
  imageUrl?: string
  imageKey?: string
  imageFile?: File | null
  clearedImage?: boolean
}

interface CreateEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId?: string
  organizationName?: string
  mode?: "create" | "edit"
  initialValues?: Partial<CreateEventPayload>
  onCreate: (payload: CreateEventPayload) => void
}

const createEventSchema = z
  .object({
    organizationId: z.string().min(1, "Organization is required"),
    code: z.string().trim().min(2, "Event code is required"),
    name: z.string().trim().min(2, "Name is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    venue: z.string().trim().min(2, "Venue is required"),
  })
  .refine((data) => new Date(data.endDate).getTime() >= new Date(data.startDate).getTime(), {
    message: "End date must be after start date",
    path: ["endDate"],
  })

export function CreateEventDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
  mode = "create",
  initialValues,
  onCreate,
}: CreateEventDialogProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [existingImageKey, setExistingImageKey] = useState<string | null>(null)

  const defaultValues = useMemo<CreateEventPayload>(
    () => ({
      organizationId: initialValues?.organizationId ?? organizationId ?? "",
      code: initialValues?.code ?? "",
      name: initialValues?.name ?? "",
      startDate: initialValues?.startDate ?? "",
      endDate: initialValues?.endDate ?? "",
      venue: initialValues?.venue ?? "",
      imageUrl: initialValues?.imageUrl,
      imageKey: initialValues?.imageKey,
      imageFile: null,
      clearedImage: false,
    }),
    [initialValues, organizationId]
  )

  const form = useForm<CreateEventPayload>({
    resolver: zodResolver(createEventSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
      setImageFile(null)
      setExistingImageUrl(initialValues?.imageUrl ?? null)
      setExistingImageKey(initialValues?.imageKey ?? null)
    }
  }, [open])

  const firstError = Object.values(form.formState.errors)[0]?.message

  const handleSubmit = form.handleSubmit((data) => {
    const hadInitialImage = Boolean(initialValues?.imageUrl || initialValues?.imageKey)
    const clearedImage = mode === "edit" && hadInitialImage && !existingImageUrl && !imageFile

    onCreate({
      ...data,
      imageFile,
      imageUrl: existingImageUrl ?? undefined,
      imageKey: existingImageUrl ? existingImageKey ?? undefined : undefined,
      clearedImage,
    })
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Event" : "Create Event"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update event details for operations planning."
              : "Add a new event for your organization and schedule operations."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Organization</label>
              <Input
                value={organizationName ?? "No organization selected"}
                disabled
                className="bg-[#1A1A1F] border-[#2B2B30] text-gray-300"
              />
              <p className="text-xs text-gray-500">
                The event is created under the currently selected organization.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Event code</label>
              <Input
                {...form.register("code")}
                placeholder="ADCC_LATAM_2026"
                className="bg-[#1A1A1F] border-[#2B2B30]"
                readOnly={mode === "edit"}
              />
              {mode === "edit" && <p className="text-xs text-gray-500">Event code is locked in edit mode.</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Name</label>
              <Input
                {...form.register("name")}
                placeholder="ADCC LATAM 2026"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Start date & time</label>
              <Input
                type="datetime-local"
                {...form.register("startDate")}
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">End date & time</label>
              <Input
                type="datetime-local"
                {...form.register("endDate")}
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Venue</label>
              <Input
                {...form.register("venue")}
                placeholder="Parque Olimpico de la Juventud, Buenos Aires, Argentina"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <ImageUpload
                label="Event image / flyer"
                description="Optional. Upload a flyer or hero image for event cards and event details."
                value={imageFile}
                onChange={setImageFile}
                existingImageUrl={existingImageUrl}
                onClearExisting={() => {
                  setExistingImageUrl(null)
                  setExistingImageKey(null)
                }}
                maxSizeMB={5}
              />
            </div>
          </div>

          {firstError && <p className="text-xs text-red-400">{String(firstError)}</p>}

          <p className="text-xs text-gray-500">
            This only updates local mock data for now. Later this will create records in the real SNP backend.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{mode === "edit" ? "Save changes" : "Create Event"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
