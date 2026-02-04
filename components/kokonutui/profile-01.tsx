"use client"

import React from "react"

import { LogOut, Settings, User } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/context/auth-context"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface MenuItem {
  label: string
  value?: string
  href: string
  icon?: React.ReactNode
}

interface Profile01Props {
  avatar?: string
}

export default function Profile01({ avatar }: Profile01Props) {
  const { user, currentOrg, logout } = useAuth()
  const router = useRouter()
  const avatarSrc = avatar || user?.avatarUrl || user?.avatar
  const avatarFallback = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U"

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const menuItems: MenuItem[] = [
    {
      label: "Profile",
      href: "/settings",
      icon: <User className="w-4 h-4" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="w-4 h-4" />,
    },
  ]

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="relative px-6 pt-8 pb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative shrink-0">
              <Avatar className="h-14 w-14 ring-4 ring-white dark:ring-zinc-900">
                {avatarSrc ? <AvatarImage src={avatarSrc} alt={user?.name || "User"} /> : null}
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {user?.name || "User"}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {currentOrg?.name || "No organization"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                {user?.email || ""}
              </p>
            </div>
          </div>
          <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-4" />
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between p-2 
                                    hover:bg-zinc-50 dark:hover:bg-zinc-800/50 
                                    rounded-lg transition-colors duration-200"
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.label}</span>
                </div>
              </Link>
            ))}

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-2 
                                hover:bg-red-50 dark:hover:bg-red-900/20 
                                rounded-lg transition-colors duration-200"
            >
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
