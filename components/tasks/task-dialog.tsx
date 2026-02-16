"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TaskPriority, TaskStatus, TaskType } from "@/lib/types"

interface EventOption {
  id: string
  name: string
}

interface AssigneeOption {
  id: string
  name: string
  avatarUrl?: string
}

export interface TaskDialogValues {
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  type: TaskType
  assigneeId?: string
  assigneeName?: string
  assigneeAvatarUrl?: string
  eventId?: string | null
  relatedIncidentId?: string
  relatedWorkOrderId?: string
  relatedSponsorshipId?: string
  relatedLabel?: string
  dueDate?: string
  imageUrl?: string
  imageKey?: string
  imageFile?: File | null
  clearImage?: boolean
}

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: "create" | "edit"
  initialValues?: Partial<TaskDialogValues>
  events: EventOption[]
  assignees: AssigneeOption[]
  isSubmitting?: boolean
  onSubmit: (payload: TaskDialogValues) => Promise<boolean | void> | boolean | void
}

const schema = z.object({
  title: z.string().trim().min(3, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  type: z.enum(["GENERAL", "INCIDENT", "WORK_ORDER", "SPONSORSHIP", "REFEREE", "INVENTORY"]),
  assigneeId: z.string().nullable(),
  eventId: z.string().nullable(),
  relatedIncidentId: z.string().optional(),
  relatedWorkOrderId: z.string().optional(),
  relatedSponsorshipId: z.string().optional(),
  relatedLabel: z.string().optional(),
  dueDate: z.string().optional(),
})

export function TaskDialog({
  open,
  onOpenChange,
  mode = "create",
  initialValues,
  events,
  assignees,
  isSubmitting = false,
  onSubmit,
}: TaskDialogProps) {
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [clearCurrentImage, setClearCurrentImage] = useState(false)

  const defaultValues = useMemo(
    () => ({
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      status: initialValues?.status ?? "TODO",
      priority: initialValues?.priority ?? "MEDIUM",
      type: initialValues?.type ?? "GENERAL",
      assigneeId: initialValues?.assigneeId ?? null,
      eventId: initialValues?.eventId ?? null,
      relatedIncidentId: initialValues?.relatedIncidentId ?? "",
      relatedWorkOrderId: initialValues?.relatedWorkOrderId ?? "",
      relatedSponsorshipId: initialValues?.relatedSponsorshipId ?? "",
      relatedLabel: initialValues?.relatedLabel ?? "",
      dueDate: initialValues?.dueDate ?? "",
    }),
    [initialValues]
  )

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
      setAttachmentFile(null)
      setAttachmentPreviewUrl(null)
      setAttachmentError(null)
      setClearCurrentImage(false)
    }
  }, [defaultValues, form, open])

  useEffect(() => {
    if (!attachmentFile) {
      setAttachmentPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(attachmentFile)
    setAttachmentPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [attachmentFile])

  const firstError = Object.values(form.formState.errors)[0]?.message

  const existingImageUrl = clearCurrentImage ? null : (initialValues?.imageUrl ?? null)
  const imagePreview = attachmentPreviewUrl ?? existingImageUrl

  const handleAttachmentSelection = (file: File | null) => {
    if (!file) {
      setAttachmentFile(null)
      setAttachmentError(null)
      return
    }

    if (!file.type.startsWith("image/")) {
      setAttachmentError("Only image files are allowed.")
      return
    }

    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setAttachmentError("Image must be 5MB or smaller.")
      return
    }

    setAttachmentError(null)
    setClearCurrentImage(false)
    setAttachmentFile(file)
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    if (attachmentError) return

    const selectedAssignee = assignees.find((assignee) => assignee.id === data.assigneeId)
    const success = await onSubmit({
      title: data.title,
      description: data.description || undefined,
      status: data.status,
      priority: data.priority,
      type: data.type,
      assigneeId: selectedAssignee?.id,
      assigneeName: selectedAssignee?.name,
      assigneeAvatarUrl: selectedAssignee?.avatarUrl,
      eventId: data.eventId || null,
      relatedIncidentId: data.relatedIncidentId || undefined,
      relatedWorkOrderId: data.relatedWorkOrderId || undefined,
      relatedSponsorshipId: data.relatedSponsorshipId || undefined,
      relatedLabel: data.relatedLabel || undefined,
      dueDate: data.dueDate || undefined,
      imageUrl: clearCurrentImage ? undefined : (initialValues?.imageUrl ?? undefined),
      imageKey: clearCurrentImage ? undefined : (initialValues?.imageKey ?? undefined),
      imageFile: attachmentFile,
      clearImage: clearCurrentImage,
    })
    if (success !== false) {
      onOpenChange(false)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Task" : "New Task"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update task details for operational follow-up."
              : "Create a new task linked to the current event operations."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Title</label>
              <Input
                {...form.register("title")}
                placeholder="Follow up with technical provider"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Description</label>
              <Textarea
                {...form.register("description")}
                placeholder="Operational context, expected output and blockers."
                className="min-h-[90px] bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Image (optional)</label>
              <div className="rounded-lg border border-[#2B2B30] bg-[#1A1A1F] p-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleAttachmentSelection(event.target.files?.[0] ?? null)}
                      className="border-[#2B2B30] bg-[#171A22] text-sm file:mr-3 file:rounded file:border-0 file:bg-[#2A3040] file:px-3 file:py-1 file:text-xs file:text-gray-200"
                    />
                    <p className="text-xs text-gray-500">Accepted: image/* up to 5MB.</p>
                    {attachmentError ? <p className="text-xs text-red-400">{attachmentError}</p> : null}
                  </div>

                  {imagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreview}
                        alt="Task attachment preview"
                        className="h-24 w-40 rounded-md border border-[#2B2B30] object-cover"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 border-[#2B2B30] bg-transparent text-xs"
                        onClick={() => {
                          if (attachmentFile) {
                            setAttachmentFile(null)
                            return
                          }
                          setClearCurrentImage(true)
                        }}
                        disabled={isSubmitting}
                      >
                        Remove image
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Status</label>
              <Select
                value={form.watch("status")}
                onValueChange={(value: TaskStatus) => form.setValue("status", value, { shouldValidate: true })}
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">TODO</SelectItem>
                  <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                  <SelectItem value="BLOCKED">BLOCKED</SelectItem>
                  <SelectItem value="DONE">DONE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Priority</label>
              <Select
                value={form.watch("priority")}
                onValueChange={(value: TaskPriority) => form.setValue("priority", value, { shouldValidate: true })}
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">LOW</SelectItem>
                  <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                  <SelectItem value="HIGH">HIGH</SelectItem>
                  <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Type</label>
              <Select
                value={form.watch("type")}
                onValueChange={(value: TaskType) => form.setValue("type", value, { shouldValidate: true })}
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">GENERAL</SelectItem>
                  <SelectItem value="INCIDENT">INCIDENT</SelectItem>
                  <SelectItem value="WORK_ORDER">WORK_ORDER</SelectItem>
                  <SelectItem value="SPONSORSHIP">SPONSORSHIP</SelectItem>
                  <SelectItem value="REFEREE">REFEREE</SelectItem>
                  <SelectItem value="INVENTORY">INVENTORY</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Assignee</label>
              <Select
                value={form.watch("assigneeId") ?? "none"}
                onValueChange={(value) =>
                  form.setValue("assigneeId", value === "none" ? null : value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {assignees.map((assignee) => (
                    <SelectItem key={assignee.id} value={assignee.id}>
                      {assignee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Related event</label>
              <Select
                value={form.watch("eventId") ?? "none"}
                onValueChange={(value) =>
                  form.setValue("eventId", value === "none" ? null : value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No related event</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Due date (optional)</label>
              <Input
                type="datetime-local"
                {...form.register("dueDate")}
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Related incident (optional)</label>
              <Input
                {...form.register("relatedIncidentId")}
                placeholder="inc-12"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Related work order (optional)</label>
              <Input
                {...form.register("relatedWorkOrderId")}
                placeholder="wo-12"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Related sponsorship (optional)</label>
              <Input
                {...form.register("relatedSponsorshipId")}
                placeholder="sp-12"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Context label (optional)</label>
              <Input
                {...form.register("relatedLabel")}
                placeholder="WO-002 Security perimeter check"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>
          </div>

          {firstError ? <p className="text-xs text-red-400">{String(firstError)}</p> : null}

          <p className="text-xs text-gray-500">
            This only updates local mock data for now. Later this will call the real SNP backend.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : mode === "edit" ? "Save changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
