"use client"

import { useState } from "react"
import Layout from "@/components/kokonutui/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Handshake, Globe, Instagram, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CreateBrandDialog, type CreateBrandPayload } from "@/components/partners/create-brand-dialog"
import {
  CreatePartnershipDialog,
  type CreatePartnershipPayload,
} from "@/components/partners/create-partnership-dialog"

interface BrandItem {
  id: string
  name: string
  website?: string
  instagram?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  notes?: string
  isPartner: boolean
  isSponsor: boolean
}

interface PartnershipItem {
  id: string
  brandId: string
  status: "PROSPECT" | "ACTIVE" | "INACTIVE"
  startDate?: string
  endDate?: string
  scope: string
  benefits?: string
  notes?: string
}

const initialBrands: BrandItem[] = [
  {
    id: "br-1",
    name: "ADCC",
    website: "https://adcc.com",
    instagram: "@adccofficial",
    isPartner: true,
    isSponsor: true,
  },
  {
    id: "br-2",
    name: "Braus",
    website: "https://braus.com",
    instagram: "@brausfightwear",
    isPartner: false,
    isSponsor: true,
  },
  {
    id: "br-3",
    name: "Shoyoroll",
    website: "https://shoyoroll.com",
    instagram: "@shoyoroll",
    isPartner: true,
    isSponsor: true,
  },
  {
    id: "br-4",
    name: "Tatami",
    website: "https://tatamifightwear.com",
    instagram: "@tatamifightwear",
    isPartner: true,
    isSponsor: true,
  },
  {
    id: "br-5",
    name: "RVCA",
    website: "https://rvca.com",
    instagram: "@rvca",
    isPartner: true,
    isSponsor: false,
  },
  {
    id: "br-6",
    name: "Gatorade",
    website: "https://gatorade.com",
    instagram: "@gatorade",
    isPartner: true,
    isSponsor: true,
  },
]

const initialPartnerships: PartnershipItem[] = [
  {
    id: "pr-1",
    brandId: "br-3",
    status: "ACTIVE",
    startDate: "2025-01-15",
    scope: "Gi and no-gi uniform partnership",
    benefits: "Athlete gift bags and co-branded media kit",
  },
  {
    id: "pr-2",
    brandId: "br-5",
    status: "PROSPECT",
    scope: "Apparel and merchandising collaboration",
    notes: "Initial outreach sent",
  },
]

export default function PartnersPage() {
  const { toast } = useToast()
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false)
  const [isPartnershipDialogOpen, setIsPartnershipDialogOpen] = useState(false)
  const [brands, setBrands] = useState<BrandItem[]>(initialBrands)
  const [partnerships, setPartnerships] = useState<PartnershipItem[]>(initialPartnerships)

  const handleCreateBrand = (payload: CreateBrandPayload) => {
    console.log("Create Brand payload", payload)

    const nextBrand: BrandItem = {
      id: `br-${Date.now()}`,
      name: payload.name,
      website: payload.websiteUrl,
      instagram: payload.instagramUrl,
      contactName: payload.contactName,
      contactEmail: payload.contactEmail,
      contactPhone: payload.contactPhone,
      notes: payload.notes,
      isPartner: false,
      isSponsor: false,
    }

    setBrands((prev) => [nextBrand, ...prev])

    toast({
      title: "Brand added",
      description: `${payload.name} was added to local mock data.`,
    })
  }

  const handleCreatePartnership = (payload: CreatePartnershipPayload) => {
    console.log("Create Partnership payload", payload)

    const nextPartnership: PartnershipItem = {
      id: `pr-${Date.now()}`,
      brandId: payload.brandId,
      status: payload.status,
      startDate: payload.startDate,
      endDate: payload.endDate,
      scope: payload.scope,
      benefits: payload.benefits,
      notes: payload.notes,
    }

    setPartnerships((prev) => [nextPartnership, ...prev])

    setBrands((prev) =>
      prev.map((brand) => (brand.id === payload.brandId ? { ...brand, isPartner: true } : brand))
    )

    const selectedBrand = brands.find((brand) => brand.id === payload.brandId)

    toast({
      title: "Partnership added",
      description: `${selectedBrand?.name ?? "Brand"} partnership was added to local mock data.`,
    })
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Handshake className="w-6 h-6" />
              Partners & Brands
            </h1>
            <p className="text-gray-500 mt-1">Manage partnerships and brand relationships</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsBrandDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Brand
            </Button>
            <Button onClick={() => setIsPartnershipDialogOpen(true)} disabled={brands.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Add Partnership
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23] hover:border-[#2B2B30] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 rounded-lg bg-[#1A1A1F] flex items-center justify-center text-2xl font-bold text-white">
                  {brand.name.charAt(0)}
                </div>
                <div className="flex gap-2">
                  {brand.isPartner && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Partner</Badge>
                  )}
                  {brand.isSponsor && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Sponsor</Badge>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-4">{brand.name}</h3>

              <div className="flex items-center gap-4">
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
                {brand.instagram && (
                  <a
                    href={brand.instagram.startsWith("http") ? brand.instagram : `https://instagram.com/${brand.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                    {brand.instagram.startsWith("http") ? "Instagram" : brand.instagram}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#0F0F12] rounded-xl border border-[#1F1F23] overflow-hidden">
          <div className="p-6 border-b border-[#1F1F23]">
            <h2 className="text-lg font-bold text-white">Partnerships</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b border-[#1F1F23] bg-[#1A1A1F]">
                  <th className="px-6 py-4 font-medium">Brand</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Timeline</th>
                  <th className="px-6 py-4 font-medium">Scope</th>
                </tr>
              </thead>
              <tbody>
                {partnerships.map((partnership) => {
                  const brand = brands.find((item) => item.id === partnership.brandId)

                  return (
                    <tr key={partnership.id} className="border-b border-[#1F1F23] hover:bg-[#1A1A1F] transition-colors">
                      <td className="px-6 py-4 text-sm text-white">{brand?.name ?? "Unknown brand"}</td>
                      <td className="px-6 py-4">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{partnership.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {partnership.startDate || "-"} {partnership.endDate ? `to ${partnership.endDate}` : ""}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{partnership.scope}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateBrandDialog open={isBrandDialogOpen} onOpenChange={setIsBrandDialogOpen} onCreate={handleCreateBrand} />

      <CreatePartnershipDialog
        open={isPartnershipDialogOpen}
        onOpenChange={setIsPartnershipDialogOpen}
        brands={brands.map((brand) => ({ id: brand.id, name: brand.name }))}
        onCreate={handleCreatePartnership}
      />
    </Layout>
  )
}
