"use client"

import { useEffect, useMemo } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface EventOption {
  id: string
  name: string
}

export interface CreateTrainingPayload {
  organizationId: string
  relatedEventId: string | null
  title: string
  description: string
  dateTime: string
  location: string
  mandatory: boolean
  capacity?: number
}

interface CreateTrainingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId?: string
  organizationName?: string
  events: EventOption[]
  mode?: "create" | "edit"
  initialValues?: Partial<CreateTrainingPayload>
  onCreate: (payload: CreateTrainingPayload) => void
}

const schema = z.object({
  organizationId: z.string().min(1, "Organization is required"),
  relatedEventId: z.string().nullable(),
  title: z.string().trim().min(3, "Title is required"),
  description: z.string().trim().min(5, "Description is required"),
  dateTime: z.string().min(1, "Date and time are required"),
  location: z.string().trim().min(2, "Location is required"),
  mandatory: z.boolean(),
  capacity: z.number().int().positive().optional(),
})

export function CreateTrainingDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
  events,
  mode = "create",
  initialValues,
  onCreate,
}: CreateTrainingDialogProps) {
  const defaultValues = useMemo<CreateTrainingPayload>(
    () => ({
      organizationId: initialValues?.organizationId ?? organizationId ?? "",
      relatedEventId: initialValues?.relatedEventId ?? null,
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      dateTime: initialValues?.dateTime ?? "",
      location: initialValues?.location ?? "",
      mandatory: initialValues?.mandatory ?? false,
      capacity: initialValues?.capacity,
    }),
    [initialValues, organizationId]
  )

  const form = useForm<CreateTrainingPayload>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
    }
  }, [open])

  const firstError = Object.values(form.formState.errors)[0]?.message

  const handleSubmit = form.handleSubmit((data) => {
    onCreate(data)
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Training" : "Create Training"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update training session details and attendance constraints."
              : "Plan a training session for staff and referee readiness."}
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
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Related event (optional)</label>
              <Select
                value={form.watch("relatedEventId") ?? "none"}
                onValueChange={(value) =>
                  form.setValue("relatedEventId", value === "none" ? null : value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No related event</SelectItem>
                  {events.map((eventOption) => (
                    <SelectItem key={eventOption.id} value={eventOption.id}>
                      {eventOption.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Title</label>
              <Input
                {...form.register("title")}
                placeholder="Safety and emergency protocol briefing"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Description</label>
              <Textarea
                {...form.register("description")}
                placeholder="Main objectives, expected attendees, and required preparation"
                className="min-h-[88px] bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Date & time</label>
              <Input
                type="datetime-local"
                {...form.register("dateTime")}
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Location</label>
              <Input
                {...form.register("location")}
                placeholder="Dojo"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <label className="flex items-center gap-3 rounded-md border border-[#2B2B30] bg-[#1A1A1F] px-3 py-2">
              <Checkbox
                checked={form.watch("mandatory")}
                onCheckedChange={(checked) => form.setValue("mandatory", checked === true, { shouldValidate: true })}
              />
              <span className="text-sm text-gray-200">Mandatory training</span>
            </label>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Capacity (optional)</label>
              <Input
                type="number"
                min={1}
                {...form.register("capacity", {
                  setValueAs: (value) => (value === "" ? undefined : Number(value)),
                })}
                placeholder="30"
                className="bg-[#1A1A1F] border-[#2B2B30]"
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
            <Button type="submit">{mode === "edit" ? "Save changes" : "Create Training"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
