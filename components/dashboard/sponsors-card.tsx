"use client"

import { Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { mockSponsorsByTier } from "@/lib/mock-data"
import type { SponsorTier } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function SponsorsCard() {
  const getTierColor = (tier: SponsorTier) => {
    const colors = {
      title: "bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-0",
      gold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      silver: "bg-gray-400/20 text-gray-300 border-gray-400/30",
      bronze: "bg-orange-700/20 text-orange-400 border-orange-700/30",
      support: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    }
    return colors[tier]
  }

  const getTierPanelClass = (tier: SponsorTier) => {
    const styles: Record<SponsorTier, string> = {
      title: "border-yellow-500/30 bg-gradient-to-b from-yellow-500/12 to-transparent",
      gold: "border-yellow-500/20 bg-yellow-500/5",
      silver: "border-slate-400/20 bg-slate-400/5",
      bronze: "border-orange-600/20 bg-orange-700/5",
      support: "border-blue-500/20 bg-blue-500/5",
    }
    return styles[tier]
  }

  const tiers: { key: SponsorTier; label: string }[] = [
    { key: "title", label: "Title" },
    { key: "gold", label: "Gold" },
    { key: "silver", label: "Silver" },
    { key: "bronze", label: "Bronze" },
    { key: "support", label: "Support" },
  ]

  return (
    <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          Sponsors by Tier
        </h2>
        <Link href="/sponsors">
          <Button variant="outline" size="sm" className="text-xs bg-transparent border-[#2B2B30] hover:bg-[#1A1A1F] text-gray-300">
            View all
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {tiers.map(({ key, label }) => {
          const sponsors = mockSponsorsByTier[key]
          if (sponsors.length === 0) return null

          return (
            <div key={key} className={`rounded-lg border p-3 ${getTierPanelClass(key)}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <Badge className={getTierColor(key)}>{label}</Badge>
                <span className="text-xs text-gray-400">{sponsors.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sponsors.map((sponsor) => (
                  <div
                    key={sponsor.id}
                    className="flex min-h-8 items-center gap-2 rounded-full border border-[#2B2B30] bg-[#1A1A1F] px-3 py-1 text-sm text-gray-200"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={sponsor.logo || undefined} alt={sponsor.brandName} />
                      <AvatarFallback>{sponsor.brandName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="leading-none">{sponsor.brandName}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
