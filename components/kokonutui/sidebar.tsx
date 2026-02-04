"use client"

import type { ReactNode } from "react"
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
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface SidebarProps {
  collapsed: boolean
  onToggle: (collapsed: boolean) => void
}

interface NavItemConfig {
  href: string
  label: string
  icon: React.ElementType
}

const navSections: { title: string; items: NavItemConfig[] }[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/kpis", label: "Operations KPIs", icon: BarChart2 },
    ],
  },
  {
    title: "Events",
    items: [
      { href: "/events", label: "Events", icon: Calendar },
      { href: "/events/zones", label: "Zones & Layout", icon: LayoutGrid },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/work-orders", label: "Work Orders", icon: ClipboardList },
      { href: "/incidents", label: "Incidents", icon: AlertTriangle },
      { href: "/improvements", label: "Improvements", icon: Lightbulb },
    ],
  },
  {
    title: "Staff & Access",
    items: [
      { href: "/staff", label: "Staff & Roles", icon: Users2 },
      { href: "/shifts", label: "Shifts & Assignments", icon: Clock },
      { href: "/access", label: "Credentials & QR", icon: QrCode },
    ],
  },
  {
    title: "Inventory",
    items: [
      { href: "/inventory/assets", label: "Assets", icon: Package },
      { href: "/inventory/categories", label: "Asset Categories", icon: FolderTree },
    ],
  },
  {
    title: "Partners",
    items: [
      { href: "/partners", label: "Partners & Brands", icon: Handshake },
      { href: "/sponsors", label: "Sponsors", icon: Trophy },
    ],
  },
  {
    title: "Referees & Training",
    items: [
      { href: "/referees", label: "Referees & Tatamis", icon: GraduationCap },
      { href: "/trainings", label: "Trainings", icon: Dumbbell },
    ],
  },
]

const settingsItem: NavItemConfig = { href: "/settings", label: "Settings", icon: Settings }

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  function closeMobileMenu() {
    setIsMobileMenuOpen(false)
  }

  function NavItem({ href, label, icon: Icon }: NavItemConfig) {
    const isActive = pathname === href
    const linkClasses = cn(
      "flex items-center rounded-md py-2 text-sm transition-colors",
      "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1F1F23]",
      isActive && "bg-white/10 text-white",
      collapsed ? "px-3 lg:justify-center lg:px-2" : "px-3"
    )

    const content: ReactNode = (
      <Link href={href} onClick={closeMobileMenu} className={linkClasses}>
        <Icon className={cn("h-4 w-4 flex-shrink-0", collapsed ? "lg:mr-0" : "mr-3")} />
        <span className={collapsed ? "lg:sr-only" : ""}>{label}</span>
      </Link>
    )

    if (!collapsed) {
      return content
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="hidden lg:block">
          {label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-[80] rounded-lg border-[#2B2B30] bg-white dark:bg-[#0F0F12]"
        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[70] border-r border-gray-200 dark:border-[#1F1F23] bg-white dark:bg-[#0F0F12]",
          "w-64 transition-[width,transform] duration-200 ease-in-out",
          "-translate-x-full lg:translate-x-0",
          isMobileMenuOpen && "translate-x-0",
          collapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-3 dark:border-[#1F1F23]">
            <Link href="/dashboard" onClick={closeMobileMenu} className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-black">
                <Image src="/images/snp-logo.png" alt="SNP Logo" width={32} height={32} className="object-contain" />
              </div>
              <span className={cn("text-lg font-semibold text-gray-900 dark:text-white", collapsed && "lg:hidden")}>
                SNP
              </span>
            </Link>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto hidden lg:flex"
              onClick={() => onToggle(!collapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-6">
              {navSections.map((section) => (
                <div key={section.title}>
                  <div
                    className={cn(
                      "mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400",
                      collapsed && "lg:sr-only"
                    )}
                  >
                    {section.title}
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <NavItem key={item.href} {...item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 px-3 py-4 dark:border-[#1F1F23]">
            <NavItem {...settingsItem} />
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="fixed inset-0 z-[65] bg-black/50 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}
    </TooltipProvider>
  )
}
