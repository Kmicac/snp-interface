"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Event } from "@/lib/types"
import type { InventoryKit } from "@/lib/inventory/types"

interface ApplyKitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kit: InventoryKit | null
  events: Event[]
  defaultEventId?: string
  isSubmitting?: boolean
  onApply: (eventId: string, kitId: string) => Promise<boolean>
}

export function ApplyKitDialog({ open, onOpenChange, kit, events, defaultEventId, isSubmitting, onApply }: ApplyKitDialogProps) {
  const [eventId, setEventId] = useState(defaultEventId || "")
  const [manualEventId, setManualEventId] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setEventId(defaultEventId || events[0]?.id || "")
    setManualEventId("")
    setError(null)
  }, [defaultEventId, events, open])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!kit?.id) {
      setError("Debes seleccionar un kit para aplicar.")
      return
    }

    const normalizedEventId = eventId || manualEventId.trim()
    if (!normalizedEventId) {
      setError("Debes seleccionar un evento.")
      return
    }

    const success = await onApply(normalizedEventId, kit.id)
    if (success) {
      setError(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Aplicar kit a evento</DialogTitle>
          <DialogDescription>Asigna los items del kit al evento y registra los movimientos correspondientes.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2 rounded-md border border-[#2B2B30] bg-[#151821] p-3">
            <p className="text-xs text-gray-500">Kit seleccionado</p>
            <p className="text-sm font-medium text-white">{kit?.name || "-"}</p>
            <p className="text-xs text-gray-400">{kit?.description || "Sin descripcion"}</p>
          </div>

          <div className="space-y-2">
            <Label>Evento</Label>
            {events.length > 0 ? (
              <Select value={eventId || "none"} onValueChange={(value) => setEventId(value === "none" ? "" : value)}>
                <SelectTrigger className="border-[#2B2B30] bg-[#171A22]">
                  <SelectValue placeholder="Seleccionar evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Seleccionar</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={manualEventId}
                onChange={(e) => setManualEventId(e.target.value)}
                placeholder="Ingresa eventId"
                className="border-[#2B2B30] bg-[#171A22]"
              />
            )}
          </div>

          {error ? <p className="text-xs text-red-400">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Aplicando..." : "Aplicar kit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
