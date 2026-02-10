"use client"

import { useEffect, useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/context/auth-context"
import { useTasksBoard } from "@/lib/context/tasks-board-context"
import type { Task } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TaskDetailsDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
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

function formatRelativeDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Just now"

  return formatDistanceToNow(date, { addSuffix: true })
}

export function TaskDetailsDialog({ task, open, onOpenChange }: TaskDetailsDialogProps) {
  const { user } = useAuth()
  const { addComment, toggleChecklistItem, addChecklistItem } = useTasksBoard()

  const [newChecklistText, setNewChecklistText] = useState("")
  const [newCommentText, setNewCommentText] = useState("")

  const checklist = task?.checklist ?? []
  const comments = useMemo(
    () =>
      [...(task?.comments ?? [])].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [task?.comments]
  )

  const checklistTotal = checklist.length
  const checklistDone = checklist.filter((item) => item.done).length

  useEffect(() => {
    if (!open) {
      setNewChecklistText("")
      setNewCommentText("")
    }
  }, [open])

  const handleAddChecklistItem = () => {
    if (!task || !newChecklistText.trim()) return
    addChecklistItem(task.id, newChecklistText)
    setNewChecklistText("")
  }

  const handleAddComment = () => {
    if (!task || !newCommentText.trim()) return
    addComment(task.id, newCommentText, {
      id: user?.id ?? "usr-local",
      name: user?.name ?? "Unknown User",
      avatarUrl: user?.avatarUrl || user?.avatar,
    })
    setNewCommentText("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-[#1F1F23] bg-[#0F1117] text-white sm:max-w-5xl">
        {task ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl text-white">{task.title}</DialogTitle>
              <DialogDescription className="sr-only">
                Task details including checklist progress and recent activity comments.
              </DialogDescription>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge className={cn("text-[11px]", priorityColorMap[task.priority])}>{task.priority}</Badge>
                <Badge className={cn("text-[11px]", typeColorMap[task.type])}>{task.type}</Badge>
              </div>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4 rounded-xl border border-[#232735] bg-[#121623]/85 p-4">
                <section className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-200">Description</h4>
                  <p className="text-sm text-gray-300">
                    {task.description || "No description provided for this task yet."}
                  </p>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-200">Checklist</h4>
                      <p className="text-xs text-gray-400">
                        {checklistDone}/{checklistTotal} completed
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-[#2A2E3A] px-2 py-1 text-xs text-gray-300">
                      <Checkbox
                        checked={checklistTotal > 0 && checklistDone === checklistTotal}
                        onCheckedChange={() => {}}
                        className="border-[#3A4254] data-[state=checked]:bg-[#5A6A84]"
                      />
                      Overall
                    </div>
                  </div>

                  <div className="space-y-2">
                    {checklist.length > 0 ? (
                      checklist.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-2 rounded-md border border-[#2A2E3A] bg-[#171C2A] px-2 py-1.5"
                        >
                          <Checkbox
                            checked={item.done}
                            onCheckedChange={() => toggleChecklistItem(task.id, item.id)}
                            className="border-[#3A4254] data-[state=checked]:bg-[#5A6A84]"
                          />
                          <span className={cn("text-sm text-gray-200", item.done && "text-gray-400 line-through")}>
                            {item.text}
                          </span>
                        </label>
                      ))
                    ) : (
                      <div className="rounded-md border border-dashed border-[#2A2E3A] bg-[#151A26] p-3 text-xs text-gray-400">
                        No checklist items yet.
                      </div>
                    )}
                  </div>

                  <Input
                    value={newChecklistText}
                    onChange={(event) => setNewChecklistText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        handleAddChecklistItem()
                      }
                    }}
                    placeholder="Add checklist item and press Enter"
                    className="border-[#2A2E3A] bg-[#171C2A] text-sm text-gray-100 placeholder:text-gray-500"
                  />
                </section>
              </div>

              <div className="space-y-3 rounded-xl border border-[#232735] bg-[#121623]/85 p-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-200">Activity</h4>
                  <p className="text-xs text-gray-400">Comments and updates</p>
                </div>

                <ScrollArea className="h-[300px] pr-2">
                  <div className="space-y-3">
                    {comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="rounded-md border border-[#2A2E3A] bg-[#171C2A] p-2.5">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                {comment.authorAvatarUrl ? (
                                  <AvatarImage src={comment.authorAvatarUrl} alt={comment.authorName} />
                                ) : null}
                                <AvatarFallback className="bg-[#2B2F3A] text-[10px] text-gray-200">
                                  {comment.authorName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium text-gray-200">{comment.authorName}</span>
                            </div>
                            <span className="text-[11px] text-gray-400">{formatRelativeDate(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-300">{comment.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-md border border-dashed border-[#2A2E3A] bg-[#151A26] p-3 text-xs text-gray-400">
                        No comments yet.
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="space-y-2">
                  <Textarea
                    value={newCommentText}
                    onChange={(event) => setNewCommentText(event.target.value)}
                    placeholder="Write an update..."
                    className="min-h-[84px] border-[#2A2E3A] bg-[#171C2A] text-sm text-gray-100 placeholder:text-gray-500"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handleAddComment}>
                      Add comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
