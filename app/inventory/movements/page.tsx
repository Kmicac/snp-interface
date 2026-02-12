"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { CalendarDays, Download, History, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/context/auth-context"
import { canAccessInventory } from "@/lib/inventory/permissions"
import type { Asset, InventoryMovement } from "@/lib/inventory/types"
import { cn } from "@/lib/utils"
import { exportMovementsReport, listAssets, listMovements } from "@/lib/inventory/utils"

const MOVEMENT_TYPES = ["CHECKOUT", "RETURN", "TRANSFER", "ADJUSTMENT", "KIT_APPLIED"]
const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"))
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"))

function movementBadgeClass(type: string): string {
  const styles: Record<string, string> = {
    CHECKOUT: "border-blue-500/30 bg-blue-500/20 text-blue-200",
    RETURN: "border-emerald-500/30 bg-emerald-500/20 text-emerald-200",
    TRANSFER: "border-violet-500/30 bg-violet-500/20 text-violet-200",
    ADJUSTMENT: "border-amber-500/30 bg-amber-500/20 text-amber-200",
    KIT_APPLIED: "border-cyan-500/30 bg-cyan-500/20 text-cyan-200",
  }

  return styles[type] || "border-[#2B2B30] bg-[#171A22] text-gray-200"
}

function parseFilterDate(value: string): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function toFilterValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hour = String(date.getHours()).padStart(2, "0")
  const minute = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hour}:${minute}`
}

function getTimeParts(date: Date | null): { hour: string; minute: string; period: "AM" | "PM" } {
  if (!date) {
    return {
      hour: "12",
      minute: "00",
      period: "AM",
    }
  }

  const hour24 = date.getHours()
  return {
    hour: String(hour24 % 12 || 12).padStart(2, "0"),
    minute: String(date.getMinutes()).padStart(2, "0"),
    period: hour24 >= 12 ? "PM" : "AM",
  }
}

function DateTimeFilterInput({
  label,
  value,
  onChange,
}: {
  label: "Desde" | "Hasta"
  value: string
  onChange: (value: string) => void
}) {
  const selectedDate = parseFilterDate(value)
  const { hour, minute, period } = getTimeParts(selectedDate)

  const applyDate = (nextDate: Date) => {
    const baseTime = selectedDate ?? new Date()
    const merged = new Date(nextDate)
    merged.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0)
    onChange(toFilterValue(merged))
  }

  const applyTime = (nextHour: string, nextMinute: string, nextPeriod: "AM" | "PM") => {
    const baseDate = selectedDate ?? new Date()
    const merged = new Date(baseDate)
    let hour24 = Number(nextHour) % 12
    if (nextPeriod === "PM") {
      hour24 += 12
    }
    merged.setHours(hour24, Number(nextMinute), 0, 0)
    onChange(toFilterValue(merged))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full justify-start border-[#2B2B30] bg-[#171A22] px-3 text-left font-normal text-gray-200 hover:bg-[#1B1E25]"
        >
          <CalendarDays className="mr-2 h-4 w-4 shrink-0 text-gray-500" />
          <span className={cn("truncate text-sm", !selectedDate && "text-gray-500")}>
            {selectedDate ? `${label}: ${format(selectedDate, "MM/dd/yyyy hh:mm a")}` : `${label}: mm/dd/yyyy`}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto border-[#2B2B30] bg-[#0F0F12] p-0 text-white">
          <div className="p-2">
            <Calendar
              mode="single"
              selected={selectedDate ?? undefined}
              onSelect={(nextDate) => {
                if (nextDate) {
                  applyDate(nextDate)
                }
              }}
              className="rounded-md border border-[#1F1F23] bg-[#0F0F12]"
            />
          </div>
          <div className="border-t border-[#1F1F23] p-2">
            <div className="grid grid-cols-3 gap-2">
              <Select value={hour} onValueChange={(nextHour) => applyTime(nextHour, minute, period)}>
                <SelectTrigger className="h-9 border-[#2B2B30] bg-[#171A22] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={minute} onValueChange={(nextMinute) => applyTime(hour, nextMinute, period)}>
                <SelectTrigger className="h-9 border-[#2B2B30] bg-[#171A22] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MINUTE_OPTIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={period} onValueChange={(nextPeriod) => applyTime(hour, minute, nextPeriod as "AM" | "PM")}>
                <SelectTrigger className="h-9 border-[#2B2B30] bg-[#171A22] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-400 hover:text-white" onClick={() => onChange("")}>
                Clear
              </Button>
              <span className="text-xs text-gray-500">{selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Selecciona fecha y hora"}</span>
            </div>
          </div>
      </PopoverContent>
    </Popover>
  )
}

export default function InventoryMovementsPage() {
  const { user, currentOrg, events } = useAuth()
  const { toast } = useToast()

  const [items, setItems] = useState<InventoryMovement[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [assetFilter, setAssetFilter] = useState("all")
  const [eventFilter, setEventFilter] = useState("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const hasAccess = canAccessInventory(user, currentOrg?.id)

  useEffect(() => {
    const run = async () => {
      if (!currentOrg?.id || !hasAccess) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const [movements, assetsResponse] = await Promise.all([
          listMovements(currentOrg.id, {
            limit: 500,
            offset: 0,
            type: typeFilter !== "all" ? typeFilter : undefined,
            assetId: assetFilter !== "all" ? assetFilter : undefined,
            eventId: eventFilter !== "all" ? eventFilter : undefined,
            from: fromDate || undefined,
            to: toDate || undefined,
          }),
          listAssets(currentOrg.id),
        ])
        setItems(movements.items)
        setAssets(assetsResponse)
      } catch {
        setItems([])
        setAssets([])
      } finally {
        setIsLoading(false)
      }
    }

    void run()
  }, [assetFilter, currentOrg?.id, eventFilter, fromDate, hasAccess, toDate, typeFilter])

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return items

    return items.filter((item) => {
      const source = [item.assetName, item.assetId, item.eventName, item.eventId, item.createdByName, item.type, item.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return source.includes(query)
    })
  }, [items, searchQuery])

  async function handleExport() {
    if (!currentOrg?.id) return

    try {
      const blob = await exportMovementsReport(currentOrg.id, {
        type: typeFilter !== "all" ? typeFilter : undefined,
        assetId: assetFilter !== "all" ? assetFilter : undefined,
        eventId: eventFilter !== "all" ? eventFilter : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      })

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = "inventory-movements.xlsx"
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No fue posible exportar movimientos.",
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
            <History className="h-6 w-6" />
            Movimientos
          </h1>
          <p className="text-sm text-gray-400">Historial de check-out, devoluciones, transferencias y ajustes de inventario.</p>
        </div>
        <Button variant="outline" className="border-[#2B2B30] bg-transparent" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      <div className="rounded-xl border border-[#1F1F23] bg-[#0F0F12] p-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-7">
          <div className="xl:col-span-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar por equipo, evento o usuario"
                className="border-[#2B2B30] bg-[#171A22] pl-10 text-white"
              />
            </div>
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="border-[#2B2B30] bg-[#171A22] text-white">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {MOVEMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={assetFilter} onValueChange={setAssetFilter}>
            <SelectTrigger className="border-[#2B2B30] bg-[#171A22] text-white">
              <SelectValue placeholder="Equipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los equipos</SelectItem>
              {assets.map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  {asset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="border-[#2B2B30] bg-[#171A22] text-white">
              <SelectValue placeholder="Evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los eventos</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DateTimeFilterInput label="Desde" value={fromDate} onChange={setFromDate} />
          <DateTimeFilterInput label="Hasta" value={toDate} onChange={setToDate} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#1F1F23] bg-[#0F0F12]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-[#1F1F23] bg-[#171A22] text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-3">Fecha / Hora</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Equipo</th>
                <th className="px-4 py-3">Evento</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Notas</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-5 text-gray-500" colSpan={7}>
                    Cargando movimientos...
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-[#1F1F23] text-gray-300 hover:bg-[#171A22]">
                    <td className="px-4 py-3">{new Date(item.createdAt).toLocaleString("es-CL")}</td>
                    <td className="px-4 py-3">
                      <Badge className={movementBadgeClass(item.type)}>{item.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-white">{item.assetName || item.assetId}</td>
                    <td className="px-4 py-3">{item.eventName || item.eventId || "-"}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">{item.createdByName || item.createdBy || "-"}</td>
                    <td className="px-4 py-3">{item.notes || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredItems.length === 0 ? <div className="py-10 text-center text-sm text-gray-500">No hay movimientos para los filtros aplicados.</div> : null}
      </div>
    </div>
  )
}
