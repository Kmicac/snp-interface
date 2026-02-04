"use client"

import { useEffect, useMemo, useState } from "react"
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
import { ImageUpload } from "@/components/shared/image-upload"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type StaffRoleFormValue =
  | "STAFF"
  | "SECURITY"
  | "LOGISTICS"
  | "CLEANING"
  | "REFEREE"
  | "MEDIC"
  | "PRODUCTION"
  | "TICKETING"
  | "OTHER"

export interface CreateStaffPayload {
  fullName: string
  documentId?: string
  phone?: string
  email?: string
  avatarUrl?: string
  photoFile?: File | null
  role: StaffRoleFormValue
  notes?: string
}

interface CreateStaffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: "create" | "edit"
  initialValues?: Partial<CreateStaffPayload>
  onCreate: (payload: CreateStaffPayload) => void
}

const schema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  documentId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Enter a valid email").or(z.literal("")),
  role: z.enum(["STAFF", "SECURITY", "LOGISTICS", "CLEANING", "REFEREE", "MEDIC", "PRODUCTION", "TICKETING", "OTHER"]),
  notes: z.string().optional(),
})

export function CreateStaffDialog({
  open,
  onOpenChange,
  mode = "create",
  initialValues,
  onCreate,
}: CreateStaffDialogProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)

  const defaultValues = useMemo<CreateStaffPayload>(
    () => ({
      fullName: initialValues?.fullName || "",
      documentId: initialValues?.documentId || "",
      phone: initialValues?.phone || "",
      email: initialValues?.email || "",
      role: initialValues?.role || "STAFF",
      notes: initialValues?.notes || "",
      avatarUrl: initialValues?.avatarUrl,
      photoFile: null,
    }),
    [initialValues]
  )

  const form = useForm<CreateStaffPayload>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
      setPhotoFile(null)
      setExistingPhotoUrl(initialValues?.avatarUrl ?? null)
    }
  }, [open])

  const firstError = Object.values(form.formState.errors)[0]?.message

  const handleSubmit = form.handleSubmit((data) => {
    onCreate({
      ...data,
      documentId: data.documentId || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      notes: data.notes || undefined,
      photoFile,
      avatarUrl: existingPhotoUrl ?? undefined,
    })
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update staff details for operations planning and access control."
              : "Register a staff profile for operations planning and access control."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Full name</label>
              <Input
                {...form.register("fullName")}
                placeholder="Ana Garcia"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Document ID (optional)</label>
              <Input
                {...form.register("documentId")}
                placeholder="DNI 12345678"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Phone (optional)</label>
              <Input
                {...form.register("phone")}
                placeholder="+54 9 11 5555 1234"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Email (optional)</label>
              <Input
                type="email"
                {...form.register("email")}
                placeholder="ana@snp.com"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <ImageUpload
                label="Profile photo"
                description="Optional. Add a staff photo using drag and drop or file picker."
                value={photoFile}
                onChange={setPhotoFile}
                existingImageUrl={existingPhotoUrl}
                onClearExisting={() => setExistingPhotoUrl(null)}
                maxSizeMB={5}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Role</label>
              <Select
                value={form.watch("role")}
                onValueChange={(value: StaffRoleFormValue) => form.setValue("role", value, { shouldValidate: true })}
              >
                <SelectTrigger className="bg-[#1A1A1F] border-[#2B2B30]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">STAFF</SelectItem>
                  <SelectItem value="SECURITY">SECURITY</SelectItem>
                  <SelectItem value="LOGISTICS">LOGISTICS</SelectItem>
                  <SelectItem value="CLEANING">CLEANING</SelectItem>
                  <SelectItem value="REFEREE">REFEREE</SelectItem>
                  <SelectItem value="MEDIC">MEDIC</SelectItem>
                  <SelectItem value="PRODUCTION">PRODUCTION</SelectItem>
                  <SelectItem value="TICKETING">TICKETING</SelectItem>
                  <SelectItem value="OTHER">OTHER</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Notes (optional)</label>
              <Textarea
                {...form.register("notes")}
                placeholder="Availability, supervisor notes, or constraints"
                className="min-h-[96px] bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>
          </div>

          {firstError && <p className="text-xs text-red-400">{String(firstError)}</p>}

          <p className="text-xs text-gray-500">
            These changes update local mock data only. Later this will call the real SNP backend.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{mode === "edit" ? "Save changes" : "Add Staff Member"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
