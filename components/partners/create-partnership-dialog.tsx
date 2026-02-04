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

interface BrandOption {
  id: string
  name: string
}

export interface CreatePartnershipPayload {
  brandId: string
  status: "PROSPECT" | "ACTIVE" | "INACTIVE"
  startDate?: string
  endDate?: string
  scope: string
  benefits?: string
  notes?: string
}

interface CreatePartnershipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brands: BrandOption[]
  mode?: "create" | "edit"
  initialValues?: Partial<CreatePartnershipPayload>
  onCreate: (payload: CreatePartnershipPayload) => void
}

const schema = z
  .object({
    brandId: z.string().min(1, "Brand is required"),
    status: z.enum(["PROSPECT", "ACTIVE", "INACTIVE"]),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    scope: z.string().trim().min(4, "Scope is required"),
    benefits: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => !data.startDate || !data.endDate || new Date(data.endDate).getTime() >= new Date(data.startDate).getTime(),
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  )

export function CreatePartnershipDialog({
  open,
  onOpenChange,
  brands,
  mode = "create",
  initialValues,
  onCreate,
}: CreatePartnershipDialogProps) {
  const defaultValues = useMemo<CreatePartnershipPayload>(
    () => ({
      brandId: initialValues?.brandId || brands[0]?.id || "",
      status: initialValues?.status || "PROSPECT",
      startDate: initialValues?.startDate || "",
      endDate: initialValues?.endDate || "",
      scope: initialValues?.scope || "",
      benefits: initialValues?.benefits || "",
      notes: initialValues?.notes || "",
    }),
    [brands, initialValues]
  )

  const form = useForm<CreatePartnershipPayload>({
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
    onCreate({
      ...data,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
      benefits: data.benefits || undefined,
      notes: data.notes || undefined,
    })
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Partnership" : "Add Partnership"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update partnership scope, timeline, and commercial details."
              : "Define a formal partnership scope and timeline for a selected brand."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Brand</label>
              <Select
                value={form.watch("brandId")}
                onValueChange={(value) => form.setValue("brandId", value, { shouldValidate: true })}
                disabled={mode === "edit"}
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
              <label className="text-sm font-medium text-gray-200">Status</label>
              <Select
                value={form.watch("status")}
                onValueChange={(value: CreatePartnershipPayload["status"]) =>
                  form.setValue("status", value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROSPECT">PROSPECT</SelectItem>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Start date (optional)</label>
              <Input
                type="date"
                {...form.register("startDate")}
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">End date (optional)</label>
              <Input
                type="date"
                {...form.register("endDate")}
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Scope</label>
              <Textarea
                {...form.register("scope")}
                placeholder="Technical partner for safety trainings"
                className="min-h-[88px] bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Benefits (optional)</label>
              <Textarea
                {...form.register("benefits")}
                placeholder="Brand visibility, product integration, and audience reach"
                className="min-h-[88px] bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Notes (optional)</label>
              <Textarea
                {...form.register("notes")}
                placeholder="Negotiation details and next follow-up date"
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
            <Button type="submit">{mode === "edit" ? "Save changes" : "Add Partnership"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
