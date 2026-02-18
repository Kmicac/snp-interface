"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import { formatDistanceToNow } from "date-fns"
import { ImagePlus, X } from "lucide-react"

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
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/context/auth-context"
import { uploadImage } from "@/lib/api/upload-image"
import { useTasksBoard } from "@/lib/context/tasks-board-context"
import {
  ACCEPTED_IMAGE_INPUT_VALUE,
  ALLOWED_IMAGE_MIME_TYPES,
  getAttachmentMediaKind,
  isAllowedImageMimeType,
} from "@/lib/media/attachments"
import type { Task } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TaskDetailsDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditTask?: (task: Task) => void
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

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
        return
      }
      reject(new Error("Could not generate image preview"))
    }
    reader.onerror = () => reject(new Error("Could not read image file"))
    reader.readAsDataURL(file)
  })
}

export function TaskDetailsDialog({ task, open, onOpenChange, onEditTask }: TaskDetailsDialogProps) {
  const { toast } = useToast()
  const { user, currentOrg } = useAuth()
  const { addComment, toggleChecklistItem, addChecklistItem } = useTasksBoard()
  const commentImageInputRef = useRef<HTMLInputElement | null>(null)

  const [newChecklistText, setNewChecklistText] = useState("")
  const [newCommentText, setNewCommentText] = useState("")
  const [newCommentImageFile, setNewCommentImageFile] = useState<File | null>(null)
  const [newCommentImagePreview, setNewCommentImagePreview] = useState<string | null>(null)
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false)
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const [commentImagePreviewUrl, setCommentImagePreviewUrl] = useState<string | null>(null)

  const checklist = task?.checklist ?? []
  const taskAttachmentKind = getAttachmentMediaKind(task?.imageUrl)
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
      setNewCommentImageFile(null)
      setNewCommentImagePreview(null)
      setIsCommentSubmitting(false)
      setImagePreviewOpen(false)
      setCommentImagePreviewUrl(null)
    }
  }, [open])

  const handleAddChecklistItem = async () => {
    if (!task || !newChecklistText.trim()) return
    try {
      await addChecklistItem(task.id, newChecklistText)
      setNewChecklistText("")
    } catch (error) {
      toast({
        title: "Could not add checklist item",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddComment = async () => {
    if (!task) return

    const trimmedComment = newCommentText.trim()
    if (!trimmedComment && !newCommentImageFile) {
      toast({
        title: "Comment required",
        description: "Write a short update or attach an image before adding a comment.",
        variant: "destructive",
      })
      return
    }

    setIsCommentSubmitting(true)
    try {
      let imageUrl: string | undefined
      if (newCommentImageFile) {
        if (!currentOrg?.id) {
          throw new Error("Select an organization before uploading an image.")
        }

        const upload = await uploadImage({
          orgId: currentOrg.id,
          file: newCommentImageFile,
          folder: `orgs/${currentOrg.id}/tasks/comments`,
          entityId: task.id,
        })
        imageUrl = upload.url
      }

      await addComment(
        task.id,
        trimmedComment || "Shared an image",
        {
          id: user?.id ?? "usr-local",
          name: user?.name ?? "Unknown User",
          avatarUrl: user?.avatarUrl || user?.avatar,
        },
        { imageUrl }
      )

      setNewCommentText("")
      setNewCommentImageFile(null)
      setNewCommentImagePreview(null)
    } catch (error) {
      toast({
        title: "Could not add comment",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      })
    } finally {
      setIsCommentSubmitting(false)
    }
  }

  const handleCommentImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isAllowedImageMimeType(file.type)) {
      toast({
        title: "Invalid file type",
        description: `Allowed formats: ${ALLOWED_IMAGE_MIME_TYPES.join(", ")}`,
        variant: "destructive",
      })
      event.target.value = ""
      return
    }

    try {
      const preview = await fileToDataUrl(file)
      setNewCommentImageFile(file)
      setNewCommentImagePreview(preview)
    } catch (error) {
      toast({
        title: "Could not read image",
        description: error instanceof Error ? error.message : "Try another image.",
        variant: "destructive",
      })
    } finally {
      event.target.value = ""
    }
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

                {task.imageUrl ? (
                  <section className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-200">Attachment</h4>
                    <button
                      type="button"
                      onClick={() => setImagePreviewOpen(true)}
                      className="w-full overflow-hidden rounded-md border border-[#2A2E3A] bg-[#171C2A] p-1 text-left transition hover:border-[#3E4658]"
                    >
                      {taskAttachmentKind === "video" ? (
                        <video
                          src={task.imageUrl}
                          className="h-40 w-full rounded bg-black object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={task.imageUrl}
                          alt={`${task.title} attachment`}
                          className="h-40 w-full rounded object-cover"
                        />
                      )}
                    </button>
                    <p className="text-xs text-gray-500">
                      Click to preview {taskAttachmentKind === "video" ? "video" : "image"}.
                    </p>
                  </section>
                ) : null}

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
                            onCheckedChange={() => {
                              void toggleChecklistItem(task.id, item.id).catch((error) => {
                                toast({
                                  title: "Could not update checklist item",
                                  description: error instanceof Error ? error.message : "Try again.",
                                  variant: "destructive",
                                })
                              })
                            }}
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
                        void handleAddChecklistItem()
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
                              {comment.kind === "UPDATE" ? (
                                <Badge className="h-5 border-[#38558A]/40 bg-[#38558A]/20 px-1.5 text-[10px] text-blue-200">
                                  UPDATE
                                </Badge>
                              ) : null}
                            </div>
                            <span className="text-[11px] text-gray-400">{formatRelativeDate(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-300">{comment.message}</p>
                          {comment.imageUrl ? (
                            <button
                              type="button"
                              onClick={() => setCommentImagePreviewUrl(comment.imageUrl ?? null)}
                              className="mt-2 block w-full overflow-hidden rounded-md border border-[#2A2E3A] bg-[#111626] p-1 text-left transition hover:border-[#3E4658]"
                            >
                              {getAttachmentMediaKind(comment.imageUrl) === "video" ? (
                                <video
                                  src={comment.imageUrl}
                                  className="max-h-48 w-full rounded bg-black object-cover"
                                  muted
                                  playsInline
                                />
                              ) : (
                                <img
                                  src={comment.imageUrl}
                                  alt="Comment attachment"
                                  className="max-h-48 w-full rounded object-cover"
                                />
                              )}
                            </button>
                          ) : null}
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
                  <div className="relative">
                    <Textarea
                      value={newCommentText}
                      onChange={(event) => setNewCommentText(event.target.value)}
                      placeholder="Write an update..."
                      className="min-h-[84px] border-[#2A2E3A] bg-[#171C2A] pr-11 text-sm text-gray-100 placeholder:text-gray-500"
                    />
                    <input
                      ref={commentImageInputRef}
                      type="file"
                      accept={ACCEPTED_IMAGE_INPUT_VALUE}
                      className="hidden"
                      onChange={handleCommentImageSelect}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute bottom-2 right-2 h-7 w-7 text-blue-300 hover:bg-[#202638] hover:text-blue-200"
                      onClick={() => commentImageInputRef.current?.click()}
                    >
                      <ImagePlus className="h-4 w-4" />
                    </Button>
                  </div>
                  {newCommentImagePreview ? (
                    <div className="flex items-center justify-between rounded-md border border-[#2A2E3A] bg-[#171C2A] px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => setCommentImagePreviewUrl(newCommentImagePreview)}
                        className="flex items-center gap-2"
                      >
                        <img
                          src={newCommentImagePreview}
                          alt="New comment attachment preview"
                          className="h-9 w-9 rounded object-cover"
                        />
                        <span className="text-xs text-gray-300">Image ready to attach</span>
                      </button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-gray-400 hover:text-gray-100"
                        onClick={() => {
                          setNewCommentImageFile(null)
                          setNewCommentImagePreview(null)
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : null}
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handleAddComment} disabled={isCommentSubmitting}>
                      Add comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              {onEditTask ? (
                <Button type="button" variant="outline" onClick={() => onEditTask(task)}>
                  Edit task
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>

            <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
              <DialogContent className="border-[#1F1F23] bg-[#0B0D12] text-white sm:max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Task attachment</DialogTitle>
                  <DialogDescription className="text-gray-400">{task.title}</DialogDescription>
                </DialogHeader>
                <div className="overflow-hidden rounded-lg border border-[#2A2E3A] bg-black/50 p-2">
                  {task.imageUrl ? (
                    taskAttachmentKind === "video" ? (
                      <video
                        src={task.imageUrl}
                        controls
                        className="max-h-[70vh] w-full rounded bg-black object-contain"
                      />
                    ) : (
                      <img
                        src={task.imageUrl}
                        alt={`${task.title} full preview`}
                        className="max-h-[70vh] w-full rounded object-contain"
                      />
                    )
                  ) : null}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setImagePreviewOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={Boolean(commentImagePreviewUrl)} onOpenChange={(nextOpen) => !nextOpen && setCommentImagePreviewUrl(null)}>
              <DialogContent className="border-[#1F1F23] bg-[#0B0D12] text-white sm:max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Comment attachment</DialogTitle>
                  <DialogDescription className="text-gray-400">{task.title}</DialogDescription>
                </DialogHeader>
                <div className="overflow-hidden rounded-lg border border-[#2A2E3A] bg-black/50 p-2">
                  {commentImagePreviewUrl ? (
                    getAttachmentMediaKind(commentImagePreviewUrl) === "video" ? (
                      <video
                        src={commentImagePreviewUrl}
                        controls
                        className="max-h-[70vh] w-full rounded bg-black object-contain"
                      />
                    ) : (
                      <img
                        src={commentImagePreviewUrl}
                        alt="Comment image full preview"
                        className="max-h-[70vh] w-full rounded object-contain"
                      />
                    )
                  ) : null}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCommentImagePreviewUrl(null)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
