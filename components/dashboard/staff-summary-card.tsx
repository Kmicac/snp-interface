"use client"

import { Users2, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { mockKpisSummary, mockTatamis } from "@/lib/mock-data"

export default function StaffSummaryCard() {
  return (
    <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users2 className="w-4 h-4" />
          Staff & Referees
        </h2>
        <Link href="/staff">
          <Button variant="outline" size="sm" className="text-xs bg-transparent border-[#2B2B30] hover:bg-[#1A1A1F] text-gray-300">
            View all
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-[#1A1A1F] rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Staff Assigned</p>
              <p className="text-xl font-bold text-white">{mockKpisSummary.activeStaff}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-[#1A1A1F] rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Referees Assigned</p>
              <p className="text-xl font-bold text-white">
                {mockTatamis.reduce((acc, t) => acc + t.assignedReferees.length, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#1F1F23] pt-4">
          <p className="text-xs text-gray-500 uppercase mb-3">Zone Distribution</p>
          <div className="space-y-2">
            {mockTatamis.map((tatami) => (
              <div key={tatami.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{tatami.name}</span>
                <span className="text-white">{tatami.assignedReferees.length} refs</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
