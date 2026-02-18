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

interface ProviderServiceOption {
  id: string
  label: string
}

interface ZoneOption {
  id: string
  name: string
}

type WorkOrderDialogMode = "create" | "edit"

export interface CreateWorkOrderPayload {
  eventId: string
  providerServiceId: string
  zoneId: string | null
  title: string
  description: string
  scheduledStart: string
  scheduledEnd: string
  slaMinutes?: number
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED" | "CANCELED"
}

interface CreateWorkOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  events: EventOption[]
  selectedEventId?: string
  providerServices: ProviderServiceOption[]
  zones: ZoneOption[]
  mode?: WorkOrderDialogMode
  initialValues?: Partial<CreateWorkOrderPayload>
  onCreate: (payload: CreateWorkOrderPayload) => void
}

const createWorkOrderSchema = z
  .object({
    eventId: z.string().min(1, "Event is required"),
    providerServiceId: z.string().min(1, "Provider service is required"),
    zoneId: z.string().nullable(),
    title: z.string().trim().min(3, "Title is required"),
    description: z.string().trim().min(5, "Description is required"),
    scheduledStart: z.string().min(1, "Scheduled start is required"),
    scheduledEnd: z.string().min(1, "Scheduled end is required"),
    slaMinutes: z.number().int().positive().optional(),
    status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "DELAYED", "CANCELED"]),
  })
  .refine((data) => new Date(data.scheduledEnd).getTime() >= new Date(data.scheduledStart).getTime(), {
    message: "Scheduled end must be after scheduled start",
    path: ["scheduledEnd"],
  })

export function CreateWorkOrderDialog({
  open,
  onOpenChange,
  events,
  selectedEventId,
  providerServices,
  zones,
  mode = "create",
  initialValues,
  onCreate,
}: CreateWorkOrderDialogProps) {
  const defaultValues = useMemo<CreateWorkOrderPayload>(
    () => ({
      eventId: initialValues?.eventId || selectedEventId || events[0]?.id || "",
      providerServiceId: initialValues?.providerServiceId || providerServices[0]?.id || "",
      zoneId: initialValues?.zoneId ?? null,
      title: initialValues?.title || "",
      description: initialValues?.description || "",
      scheduledStart: initialValues?.scheduledStart || "",
      scheduledEnd: initialValues?.scheduledEnd || "",
      slaMinutes: initialValues?.slaMinutes,
      status: initialValues?.status || "SCHEDULED",
    }),
    [events, initialValues, providerServices, selectedEventId]
  )

  const form = useForm<CreateWorkOrderPayload>({
    resolver: zodResolver(createWorkOrderSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
    }
  }, [open])

  const eventId = form.watch("eventId")
  const providerServiceId = form.watch("providerServiceId")
  const zoneValue = form.watch("zoneId")
  const firstError = Object.values(form.formState.errors)[0]?.message

  const handleSubmit = form.handleSubmit((data) => {
    onCreate(data)
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Work Order" : "Create Work Order"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update operational task details and scheduling."
              : "Plan an operational task with SLA expectations and initial scheduling."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Event</label>
              <Select
                value={eventId}
                onValueChange={(value) => form.setValue("eventId", value, { shouldValidate: true })}
                disabled={mode === "edit"}
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((eventOption) => (
                    <SelectItem key={eventOption.id} value={eventOption.id}>
                      {eventOption.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Provider service</label>
              <Select
                value={providerServiceId}
                onValueChange={(value) => form.setValue("providerServiceId", value, { shouldValidate: true })}
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue placeholder="Select provider service" />
                </SelectTrigger>
                <SelectContent>
                  {providerServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Zone (optional)</label>
              <Select
                value={zoneValue ?? "none"}
                onValueChange={(value) =>
                  form.setValue("zoneId", value === "none" ? null : value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No zone</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Initial status</label>
              <Select
                value={form.watch("status")}
                onValueChange={(value: CreateWorkOrderPayload["status"]) =>
                  form.setValue("status", value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHEDULED">SCHEDULED</SelectItem>
                  <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                  <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                  <SelectItem value="DELAYED">DELAYED</SelectItem>
                  <SelectItem value="CANCELED">CANCELED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">SLA minutes (optional)</label>
              <Input
                type="number"
                min={1}
                {...form.register("slaMinutes", {
                  setValueAs: (value) => (value === "" ? undefined : Number(value)),
                })}
                placeholder="120"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Title</label>
              <Input
                {...form.register("title")}
                placeholder="Setup tatami mats - Zone A"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Description</label>
              <Textarea
                {...form.register("description")}
                placeholder="Describe scope, expected output, and dependencies"
                className="min-h-[96px] bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Scheduled start</label>
              <Input
                type="datetime-local"
                {...form.register("scheduledStart")}
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Scheduled end</label>
              <Input
                type="datetime-local"
                {...form.register("scheduledEnd")}
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>
          </div>

          {firstError && <p className="text-xs text-red-400">{String(firstError)}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{mode === "edit" ? "Save changes" : "Create Work Order"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
