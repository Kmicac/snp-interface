"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  if (type === "LOADING") return "Carga"
  if (type === "UNLOADING") return "Descarga"
  if (type === "RETURN") return "Return"
  return type
}

export function CreateChecklistDialog({ open, onOpenChange, assets: _assets, events, defaultEventId, isSubmitting, onSubmit }: CreateChecklistDialogProps) {
  const [eventId, setEventId] = useState(defaultEventId || "")
  const [type, setType] = useState<ChecklistType>("RETURN")
  const [responsibleName, setResponsibleName] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setEventId(defaultEventId || events[0]?.id || "")
    setType("RETURN")
    setResponsibleName("")
    setNotes("")
    setError(null)
  }, [defaultEventId, events, open])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!eventId) {
      setError("Debes seleccionar un evento.")
      return
    }

    const payload: CreateChecklistDto = {
      eventId,
      checklistType: type,
      responsibleName: responsibleName.trim() || undefined,
      notes: notes.trim() || undefined,
    }

    const success = await onSubmit(payload)
    if (success) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Nuevo checklist</DialogTitle>
          <DialogDescription>Crea un checklist para carga, descarga o retorno de equipos por evento.</DialogDescription>
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
                  <SelectItem value="LOADING">{checklistTypeLabel("LOADING")}</SelectItem>
                  <SelectItem value="UNLOADING">{checklistTypeLabel("UNLOADING")}</SelectItem>
                  <SelectItem value="RETURN">{checklistTypeLabel("RETURN")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Responsable</Label>
              <Input value={responsibleName} onChange={(event) => setResponsibleName(event.target.value)} className="border-[#2B2B30] bg-[#171A22]" />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label>Notas</Label>
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} className="border-[#2B2B30] bg-[#171A22]" />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            El backend construye los ítems desde los activos en uso del evento; este formulario no envía items manuales.
          </p>

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
