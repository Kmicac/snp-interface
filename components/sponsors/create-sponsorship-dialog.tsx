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

interface BrandOption {
  id: string
  name: string
}

export interface CreateSponsorshipPayload {
  eventId: string
  brandId: string
  tier: "TITLE" | "GOLD" | "SILVER" | "BRONZE" | "SUPPORT"
  status: "PROPOSED" | "NEGOTIATION" | "CONFIRMED" | "CANCELED"
  cashValue?: number
  inKindValue?: number
  benefits: string
  notes?: string
}

interface CreateSponsorshipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  events: EventOption[]
  brands: BrandOption[]
  selectedEventId?: string
  onCreate: (payload: CreateSponsorshipPayload) => void
}

const schema = z.object({
  eventId: z.string().min(1, "Event is required"),
  brandId: z.string().min(1, "Brand is required"),
  tier: z.enum(["TITLE", "GOLD", "SILVER", "BRONZE", "SUPPORT"]),
  status: z.enum(["PROPOSED", "NEGOTIATION", "CONFIRMED", "CANCELED"]),
  cashValue: z.number().min(0).optional(),
  inKindValue: z.number().min(0).optional(),
  benefits: z.string().trim().min(4, "Benefits are required"),
  notes: z.string().optional(),
})

export function CreateSponsorshipDialog({
  open,
  onOpenChange,
  events,
  brands,
  selectedEventId,
  onCreate,
}: CreateSponsorshipDialogProps) {
  const form = useForm<CreateSponsorshipPayload>({
    resolver: zodResolver(schema),
    defaultValues: {
      eventId: selectedEventId || events[0]?.id || "",
      brandId: brands[0]?.id || "",
      tier: "GOLD",
      status: "PROPOSED",
      cashValue: undefined,
      inKindValue: undefined,
      benefits: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset({
        eventId: selectedEventId || events[0]?.id || "",
        brandId: brands[0]?.id || "",
        tier: "GOLD",
        status: "PROPOSED",
        cashValue: undefined,
        inKindValue: undefined,
        benefits: "",
        notes: "",
      })
    }
  }, [open, selectedEventId, events, brands, form])

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
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Sponsorship</DialogTitle>
          <DialogDescription>
            Add a sponsorship proposal or confirmation linked to a brand and event.
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
              <label className="text-sm font-medium text-gray-200">Brand</label>
              <Select
                value={form.watch("brandId")}
                onValueChange={(value) => form.setValue("brandId", value, { shouldValidate: true })}
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Tier</label>
              <Select
                value={form.watch("tier")}
                onValueChange={(value: CreateSponsorshipPayload["tier"]) =>
                  form.setValue("tier", value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TITLE">TITLE</SelectItem>
                  <SelectItem value="GOLD">GOLD</SelectItem>
                  <SelectItem value="SILVER">SILVER</SelectItem>
                  <SelectItem value="BRONZE">BRONZE</SelectItem>
                  <SelectItem value="SUPPORT">SUPPORT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Status</label>
              <Select
                value={form.watch("status")}
                onValueChange={(value: CreateSponsorshipPayload["status"]) =>
                  form.setValue("status", value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROPOSED">PROPOSED</SelectItem>
                  <SelectItem value="NEGOTIATION">NEGOTIATION</SelectItem>
                  <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
                  <SelectItem value="CANCELED">CANCELED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Cash value (optional)</label>
              <Input
                type="number"
                min={0}
                {...form.register("cashValue", {
                  setValueAs: (value) => (value === "" ? undefined : Number(value)),
                })}
                placeholder="50000"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">In-kind value (optional)</label>
              <Input
                type="number"
                min={0}
                {...form.register("inKindValue", {
                  setValueAs: (value) => (value === "" ? undefined : Number(value)),
                })}
                placeholder="15000"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Benefits</label>
              <Textarea
                {...form.register("benefits")}
                placeholder="Brand on center mat, social media mentions"
                className="min-h-[88px] bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Notes (optional)</label>
              <Textarea
                {...form.register("notes")}
                placeholder="Contract status, legal notes, and deadlines"
                className="min-h-[88px] bg-[#1A1A1F] border-[#2B2B30]"
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
            <Button type="submit">Add Sponsorship</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
