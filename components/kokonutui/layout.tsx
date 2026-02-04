"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import Sidebar from "./sidebar"
import TopNav from "./top-nav"
import { cn } from "@/lib/utils"

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [mounted, setMounted] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0F0F12]">
        <div className="fixed inset-y-0 left-0 w-64 border-r border-[#1F1F23]" />
        <div className="flex min-h-screen flex-col lg:ml-64">
          <header className="h-16 border-b border-[#1F1F23]" />
          <main className="flex-1 overflow-auto p-6" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white dark:bg-[#0F0F12]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[margin] duration-200 ease-in-out",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        <header className="h-16 border-b border-gray-200 dark:border-[#1F1F23]">
          <TopNav />
        </header>
        <main className="flex-1 overflow-auto bg-white p-4 sm:p-6 dark:bg-[#0F0F12]">{children}</main>
      </div>
    </div>
  )
}
