"use client"

import type { ButtonHTMLAttributes } from "react"
import { AlertTriangle, CalendarDays, CheckSquare, ClipboardList, MessageSquare, Package, Trophy, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Task } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TaskCardProps {
  task: Task
  onClick: () => void
  dragRef?: (node: HTMLButtonElement | null) => void
  dndProps?: ButtonHTMLAttributes<HTMLButtonElement>
  isDragging?: boolean
  isDragOverlay?: boolean
}

const priorityColorMap = {
  LOW: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  HIGH: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  CRITICAL: "bg-red-500/20 text-red-300 border-red-500/30",
} as const

const typeColorMap = {
  GENERAL: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  INCIDENT: "bg-red-500/20 text-red-300 border-red-500/30",
  WORK_ORDER: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  SPONSORSHIP: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  REFEREE: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  INVENTORY: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
} as const

function getTypeIcon(type: Task["type"]) {
  switch (type) {
    case "INCIDENT":
      return AlertTriangle
    case "WORK_ORDER":
      return ClipboardList
    case "SPONSORSHIP":
      return Trophy
    case "REFEREE":
      return Users
    case "INVENTORY":
      return Package
    default:
      return ClipboardList
  }
}

export function TaskCard({ task, onClick, dragRef, dndProps, isDragging = false, isDragOverlay = false }: TaskCardProps) {
  const TypeIcon = getTypeIcon(task.type)
  const commentsCount = task.comments ? task.comments.length : task.commentsCount
  const checklistTotal = task.checklist ? task.checklist.length : task.checklistTotal
  const checklistDone = task.checklist
    ? task.checklist.filter((item) => item.done).length
    : (task.checklistDone ?? 0)

  return (
    <button
      type="button"
      ref={dragRef}
      onClick={isDragging || isDragOverlay ? undefined : onClick}
      className={cn(
        "w-full rounded-lg border border-[#2A2D34] bg-[#171A21] p-2.5 text-left transition duration-150",
        "hover:border-[#3C404A] hover:bg-[#1D2027]",
        "cursor-grab active:cursor-grabbing",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4A5568]",
        isDragging && !isDragOverlay && "opacity-0 pointer-events-none",
        isDragging && "shadow-[0_14px_28px_rgba(0,0,0,0.38)] ring-1 ring-[#4A5568]/70",
        isDragOverlay && "cursor-grabbing border-[#4A5568] shadow-[0_18px_30px_rgba(0,0,0,0.42)]"
      )}
      {...dndProps}
    >
      <p className="line-clamp-2 text-sm font-medium text-white">{task.title}</p>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <Badge className={cn("text-[11px]", priorityColorMap[task.priority])}>{task.priority}</Badge>
        <Badge className={cn("text-[11px]", typeColorMap[task.type])}>{task.type}</Badge>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-300">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{commentsCount}</span>
          {typeof checklistTotal === "number" ? (
            <>
              <CheckSquare className="ml-2 h-3.5 w-3.5" />
              <span>
                {checklistDone}/{checklistTotal}
              </span>
            </>
          ) : null}
        </div>

        <TypeIcon className="h-3.5 w-3.5 text-gray-400" />
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            {task.assigneeAvatarUrl ? <AvatarImage src={task.assigneeAvatarUrl} alt={task.assigneeName || "Assignee"} /> : null}
            <AvatarFallback className="bg-[#2B2B30] text-[10px] text-gray-200">
              {task.assigneeName?.charAt(0) ?? "U"}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[120px] truncate text-xs text-gray-200">{task.assigneeName || "Unassigned"}</span>
        </div>

        {task.dueDate ? (
          <div className="flex items-center gap-1 text-[11px] text-gray-300">
            <CalendarDays className="h-3.5 w-3.5" />
            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        ) : null}
      </div>
    </button>
  )
}
