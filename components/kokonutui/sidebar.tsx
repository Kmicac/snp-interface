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
  Handshake,
  Trophy,
  GraduationCap,
  Dumbbell,
  SquareKanban,
  Settings,
  Menu,
  LayoutGrid,
  Home,
  ChevronLeft,
  ChevronDown,
  X,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
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
      { href: "/tasks", label: "Tasks Board", icon: SquareKanban },
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
      { href: "/inventory", label: "Panel", icon: LayoutGrid },
      { href: "/inventory/assets", label: "Assets", icon: Package },
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
const SIDEBAR_SCROLL_STORAGE_KEY = "snp_sidebar_scroll_top"

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navScrollRef = useRef<HTMLDivElement | null>(null)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  function isPathInSection(section: { items: NavItemConfig[] }): boolean {
    return section.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
  }

  function persistSidebarScroll() {
    if (typeof window === "undefined" || !navScrollRef.current) return
    localStorage.setItem(SIDEBAR_SCROLL_STORAGE_KEY, String(navScrollRef.current.scrollTop))
  }

  useEffect(() => {
    if (typeof window === "undefined" || !navScrollRef.current) return
    const storedScroll = localStorage.getItem(SIDEBAR_SCROLL_STORAGE_KEY)
    if (!storedScroll) return

    const parsed = Number(storedScroll)
    if (!Number.isNaN(parsed)) {
      navScrollRef.current.scrollTop = parsed
    }
  }, [])

  useEffect(() => {
    setOpenSections((prev) => {
      const base = Object.fromEntries(
        navSections.map((section) => [
          section.title,
          prev[section.title] ?? (section.title === "Overview" || isPathInSection(section)),
        ])
      )
      return base
    })
  }, [pathname])

  function closeMobileMenu() {
    persistSidebarScroll()
    setIsMobileMenuOpen(false)
  }

  function toggleSection(title: string) {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
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
            {collapsed ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => onToggle(false)}
                aria-label="Expand sidebar"
              >
                <Image src="/images/snp-logo.png" alt="SNP Logo" width={32} height={32} className="rounded-md object-contain" />
              </Button>
            ) : (
              <>
                <Link href="/dashboard" onClick={closeMobileMenu} className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-black">
                    <Image src="/images/snp-logo.png" alt="SNP Logo" width={32} height={32} className="object-contain" />
                  </div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">SNP</span>
                </Link>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-auto hidden lg:flex"
                  onClick={() => onToggle(true)}
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <div
            ref={navScrollRef}
            onScroll={persistSidebarScroll}
            className="flex-1 overflow-y-auto px-3 py-4 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="space-y-6">
              {navSections.map((section) => (
                <div key={section.title}>
                  {collapsed ? (
                    <div
                      className={cn(
                        "mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400",
                        "lg:sr-only"
                      )}
                    >
                      {section.title}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="mb-2 flex w-full items-center justify-between px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                      onClick={() => toggleSection(section.title)}
                      aria-expanded={openSections[section.title] ?? false}
                    >
                      <span>{section.title}</span>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200",
                          openSections[section.title] ? "rotate-0" : "-rotate-90"
                        )}
                      />
                    </button>
                  )}
                  {(collapsed || openSections[section.title]) && (
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <NavItem key={item.href} {...item} />
                      ))}
                    </div>
                  )}
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
