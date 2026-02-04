"use client"

import React from "react"

import {
  BarChart2,
  Calendar,
  ClipboardList,
  AlertTriangle,
  Lightbulb,
  Users2,
  Clock,
  QrCode,
  Package,
  FolderTree,
  Handshake,
  Trophy,
  GraduationCap,
  Dumbbell,
  Settings,
  Menu,
  LayoutGrid,
  Home,
} from "lucide-react"

import Link from "next/link"
import { useState } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  function handleNavigation() {
    setIsMobileMenuOpen(false)
  }

  function NavItem({
    href,
    icon: Icon,
    children,
  }: {
    href: string
    icon: React.ElementType
    children: React.ReactNode
  }) {
    const isActive = pathname === href
    return (
      <Link
        href={href}
        onClick={handleNavigation}
        className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
          isActive
            ? "bg-white/10 text-white"
            : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1F1F23]"
        }`}
      >
        <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
        {children}
      </Link>
    )
  }

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-[70] p-2 rounded-lg bg-white dark:bg-[#0F0F12] shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>
      <nav
        className={`
                fixed inset-y-0 left-0 z-[70] w-64 bg-white dark:bg-[#0F0F12] transform transition-transform duration-200 ease-in-out
                lg:translate-x-0 lg:static lg:w-64 border-r border-gray-200 dark:border-[#1F1F23]
                ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
            `}
      >
        <div className="h-full flex flex-col">
          <Link
            href="/dashboard"
            className="h-16 px-6 flex items-center border-b border-gray-200 dark:border-[#1F1F23]"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-black rounded-md flex items-center justify-center overflow-hidden">
                <Image
                  src="/images/snp-logo.png"
                  alt="SNP Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className="text-lg font-semibold hover:cursor-pointer text-gray-900 dark:text-white">
                SNP
              </span>
            </div>
          </Link>

          <div className="flex-1 overflow-y-auto py-4 px-4">
            <div className="space-y-6">
              {/* OVERVIEW */}
              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Overview
                </div>
                <div className="space-y-1">
                  <NavItem href="/dashboard" icon={Home}>
                    Dashboard
                  </NavItem>
                  <NavItem href="/kpis" icon={BarChart2}>
                    Operations KPIs
                  </NavItem>
                </div>
              </div>

              {/* EVENTS */}
              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Events
                </div>
                <div className="space-y-1">
                  <NavItem href="/events" icon={Calendar}>
                    Events
                  </NavItem>
                  <NavItem href="/events/zones" icon={LayoutGrid}>
                    Zones & Layout
                  </NavItem>
                </div>
              </div>

              {/* OPERATIONS */}
              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Operations
                </div>
                <div className="space-y-1">
                  <NavItem href="/work-orders" icon={ClipboardList}>
                    Work Orders
                  </NavItem>
                  <NavItem href="/incidents" icon={AlertTriangle}>
                    Incidents
                  </NavItem>
                  <NavItem href="/improvements" icon={Lightbulb}>
                    Improvements
                  </NavItem>
                </div>
              </div>

              {/* STAFF & ACCESS */}
              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Staff & Access
                </div>
                <div className="space-y-1">
                  <NavItem href="/staff" icon={Users2}>
                    Staff & Roles
                  </NavItem>
                  <NavItem href="/shifts" icon={Clock}>
                    Shifts & Assignments
                  </NavItem>
                  <NavItem href="/access" icon={QrCode}>
                    Credentials & QR
                  </NavItem>
                </div>
              </div>

              {/* INVENTORY */}
              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Inventory
                </div>
                <div className="space-y-1">
                  <NavItem href="/inventory/assets" icon={Package}>
                    Assets
                  </NavItem>
                  <NavItem href="/inventory/categories" icon={FolderTree}>
                    Asset Categories
                  </NavItem>
                </div>
              </div>

              {/* PARTNERS */}
              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Partners
                </div>
                <div className="space-y-1">
                  <NavItem href="/partners" icon={Handshake}>
                    Partners & Brands
                  </NavItem>
                  <NavItem href="/sponsors" icon={Trophy}>
                    Sponsors
                  </NavItem>
                </div>
              </div>

              {/* REFEREES & TRAINING */}
              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Referees & Training
                </div>
                <div className="space-y-1">
                  <NavItem href="/referees" icon={GraduationCap}>
                    Referees & Tatamis
                  </NavItem>
                  <NavItem href="/trainings" icon={Dumbbell}>
                    Trainings
                  </NavItem>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 border-t border-gray-200 dark:border-[#1F1F23]">
            <div className="space-y-1">
              <NavItem href="/settings" icon={Settings}>
                Settings
              </NavItem>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[65] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
