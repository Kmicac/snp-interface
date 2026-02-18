"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import { apiClient, ApiError, setAuthToken } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/config"
import type { Event, LoginResponse, Membership, Organization, OrgRole, User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  currentOrg: Organization | null
  currentEvent: Event | null
  organizations: Organization[]
  events: Event[]
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setCurrentOrg: (org: Organization) => void
  setCurrentEvent: (event: Event) => void
}

interface AuthMeResponse {
  userId: string
  email: string | null
  fullName: string | null
  memberships: Array<{
    orgId: string
    orgName: string
    role: OrgRole
  }>
}

interface EventApiResponse {
  id: string
  code: string
  name: string
  description: string | null
  startDate: string | null
  endDate: string | null
  venue: string | null
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED"
  imageUrl: string | null
  imageKey: string | null
}

const TOKEN_STORAGE_KEY = "snp_token"
const CURRENT_ORG_STORAGE_KEY = "snp_current_org"
const CURRENT_EVENT_STORAGE_KEY = "snp_current_event"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function mapMembershipsToOrganizations(memberships: Membership[]): Organization[] {
  const seen = new Set<string>()
  const organizations: Organization[] = []

  for (const membership of memberships) {
    if (seen.has(membership.orgId)) continue
    seen.add(membership.orgId)
    organizations.push({
      id: membership.orgId,
      name: membership.orgName,
      slug: slugify(membership.orgName),
    })
  }

  return organizations
}

function mapEventApiResponse(source: EventApiResponse): Event {
  const startDate = source.startDate ?? ""
  const endDate = source.endDate ?? source.startDate ?? ""

  return {
    id: source.id,
    name: source.name,
    code: source.code,
    startDate,
    endDate,
    venue: source.venue ?? "Venue not set",
    status: source.status,
    description: source.description ?? undefined,
    imageUrl: source.imageUrl ?? undefined,
    imageKey: source.imageKey ?? undefined,
  }
}

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

function persistToken(token: string | null) {
  setAuthToken(token)
  if (typeof window === "undefined") return
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
    return
  }
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null)
  const [currentEvent, setCurrentEventState] = useState<Event | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [events, setEvents] = useState<Event[]>([])

  const clearSession = useCallback(() => {
    persistToken(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem(CURRENT_ORG_STORAGE_KEY)
      localStorage.removeItem(CURRENT_EVENT_STORAGE_KEY)
    }
    setUser(null)
    setOrganizations([])
    setEvents([])
    setCurrentOrgState(null)
    setCurrentEventState(null)
  }, [])

  const fetchEvents = useCallback(async (orgId: string): Promise<Event[]> => {
    const response = await apiClient.get<EventApiResponse[]>(API_ENDPOINTS.events(orgId))
    return response.map(mapEventApiResponse)
  }, [])

  const hydrateSession = useCallback(async () => {
    const token = readStoredToken()
    if (!token) {
      clearSession()
      return
    }

    persistToken(token)

    const me = await apiClient.get<AuthMeResponse>(API_ENDPOINTS.me)
    const memberships: Membership[] = me.memberships.map((membership) => ({
      orgId: membership.orgId,
      orgName: membership.orgName,
      role: membership.role,
    }))
    const nextUser: User = {
      id: me.userId,
      email: me.email ?? "",
      name: me.fullName ?? me.email ?? "User",
      memberships,
    }

    const nextOrganizations = mapMembershipsToOrganizations(memberships)
    const storedOrgId = typeof window !== "undefined" ? localStorage.getItem(CURRENT_ORG_STORAGE_KEY) : null
    const nextOrg = nextOrganizations.find((org) => org.id === storedOrgId) ?? nextOrganizations[0] ?? null

    let nextEvents: Event[] = []
    if (nextOrg) {
      nextEvents = await fetchEvents(nextOrg.id)
    }

    const storedEventId = typeof window !== "undefined" ? localStorage.getItem(CURRENT_EVENT_STORAGE_KEY) : null
    const nextEvent = nextEvents.find((event) => event.id === storedEventId) ?? nextEvents[0] ?? null

    setUser(nextUser)
    setOrganizations(nextOrganizations)
    setCurrentOrgState(nextOrg)
    setEvents(nextEvents)
    setCurrentEventState(nextEvent)
  }, [clearSession, fetchEvents])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setIsLoading(true)
      try {
        await hydrateSession()
      } catch (error) {
        if (!cancelled) {
          clearSession()
          if (!(error instanceof ApiError && error.status === 401)) {
            console.error("Failed to hydrate auth session", error)
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [clearSession, hydrateSession])

  useEffect(() => {
    if (isLoading) return
    if (!user && pathname !== "/login") {
      router.replace("/login")
      return
    }
    if (user && pathname === "/login") {
      router.replace("/dashboard")
    }
  }, [isLoading, pathname, router, user])

  const login = useCallback(async (email: string, password: string) => {
    const payload = await apiClient.post<LoginResponse>(API_ENDPOINTS.login, { email, password })
    persistToken(payload.accessToken)
    await hydrateSession()
  }, [hydrateSession])

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  const setCurrentOrg = useCallback((org: Organization) => {
    setCurrentOrgState(org)
    if (typeof window !== "undefined") {
      localStorage.setItem(CURRENT_ORG_STORAGE_KEY, org.id)
    }

    void (async () => {
      try {
        const nextEvents = await fetchEvents(org.id)
        setEvents(nextEvents)

        const storedEventId = typeof window !== "undefined" ? localStorage.getItem(CURRENT_EVENT_STORAGE_KEY) : null
        const nextEvent = nextEvents.find((event) => event.id === storedEventId) ?? nextEvents[0] ?? null
        setCurrentEventState(nextEvent)
      } catch (error) {
        console.error("Failed to load events for org", error)
        setEvents([])
        setCurrentEventState(null)
      }
    })()
  }, [fetchEvents])

  const setCurrentEvent = useCallback((event: Event) => {
    setCurrentEventState(event)
    if (typeof window !== "undefined") {
      localStorage.setItem(CURRENT_EVENT_STORAGE_KEY, event.id)
    }
  }, [])

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      currentOrg,
      currentEvent,
      organizations,
      events,
      login,
      logout,
      setCurrentOrg,
      setCurrentEvent,
    }),
    [currentEvent, currentOrg, events, isLoading, login, logout, organizations, setCurrentEvent, setCurrentOrg, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
