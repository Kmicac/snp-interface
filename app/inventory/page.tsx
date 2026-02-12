"use client"

import { useEffect, useMemo, useState } from "react"
import { Boxes, PackageCheck, PackageX } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/context/auth-context"
import { canAccessInventory } from "@/lib/inventory/permissions"
import type { InventoryDashboardStats, InventoryMovement } from "@/lib/inventory/types"
import { getInventoryDashboardStats, listMovements } from "@/lib/inventory/utils"

const EMPTY_STATS: InventoryDashboardStats = {
  totalAssets: 0,
  availableAssets: 0,
  inUseAssets: 0,
  damagedAssets: 0,
  lowStockAssets: 0,
  lostAssets: 0,
  totalUnits: 0,
  totalValue: 0,
  byCategory: [],
  categories: [],
  recentMovements: [],
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "-"
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value)
}

export default function InventoryDashboardPage() {
  const { user, currentOrg } = useAuth()
  const [stats, setStats] = useState<InventoryDashboardStats>(EMPTY_STATS)
  const [recentMovements, setRecentMovements] = useState<InventoryMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const hasAccess = canAccessInventory(user, currentOrg?.id)

  useEffect(() => {
    const run = async () => {
      if (!currentOrg?.id || !hasAccess) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const dashboard = await getInventoryDashboardStats(currentOrg.id)
        const fromStats = dashboard.recentMovements ?? []

        if (fromStats.length > 0) {
          setRecentMovements(fromStats.slice(0, 8))
        } else {
          const movements = await listMovements(currentOrg.id, { limit: 8, offset: 0 })
          setRecentMovements(movements.items)
        }

        setStats({
          ...EMPTY_STATS,
          ...dashboard,
        })
      } catch {
        setStats(EMPTY_STATS)
        setRecentMovements([])
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }, [currentOrg?.id, hasAccess])

  const categorySummary = useMemo(() => stats.byCategory ?? stats.categories ?? [], [stats.byCategory, stats.categories])
  const totalUnits = Number.isFinite(stats.totalUnits) && stats.totalUnits ? stats.totalUnits : stats.totalAssets
  const hasAnyData =
    stats.totalAssets > 0 ||
    stats.availableAssets > 0 ||
    stats.inUseAssets > 0 ||
    stats.damagedAssets > 0 ||
    (stats.lostAssets ?? 0) > 0 ||
    categorySummary.length > 0 ||
    recentMovements.length > 0

  if (!currentOrg) {
    return <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">Selecciona una organizacion para continuar.</div>
  }

  if (!hasAccess) {
    return <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200">No tienes permisos para inventario.</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Panel de Inventario</h1>
        <p className="text-sm text-gray-400">Visibilidad general del estado de equipos, categorias y movimientos recientes.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-[#1F1F23] bg-[#0F0F12] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Total de items</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24 bg-[#20242E]" /> : <p className="text-2xl font-semibold">{totalUnits}</p>}
          </CardContent>
        </Card>

        <Card className="border-[#1F1F23] bg-[#0F0F12] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Stock vs Evento</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <PackageCheck className="h-5 w-5 text-emerald-300" />
            {isLoading ? (
              <Skeleton className="h-8 w-28 bg-[#20242E]" />
            ) : (
              <p className="text-xl font-semibold">
                {stats.availableAssets} / {stats.inUseAssets}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#1F1F23] bg-[#0F0F12] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Dañados / Perdidos</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <PackageX className="h-5 w-5 text-red-300" />
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-[#20242E]" />
            ) : (
              <p className="text-xl font-semibold">
                {stats.damagedAssets} / {stats.lostAssets ?? 0}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#1F1F23] bg-[#0F0F12] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Valor total</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32 bg-[#20242E]" />
            ) : (
              <p className="text-xl font-semibold">{formatCurrency(stats.totalValue ?? 0)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#1F1F23] bg-[#0F0F12] text-white">
        <CardHeader>
          <CardTitle className="text-base">Resumen por categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={`cat-skeleton-${index}`} className="h-20 rounded-md bg-[#20242E]" />
              ))}
            </div>
          ) : categorySummary.length === 0 ? (
            <p className="text-sm text-gray-500">No hay categorias con datos de inventario aun.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {categorySummary.map((category) => (
                <div key={category.categoryId || category.categoryName} className="rounded-md border border-[#2B2B30] bg-[#151821] p-3">
                  <p className="text-sm font-semibold text-white">{category.categoryName}</p>
                  <p className="mt-1 text-sm text-gray-300">Total: {category.totalQuantity}</p>
                  <p className="text-xs text-gray-500">
                    Stock: {category.inStorageQuantity ?? 0} · En uso: {category.inUseQuantity ?? 0}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-[#1F1F23] bg-[#0F0F12] text-white">
        <CardHeader>
          <CardTitle className="text-base">Movimientos recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={`mov-skeleton-${index}`} className="h-10 bg-[#20242E]" />
              ))}
            </div>
          ) : recentMovements.length === 0 ? (
            <p className="text-sm text-gray-500">No hay movimientos de inventario aun.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-[#1F1F23] text-left text-xs uppercase text-gray-500">
                    <th className="px-2 py-2">Fecha</th>
                    <th className="px-2 py-2">Tipo</th>
                    <th className="px-2 py-2">Equipo</th>
                    <th className="px-2 py-2">Evento</th>
                    <th className="px-2 py-2">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMovements.map((movement) => (
                    <tr key={movement.id} className="border-b border-[#1F1F23] text-gray-300">
                      <td className="px-2 py-2">{new Date(movement.createdAt).toLocaleString("es-CL")}</td>
                      <td className="px-2 py-2">
                        <Badge className="border-[#2B2B30] bg-[#171A22] text-gray-200">{movement.type}</Badge>
                      </td>
                      <td className="px-2 py-2 text-white">{movement.assetName || movement.assetId}</td>
                      <td className="px-2 py-2">{movement.eventName || movement.eventId || "-"}</td>
                      <td className="px-2 py-2">{movement.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && !hasAnyData ? (
        <div className="rounded-lg border border-[#2B2B30] bg-[#11141d] p-4 text-sm text-gray-400">No hay datos de inventario aun.</div>
      ) : null}
    </div>
  )
}
