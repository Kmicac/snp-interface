import React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/context/auth-context"
import { TasksBoardProvider } from "@/lib/context/tasks-board-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "SNP - Santo Negro Producciones",
  description: "Event Operations Platform for Jiu Jitsu events management",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <TasksBoardProvider>
              {children}
              <Toaster />
            </TasksBoardProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
