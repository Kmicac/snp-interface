"use client"

import { useMemo, useState } from "react"
import Layout from "@/components/kokonutui/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Users2, Search, Mail, Phone, Plus } from "lucide-react"
import { mockStaff } from "@/lib/mock-data"
import type { StaffRole, Staff } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { CreateStaffDialog, type CreateStaffPayload } from "@/components/staff/create-staff-dialog"

type StaffListItem = Staff & {
  documentId?: string
}

const initialStaff: StaffListItem[] = [
  ...mockStaff,
  {
    id: "st-6",
    name: "Roberto Alves",
    email: "roberto@snp.com",
    phone: "+56 9 8765 4321",
    roles: ["referee"],
    notes: "Senior referee",
  },
  {
    id: "st-7",
    name: "Diego Torres",
    email: "diego@snp.com",
    roles: ["referee", "logistics"],
  },
  { id: "st-8", name: "Camila Ruiz", email: "camila@snp.com", phone: "+56 9 1111 2222", roles: ["admin"] },
  { id: "st-9", name: "Felipe Soto", email: "felipe@snp.com", roles: ["security"] },
  { id: "st-10", name: "Valentina Mora", email: "valentina@snp.com", roles: ["volunteer"] },
]

const roleMap: Record<CreateStaffPayload["role"], StaffRole> = {
  STAFF: "admin",
  SECURITY: "security",
  LOGISTICS: "logistics",
  CLEANING: "cleaning",
  REFEREE: "referee",
  MEDIC: "medical",
  PRODUCTION: "admin",
  TICKETING: "volunteer",
  OTHER: "volunteer",
}

export default function StaffPage() {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [staffList, setStaffList] = useState<StaffListItem[]>(initialStaff)
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredStaff = useMemo(
    () =>
      staffList.filter((staffMember) => {
        const matchesRole = roleFilter === "all" || staffMember.roles.includes(roleFilter as StaffRole)
        const matchesSearch =
          searchQuery === "" ||
          staffMember.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          staffMember.email.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesRole && matchesSearch
      }),
    [staffList, roleFilter, searchQuery]
  )

  const handleCreateStaff = (payload: CreateStaffPayload) => {
    console.log("Create Staff payload", payload)

    const nextStaff: StaffListItem = {
      id: `st-${Date.now()}`,
      name: payload.fullName,
      email: payload.email || `${payload.fullName.toLowerCase().replace(/\s+/g, ".")}@snp.com`,
      phone: payload.phone,
      roles: [roleMap[payload.role]],
      notes: payload.notes,
      documentId: payload.documentId,
    }

    setStaffList((prev) => [nextStaff, ...prev])

    toast({
      title: "Staff member added",
      description: `${payload.fullName} was added to local mock data.`,
    })
  }

  const getRoleBadge = (role: StaffRole) => {
    const colors: Record<StaffRole, string> = {
      security: "bg-red-500/20 text-red-400 border-red-500/30",
      logistics: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      referee: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      medical: "bg-green-500/20 text-green-400 border-green-500/30",
      cleaning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      admin: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      volunteer: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    }
    return <Badge className={colors[role]}>{role}</Badge>
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users2 className="w-6 h-6" />
              Staff & Roles
            </h1>
            <p className="text-gray-500 mt-1">Manage staff members and their roles</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff Member
          </Button>
        </div>

        <div className="bg-[#0F0F12] rounded-xl p-4 border border-[#1F1F23]">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1A1A1F] border-[#2B2B30] text-white placeholder:text-gray-500"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px] bg-[#1A1A1F] border-[#2B2B30] text-white">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1F] border-[#2B2B30]">
                <SelectItem value="all" className="text-white focus:bg-[#2B2B30] focus:text-white">
                  All Roles
                </SelectItem>
                <SelectItem value="security" className="text-white focus:bg-[#2B2B30] focus:text-white">
                  Security
                </SelectItem>
                <SelectItem value="logistics" className="text-white focus:bg-[#2B2B30] focus:text-white">
                  Logistics
                </SelectItem>
                <SelectItem value="referee" className="text-white focus:bg-[#2B2B30] focus:text-white">
                  Referee
                </SelectItem>
                <SelectItem value="medical" className="text-white focus:bg-[#2B2B30] focus:text-white">
                  Medical
                </SelectItem>
                <SelectItem value="cleaning" className="text-white focus:bg-[#2B2B30] focus:text-white">
                  Cleaning
                </SelectItem>
                <SelectItem value="admin" className="text-white focus:bg-[#2B2B30] focus:text-white">
                  Admin
                </SelectItem>
                <SelectItem value="volunteer" className="text-white focus:bg-[#2B2B30] focus:text-white">
                  Volunteer
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-[#0F0F12] rounded-xl border border-[#1F1F23] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b border-[#1F1F23] bg-[#1A1A1F]">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Roles</th>
                  <th className="px-6 py-4 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staffMember) => (
                  <tr
                    key={staffMember.id}
                    className="border-b border-[#1F1F23] hover:bg-[#1A1A1F] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-white">{staffMember.name}</span>
                      {staffMember.documentId && (
                        <p className="text-xs text-gray-500 mt-1">Document: {staffMember.documentId}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Mail className="w-3 h-3" />
                          {staffMember.email}
                        </div>
                        {staffMember.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Phone className="w-3 h-3" />
                            {staffMember.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {staffMember.roles.map((role) => (
                          <span key={role}>{getRoleBadge(role)}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">{staffMember.notes || "-"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredStaff.length === 0 && <div className="text-center py-12 text-gray-500">No staff members found</div>}
        </div>
      </div>

      <CreateStaffDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onCreate={handleCreateStaff} />
    </Layout>
  )
}
