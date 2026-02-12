"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Event } from "@/lib/types"
import type { Asset, ChecklistType, CreateChecklistDto } from "@/lib/inventory/types"

interface CreateChecklistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assets: Asset[]
  events: Event[]
  defaultEventId?: string
  isSubmitting?: boolean
  onSubmit: (payload: CreateChecklistDto) => Promise<boolean>
}

function checklistTypeLabel(type: ChecklistType) {
  if (type === "CHECKOUT") return "Carga"
  if (type === "RETURN") return "Return"
  return type
}

export function CreateChecklistDialog({ open, onOpenChange, assets, events, defaultEventId, isSubmitting, onSubmit }: CreateChecklistDialogProps) {
  const [eventId, setEventId] = useState(defaultEventId || "")
  const [type, setType] = useState<ChecklistType>("RETURN")
  const [notes, setNotes] = useState("")
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setEventId(defaultEventId || events[0]?.id || "")
    setType("RETURN")
    setNotes("")
    setSelected({})
    setError(null)
  }, [defaultEventId, events, open])

  function toggleAsset(assetId: string, checked: boolean) {
    setSelected((prev) => {
      if (!checked) {
        const next = { ...prev }
        delete next[assetId]
        return next
      }

      return {
        ...prev,
        [assetId]: prev[assetId] || 1,
      }
    })
  }

  function setAssetQty(assetId: string, value: number) {
    setSelected((prev) => ({
      ...prev,
      [assetId]: Math.max(1, Number(value) || 1),
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const items = Object.entries(selected).map(([assetId, expectedQty]) => ({
      assetId,
      expectedQty,
    }))

    if (items.length === 0) {
      setError("Debes seleccionar al menos un asset.")
      return
    }

    const payload: CreateChecklistDto = {
      eventId: eventId || null,
      type,
      notes: notes.trim() || null,
      items,
    }

    const success = await onSubmit(payload)
    if (success) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Nuevo checklist</DialogTitle>
          <DialogDescription>Crea un checklist para carga/return de equipos por evento.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Evento</Label>
              <Select value={eventId || "none"} onValueChange={(value) => setEventId(value === "none" ? "" : value)}>
                <SelectTrigger className="border-[#2B2B30] bg-[#171A22]">
                  <SelectValue placeholder="Seleccionar evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin evento</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(value) => setType(value as ChecklistType)}>
                <SelectTrigger className="border-[#2B2B30] bg-[#171A22]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHECKOUT">{checklistTypeLabel("CHECKOUT")}</SelectItem>
                  <SelectItem value="RETURN">{checklistTypeLabel("RETURN")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} className="border-[#2B2B30] bg-[#171A22]" />
            </div>
          </div>

          <ScrollArea className="h-80 rounded-md border border-[#2B2B30] bg-[#151821] p-3">
            <div className="space-y-2">
              {assets.map((asset) => {
                const checked = selected[asset.id] !== undefined
                const qty = selected[asset.id] || 1
                return (
                  <div key={asset.id} className="grid grid-cols-1 items-center gap-2 rounded-md border border-[#2B2B30] bg-[#10131A] p-2 md:grid-cols-[1fr_120px_120px]">
                    <label className="flex items-center gap-2 text-sm text-gray-200">
                      <input type="checkbox" checked={checked} onChange={(event) => toggleAsset(asset.id, event.target.checked)} />
                      <span>{asset.name}</span>
                    </label>

                    <p className="text-xs text-gray-400">{asset.assetTag || asset.serialNumber || asset.id}</p>

                    <Input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(event) => setAssetQty(asset.id, Number(event.target.value))}
                      disabled={!checked}
                      className="h-8 border-[#2B2B30] bg-[#171A22]"
                    />
                  </div>
                )
              })}
            </div>
          </ScrollArea>

          {error ? <p className="text-xs text-red-400">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear checklist"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
