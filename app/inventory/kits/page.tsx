"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Boxes, Plus, Trash2, WandSparkles } from "lucide-react"

import { ApplyKitDialog } from "@/components/inventory/apply-kit-dialog"
import { KitFormDialog } from "@/components/inventory/kit-form-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/context/auth-context"
import { invalidateQueryKeys, subscribeInvalidation } from "@/lib/data/query-invalidation"
import { queryKeys } from "@/lib/data/query-keys"
import { canAccessInventory, canWriteInventory } from "@/lib/inventory/permissions"
import type { Asset, CreateKitDto, InventoryKit, UpdateKitDto } from "@/lib/inventory/types"
import { applyKitToEvent, createKit, deleteKit, listAssets, listKits, updateKit } from "@/lib/inventory/utils"

function eventTypeLabel(eventType?: string | null) {
  if (!eventType) return "General"
  return eventType.replaceAll("_", " ")
}

export default function InventoryKitsPage() {
  const { user, currentOrg, currentEvent, events } = useAuth()
  const { toast } = useToast()

  const [kits, setKits] = useState<InventoryKit[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingKit, setEditingKit] = useState<InventoryKit | null>(null)
  const [kitToApply, setKitToApply] = useState<InventoryKit | null>(null)
  const [kitToDelete, setKitToDelete] = useState<InventoryKit | null>(null)

  const hasAccess = canAccessInventory(user, currentOrg?.id)
  const canWrite = canWriteInventory(user, currentOrg?.id)

  const itemCountByKit = useMemo(
    () =>
      new Map(
        kits.map((kit) => [
          kit.id,
          kit.items.reduce((acc, item) => acc + (Number.isFinite(item.quantity) ? item.quantity : 0), 0),
        ])
      ),
    [kits]
  )

  const loadData = useCallback(async () => {
    if (!currentOrg?.id || !hasAccess) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError(null)

    try {
      const [kitsResponse, assetsResponse] = await Promise.all([listKits(currentOrg.id), listAssets(currentOrg.id)])
      setKits(kitsResponse)
      setAssets(assetsResponse)
    } catch (error) {
      setKits([])
      setAssets([])
      setLoadError(error instanceof Error ? error.message : "No fue posible cargar kits.")
    } finally {
      setIsLoading(false)
    }
  }, [currentOrg?.id, hasAccess])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (!currentOrg?.id) return

    const keys = [
      queryKeys.kits(currentOrg.id),
      queryKeys.assets(currentOrg.id),
      queryKeys.movements(currentOrg.id),
      queryKeys.dashboard(currentOrg.id),
      queryKeys.checklists(currentOrg.id),
    ] as Array<readonly unknown[]>

    return subscribeInvalidation(keys, () => {
      void loadData()
    })
  }, [currentOrg?.id, loadData])

  async function handleCreate(payload: CreateKitDto | UpdateKitDto) {
    if (!currentOrg?.id) return false
    setIsSaving(true)
    try {
      await createKit(currentOrg.id, payload as CreateKitDto)
      toast({ title: "Kit creado", description: "El kit se creo correctamente." })
      await loadData()
      return true
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No fue posible crear kit.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdate(payload: CreateKitDto | UpdateKitDto) {
    if (!currentOrg?.id || !editingKit) return false
    setIsSaving(true)
    try {
      await updateKit(currentOrg.id, editingKit.id, payload as UpdateKitDto)
      toast({ title: "Kit actualizado", description: "Los cambios fueron guardados." })
      setEditingKit(null)
      await loadData()
      return true
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No fue posible actualizar kit.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function handleApply(eventId: string, kitId: string) {
    if (!currentOrg?.id) return false
    setIsSaving(true)
    try {
      const result = await applyKitToEvent(currentOrg.id, eventId, kitId)
      const assignedCount = result.assignedCount
      const missingCount = result.missingItems.reduce((total, item) => total + item.quantity, 0)

      toast({
        title: "Kit aplicado",
        description:
          assignedCount > 0 || result.missingItems.length > 0
            ? `Aplicados: ${assignedCount} · Faltantes: ${missingCount}`
            : "Se registraron movimientos para el evento seleccionado.",
      })

      invalidateQueryKeys(
        queryKeys.kits(currentOrg.id),
        queryKeys.assets(currentOrg.id),
        queryKeys.movements(currentOrg.id),
        queryKeys.checklists(currentOrg.id, eventId),
        queryKeys.dashboard(currentOrg.id, eventId),
        queryKeys.event(currentOrg.id, eventId),
        queryKeys.eventResources(eventId),
      )

      await loadData()
      return true
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No fue posible aplicar kit.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteKit() {
    if (!currentOrg?.id || !kitToDelete) return
    setIsSaving(true)
    try {
      await deleteKit(currentOrg.id, kitToDelete.id)
      toast({ title: "Kit eliminado", description: "El kit fue eliminado correctamente." })
      setKitToDelete(null)
      await loadData()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No fue posible eliminar kit.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
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
            <Boxes className="h-6 w-6" />
            Kits de Inventario
          </h1>
          <p className="text-sm text-gray-400">Configura kits reutilizables de equipos y aplicalos rapidamente por evento.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} disabled={!canWrite}>
          <Plus className="mr-2 h-4 w-4" />
          Crear kit
        </Button>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{loadError}</div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-[#1F1F23] bg-[#0F0F12] p-6 text-sm text-gray-500">Cargando kits...</div>
      ) : kits.length === 0 ? (
        <div className="rounded-xl border border-[#1F1F23] bg-[#0F0F12] p-6 text-center text-sm text-gray-500">No hay kits creados aun.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {kits.map((kit) => (
            <div key={kit.id} className="rounded-xl border border-[#1F1F23] bg-[#0F0F12] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{kit.name}</h3>
                  <p className="mt-1 text-sm text-gray-400">{kit.description || "Sin descripcion"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge className="border-[#2B2B30] bg-[#171A22] text-gray-200">{eventTypeLabel(kit.eventType)}</Badge>
                    <Badge className="border-blue-500/30 bg-blue-500/20 text-blue-200">{itemCountByKit.get(kit.id) || 0} items</Badge>
                  </div>
                </div>
                <WandSparkles className="h-5 w-5 text-blue-300" />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="border-[#2B2B30] bg-transparent" onClick={() => setEditingKit(kit)} disabled={!canWrite}>
                  Ver / Editar
                </Button>
                <Button variant="outline" size="sm" className="border-[#2B2B30] bg-transparent" onClick={() => setKitToApply(kit)} disabled={!canWrite}>
                  Aplicar a evento
                </Button>
                <Button variant="ghost" size="sm" className="text-red-300 hover:text-red-200" onClick={() => setKitToDelete(kit)} disabled={!canWrite}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <KitFormDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} assets={assets} isSubmitting={isSaving} onSubmit={handleCreate} />

      <KitFormDialog
        open={editingKit !== null}
        onOpenChange={(open) => {
          if (!open) setEditingKit(null)
        }}
        mode="edit"
        initialValues={editingKit}
        assets={assets}
        isSubmitting={isSaving}
        onSubmit={handleUpdate}
      />

      <ApplyKitDialog
        open={kitToApply !== null}
        onOpenChange={(open) => {
          if (!open) setKitToApply(null)
        }}
        kit={kitToApply}
        events={events}
        defaultEventId={currentEvent?.id}
        isSubmitting={isSaving}
        onApply={handleApply}
      />

      <AlertDialog
        open={kitToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setKitToDelete(null)
        }}
      >
        <AlertDialogContent className="border-[#1F1F23] bg-[#0F0F12] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar kit</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Vas a eliminar <span className="font-medium text-white">{kitToDelete?.name}</span>. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#2B2B30] bg-transparent text-gray-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-500"
              onClick={(event) => {
                event.preventDefault()
                void handleDeleteKit()
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
