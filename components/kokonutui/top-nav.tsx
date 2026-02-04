"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Bell, ChevronRight, Building2, Calendar, Check, ChevronDown } from "lucide-react"
import Profile01 from "./profile-01"
import Link from "next/link"
import { ThemeToggle } from "../theme-toggle"
import { useAuth } from "@/lib/context/auth-context"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function TopNav() {
  const { user, currentOrg, currentEvent, organizations, events, setCurrentOrg, setCurrentEvent } = useAuth()
  const pathname = usePathname()
  const avatarSrc = user?.avatarUrl || user?.avatar

  // Generate breadcrumbs based on pathname
  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean)
    const breadcrumbs = [{ label: "SNP", href: "/dashboard" }]

    if (segments.length > 0) {
      breadcrumbs.push({
        label: segments[0].charAt(0).toUpperCase() + segments[0].slice(1).replace(/-/g, " "),
        href: `/${segments[0]}`,
      })
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <nav className="px-3 sm:px-6 flex items-center justify-between bg-white dark:bg-[#0F0F12] border-b border-gray-200 dark:border-[#1F1F23] h-full">
      {/* Breadcrumbs */}
      <div className="font-medium text-sm hidden sm:flex items-center space-x-1 truncate max-w-[300px]">
        {breadcrumbs.map((item, index) => (
          <div key={item.label} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400 mx-1" />}
            {item.href ? (
              <Link
                href={item.href}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 dark:text-gray-100">{item.label}</span>
            )}
          </div>
        ))}
      </div>

      {/* Center - Org & Event Selectors */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Organization Selector */}
        {organizations.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-[#1A1A1F] border border-[#2B2B30] hover:bg-[#252529] transition-colors focus:outline-none">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span className="text-gray-200 hidden md:inline max-w-[120px] truncate">
                {currentOrg?.name || "Select Org"}
              </span>
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56 bg-[#1A1A1F] border-[#2B2B30]">
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase">
                Organizations
              </div>
              <DropdownMenuSeparator className="bg-[#2B2B30]" />
              {organizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => setCurrentOrg(org)}
                  className="flex items-center justify-between cursor-pointer text-gray-200 focus:bg-[#252529] focus:text-white"
                >
                  <span>{org.name}</span>
                  {currentOrg?.id === org.id && <Check className="h-4 w-4 text-green-500" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Event Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-[#1A1A1F] border border-[#2B2B30] hover:bg-[#252529] transition-colors focus:outline-none">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-200 hidden sm:inline max-w-[150px] truncate">
              {currentEvent?.name || "Select Event"}
            </span>
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-64 bg-[#1A1A1F] border-[#2B2B30]">
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase">
              Current Event
            </div>
            <DropdownMenuSeparator className="bg-[#2B2B30]" />
            {events.map((event) => (
              <DropdownMenuItem
                key={event.id}
                onClick={() => setCurrentEvent(event)}
                className="flex items-center justify-between cursor-pointer text-gray-200 focus:bg-[#252529] focus:text-white"
              >
                <div className="flex flex-col">
                  <span>{event.name}</span>
                  <span className="text-xs text-gray-500">{event.venue}</span>
                </div>
                {currentEvent?.id === event.id && <Check className="h-4 w-4 text-green-500" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-[#1F1F23] rounded-full transition-colors relative"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-gray-200 dark:ring-[#2B2B30]">
              {avatarSrc && <AvatarImage src={avatarSrc} alt={user?.name ?? "User"} />}
              <AvatarFallback>{user?.name?.charAt(0) ?? "U"}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-[280px] sm:w-80 bg-background border-border rounded-lg shadow-lg"
          >
            <Profile01 avatar={avatarSrc} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
