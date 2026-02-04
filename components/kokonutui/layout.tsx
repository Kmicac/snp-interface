"use client"

import type { ReactNode } from "react"
import Sidebar from "./sidebar"
import TopNav from "./top-nav"
import { useEffect, useState } from "react"

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show a minimal loading state during hydration
  if (!mounted) {
    return (
      <div className="flex h-screen bg-[#0F0F12]">
        <div className="w-64 bg-[#0F0F12] border-r border-[#1F1F23]" />
        <div className="w-full flex flex-1 flex-col">
          <header className="h-16 border-b border-[#1F1F23]" />
          <main className="flex-1 overflow-auto p-6 bg-[#0F0F12]" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="w-full flex flex-1 flex-col">
        <header className="h-16 border-b border-gray-200 dark:border-[#1F1F23]">
          <TopNav />
        </header>
        <main className="flex-1 overflow-auto p-6 bg-white dark:bg-[#0F0F12]">{children}</main>
      </div>
    </div>
  )
}
