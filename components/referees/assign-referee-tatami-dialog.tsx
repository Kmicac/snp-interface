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

interface TatamiOption {
  id: string
  name: string
}

interface RefereeOption {
  id: string
  name: string
}

export interface AssignRefereeTatamiPayload {
  eventId: string
  tatamiId: string
  refereeId: string
  role: string
}

interface AssignRefereeTatamiDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  events: EventOption[]
  selectedEventId?: string
  tatamis: TatamiOption[]
  referees: RefereeOption[]
  onCreate: (payload: AssignRefereeTatamiPayload) => void
}

const schema = z.object({
  eventId: z.string().min(1, "Event is required"),
  tatamiId: z.string().min(1, "Tatami is required"),
  refereeId: z.string().min(1, "Referee is required"),
  role: z.string().trim().min(2, "Role is required"),
})

export function AssignRefereeTatamiDialog({
  open,
  onOpenChange,
  events,
  selectedEventId,
  tatamis,
  referees,
  onCreate,
}: AssignRefereeTatamiDialogProps) {
  const form = useForm<AssignRefereeTatamiPayload>({
    resolver: zodResolver(schema),
    defaultValues: {
      eventId: selectedEventId || events[0]?.id || "",
      tatamiId: tatamis[0]?.id || "",
      refereeId: referees[0]?.id || "",
      role: "Center Referee",
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset({
        eventId: selectedEventId || events[0]?.id || "",
        tatamiId: tatamis[0]?.id || "",
        refereeId: referees[0]?.id || "",
        role: "Center Referee",
      })
    }
  }, [open, selectedEventId, events, tatamis, referees, form])

  const firstError = Object.values(form.formState.errors)[0]?.message

  const handleSubmit = form.handleSubmit((data) => {
    onCreate(data)
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Referee to Tatami</DialogTitle>
          <DialogDescription>
            Assign an available referee profile to a tatami role for an event.
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
              <label className="text-sm font-medium text-gray-200">Tatami</label>
              <Select
                value={form.watch("tatamiId")}
                onValueChange={(value) => form.setValue("tatamiId", value, { shouldValidate: true })}
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue placeholder="Select tatami" />
                </SelectTrigger>
                <SelectContent>
                  {tatamis.map((tatami) => (
                    <SelectItem key={tatami.id} value={tatami.id}>
                      {tatami.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Referee</label>
              <Select
                value={form.watch("refereeId")}
                onValueChange={(value) => form.setValue("refereeId", value, { shouldValidate: true })}
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue placeholder="Select referee" />
                </SelectTrigger>
                <SelectContent>
                  {referees.map((referee) => (
                    <SelectItem key={referee.id} value={referee.id}>
                      {referee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Role</label>
              <Input
                {...form.register("role")}
                placeholder="Center Referee"
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
            <Button type="submit">Assign to Tatami</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
