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

export interface CreateShiftPayload {
  eventId: string
  name: string
  startsAt: string
  endsAt: string
  notes?: string
}

interface CreateShiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  events: EventOption[]
  selectedEventId?: string
  onCreate: (payload: CreateShiftPayload) => void
}

const schema = z
  .object({
    eventId: z.string().min(1, "Event is required"),
    name: z.string().trim().min(2, "Shift name is required"),
    startsAt: z.string().min(1, "Start time is required"),
    endsAt: z.string().min(1, "End time is required"),
    notes: z.string().optional(),
  })
  .refine((data) => new Date(data.endsAt).getTime() >= new Date(data.startsAt).getTime(), {
    message: "End time must be after start time",
    path: ["endsAt"],
  })

export function CreateShiftDialog({
  open,
  onOpenChange,
  events,
  selectedEventId,
  onCreate,
}: CreateShiftDialogProps) {
  const form = useForm<CreateShiftPayload>({
    resolver: zodResolver(schema),
    defaultValues: {
      eventId: selectedEventId || events[0]?.id || "",
      name: "",
      startsAt: "",
      endsAt: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset({
        eventId: selectedEventId || events[0]?.id || "",
        name: "",
        startsAt: "",
        endsAt: "",
        notes: "",
      })
    }
  }, [open, selectedEventId, events, form])

  const firstError = Object.values(form.formState.errors)[0]?.message

  const handleSubmit = form.handleSubmit((data) => {
    onCreate({
      ...data,
      notes: data.notes || undefined,
    })
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Shift</DialogTitle>
          <DialogDescription>
            Define a shift block for the selected event and operational team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
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

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Name</label>
              <Input
                {...form.register("name")}
                placeholder="Morning Shift"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Starts at</label>
              <Input
                type="datetime-local"
                {...form.register("startsAt")}
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Ends at</label>
              <Input
                type="datetime-local"
                {...form.register("endsAt")}
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Notes / Description (optional)</label>
              <Textarea
                {...form.register("notes")}
                placeholder="Scope and role assignments for this shift"
                className="min-h-[96px] bg-[#1A1A1F] border-[#2B2B30]"
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
            <Button type="submit">Create Shift</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
