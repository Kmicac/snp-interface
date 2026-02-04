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

export type AssetStatusFormValue =
  | "IN_STORAGE"
  | "IN_USE"
  | "DAMAGED"
  | "UNDER_REPAIR"
  | "LOST"
  | "RETIRED"

export type AssetConditionFormValue = "NEW" | "GOOD" | "FAIR" | "POOR" | "BROKEN"

export interface CreateAssetPayload {
  category: string
  name: string
  assetTag?: string
  serialNumber?: string
  quantity: number
  status: AssetStatusFormValue
  condition: AssetConditionFormValue
  location: string
  notes?: string
}

interface CreateAssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: string[]
  onCreate: (payload: CreateAssetPayload) => void
}

const schema = z.object({
  category: z.string().min(1, "Category is required"),
  name: z.string().trim().min(2, "Name is required"),
  assetTag: z.string().optional(),
  serialNumber: z.string().optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  status: z.enum(["IN_STORAGE", "IN_USE", "DAMAGED", "UNDER_REPAIR", "LOST", "RETIRED"]),
  condition: z.enum(["NEW", "GOOD", "FAIR", "POOR", "BROKEN"]),
  location: z.string().trim().min(2, "Location is required"),
  notes: z.string().optional(),
})

export function CreateAssetDialog({ open, onOpenChange, categories, onCreate }: CreateAssetDialogProps) {
  const form = useForm<CreateAssetPayload>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: categories[0] ?? "",
      name: "",
      assetTag: "",
      serialNumber: "",
      quantity: 1,
      status: "IN_STORAGE",
      condition: "GOOD",
      location: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset({
        category: categories[0] ?? "",
        name: "",
        assetTag: "",
        serialNumber: "",
        quantity: 1,
        status: "IN_STORAGE",
        condition: "GOOD",
        location: "",
        notes: "",
      })
    }
  }, [open, categories, form])

  const firstError = Object.values(form.formState.errors)[0]?.message

  const handleSubmit = form.handleSubmit((data) => {
    onCreate({
      ...data,
      assetTag: data.assetTag || undefined,
      serialNumber: data.serialNumber || undefined,
      notes: data.notes || undefined,
    })
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Asset</DialogTitle>
          <DialogDescription>
            Register a new inventory asset and its initial operational status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Category</label>
              <Select
                value={form.watch("category")}
                onValueChange={(value) => form.setValue("category", value, { shouldValidate: true })}
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Name</label>
              <Input
                {...form.register("name")}
                placeholder="Sony A7S Camera"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Asset tag / code (optional)</label>
              <Input
                {...form.register("assetTag")}
                placeholder="SNP-CAM-004"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Serial number (optional)</label>
              <Input
                {...form.register("serialNumber")}
                placeholder="A7S-238741-A"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Quantity</label>
              <Input
                type="number"
                min={1}
                {...form.register("quantity", {
                  setValueAs: (value) => Number(value),
                })}
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Status</label>
              <Select
                value={form.watch("status")}
                onValueChange={(value: AssetStatusFormValue) => form.setValue("status", value, { shouldValidate: true })}
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_STORAGE">IN_STORAGE</SelectItem>
                  <SelectItem value="IN_USE">IN_USE</SelectItem>
                  <SelectItem value="DAMAGED">DAMAGED</SelectItem>
                  <SelectItem value="UNDER_REPAIR">UNDER_REPAIR</SelectItem>
                  <SelectItem value="LOST">LOST</SelectItem>
                  <SelectItem value="RETIRED">RETIRED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Condition</label>
              <Select
                value={form.watch("condition")}
                onValueChange={(value: AssetConditionFormValue) =>
                  form.setValue("condition", value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">NEW</SelectItem>
                  <SelectItem value="GOOD">GOOD</SelectItem>
                  <SelectItem value="FAIR">FAIR</SelectItem>
                  <SelectItem value="POOR">POOR</SelectItem>
                  <SelectItem value="BROKEN">BROKEN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Location</label>
              <Input
                {...form.register("location")}
                placeholder="Main warehouse shelf 3"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Notes (optional)</label>
              <Textarea
                {...form.register("notes")}
                placeholder="Maintenance details, warranty, or deployment notes"
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
            <Button type="submit">Add Asset</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
