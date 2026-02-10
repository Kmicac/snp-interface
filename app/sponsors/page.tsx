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

  const handleSubmitTask = (payload: TaskDialogValues) => {
    createTask({
      ...payload,
      orgId: currentOrg?.id || "org-1",
      eventId: payload.eventId ?? currentEvent?.id ?? null,
    })
    toast({
      title: "Task created",
      description: "Task was added to the board in local mock data.",
    })
    setTaskPrefill(undefined)
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

        <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
          <h2 className="text-lg font-bold text-white mb-6">Sponsor Wall</h2>
          <div className="space-y-8">
            {tierOrder.map((tier) => {
              const tierSponsors = sponsorshipsByTier[tier]

              if (tierSponsors.length === 0) {
                return null
              }

              return (
                <div key={tier}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${getTierColor(tier)}`} />
                    <h3 className="text-white font-medium">{tier}</h3>
                    <Badge className={getTierBadgeColor(tier)}>{tierSponsors.length}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {tierSponsors.map((sponsorship) => (
                      <div
                        key={sponsorship.id}
                        className="bg-[#1A1A1F] rounded-lg p-4 border border-[#2B2B30] hover:border-[#3B3B40] transition-colors min-w-[220px]"
                      >
                        {canEdit && (
                          <div className="mb-2 flex justify-end">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleCreateTaskFromSponsorship(sponsorship)}>
                                <ListTodo className="mr-2 h-3.5 w-3.5" />
                                Create task
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setEditingSponsorship(sponsorship)}>
                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-none bg-transparent">
                            <AvatarImage
                              src={brands.find((brand) => brand.id === sponsorship.brandId)?.logoUrl}
                              alt={sponsorship.brandName}
                            />
                            <AvatarFallback>{sponsorship.brandName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-white">{sponsorship.brandName}</p>
                            <p className="text-xs text-gray-500">{sponsorship.status}</p>
                          </div>
                        </div>
                        {sponsorship.imageUrl && (
                          <img
                            src={sponsorship.imageUrl}
                            alt={`${sponsorship.brandName} event banner`}
                            className="mt-3 h-12 w-full rounded-md object-cover"
                          />
                        )}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-400">
                          {typeof sponsorship.cashValue === "number" && <span>Cash: ${sponsorship.cashValue.toLocaleString()}</span>}
                          {typeof sponsorship.inKindValue === "number" && (
                            <span>In-kind: ${sponsorship.inKindValue.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
