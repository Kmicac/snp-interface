"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ClipboardList, Download, Eye, Plus, Trash2 } from "lucide-react"

import { ChecklistDetailDialog } from "@/components/inventory/checklist-detail-dialog"
import { CreateChecklistDialog } from "@/components/inventory/create-checklist-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/context/auth-context"
import { canAccessInventory, canWriteInventory } from "@/lib/inventory/permissions"
import type { Asset, CreateChecklistDto, InventoryChecklist, SignChecklistDto, VerifyChecklistItemDto } from "@/lib/inventory/types"
import { createChecklist, deleteChecklist, exportChecklistPdf, getChecklist, listAssets, listChecklists, signChecklist, verifyChecklistItem } from "@/lib/inventory/utils"

function checklistStatusClass(status: string): string {
  const normalized = status.toUpperCase()
  if (["SIGNED", "COMPLETED", "CLOSED"].includes(normalized)) return "border-emerald-500/30 bg-emerald-500/20 text-emerald-200"
  if (["IN_PROGRESS"].includes(normalized)) return "border-blue-500/30 bg-blue-500/20 text-blue-200"
  return "border-amber-500/30 bg-amber-500/20 text-amber-200"
}

function checklistTypeLabel(type: string): string {
  if (type === "CHECKOUT") return "Carga"
  if (type === "RETURN") return "Return"
  return type
}

