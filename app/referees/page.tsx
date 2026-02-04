"use client"

import { useMemo, useState } from "react"
import Layout from "@/components/kokonutui/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GraduationCap, Award, Users2, Plus } from "lucide-react"
import { mockReferees, mockTatamis, mockStaff } from "@/lib/mock-data"
import type { RefereeLevel } from "@/lib/types"
import { useAuth } from "@/lib/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  CreateRefereeProfileDialog,
  type CreateRefereeProfilePayload,
} from "@/components/referees/create-referee-profile-dialog"
import {
  AssignRefereeTatamiDialog,
  type AssignRefereeTatamiPayload,
} from "@/components/referees/assign-referee-tatami-dialog"

interface RefereeListItem {
  id: string
  staffId: string
  name: string
  level: RefereeLevel
  certifications: string[]
  eventsRefereed: number
  rank?: string
  association?: string
  experience?: string
  active?: boolean
}

interface TatamiListItem {
  id: string
  number: number
  name: string
  assignedReferees: {
    refereeId: string
    refereeName: string
    role: string
  }[]
}

const levelByRank = (rank: string): RefereeLevel => {
  const normalized = rank.toLowerCase()

  if (normalized.includes("black") || normalized.includes("dan")) {
    return "senior"
  }

  if (normalized.includes("brown") || normalized.includes("purple")) {
    return "intermediate"
  }

  return "junior"
}

const initialStaffOptions = Array.from(
  new Map(
    [...mockStaff, ...mockReferees.map((referee) => ({ id: referee.staffId, name: referee.name }))].map((staff) => [
      staff.id,
      { id: staff.id, name: staff.name },
    ])
  ).values()
)

export default function RefereesPage() {
  const { events, currentEvent } = useAuth()
  const { toast } = useToast()

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [referees, setReferees] = useState<RefereeListItem[]>(mockReferees)
  const [tatamis, setTatamis] = useState<TatamiListItem[]>(mockTatamis)

  const handleCreateRefereeProfile = (payload: CreateRefereeProfilePayload) => {
    console.log("Create Referee Profile payload", payload)

    const selectedStaff = initialStaffOptions.find((staff) => staff.id === payload.staffId)

    const nextReferee: RefereeListItem = {
      id: `ref-${Date.now()}`,
      staffId: payload.staffId,
      name: selectedStaff?.name ?? "Unknown referee",
      level: levelByRank(payload.rank),
      certifications: payload.association ? [payload.association] : [],
      eventsRefereed: 0,
      rank: payload.rank,
      association: payload.association,
      experience: payload.experience,
      active: payload.active,
    }

    setReferees((prev) => [nextReferee, ...prev])

    toast({
      title: "Referee profile created",
      description: `${nextReferee.name} was added to local mock data.`,
    })
  }

  const handleAssignReferee = (payload: AssignRefereeTatamiPayload) => {
    console.log("Assign Referee payload", payload)

    const selectedReferee = referees.find((referee) => referee.id === payload.refereeId)

    setTatamis((prev) =>
      prev.map((tatami) =>
        tatami.id === payload.tatamiId
          ? {
              ...tatami,
              assignedReferees: [
                ...tatami.assignedReferees,
                {
                  refereeId: payload.refereeId,
                  refereeName: selectedReferee?.name ?? "Unknown referee",
                  role: payload.role,
                },
              ],
            }
          : tatami
      )
    )

    toast({
      title: "Referee assigned",
      description: `${selectedReferee?.name ?? "Referee"} assigned to tatami in local mock data.`,
    })
  }

  const getLevelBadge = (level: RefereeLevel) => {
    const config: Record<RefereeLevel, string> = {
      junior: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      intermediate: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      senior: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      master: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    }
    return <Badge className={config[level]}>{level}</Badge>
  }

  const refereeOptions = useMemo(
    () => referees.map((referee) => ({ id: referee.id, name: referee.name })),
    [referees]
  )

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-6 h-6" />
              Referees & Tatamis
            </h1>
            <p className="text-gray-500 mt-1">Manage referees and tatami assignments</p>
            {!currentEvent && (
              <p className="mt-2 text-sm text-amber-400">Select an event to assign referees to tatamis.</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsProfileDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Referee Profile
            </Button>
            <Button onClick={() => setIsAssignDialogOpen(true)} disabled={events.length === 0 || refereeOptions.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Assign to Tatami
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tatamis.map((tatami) => (
            <div key={tatami.id} className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users2 className="w-5 h-5 text-blue-400" />
                {tatami.name}
              </h3>
              <div className="space-y-3">
                {tatami.assignedReferees.map((assignedReferee, index) => (
                  <div
                    key={`${assignedReferee.refereeId}-${index}`}
                    className="flex items-center justify-between p-3 bg-[#1A1A1F] rounded-lg"
                  >
                    <span className="text-white">{assignedReferee.refereeName}</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{assignedReferee.role}</Badge>
                  </div>
                ))}
                {tatami.assignedReferees.length === 0 && <p className="text-gray-500 text-sm">No referees assigned</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#0F0F12] rounded-xl border border-[#1F1F23] overflow-hidden">
          <div className="p-6 border-b border-[#1F1F23]">
            <h2 className="text-lg font-bold text-white">All Referees</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b border-[#1F1F23] bg-[#1A1A1F]">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Level</th>
                  <th className="px-6 py-4 font-medium">Certifications</th>
                  <th className="px-6 py-4 font-medium">Events</th>
                </tr>
              </thead>
              <tbody>
                {referees.map((referee) => (
                  <tr key={referee.id} className="border-b border-[#1F1F23] hover:bg-[#1A1A1F] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-white">{referee.name}</span>
                      {referee.rank && <p className="text-xs text-gray-500 mt-1">{referee.rank}</p>}
                    </td>
                    <td className="px-6 py-4">{getLevelBadge(referee.level)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {referee.certifications.length > 0 ? (
                          referee.certifications.map((certification) => (
                            <Badge
                              key={certification}
                              className="bg-blue-500/20 text-blue-400 border-blue-500/30"
                            >
                              <Award className="w-3 h-3 mr-1" />
                              {certification}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{referee.eventsRefereed}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateRefereeProfileDialog
        open={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
        staffMembers={initialStaffOptions}
        onCreate={handleCreateRefereeProfile}
      />

      <AssignRefereeTatamiDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        events={events.map((event) => ({ id: event.id, name: event.name }))}
        selectedEventId={currentEvent?.id}
        tatamis={tatamis.map((tatami) => ({ id: tatami.id, name: tatami.name }))}
        referees={refereeOptions}
        onCreate={handleAssignReferee}
      />
    </Layout>
  )
}
