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

interface StaffOption {
  id: string
  name: string
}

export interface IssueCredentialPayload {
  eventId: string
  staffId: string
  zone: string | null
  status: "ACTIVE"
  note?: string
}

interface IssueCredentialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  events: EventOption[]
  selectedEventId?: string
  staffMembers: StaffOption[]
  zones: string[]
  onCreate: (payload: IssueCredentialPayload) => void
}

const schema = z.object({
  eventId: z.string().min(1, "Event is required"),
  staffId: z.string().min(1, "Staff member is required"),
  zone: z.string().nullable(),
  status: z.literal("ACTIVE"),
  note: z.string().optional(),
})

export function IssueCredentialDialog({
  open,
  onOpenChange,
  events,
  selectedEventId,
  staffMembers,
  zones,
  onCreate,
}: IssueCredentialDialogProps) {
  const form = useForm<IssueCredentialPayload>({
    resolver: zodResolver(schema),
    defaultValues: {
      eventId: selectedEventId || events[0]?.id || "",
      staffId: staffMembers[0]?.id || "",
      zone: null,
      status: "ACTIVE",
      note: "",
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset({
        eventId: selectedEventId || events[0]?.id || "",
        staffId: staffMembers[0]?.id || "",
        zone: null,
        status: "ACTIVE",
        note: "",
      })
    }
  }, [open, selectedEventId, events, staffMembers, form])

  const firstError = Object.values(form.formState.errors)[0]?.message

  const handleSubmit = form.handleSubmit((data) => {
    onCreate({
      ...data,
      note: data.note || undefined,
    })
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Issue Credential</DialogTitle>
          <DialogDescription>
            Grant credential access to a staff member for the selected event.
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
              <label className="text-sm font-medium text-gray-200">Staff member</label>
              <Select
                value={form.watch("staffId")}
                onValueChange={(value) => form.setValue("staffId", value, { shouldValidate: true })}
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
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
                  <SelectItem value="none">No zone restriction</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Status</label>
              <Select value={form.watch("status")} disabled>
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30] text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Note / message to staff (optional)</label>
              <Textarea
                {...form.register("note")}
                placeholder="Credential valid for backstage and warm-up area"
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
            <Button type="submit">Issue Credential</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
