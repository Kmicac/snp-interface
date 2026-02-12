"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import Layout from "@/components/kokonutui/layout"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const inventoryNav = [
  { label: "Panel", href: "/inventory" },
  { label: "Inventario", href: "/inventory/assets" },
  { label: "Assets Category", href: "/inventory/categories" },
  { label: "Kits", href: "/inventory/kits" },
  { label: "Movimientos", href: "/inventory/movements" },
  { label: "Checklists", href: "/inventory/checklists" },
]

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/inventory") {
    return pathname === "/inventory"
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function InventoryLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <Layout>
      <div
        className="-m-4 flex h-[calc(100dvh-4rem)] min-h-[calc(100dvh-4rem)] flex-col overflow-hidden sm:-m-6"
        style={{
          backgroundColor: "#0B0D12",
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.14) 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      >
        <div className="flex h-full min-h-0 flex-col border border-[#1F1F23] p-4 sm:p-5">
          <div className="mb-4 border-b border-[#23252D] pb-4">
            <div className="flex flex-wrap items-center gap-2">
              {inventoryNav.map((item) => {
                const active = isActivePath(pathname, item.href)

                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      size="sm"
                      variant={active ? "default" : "outline"}
                      className={cn(
                        "h-8 px-3 text-sm",
                        !active && "border-[#2C2F39] bg-[#14161D] text-gray-200 hover:bg-[#1B1E25]"
                      )}
                    >
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        </div>
      </div>
    </Layout>
  )
}
