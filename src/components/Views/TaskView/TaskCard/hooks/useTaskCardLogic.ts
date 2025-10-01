import { useState, useRef, useEffect } from "react"
import { DatabaseTask, DatabaseHistoryEntry, HistoryActionType, TaskStatus } from "@/src/lib/models/types"

interface UseTaskCardLogicProps {
  task: DatabaseTask
  onUpdate: (task: DatabaseTask, historyAction?: Omit<DatabaseHistoryEntry, "id" | "timestamp">) => void
}

export function useTaskCardLogic({ task, onUpdate }: UseTaskCardLogicProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isReminderMenuOpen, setIsReminderMenuOpen] = useState(false)
  const [isAnimatingOverdue, setIsAnimatingOverdue] = useState(false)
  const suppressUntilRef = useRef(0)

  // Эффект для задачи совещания
  useEffect(() => {
    if (task.title === "Подготовить презентацию по оптимизации закупок" && !task.is_overdue) {
      const timer = setTimeout(() => {
        setIsAnimatingOverdue(true)
        
        setTimeout(() => {
          const historyAction: Omit<DatabaseHistoryEntry, "id" | "timestamp"> = {
            task_id: task.id,
            action_type: HistoryActionType.STATUS_CHANGED,
            user_id: "system",
            description: "Задача просрочена",
            old_value: task.status,
            new_value: "overdue",
            created_at: new Date(),
          }
          
          onUpdate({
            ...task,
            is_overdue: true,
            is_almost_overdue: false,
            updated_at: new Date(),
            history: [
              ...(task.history || []),
              {
                id: `${task.id}-auto-overdue`,
                task_id: task.id,
                action_type: HistoryActionType.STATUS_CHANGED,
                user_id: "system",
                timestamp: new Date(),
                created_at: new Date(),
                description: "Задача просрочена. Отправьте пояснительную записку о причинах просрочки задачи",
                old_value: undefined,
                new_value: "overdue",
              } as DatabaseHistoryEntry
            ]
          }, historyAction)
        }, 2000)
      }, 11000)
      
      return () => clearTimeout(timer)
    }
  }, [task.id, task.title, task.is_overdue, onUpdate])

  function suppressCardClicks(ms = 400) {
    suppressUntilRef.current = performance.now() + ms
  }

  function clicksSuppressed() {
    return performance.now() < suppressUntilRef.current
  }

  const getCardHeight = () => {
    const baseHeight = 140
    const hourHeight = 50
    const hours = Math.max(0, task.estimated_hours ?? 1)
    const effectiveHours = hours <= 1 ? 2 : 2 + (hours - 1)
    const maxHeight = 300
    const calculatedHeight = baseHeight + effectiveHours * hourHeight
    return Math.min(calculatedHeight, maxHeight)
  }

  const getStatusStrip = (status: TaskStatus, isOverdue?: boolean, isAlmostOverdue?: boolean) => {
    if (isAnimatingOverdue || isOverdue) return "bg-red-500"
    if (isAlmostOverdue) return "bg-orange-500"
    switch (status) {
      case TaskStatus.NEW: return "bg-blue-500"
      case TaskStatus.ACKNOWLEDGED: return "bg-emerald-500"
      case TaskStatus.IN_PROGRESS: return "bg-yellow-500"
      case TaskStatus.PAUSED: return "bg-gray-400"
      case TaskStatus.WAITING_CONTROL: return "bg-purple-500"
      case TaskStatus.ON_CONTROL: return "bg-indigo-500"
      case TaskStatus.COMPLETED: return "bg-green-500"
      default: return "bg-gray-300"
    }
  }

  return {
    isMenuOpen,
    setIsMenuOpen,
    isReminderMenuOpen,
    setIsReminderMenuOpen,
    isAnimatingOverdue,
    suppressCardClicks,
    clicksSuppressed,
    getCardHeight,
    getStatusStrip,
  }
}