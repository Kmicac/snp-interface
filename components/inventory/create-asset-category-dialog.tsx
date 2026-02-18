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

export interface CreateAssetCategoryPayload {
  name: string
  description?: string
}

interface CreateAssetCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (payload: CreateAssetCategoryPayload) => Promise<boolean | void> | boolean | void
  isSubmitting?: boolean
}

const schema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  description: z.string().optional(),
})

export function CreateAssetCategoryDialog({
  open,
  onOpenChange,
  onCreate,
  isSubmitting = false,
}: CreateAssetCategoryDialogProps) {
  const form = useForm<CreateAssetCategoryPayload>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset({ name: "", description: "" })
    }
  }, [open, form])

  const firstError = Object.values(form.formState.errors)[0]?.message

  const handleSubmit = form.handleSubmit(async (data) => {
    const success = await onCreate({
      ...data,
      description: data.description || undefined,
    })
    if (success !== false) {
      onOpenChange(false)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>
            Create a reusable inventory category for assets.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Name</label>
              <Input
                {...form.register("name")}
                placeholder="Cameras"
                className="bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Description (optional)</label>
              <Textarea
                {...form.register("description")}
                placeholder="Equipment used for recording fights and interviews"
                className="min-h-[96px] bg-[#1A1A1F] border-[#2B2B30]"
              />
            </div>
          </div>

          {firstError && <p className="text-xs text-red-400">{String(firstError)}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
