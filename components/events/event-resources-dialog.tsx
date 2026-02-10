"use client"

import { useEffect, useMemo, useState } from "react"
import { Package, Search, Users2 } from "lucide-react"

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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import type { Asset, Staff } from "@/lib/types"
import { cn } from "@/lib/utils"

interface EventResourcesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventName?: string
  staffOptions: Staff[]
  assetOptions: Asset[]
  initialStaffIds?: string[]
  initialAssetIds?: string[]
  onSave: (payload: { staffIds: string[]; assetIds: string[] }) => void
}

export function EventResourcesDialog({
  open,
  onOpenChange,
  eventName,
  staffOptions,
  assetOptions,
  initialStaffIds = [],
  initialAssetIds = [],
  onSave,
}: EventResourcesDialogProps) {
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])
  const [staffQuery, setStaffQuery] = useState("")
  const [assetQuery, setAssetQuery] = useState("")

  useEffect(() => {
    if (!open) return

    setSelectedStaffIds(initialStaffIds)
    setSelectedAssetIds(initialAssetIds)
    setStaffQuery("")
    setAssetQuery("")
  }, [open, initialStaffIds, initialAssetIds])

  const filteredStaff = useMemo(
    () =>
      staffOptions.filter((staff) => {
        const query = staffQuery.toLowerCase().trim()
        if (!query) return true
        return `${staff.name} ${staff.email} ${staff.roles.join(" ")}`.toLowerCase().includes(query)
      }),
    [staffOptions, staffQuery]
  )

  const filteredAssets = useMemo(
    () =>
      assetOptions.filter((asset) => {
        const query = assetQuery.toLowerCase().trim()
        if (!query) return true
        return `${asset.name} ${asset.category} ${asset.location}`.toLowerCase().includes(query)
      }),
    [assetOptions, assetQuery]
  )

  const toggleStaff = (staffId: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(staffId) ? prev.filter((id) => id !== staffId) : [...prev, staffId]
    )
  }

  const toggleAsset = (assetId: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    )
  }

  const handleSave = () => {
    onSave({
      staffIds: selectedStaffIds,
      assetIds: selectedAssetIds,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Assign Staff and Assets</DialogTitle>
          <DialogDescription>
            Manage resources linked to <span className="font-medium text-gray-300">{eventName || "this event"}</span>.
            A staff member can be assigned to multiple events.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-[#1F1F23] bg-[#11131A] p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-100">
                <Users2 className="h-4 w-4 text-blue-300" />
                Staff
              </div>
              <span className="rounded-full border border-[#2B3040] bg-[#1A2030] px-2 py-0.5 text-xs text-gray-200">
                {selectedStaffIds.length} assigned
              </span>
            </div>

            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={staffQuery}
                onChange={(event) => setStaffQuery(event.target.value)}
                placeholder="Search staff"
                className="border-[#2B2B30] bg-[#1A1A1F] pl-8"
              />
            </div>

            <ScrollArea className="h-[280px] pr-1">
              <div className="space-y-2">
                {filteredStaff.map((staff) => {
                  const checked = selectedStaffIds.includes(staff.id)

                  return (
                    <label
                      key={staff.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-md border p-2 transition-colors",
                        checked ? "border-blue-500/30 bg-blue-500/10" : "border-[#23252C] bg-[#151821]"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleStaff(staff.id)}
                        className="mt-0.5 border-[#3A3D47] data-[state=checked]:bg-blue-500/70"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-gray-100">{staff.name}</span>
                        <span className="block truncate text-xs text-gray-400">{staff.roles.join(", ")}</span>
                      </span>
                    </label>
                  )
                })}

                {filteredStaff.length === 0 ? (
                  <div className="rounded-md border border-dashed border-[#2A2C33] bg-[#13151A] p-3 text-xs text-gray-400">
                    No staff matches your search.
                  </div>
                ) : null}
              </div>
            </ScrollArea>
          </section>

          <section className="rounded-xl border border-[#1F1F23] bg-[#11131A] p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-100">
                <Package className="h-4 w-4 text-emerald-300" />
                Assets
              </div>
              <span className="rounded-full border border-[#2B3040] bg-[#1A2030] px-2 py-0.5 text-xs text-gray-200">
                {selectedAssetIds.length} assigned
              </span>
            </div>

            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={assetQuery}
                onChange={(event) => setAssetQuery(event.target.value)}
                placeholder="Search assets"
                className="border-[#2B2B30] bg-[#1A1A1F] pl-8"
              />
            </div>

            <ScrollArea className="h-[280px] pr-1">
              <div className="space-y-2">
                {filteredAssets.map((asset) => {
                  const checked = selectedAssetIds.includes(asset.id)

                  return (
                    <label
                      key={asset.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-md border p-2 transition-colors",
                        checked ? "border-emerald-500/30 bg-emerald-500/10" : "border-[#23252C] bg-[#151821]"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleAsset(asset.id)}
                        className="mt-0.5 border-[#3A3D47] data-[state=checked]:bg-emerald-500/70"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-gray-100">{asset.name}</span>
                        <span className="block truncate text-xs text-gray-400">
                          {asset.category} - {asset.location}
                        </span>
                      </span>
                    </label>
                  )
                })}

                {filteredAssets.length === 0 ? (
                  <div className="rounded-md border border-dashed border-[#2A2C33] bg-[#13151A] p-3 text-xs text-gray-400">
                    No assets matches your search.
                  </div>
                ) : null}
              </div>
            </ScrollArea>
          </section>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save assignments
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
