"use client"

import { useMemo, useState } from "react"
import Layout from "@/components/kokonutui/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { QrCode, CheckCircle2, XCircle, Clock, Plus } from "lucide-react"
import { mockStaff } from "@/lib/mock-data"
import type { Credential } from "@/lib/types"
import { useAuth } from "@/lib/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  IssueCredentialDialog,
  type IssueCredentialPayload,
} from "@/components/access/issue-credential-dialog"

interface CredentialListItem extends Credential {
  eventId?: string
  zone?: string
  note?: string
}

const initialCredentials: CredentialListItem[] = [
  { id: "cred-1", staffId: "st-1", staffName: "Carlos Mendez", status: "active", issuedAt: "2025-03-14T10:00:00" },
  { id: "cred-2", staffId: "st-2", staffName: "Maria Silva", status: "active", issuedAt: "2025-03-14T10:15:00" },
  { id: "cred-3", staffId: "st-3", staffName: "Juan Perez", status: "active", issuedAt: "2025-03-14T10:30:00" },
  { id: "cred-4", staffId: "st-4", staffName: "Ana Garcia", status: "active", issuedAt: "2025-03-14T11:00:00" },
  {
    id: "cred-5",
    staffId: "st-5",
    staffName: "Pedro Rojas",
    status: "revoked",
    issuedAt: "2025-03-14T11:15:00",
    revokedAt: "2025-03-15T08:00:00",
  },
  { id: "cred-6", staffId: "st-6", staffName: "Roberto Alves", status: "active", issuedAt: "2025-03-14T11:30:00" },
  { id: "cred-7", staffId: "st-7", staffName: "Diego Torres", status: "expired", issuedAt: "2025-03-10T10:00:00" },
]

const zoneOptions = ["ENTRANCE", "VIP", "TATAMI 1", "TATAMI 2", "TATAMI 3", "BACKSTAGE", "WARM-UP", "MEDICAL"]

const statusMap: Record<IssueCredentialPayload["status"], Credential["status"]> = {
  ACTIVE: "active",
}

export default function AccessPage() {
  const { events, currentEvent } = useAuth()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [credentials, setCredentials] = useState<CredentialListItem[]>(initialCredentials)

  const staffMembers = useMemo(
    () =>
      mockStaff.map((staffMember) => ({
        id: staffMember.id,
        name: staffMember.name,
      })),
    []
  )

  const activeCount = credentials.filter((credential) => credential.status === "active").length
  const revokedCount = credentials.filter((credential) => credential.status === "revoked").length
  const expiredCount = credentials.filter((credential) => credential.status === "expired").length

  const handleIssueCredential = (payload: IssueCredentialPayload) => {
    console.log("Create Credential payload", payload)

    const selectedStaff = staffMembers.find((staffMember) => staffMember.id === payload.staffId)

    const nextCredential: CredentialListItem = {
      id: `cred-${Date.now()}`,
      staffId: payload.staffId,
      staffName: selectedStaff?.name ?? "Unknown staff",
      status: statusMap[payload.status],
      issuedAt: new Date().toISOString(),
      eventId: payload.eventId,
      zone: payload.zone ?? undefined,
      note: payload.note,
    }

    setCredentials((prev) => [nextCredential, ...prev])

    toast({
      title: "Credential issued",
      description: `${nextCredential.staffName} now has an active credential in local mock data.`,
    })
  }

  const getStatusBadge = (status: Credential["status"]) => {
    const config = {
      active: {
        className: "bg-green-500/20 text-green-400 border-green-500/30",
        icon: CheckCircle2,
        label: "Active",
      },
      revoked: {
        className: "bg-red-500/20 text-red-400 border-red-500/30",
        icon: XCircle,
        label: "Revoked",
      },
      expired: {
        className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
        icon: Clock,
        label: "Expired",
      },
    }

    const { className, icon: Icon, label } = config[status]

    return (
      <Badge className={`${className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <QrCode className="w-6 h-6" />
              Credentials & QR
            </h1>
            <p className="text-gray-500 mt-1">Manage access credentials for the current event</p>
            {!currentEvent && <p className="mt-2 text-sm text-amber-400">Select an event to issue credentials.</p>}
          </div>
          <Button onClick={() => setIsDialogOpen(true)} disabled={events.length === 0 || staffMembers.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Issue Credential
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activeCount}</p>
                <p className="text-sm text-gray-500">Active Credentials</p>
              </div>
            </div>
          </div>
          <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{revokedCount}</p>
                <p className="text-sm text-gray-500">Revoked</p>
              </div>
            </div>
          </div>
          <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{expiredCount}</p>
                <p className="text-sm text-gray-500">Expired</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0F0F12] rounded-xl border border-[#1F1F23] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b border-[#1F1F23] bg-[#1A1A1F]">
                  <th className="px-6 py-4 font-medium">Staff</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Zone</th>
                  <th className="px-6 py-4 font-medium">Issued At</th>
                  <th className="px-6 py-4 font-medium">Revoked At</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map((credential) => (
                  <tr
                    key={credential.id}
                    className="border-b border-[#1F1F23] hover:bg-[#1A1A1F] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-white">{credential.staffName}</span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(credential.status)}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{credential.zone || "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{new Date(credential.issuedAt).toLocaleString("es-CL")}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">
                        {credential.revokedAt ? new Date(credential.revokedAt).toLocaleString("es-CL") : "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <IssueCredentialDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        events={events.map((event) => ({ id: event.id, name: event.name }))}
        selectedEventId={currentEvent?.id}
        staffMembers={staffMembers}
        zones={zoneOptions}
        onCreate={handleIssueCredential}
      />
    </Layout>
  )
}