export default function InventoryChecklistsPage() {
  const { user, currentOrg, currentEvent, events } = useAuth()
  const { toast } = useToast()

  const [items, setItems] = useState<InventoryChecklist[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<InventoryChecklist | null>(null)
  const [checklistToDelete, setChecklistToDelete] = useState<InventoryChecklist | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const hasAccess = canAccessInventory(user, currentOrg?.id)
  const canWrite = canWriteInventory(user, currentOrg?.id)

  const progressByChecklistId = useMemo(
    () =>
      new Map(
        items.map((item) => [
          item.id,
          {
            verified: item.items.filter((row) => row.verified).length,
            total: item.items.length,
          },
        ])
      ),
    [items]
  )

  const loadData = useCallback(async () => {
    if (!currentOrg?.id || !hasAccess) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const [checklistsResponse, assetsResponse] = await Promise.all([listChecklists(currentOrg.id), listAssets(currentOrg.id)])
      setItems(checklistsResponse)
      setAssets(assetsResponse)
    } catch {
      setItems([])
      setAssets([])
    } finally {
      setIsLoading(false)
    }
  }, [currentOrg?.id, hasAccess])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function handleCreate(payload: CreateChecklistDto) {
    if (!currentOrg?.id) return false

    setIsSaving(true)
    try {
      await createChecklist(currentOrg.id, payload)
      toast({ title: "Checklist creado", description: "Se creo correctamente." })
      await loadData()
      return true
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No fue posible crear checklist.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function openDetail(checklistId: string) {
    if (!currentOrg?.id) return

    setIsSaving(true)
    try {
      const detail = await getChecklist(currentOrg.id, checklistId)
      setSelectedChecklistId(checklistId)
      setSelectedDetail(detail)
      setIsDetailOpen(true)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No fue posible abrir checklist.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleVerifyItem(payload: VerifyChecklistItemDto) {
    if (!currentOrg?.id || !selectedDetail) return false

    setIsSaving(true)
    try {
      const updated = await verifyChecklistItem(currentOrg.id, selectedDetail.id, payload)
      setSelectedDetail(updated)
      await loadData()
      return true
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No fue posible verificar item.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSign(payload: SignChecklistDto) {
    if (!currentOrg?.id || !selectedDetail) return false

    setIsSaving(true)
    try {
      const updated = await signChecklist(currentOrg.id, selectedDetail.id, payload)
      setSelectedDetail(updated)
      await loadData()
      toast({ title: "Checklist firmado", description: "Se firmo correctamente." })
      return true
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No fue posible firmar checklist.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteChecklistById(checklistId: string) {
    if (!currentOrg?.id) return false

    setIsSaving(true)
    try {
      await deleteChecklist(currentOrg.id, checklistId)
      toast({ title: "Checklist eliminado", description: "El checklist fue eliminado." })
      if (selectedDetail?.id === checklistId) {
        setSelectedDetail(null)
        setSelectedChecklistId(null)
      }
      await loadData()
      return true
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No fue posible eliminar checklist.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteFromDetail() {
    if (!selectedDetail) return false
    return deleteChecklistById(selectedDetail.id)
  }

  async function handleExport(checklistId: string) {
    if (!currentOrg?.id) return

    try {
      const blob = await exportChecklistPdf(currentOrg.id, checklistId)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `checklist-${checklistId}.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No fue posible exportar checklist.",
        variant: "destructive",
      })
    }
  }

  if (!currentOrg) {
    return <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">Selecciona una organizacion para continuar.</div>
  }

  if (!hasAccess) {
    return <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200">No tienes permisos para inventario.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <ClipboardList className="h-6 w-6" />
            Checklists
          </h1>
          <p className="text-sm text-gray-400">Control de carga y return de equipos por evento.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} disabled={!canWrite}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo checklist
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? <div className="rounded-xl border border-[#1F1F23] bg-[#0F0F12] p-4 text-sm text-gray-500">Cargando checklists...</div> : null}

        {!isLoading &&
          items.map((item) => {
            const progress = progressByChecklistId.get(item.id) || { verified: 0, total: item.items.length }
            return (
              <div key={item.id} className="rounded-xl border border-[#1F1F23] bg-[#0F0F12] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{item.id}</h3>
                      <Badge className="border-[#2B2B30] bg-[#171A22] text-gray-200">{checklistTypeLabel(item.type)}</Badge>
                      <Badge className={checklistStatusClass(item.status)}>{item.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-400">{item.eventName || item.eventId || "Sin evento"}</p>
                    <p className="text-xs text-gray-500">
                      Progreso: {progress.verified}/{progress.total} · Responsable: {item.signedBy || "-"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="border-[#2B2B30] bg-transparent" onClick={() => void openDetail(item.id)}>
                      <Eye className="mr-1 h-4 w-4" />
                      Ver / Verificar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void handleExport(item.id)}>
                      <Download className="mr-1 h-4 w-4" />
                      Exportar PDF
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-300 hover:text-red-200" disabled={!canWrite} onClick={() => setChecklistToDelete(item)}>
                      <Trash2 className="mr-1 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}

        {!isLoading && items.length === 0 ? (
          <div className="rounded-xl border border-[#1F1F23] bg-[#0F0F12] p-6 text-center text-sm text-gray-500">No hay checklists creados.</div>
        ) : null}
      </div>

      <CreateChecklistDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        assets={assets}
        events={events}
        defaultEventId={currentEvent?.id}
        isSubmitting={isSaving}
        onSubmit={handleCreate}
      />

      <ChecklistDetailDialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open)
          if (!open) {
            setSelectedChecklistId(null)
            setSelectedDetail(null)
          }
        }}
        checklist={selectedDetail || items.find((item) => item.id === selectedChecklistId) || null}
        isSubmitting={isSaving}
        onVerifyItem={handleVerifyItem}
        onSign={handleSign}
        onDelete={handleDeleteFromDetail}
      />

      <AlertDialog
        open={checklistToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setChecklistToDelete(null)
        }}
      >
        <AlertDialogContent className="border-[#1F1F23] bg-[#0F0F12] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar checklist</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Vas a eliminar el checklist <span className="font-medium text-white">{checklistToDelete?.id}</span>. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#2B2B30] bg-transparent text-gray-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-500"
              onClick={(event) => {
                event.preventDefault()
                if (checklistToDelete?.id) {
                  void deleteChecklistById(checklistToDelete.id).then((success) => {
                    if (success) setChecklistToDelete(null)
                  })
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
