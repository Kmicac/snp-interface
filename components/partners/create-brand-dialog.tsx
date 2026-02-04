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

export interface CreateBrandPayload {
  name: string
  logoUrl?: string
  logoFile?: File | null
  websiteUrl?: string
  instagramUrl?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  notes?: string
}

interface CreateBrandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: "create" | "edit"
  initialValues?: Partial<CreateBrandPayload>
  onCreate: (payload: CreateBrandPayload) => void
}

const schema = z.object({
  name: z.string().trim().min(2, "Brand name is required"),
  websiteUrl: z.string().url("Enter a valid URL").or(z.literal("")),
  instagramUrl: z.string().url("Enter a valid URL").or(z.literal("")),
  contactName: z.string().optional(),
  contactEmail: z.string().email("Enter a valid email").or(z.literal("")),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
})

export function CreateBrandDialog({
  open,
  onOpenChange,
  mode = "create",
  initialValues,
  onCreate,
}: CreateBrandDialogProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null)

  const defaultValues = useMemo<CreateBrandPayload>(
    () => ({
      name: initialValues?.name || "",
      websiteUrl: initialValues?.websiteUrl || "",
      instagramUrl: initialValues?.instagramUrl || "",
      contactName: initialValues?.contactName || "",
      contactEmail: initialValues?.contactEmail || "",
      contactPhone: initialValues?.contactPhone || "",
      notes: initialValues?.notes || "",
      logoUrl: initialValues?.logoUrl,
      logoFile: null,
    }),
    [initialValues]
  )

  const form = useForm<CreateBrandPayload>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues)
      setLogoFile(null)
      setExistingLogoUrl(initialValues?.logoUrl ?? null)
    }
  }, [open])

  const firstError = Object.values(form.formState.errors)[0]?.message

  const handleSubmit = form.handleSubmit((data) => {
    onCreate({
      ...data,
      websiteUrl: data.websiteUrl || undefined,
      instagramUrl: data.instagramUrl || undefined,
      contactName: data.contactName || undefined,
      contactEmail: data.contactEmail || undefined,
      contactPhone: data.contactPhone || undefined,
      notes: data.notes || undefined,
      logoFile,
      logoUrl: existingLogoUrl ?? undefined,
    })
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Brand" : "Add Brand"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update brand details for partnerships and sponsorship planning."
              : "Register a new brand profile for partnerships and sponsorship planning."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Name</label>
              <Input
                {...form.register("name")}
                placeholder="Leglock Store"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <ImageUpload
                label="Brand logo"
                description="Optional. Add a brand logo using drag and drop or file picker."
                value={logoFile}
                onChange={setLogoFile}
                existingImageUrl={existingLogoUrl}
                onClearExisting={() => setExistingLogoUrl(null)}
                maxSizeMB={5}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Website URL (optional)</label>
              <Input
                {...form.register("websiteUrl")}
                placeholder="https://leglockstore.com"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Instagram URL (optional)</label>
              <Input
                {...form.register("instagramUrl")}
                placeholder="https://instagram.com/leglockstore"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Contact name (optional)</label>
              <Input
                {...form.register("contactName")}
                placeholder="Maria Silva"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Contact email (optional)</label>
              <Input
                type="email"
                {...form.register("contactEmail")}
                placeholder="maria@leglockstore.com"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Contact phone (optional)</label>
              <Input
                {...form.register("contactPhone")}
                placeholder="+54 9 11 4545 4545"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-200">Notes (optional)</label>
              <Textarea
                {...form.register("notes")}
                placeholder="Main contacts, expectations, and current relationship status"
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
            <Button type="submit">{mode === "edit" ? "Save changes" : "Add Brand"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
