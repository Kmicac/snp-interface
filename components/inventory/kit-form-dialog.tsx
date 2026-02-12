"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Asset, CreateKitDto, InventoryKit, UpdateKitDto } from "@/lib/inventory/types"

interface KitFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assets: Asset[]
  mode?: "create" | "edit"
  initialValues?: InventoryKit | null
  isSubmitting?: boolean
  onSubmit: (payload: CreateKitDto | UpdateKitDto) => Promise<boolean>
}

interface KitItemDraft {
  id: string
  assetId: string
  quantity: number
}

const EVENT_TYPE_OPTIONS = ["TOURNAMENT", "SEMINAR", "OPEN", "PRIVATE", "OTHER"]

export function KitFormDialog({ open, onOpenChange, assets, mode = "create", initialValues, isSubmitting, onSubmit }: KitFormDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [eventType, setEventType] = useState("TOURNAMENT")
  const [items, setItems] = useState<KitItemDraft[]>([])
  const [error, setError] = useState<string | null>(null)

  const assetById = useMemo(() => new Map(assets.map((asset) => [asset.id, asset])), [assets])

  useEffect(() => {
    if (!open) return

    setName(initialValues?.name || "")
    setDescription(initialValues?.description || "")
    setEventType(initialValues?.eventType || "TOURNAMENT")
    setItems(
      initialValues?.items?.length
        ? initialValues.items.map((item, index) => ({
            id: `${item.assetId}-${index}`,
            assetId: item.assetId,
            quantity: item.quantity || 1,
          }))
        : [{ id: `row-${Date.now()}`, assetId: "", quantity: 1 }]
    )
    setError(null)
  }, [initialValues, open])

  const addItem = () => {
    setItems((prev) => [...prev, { id: `row-${Date.now()}-${prev.length}`, assetId: "", quantity: 1 }])
  }

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  const updateItem = (itemId: string, patch: Partial<KitItemDraft>) => {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item)))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      setError("El nombre del kit es obligatorio.")
      return
    }

    const normalizedItems = items
      .filter((item) => item.assetId)
      .map((item) => ({
        assetId: item.assetId,
        quantity: Math.max(1, Number(item.quantity) || 1),
      }))

    if (normalizedItems.length === 0) {
      setError("Debes agregar al menos un item al kit.")
      return
    }

    const payload: CreateKitDto | UpdateKitDto = {
      name: name.trim(),
      description: description.trim() || null,
      eventType: eventType || null,
      items: normalizedItems,
    }

    const success = await onSubmit(payload)
    if (success) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Editar Kit" : "Nuevo Kit"}</DialogTitle>
          <DialogDescription>Define nombre, tipo de evento e items que componen este kit de inventario.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} className="border-[#2B2B30] bg-[#171A22]" />
            </div>
            <div className="space-y-2">
              <Label>Tipo de evento</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="border-[#2B2B30] bg-[#171A22]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Input value={description} onChange={(event) => setDescription(event.target.value)} className="border-[#2B2B30] bg-[#171A22]" />
            </div>
          </div>

          <div className="rounded-lg border border-[#2B2B30] bg-[#11141d]">
            <div className="flex items-center justify-between border-b border-[#2B2B30] px-4 py-3">
              <p className="text-sm font-medium text-white">Items del kit</p>
              <Button type="button" size="sm" variant="outline" className="border-[#2B2B30] bg-transparent" onClick={addItem}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Agregar item
              </Button>
            </div>

            <div className="space-y-2 p-3">
              {items.map((item) => {
                const selectedAsset = item.assetId ? assetById.get(item.assetId) : null

                return (
                  <div key={item.id} className="grid grid-cols-1 gap-2 rounded-md border border-[#2B2B30] bg-[#151821] p-3 md:grid-cols-[1fr_140px_140px_100px]">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-400">Asset</Label>
                      <Select value={item.assetId || "none"} onValueChange={(value) => updateItem(item.id, { assetId: value === "none" ? "" : value })}>
                        <SelectTrigger className="border-[#2B2B30] bg-[#10131A]">
                          <SelectValue placeholder="Selecciona asset" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Seleccionar</SelectItem>
                          {assets.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>
                              {asset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-400">Categoria</Label>
                      <Input value={selectedAsset?.category?.name || "-"} disabled className="border-[#2B2B30] bg-[#10131A]" />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-400">Cantidad</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) || 1 })}
                        className="border-[#2B2B30] bg-[#10131A]"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-400">Accion</Label>
                      <Button type="button" variant="ghost" className="w-full text-red-300 hover:text-red-200" onClick={() => removeItem(item.id)}>
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Quitar
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {error ? <p className="text-xs text-red-400">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Crear kit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
