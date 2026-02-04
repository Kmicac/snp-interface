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

interface StaffOption {
  id: string
  name: string
}

export interface CreateRefereeProfilePayload {
  staffId: string
  rank: string
  association?: string
  experience?: string
  active: boolean
}

interface CreateRefereeProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staffMembers: StaffOption[]
  mode?: "create" | "edit"
  initialValues?: Partial<CreateRefereeProfilePayload>
  onCreate: (payload: CreateRefereeProfilePayload) => void
}

const schema = z.object({
  staffId: z.string().min(1, "Staff member is required"),
  rank: z.string().trim().min(2, "Rank is required"),
  association: z.string().optional(),
  experience: z.string().optional(),
  active: z.boolean(),
})

export function CreateRefereeProfileDialog({
  open,
  onOpenChange,
  staffMembers,
  mode = "create",
  initialValues,
  onCreate,
}: CreateRefereeProfileDialogProps) {
  const defaultValues = useMemo<CreateRefereeProfilePayload>(
    () => ({
      staffId: initialValues?.staffId || staffMembers[0]?.id || "",
      rank: initialValues?.rank || "",
      association: initialValues?.association || "",
      experience: initialValues?.experience || "",
      active: initialValues?.active ?? true,
    }),
    [initialValues, staffMembers]
  )

  const form = useForm<CreateRefereeProfilePayload>({
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
      association: data.association || undefined,
      experience: data.experience || undefined,
    })
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Referee Profile" : "Create Referee Profile"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update referee profile attributes and availability."
              : "Create a referee profile based on an existing staff member."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Staff member</label>
              <Select
                value={form.watch("staffId")}
                onValueChange={(value) => form.setValue("staffId", value, { shouldValidate: true })}
                disabled={mode === "edit"}
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
              <label className="text-sm font-medium text-gray-200">Rank / belt</label>
              <Input
                {...form.register("rank")}
                placeholder="Black Belt 2nd Dan"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Association (optional)</label>
              <Input
                {...form.register("association")}
                placeholder="ADCC"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Experience (optional)</label>
              <Textarea
                {...form.register("experience")}
                placeholder="Refereeing since 2015 in regional and international competitions"
                className="min-h-[96px] bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <label className="flex items-center gap-3 rounded-md border border-[#2B2B30] bg-[#1A1A1F] px-3 py-2 md:col-span-2">
              <Checkbox
                checked={form.watch("active")}
                onCheckedChange={(checked) => form.setValue("active", checked === true, { shouldValidate: true })}
              />
              <span className="text-sm text-gray-200">Active referee profile</span>
            </label>
          </div>

          {firstError && <p className="text-xs text-red-400">{String(firstError)}</p>}

          <p className="text-xs text-gray-500">
            This only updates local mock data for now. Later this will create records in the real SNP backend.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{mode === "edit" ? "Save changes" : "Create Referee Profile"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
