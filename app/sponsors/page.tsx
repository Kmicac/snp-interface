"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Layout from "@/components/kokonutui/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, DollarSign, Gift, Plus, Pencil, ListTodo } from "lucide-react"
import { mockSponsorsByTier, mockStaff } from "@/lib/mock-data"
import { useAuth } from "@/lib/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useTasksBoard } from "@/lib/context/tasks-board-context"
import {
  CreateSponsorshipDialog,
  type CreateSponsorshipPayload,
} from "@/components/sponsors/create-sponsorship-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TaskDialog, type TaskDialogValues } from "@/components/tasks/task-dialog"
import { cn } from "@/lib/utils"

type SponsorshipTier = "TITLE" | "GOLD" | "SILVER" | "BRONZE" | "SUPPORT"

interface BrandItem {
  id: string
  name: string
  logoUrl?: string
}

interface SponsorshipItem {
  id: string
  eventId: string
  brandId: string
  brandName: string
  tier: SponsorshipTier
  status: "PROPOSED" | "NEGOTIATION" | "CONFIRMED" | "CANCELED"
  imageUrl?: string
  cashValue?: number
  inKindValue?: number
  benefits: string
  notes?: string
}

const tierMapFromMock = {
  title: "TITLE",
  gold: "GOLD",
  silver: "SILVER",
  bronze: "BRONZE",
  support: "SUPPORT",
} as const

const initialSponsorships: SponsorshipItem[] = Object.entries(mockSponsorsByTier).flatMap(([tierKey, sponsors]) =>
  sponsors.map((sponsor: (typeof sponsors)[number]) => ({
    id: sponsor.id,
    eventId: "evt-1",
    brandId: sponsor.brandId,
    brandName: sponsor.brandName,
    tier: tierMapFromMock[tierKey as keyof typeof tierMapFromMock],
    status: "CONFIRMED" as const,
    imageUrl: undefined,
    benefits: "Existing sponsorship package",
  }))
)

const initialBrands: BrandItem[] = Array.from(
  new Map(
    initialSponsorships.map((item) => {
      const sponsorWithLogo = Object.values(mockSponsorsByTier)
        .flat()
        .find((sponsor) => sponsor.brandId === item.brandId)
      return [
        item.brandId,
        { id: item.brandId, name: item.brandName, logoUrl: sponsorWithLogo?.logo || undefined },
      ] as const
    })
  ).values()
)

const tierOrder: SponsorshipTier[] = ["TITLE", "GOLD", "SILVER", "BRONZE", "SUPPORT"]

