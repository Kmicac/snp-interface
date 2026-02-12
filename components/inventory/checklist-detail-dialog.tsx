"use client"

import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AssetCondition, InventoryChecklist, SignChecklistDto, VerifyChecklistItemDto } from "@/lib/inventory/types"
import { SignaturePad } from "./signature-pad"

interface ChecklistDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  checklist: InventoryChecklist | null
  isSubmitting?: boolean
  onVerifyItem: (payload: VerifyChecklistItemDto) => Promise<boolean>
  onSign: (payload: SignChecklistDto) => Promise<boolean>
  onDelete: () => Promise<boolean>
}

interface ItemDraft {
  checkedQty: number
  condition: AssetCondition | null
  notes: string
}

const CONDITION_OPTIONS: AssetCondition[] = ["NEW", "GOOD", "FAIR", "POOR", "BROKEN"]

function statusBadgeClass(status: string): string {
  const normalized = status.toUpperCase()
  if (["SIGNED", "COMPLETED", "CLOSED"].includes(normalized)) return "border-emerald-500/30 bg-emerald-500/20 text-emerald-200"
  if (["IN_PROGRESS"].includes(normalized)) return "border-blue-500/30 bg-blue-500/20 text-blue-200"
  return "border-amber-500/30 bg-amber-500/20 text-amber-200"
}

export function ChecklistDetailDialog({ open, onOpenChange, checklist, isSubmitting, onVerifyItem, onSign, onDelete }: ChecklistDetailDialogProps) {
  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>({})
  const [signerName, setSignerName] = useState("")
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isSigned = useMemo(() => {
    const status = checklist?.status?.toUpperCase() || ""
    return ["SIGNED", "COMPLETED", "CLOSED"].includes(status)
  }, [checklist?.status])

  useEffect(() => {
    if (!open || !checklist) return

    const nextDrafts: Record<string, ItemDraft> = {}
    checklist.items.forEach((item) => {
      nextDrafts[item.id] = {
        checkedQty: item.checkedQty ?? 0,
        condition: item.condition ?? "GOOD",
        notes: item.notes || "",
      }
    })

    setDrafts(nextDrafts)
    setSignerName(checklist.signedBy || "")
    setSignatureDataUrl(null)
    setError(null)
  }, [checklist, open])

  const verifiedCount = useMemo(() => checklist?.items.filter((item) => item.verified).length || 0, [checklist])

  if (!checklist) return null

  async function handleVerify(itemId: string) {
    const draft = drafts[itemId]
    if (!draft) return

    const success = await onVerifyItem({
      itemId,
      checkedQty: Math.max(0, Number(draft.checkedQty) || 0),
      condition: draft.condition,
      notes: draft.notes || null,
    })

    if (!success) {
      setError("No fue posible verificar el item.")
      return
    }

    setError(null)
  }

  async function handleSignChecklist() {
    if (!signatureDataUrl) {
      setError("Debes registrar una firma antes de firmar.")
      return
    }

    const success = await onSign({
      signatureDataUrl,
      signerName: signerName.trim() || null,
    })

    if (!success) {
      setError("No fue posible firmar el checklist.")
      return
    }

    setError(null)
  }

  async function handleDeleteChecklist() {
    const success = await onDelete()
    if (success) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-y-auto border-[#1F1F23] bg-[#0F0F12] text-white sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Checklist {checklist.id}</DialogTitle>
          <DialogDescription>
            {checklist.type} · {checklist.eventName || checklist.eventId || "Sin evento"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge className={statusBadgeClass(checklist.status)}>Estado: {checklist.status}</Badge>
          <Badge className="border-[#2B2B30] bg-[#171A22] text-gray-200">
            Progreso: {verifiedCount}/{checklist.items.length}
          </Badge>
          <Badge className="border-[#2B2B30] bg-[#171A22] text-gray-200">Responsable: {checklist.signedBy || "-"}</Badge>
        </div>

        <div className="overflow-x-auto rounded-md border border-[#2B2B30]">
          <table className="w-full min-w-[1060px] text-sm">
            <thead>
              <tr className="border-b border-[#2B2B30] bg-[#151821] text-left text-xs uppercase text-gray-500">
                <th className="px-3 py-2">Equipo</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Esperada</th>
                <th className="px-3 py-2">Verificada</th>
                <th className="px-3 py-2">Condicion</th>
                <th className="px-3 py-2">Notas</th>
                <th className="px-3 py-2">Accion</th>
              </tr>
            </thead>
            <tbody>
              {checklist.items.map((item) => {
                const draft = drafts[item.id]
                return (
                  <tr key={item.id} className="border-b border-[#2B2B30] bg-[#10131A] text-gray-300">
                    <td className="px-3 py-2 text-white">{item.assetName}</td>
                    <td className="px-3 py-2">{item.assetId}</td>
                    <td className="px-3 py-2">{item.expectedQty}</td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={draft?.checkedQty ?? 0}
                        disabled={isSigned}
                        className="h-8 w-24 border-[#2B2B30] bg-[#171A22]"
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [item.id]: {
                              checkedQty: Number(event.target.value) || 0,
                              condition: prev[item.id]?.condition ?? "GOOD",
                              notes: prev[item.id]?.notes || "",
                            },
                          }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Select
                        value={draft?.condition || "GOOD"}
                        onValueChange={(value) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [item.id]: {
                              checkedQty: prev[item.id]?.checkedQty ?? 0,
                              condition: value as AssetCondition,
                              notes: prev[item.id]?.notes || "",
                            },
                          }))
                        }
                        disabled={isSigned}
                      >
                        <SelectTrigger className="h-8 w-32 border-[#2B2B30] bg-[#171A22]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_OPTIONS.map((condition) => (
                            <SelectItem key={condition} value={condition}>
                              {condition}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={draft?.notes || ""}
                        disabled={isSigned}
                        className="h-8 border-[#2B2B30] bg-[#171A22]"
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [item.id]: {
                              checkedQty: prev[item.id]?.checkedQty ?? 0,
                              condition: prev[item.id]?.condition ?? "GOOD",
                              notes: event.target.value,
                            },
                          }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Button size="sm" disabled={isSubmitting || isSigned} onClick={() => void handleVerify(item.id)}>
                        Verificar
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-2">
          <Label>Firmante</Label>
          <Input
            value={signerName}
            onChange={(event) => setSignerName(event.target.value)}
            placeholder="Nombre de quien firma"
            className="border-[#2B2B30] bg-[#171A22]"
            disabled={isSigned}
          />
        </div>

        {!isSigned ? <SignaturePad onChange={setSignatureDataUrl} disabled={isSubmitting} /> : null}

        {error ? <p className="text-xs text-red-400">{error}</p> : null}

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button type="button" variant="destructive" onClick={() => void handleDeleteChecklist()} disabled={isSubmitting}>
            Eliminar
          </Button>
          <Button type="button" onClick={() => void handleSignChecklist()} disabled={isSubmitting || isSigned}>
            {isSubmitting ? "Guardando..." : isSigned ? "Checklist firmado" : "Firmar checklist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
