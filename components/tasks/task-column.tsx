"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"

import { ScrollArea } from "@/components/ui/scroll-area"
import { TaskCard } from "@/components/tasks/task-card"
import type { Task, TaskStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TaskColumnProps {
  status: TaskStatus
  title: string
  count: number
  tasks: Task[]
  activeDropStatus?: TaskStatus | null
  onTaskClick: (task: Task) => void
}

interface SortableTaskCardProps {
  status: TaskStatus
  task: Task
  onTaskClick: (task: Task) => void
}

function SortableTaskCard({ status, task, onTaskClick }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: "task",
      status,
      taskId: task.id,
    },
  })

  const dragTransform = transform
    ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
    : undefined

  return (
    <TaskCard
      task={task}
      onClick={() => onTaskClick(task)}
      dragRef={setNodeRef}
      dndProps={{
        ...attributes,
        ...listeners,
        style: {
          transform: dragTransform,
          transition,
        },
      }}
      isDragging={isDragging}
    />
  )
}

export function TaskColumn({ status, title, count, tasks, activeDropStatus, onTaskClick }: TaskColumnProps) {
  const columnId = `column-${status}`
  const { setNodeRef } = useDroppable({
    id: columnId,
    data: {
      type: "column",
      status,
    },
  })

  const isActiveDropTarget = activeDropStatus === status
  const sortableItems = tasks.map((task) => task.id)

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-h-0 w-[300px] shrink-0 flex-col rounded-xl border bg-[#10141B]/95 p-2.5",
        "shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition-colors",
        isActiveDropTarget ? "border-[#4A5568] bg-[#141A23]" : "border-[#232832]"
      )}
    >
      <div className="mb-2.5 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
        <span className="rounded-full border border-[#2B3140] bg-[#1B2230] px-2 py-0.5 text-xs text-gray-200">{count}</span>
      </div>

      <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
        <ScrollArea className="min-h-0 flex-1 pr-1">
          <div className="space-y-2 pb-1">
            {tasks.map((task) => (
              <SortableTaskCard key={task.id} status={status} task={task} onTaskClick={onTaskClick} />
            ))}
            {tasks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#2F3644] bg-[#141A24] p-3 text-xs text-gray-300">
                No tasks in this column.
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </SortableContext>
    </div>
  )
}