export default function SponsorsPage() {
  const { events, currentEvent, currentOrg } = useAuth()
  const { toast } = useToast()
  const { createTask } = useTasksBoard()
  const canEdit = true

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSponsorship, setEditingSponsorship] = useState<SponsorshipItem | null>(null)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [taskPrefill, setTaskPrefill] = useState<Partial<TaskDialogValues> | undefined>(undefined)
  const [brands, setBrands] = useState<BrandItem[]>(initialBrands)
  const [sponsorships, setSponsorships] = useState<SponsorshipItem[]>(initialSponsorships)
  const previewUrlsRef = useRef<string[]>([])

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const sponsorKpis = useMemo(
    () => ({
      totalCashValue: sponsorships.reduce((sum, sponsorship) => sum + (sponsorship.cashValue ?? 0), 0),
      totalInKindValue: sponsorships.reduce((sum, sponsorship) => sum + (sponsorship.inKindValue ?? 0), 0),
      totalSponsors: sponsorships.length,
    }),
    [sponsorships]
  )

  const sponsorshipsByTier = useMemo(() => {
    return tierOrder.reduce(
      (acc, tier) => {
        acc[tier] = sponsorships.filter((sponsorship) => sponsorship.tier === tier)
        return acc
      },
      {} as Record<SponsorshipTier, SponsorshipItem[]>
    )
  }, [sponsorships])

  const handleCreateSponsorship = (payload: CreateSponsorshipPayload) => {
    console.log("Create Sponsorship payload", { ...payload, imageFile: payload.imageFile })

    const selectedBrand = brands.find((brand) => brand.id === payload.brandId)
    const imageSource = payload.imageFile ? URL.createObjectURL(payload.imageFile) : payload.imageUrl
    if (payload.imageFile && imageSource) {
      previewUrlsRef.current.push(imageSource)
    }

    const nextSponsorship: SponsorshipItem = {
      id: `sp-${Date.now()}`,
      eventId: payload.eventId,
      brandId: payload.brandId,
      brandName: selectedBrand?.name ?? "Unknown brand",
      tier: payload.tier,
      status: payload.status,
      imageUrl: imageSource,
      cashValue: payload.cashValue,
      inKindValue: payload.inKindValue,
      benefits: payload.benefits,
      notes: payload.notes,
    }

    setSponsorships((prev) => [nextSponsorship, ...prev])

    toast({
      title: "Sponsorship added",
      description: `${nextSponsorship.brandName} sponsorship was added to local mock data.`,
    })
  }

  const handleEditSponsorship = (payload: CreateSponsorshipPayload) => {
    if (!editingSponsorship) return

    console.log("Edit Sponsorship payload", { ...payload, imageFile: payload.imageFile })
    const selectedBrand = brands.find((brand) => brand.id === payload.brandId)
    const imageSource = payload.imageFile ? URL.createObjectURL(payload.imageFile) : payload.imageUrl
    if (payload.imageFile && imageSource) {
      previewUrlsRef.current.push(imageSource)
    }

    setSponsorships((prev) =>
      prev.map((sponsorship) =>
        sponsorship.id === editingSponsorship.id
          ? {
              ...sponsorship,
              eventId: payload.eventId,
              brandId: payload.brandId,
              brandName: selectedBrand?.name ?? sponsorship.brandName,
              tier: payload.tier,
              status: payload.status,
              imageUrl: imageSource,
              cashValue: payload.cashValue,
              inKindValue: payload.inKindValue,
              benefits: payload.benefits,
              notes: payload.notes,
            }
          : sponsorship
      )
    )

    setEditingSponsorship(null)
    toast({
      title: "Sponsorship updated",
      description: `${selectedBrand?.name ?? "Sponsorship"} was updated in local mock data.`,
    })
  }

  const handleCreateTaskFromSponsorship = (sponsorship: SponsorshipItem) => {
    const contextPayload: Partial<TaskDialogValues> = {
      title: `Sponsorship follow-up: ${sponsorship.brandName}`,
      status: "TODO",
      priority: sponsorship.status === "CANCELED" ? "HIGH" : "MEDIUM",
      type: "SPONSORSHIP",
      eventId: sponsorship.eventId ?? currentEvent?.id ?? null,
      relatedSponsorshipId: sponsorship.id,
      relatedLabel: `${sponsorship.brandName} - ${sponsorship.tier}`,
    }

    console.log("Create task from sponsorship context", contextPayload)
    setTaskPrefill(contextPayload)
    setIsTaskDialogOpen(true)
  }

  const handleSubmitTask = async (payload: TaskDialogValues) => {
    try {
      await createTask({
        ...payload,
        orgId: currentOrg?.id,
        eventId: payload.eventId ?? currentEvent?.id ?? null,
      })
      toast({
        title: "Task created",
        description: "Task saved successfully.",
      })
      setTaskPrefill(undefined)
      return true
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not create task.",
        variant: "destructive",
      })
      return false
    }
  }

  const getTierColor = (tier: SponsorshipTier) => {
    const colors: Record<SponsorshipTier, string> = {
      TITLE: "bg-gradient-to-r from-yellow-500 to-amber-600",
      GOLD: "bg-yellow-500",
      SILVER: "bg-gray-400",
      BRONZE: "bg-orange-700",
      SUPPORT: "bg-blue-500",
    }
    return colors[tier]
  }

  const getTierBadgeColor = (tier: SponsorshipTier) => {
    const colors: Record<SponsorshipTier, string> = {
      TITLE: "bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-0",
      GOLD: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      SILVER: "bg-gray-400/20 text-gray-300 border-gray-400/30",
      BRONZE: "bg-orange-700/20 text-orange-400 border-orange-700/30",
      SUPPORT: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    }
    return colors[tier]
  }

  const getTierPanelClass = (tier: SponsorshipTier) => {
    const styles: Record<SponsorshipTier, string> = {
      TITLE: "border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-transparent",
      GOLD: "border-yellow-500/20 bg-yellow-500/5",
      SILVER: "border-slate-400/20 bg-slate-400/5",
      BRONZE: "border-orange-600/20 bg-orange-700/5",
      SUPPORT: "border-blue-500/20 bg-blue-500/5",
    }
    return styles[tier]
  }

  const getTierGridClass = (tier: SponsorshipTier) => {
    const styles: Record<SponsorshipTier, string> = {
      TITLE: "grid-cols-1 lg:grid-cols-2",
      GOLD: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
      SILVER: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
      BRONZE: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
      SUPPORT: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
    }
    return styles[tier]
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Sponsors
            </h1>
            <p className="text-gray-500 mt-1">Event sponsors and sponsorship metrics</p>
            {!currentEvent && (
              <p className="mt-2 text-sm text-amber-400">Select an event to create sponsorships.</p>
            )}
          </div>
          <Button onClick={() => setIsDialogOpen(true)} disabled={events.length === 0 || brands.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Add Sponsorship
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">${sponsorKpis.totalCashValue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Cash Value</p>
              </div>
            </div>
          </div>
          <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Gift className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">${sponsorKpis.totalInKindValue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">In-Kind Value</p>
              </div>
            </div>
          </div>
          <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{sponsorKpis.totalSponsors}</p>
                <p className="text-sm text-gray-500">Total Sponsors</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1F1F23] bg-[#0F0F12] p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Sponsor Wall</h2>
          </div>
          <div className="space-y-5">
            {tierOrder.map((tier) => {
              const tierSponsors = sponsorshipsByTier[tier]

              if (tierSponsors.length === 0) {
                return null
              }

              return (
                <section key={tier} className={cn("rounded-xl border p-4 md:p-5", getTierPanelClass(tier))}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getTierColor(tier)}`} />
                    <h3 className="text-white font-semibold tracking-wide">{tier}</h3>
                    <Badge className={getTierBadgeColor(tier)}>{tierSponsors.length}</Badge>
                  </div>
                  <div className={cn("grid gap-3", getTierGridClass(tier))}>
                    {tierSponsors.map((sponsorship) => (
                      <div
                        key={sponsorship.id}
                        className="group rounded-lg border border-[#2B2B30] bg-[#151821] p-4 transition-colors hover:border-[#3B3B40]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="h-11 w-11 rounded-md bg-[#10131B]">
                              <AvatarImage
                                src={brands.find((brand) => brand.id === sponsorship.brandId)?.logoUrl}
                                alt={sponsorship.brandName}
                              />
                              <AvatarFallback>{sponsorship.brandName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">{sponsorship.brandName}</p>
                              <p className="text-xs text-gray-500">{sponsorship.status}</p>
                            </div>
                          </div>
                          {canEdit ? (
                            <div className="flex items-center gap-1 opacity-75 transition-opacity group-hover:opacity-100">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleCreateTaskFromSponsorship(sponsorship)}
                                title="Create task"
                              >
                                <ListTodo className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingSponsorship(sponsorship)}
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : null}
                        </div>

                        {sponsorship.imageUrl && (
                          <img
                            src={sponsorship.imageUrl}
                            alt={`${sponsorship.brandName} event banner`}
                            className="mt-3 h-14 w-full rounded-md border border-[#232834] object-cover"
                          />
                        )}

                        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                          {typeof sponsorship.cashValue === "number" && (
                            <span className="rounded bg-[#0F121A] px-2 py-1">Cash: ${sponsorship.cashValue.toLocaleString()}</span>
                          )}
                          {typeof sponsorship.inKindValue === "number" && (
                            <span className="rounded bg-[#0F121A] px-2 py-1">In-kind: ${sponsorship.inKindValue.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </div>

      <CreateSponsorshipDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        events={events.map((event) => ({ id: event.id, name: event.name }))}
        brands={brands}
        selectedEventId={currentEvent?.id}
        onCreate={handleCreateSponsorship}
      />
      <CreateSponsorshipDialog
        open={editingSponsorship !== null}
        onOpenChange={(open) => {
          if (!open) setEditingSponsorship(null)
        }}
        mode="edit"
        initialValues={
          editingSponsorship
            ? {
                eventId: editingSponsorship.eventId,
                brandId: editingSponsorship.brandId,
                tier: editingSponsorship.tier,
                status: editingSponsorship.status,
                imageUrl: editingSponsorship.imageUrl,
                cashValue: editingSponsorship.cashValue,
                inKindValue: editingSponsorship.inKindValue,
                benefits: editingSponsorship.benefits,
                notes: editingSponsorship.notes,
              }
            : undefined
        }
        events={events.map((event) => ({ id: event.id, name: event.name }))}
        brands={brands}
        selectedEventId={currentEvent?.id}
        onCreate={handleEditSponsorship}
      />
      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={(open) => {
          setIsTaskDialogOpen(open)
          if (!open) setTaskPrefill(undefined)
        }}
        mode="create"
        initialValues={taskPrefill}
        events={events.map((event) => ({ id: event.id, name: event.name }))}
        assignees={mockStaff.map((staff) => ({ id: staff.id, name: staff.name, avatarUrl: staff.avatarUrl || staff.avatar }))}
        onSubmit={handleSubmitTask}
      />
    </Layout>
  )
}
