"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User, Organization, Event } from '@/lib/types'

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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock data for development
const mockUser: User = {
  id: '1',
  email: 'admin@snp.com',
  name: 'Admin SNP',
  avatar: 'https://image2url.com/r2/default/images/1770091475761-fe318971-6ba3-4ef4-87e0-f2d8186fc541.png',
  memberships: [
    { orgId: 'org-1', orgName: 'Santo Negro Producciones', role: 'admin' },
    { orgId: 'org-2', orgName: 'BJJ Events Chile', role: 'member' },
  ],
}

const mockOrganizations: Organization[] = [
  { id: 'org-1', name: 'Santo Negro Producciones', slug: 'snp' },
  { id: 'org-2', name: 'BJJ Events Chile', slug: 'bjj-chile' },
]

const mockEvents: Event[] = [
  {
    id: 'evt-1',
    name: 'ADCC LATAM 2025',
    code: 'ADCC_LATAM_2025',
    startDate: '2025-03-15',
    endDate: '2025-03-16',
    venue: 'Movistar Arena, Santiago',
    status: 'upcoming',
  },
  {
    id: 'evt-2',
    name: 'Open Chile 2025',
    code: 'OPEN_CHILE_2025',
    startDate: '2025-04-20',
    endDate: '2025-04-21',
    venue: 'Centro de Eventos, Valparaíso',
    status: 'upcoming',
  },
  {
    id: 'evt-3',
    name: 'Nacional BJJ 2024',
    code: 'NACIONAL_BJJ_2024',
    startDate: '2024-11-10',
    endDate: '2024-11-11',
    venue: 'Estadio Nacional, Santiago',
    status: 'past',
  },
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [mounted, setMounted] = useState(false)

  const loadUserData = useCallback(() => {
    // In production, this would call the API
    // For now, use mock data
    setUser(mockUser)
    setOrganizations(mockOrganizations)
    setEvents(mockEvents)
    
    // Set defaults - only access localStorage on client
    if (typeof window !== 'undefined') {
      if (mockOrganizations.length > 0) {
        const savedOrgId = localStorage.getItem('snp_current_org')
        const org = mockOrganizations.find(o => o.id === savedOrgId) || mockOrganizations[0]
        setCurrentOrg(org)
      }
      
      if (mockEvents.length > 0) {
        const savedEventId = localStorage.getItem('snp_current_event')
        const event = mockEvents.find(e => e.id === savedEventId) || mockEvents[0]
        setCurrentEvent(event)
      }
    } else {
      // Server-side defaults
      if (mockOrganizations.length > 0) setCurrentOrg(mockOrganizations[0])
      if (mockEvents.length > 0) setCurrentEvent(mockEvents[0])
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    // Only access localStorage on the client
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('snp_token')
      if (token) {
        loadUserData()
      } else {
        // Auto-login for demo purposes
        loadUserData()
      }
    }
    setIsLoading(false)
  }, [loadUserData])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // In production, this would call POST /auth/login
      // For now, simulate login
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (email && password) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('snp_token', 'mock_jwt_token')
        }
        loadUserData()
      } else {
        throw new Error('Invalid credentials')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('snp_token')
      localStorage.removeItem('snp_current_org')
      localStorage.removeItem('snp_current_event')
    }
    setUser(null)
    setCurrentOrg(null)
    setCurrentEvent(null)
    setOrganizations([])
    setEvents([])
  }

  const handleSetCurrentOrg = (org: Organization) => {
    setCurrentOrg(org)
    if (typeof window !== 'undefined') {
      localStorage.setItem('snp_current_org', org.id)
    }
  }

  const handleSetCurrentEvent = (event: Event) => {
    setCurrentEvent(event)
    if (typeof window !== 'undefined') {
      localStorage.setItem('snp_current_event', event.id)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        currentOrg,
        currentEvent,
        organizations,
        events,
        login,
        logout,
        setCurrentOrg: handleSetCurrentOrg,
        setCurrentEvent: handleSetCurrentEvent,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
