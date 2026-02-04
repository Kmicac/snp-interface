"use client"

import Layout from "@/components/kokonutui/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, User, Building2, Key } from "lucide-react"
import { useAuth } from "@/lib/context/auth-context"

export default function SettingsPage() {
  const { user, currentOrg } = useAuth()

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Settings
          </h1>
          <p className="text-gray-500 mt-1">Manage your profile and organization settings</p>
        </div>

        {/* Profile Section */}
        <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">Name</Label>
              <Input
                id="name"
                defaultValue={user?.name || ""}
                className="bg-[#1A1A1F] border-[#2B2B30] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue={user?.email || ""}
                className="bg-[#1A1A1F] border-[#2B2B30] text-white"
                disabled
              />
            </div>
            <Button className="bg-white text-black hover:bg-gray-200">
              Update Profile
            </Button>
          </div>
        </div>

        {/* Organization Section */}
        <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Organization
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName" className="text-gray-300">Organization Name</Label>
              <Input
                id="orgName"
                defaultValue={currentOrg?.name || ""}
                className="bg-[#1A1A1F] border-[#2B2B30] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgSlug" className="text-gray-300">Slug</Label>
              <Input
                id="orgSlug"
                defaultValue={currentOrg?.slug || ""}
                className="bg-[#1A1A1F] border-[#2B2B30] text-white"
                disabled
              />
            </div>
            <Button className="bg-white text-black hover:bg-gray-200">
              Update Organization
            </Button>
          </div>
        </div>

        {/* API Configuration */}
        <div className="bg-[#0F0F12] rounded-xl p-6 border border-[#1F1F23]">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Configuration
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiUrl" className="text-gray-300">API Base URL</Label>
              <Input
                id="apiUrl"
                defaultValue="http://localhost:3000"
                className="bg-[#1A1A1F] border-[#2B2B30] text-white font-mono"
              />
              <p className="text-xs text-gray-500">
                Configure the backend API endpoint for your deployment
              </p>
            </div>
            <Button className="bg-white text-black hover:bg-gray-200">
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
