"use client"

import { memo, useMemo } from "react"
import { Badge } from "@/src/components/ui/badge"
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Pause, 
  Trash2,
  Play,
  Eye,
  Timer
} from 'lucide-react'
import { TaskStatus } from "@/src/lib/models/types"

interface TaskCardStatusProps {
  status?: TaskStatus
  isOverdue?: boolean
  isAlmostOverdue?: boolean
  isAnimatingOverdue?: boolean
  isDeleted?: boolean
}

const TaskCardStatus = memo(function TaskCardStatus({ 
  status, 
  isOverdue, 
  isAlmostOverdue, 
  isAnimatingOverdue = false,
  isDeleted = false 
}: TaskCardStatusProps) {
  // Мемоизированные данные о статусе
  const statusData = useMemo(() => {
    // Если задача удалена, показываем иконку корзины
    if (isDeleted) {
      return {
        icon: <Trash2 className="h-4 w-4" />,
        color: "bg-orange-100 text-orange-800 border-orange-200",
        text: "В корзине"
      }
    }

    // Если просрочена или анимируется как просроченная
    if (isAnimatingOverdue || isOverdue) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        color: "bg-red-100 text-red-800 border-red-200",
        text: "Просрочена"
      }
    }
    
    // Если почти просрочена
    if (isAlmostOverdue) {
      return {
        icon: <Timer className="h-4 w-4" />,
        color: "bg-orange-100 text-orange-800 border-orange-200",
        text: "Почти просрочена"
      }
    }

    // Обычные статусы
    switch (status) {
      case TaskStatus.NEW:
        return {
          icon: <Clock className="h-4 w-4" />,
          color: "bg-blue-100 text-blue-800 border-blue-200",
          text: "Новая"
        }
      case TaskStatus.ACKNOWLEDGED:
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          color: "bg-emerald-100 text-emerald-800 border-emerald-200",
          text: "Ознакомлен"
        }
      case TaskStatus.IN_PROGRESS:
        return {
          icon: <Play className="h-4 w-4" />,
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          text: "В работе"
        }
      case TaskStatus.PAUSED:
        return {
          icon: <Pause className="h-4 w-4" />,
          color: "bg-gray-100 text-gray-800 border-gray-200",
          text: "Приостановлена"
        }
      case TaskStatus.WAITING_CONTROL:
        return {
          icon: <Eye className="h-4 w-4" />,
          color: "bg-purple-100 text-purple-800 border-purple-200",
          text: "Ждет контроля"
        }
      case TaskStatus.ON_CONTROL:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: "bg-indigo-100 text-indigo-800 border-indigo-200",
          text: "На контроле"
        }
      case TaskStatus.COMPLETED:
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          color: "bg-green-100 text-green-800 border-green-200",
          text: "Завершена"
        }
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          color: "bg-gray-100 text-gray-800 border-gray-200",
          text: "Неизвестно"
        }
    }
  }, [status, isOverdue, isAlmostOverdue, isAnimatingOverdue, isDeleted])

  return (
    <Badge
      className={`${statusData.color} flex items-center gap-1 px-3 py-1 transition-all duration-500 pointer-events-none select-none`}
    >
      {statusData.icon}
      <span className="text-sm font-medium">
        {statusData.text}
      </span>
    </Badge>
  )
})

TaskCardStatus.displayName = 'TaskCardStatus'

export default TaskCardStatus