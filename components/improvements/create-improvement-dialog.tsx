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

interface IncidentOption {
  id: string
  title: string
}

export interface CreateImprovementPayload {
  organizationId: string
  relatedEventId: string | null
  relatedIncidentId: string | null
  type: "IMPROVEMENT" | "INNOVATION" | "PROCESS"
  title: string
  description: string
  priority?: number
}

interface CreateImprovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId?: string
  organizationName?: string
  events: EventOption[]
  incidents: IncidentOption[]
  onCreate: (payload: CreateImprovementPayload) => void
}

const schema = z.object({
  organizationId: z.string().min(1, "Organization is required"),
  relatedEventId: z.string().nullable(),
  relatedIncidentId: z.string().nullable(),
  type: z.enum(["IMPROVEMENT", "INNOVATION", "PROCESS"]),
  title: z.string().trim().min(3, "Title is required"),
  description: z.string().trim().min(5, "Description is required"),
  priority: z.number().int().min(1).max(5).optional(),
})

export function CreateImprovementDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
  events,
  incidents,
  onCreate,
}: CreateImprovementDialogProps) {
  const form = useForm<CreateImprovementPayload>({
    resolver: zodResolver(schema),
    defaultValues: {
      organizationId: organizationId ?? "",
      relatedEventId: null,
      relatedIncidentId: null,
      type: "IMPROVEMENT",
      title: "",
      description: "",
      priority: undefined,
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset({
        organizationId: organizationId ?? "",
        relatedEventId: null,
        relatedIncidentId: null,
        type: "IMPROVEMENT",
        title: "",
        description: "",
        priority: undefined,
      })
    }
  }, [open, organizationId, form])

  const firstError = Object.values(form.formState.errors)[0]?.message

  const handleSubmit = form.handleSubmit((data) => {
    onCreate(data)
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>New Improvement</DialogTitle>
          <DialogDescription>
            Log a process improvement or innovation request for follow-up.
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

            <div className="space-y-2">
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Related incident (optional)</label>
              <Select
                value={form.watch("relatedIncidentId") ?? "none"}
                onValueChange={(value) =>
                  form.setValue("relatedIncidentId", value === "none" ? null : value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue placeholder="Select incident" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No related incident</SelectItem>
                  {incidents.map((incident) => (
                    <SelectItem key={incident.id} value={incident.id}>
                      {incident.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Type</label>
              <Select
                value={form.watch("type")}
                onValueChange={(value: CreateImprovementPayload["type"]) =>
                  form.setValue("type", value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMPROVEMENT">IMPROVEMENT</SelectItem>
                  <SelectItem value="INNOVATION">INNOVATION</SelectItem>
                  <SelectItem value="PROCESS">PROCESS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Priority (1-5, optional)</label>
              <Input
                type="number"
                min={1}
                max={5}
                {...form.register("priority", {
                  setValueAs: (value) => (value === "" ? undefined : Number(value)),
                })}
                placeholder="3"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Title</label>
              <Input
                {...form.register("title")}
                placeholder="Improve referee communication flow"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Description</label>
              <Textarea
                {...form.register("description")}
                placeholder="Describe expected impact, implementation notes, and owner"
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
            <Button type="submit">Save Improvement</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
