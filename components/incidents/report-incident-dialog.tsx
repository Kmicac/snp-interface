"use client"

import { useEffect } from "react"
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

export interface ReportIncidentPayload {
  eventId: string
  zone: string | null
  title: string
  description: string
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  occurredAt: string
  reporter: string
}

interface ReportIncidentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  events: EventOption[]
  selectedEventId?: string
  zones: string[]
  reporterName?: string
  onCreate: (payload: ReportIncidentPayload) => void
}

const incidentSchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  zone: z.string().nullable(),
  title: z.string().trim().min(3, "Title is required"),
  description: z.string().trim().min(5, "Description is required"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  occurredAt: z.string().min(1, "Occurred at is required"),
  reporter: z.string().min(1, "Reporter is required"),
})

export function ReportIncidentDialog({
  open,
  onOpenChange,
  events,
  selectedEventId,
  zones,
  reporterName,
  onCreate,
}: ReportIncidentDialogProps) {
  const form = useForm<ReportIncidentPayload>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      eventId: selectedEventId || events[0]?.id || "",
      zone: null,
      title: "",
      description: "",
      severity: "MEDIUM",
      occurredAt: "",
      reporter: reporterName ?? "Unknown reporter",
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset({
        eventId: selectedEventId || events[0]?.id || "",
        zone: null,
        title: "",
        description: "",
        severity: "MEDIUM",
        occurredAt: "",
        reporter: reporterName ?? "Unknown reporter",
      })
    }
  }, [open, selectedEventId, events, reporterName, form])

  const firstError = Object.values(form.formState.errors)[0]?.message

  const handleSubmit = form.handleSubmit((data) => {
    onCreate(data)
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Report Incident</DialogTitle>
          <DialogDescription>
            Register an incident with severity and timing for faster operations tracking.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Event</label>
              <Select
                value={form.watch("eventId")}
                onValueChange={(value) => form.setValue("eventId", value, { shouldValidate: true })}
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
              <label className="text-sm font-medium text-gray-200">Zone (optional)</label>
              <Select
                value={form.watch("zone") ?? "none"}
                onValueChange={(value) => form.setValue("zone", value === "none" ? null : value, { shouldValidate: true })}
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No zone</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Title</label>
              <Input
                {...form.register("title")}
                placeholder="Unauthorized access attempt"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Description</label>
              <Textarea
                {...form.register("description")}
                placeholder="Describe what happened and immediate actions taken"
                className="min-h-[96px] bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Severity</label>
              <Select
                value={form.watch("severity")}
                onValueChange={(value: ReportIncidentPayload["severity"]) =>
                  form.setValue("severity", value, { shouldValidate: true })
                }
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
              <label className="text-sm font-medium text-gray-200">Occurred at</label>
              <Input
                type="datetime-local"
                {...form.register("occurredAt")}
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Reporter</label>
              <Input
                value={form.watch("reporter")}
                disabled
                className="bg-[#1A1A1F] border-[#2B2B30] text-gray-300"
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
            <Button type="submit">Report Incident</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
