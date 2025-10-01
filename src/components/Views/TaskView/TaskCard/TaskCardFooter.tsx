"use client"

import { memo, useMemo } from "react"
import { Clock, AlertTriangle, Flag } from 'lucide-react'
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { DatabaseTask } from "@/src/lib/models/types"

interface TaskCardFooterProps {
  task: DatabaseTask
  isOverdue: boolean
  isAlmostOverdue: boolean
  isAnimatingOverdue?: boolean
}

const TaskCardFooter = memo(function TaskCardFooter({ 
  task, 
  isOverdue, 
  isAlmostOverdue, 
  isAnimatingOverdue = false 
}: TaskCardFooterProps) {
  // Мемоизированные данные для отображения
  const footerData = useMemo(() => {
    // Форматируем дату
    const formattedDate = format(task.due_date, "d MMM, HH:mm", { locale: ru })
    
    // Определяем цвета и иконки для даты
    let dateColor = "text-gray-600"
    let dateIcon = <Clock className="h-4 w-4 text-gray-400" />
    
    if (isOverdue || isAnimatingOverdue) {
      dateColor = "text-red-600 font-medium"
      dateIcon = <AlertTriangle className="h-4 w-4 text-red-500" />
    } else if (isAlmostOverdue) {
      dateColor = "text-orange-600 font-medium"
      dateIcon = <AlertTriangle className="h-4 w-4 text-orange-500" />
    }

    // Определяем цвет приоритета
    let priorityColor = "text-gray-600"
    let priorityIcon = <Flag className="h-4 w-4 text-gray-400" />
    
    switch (task.priority) {
      case 1:
        priorityColor = "text-red-600 font-medium"
        priorityIcon = <Flag className="h-4 w-4 text-red-500" />
        break
      case 2:
        priorityColor = "text-orange-600 font-medium" 
        priorityIcon = <Flag className="h-4 w-4 text-orange-500" />
        break
      case 3:
        priorityColor = "text-yellow-600"
        priorityIcon = <Flag className="h-4 w-4 text-yellow-500" />
        break
      case 4:
        priorityColor = "text-green-600"
        priorityIcon = <Flag className="h-4 w-4 text-green-500" />
        break
      case 5:
        priorityColor = "text-gray-500"
        priorityIcon = <Flag className="h-4 w-4 text-gray-400" />
        break
    }

    return {
      formattedDate,
      dateColor,
      dateIcon,
      priorityColor,
      priorityIcon,
      priority: task.priority
    }
  }, [
    task.due_date, 
    task.priority, 
    isOverdue, 
    isAlmostOverdue, 
    isAnimatingOverdue
  ])

  return (
    <div title={`Приоритет: ${footerData.priority}`} className="flex flex-row items-center gap-2">
      {/* Приоритет */}
      <div className="flex items-center gap-1 text-sm">
        {footerData.priorityIcon}
        <span className={footerData.priorityColor}>
          {footerData.priority}
        </span>
      </div>
    </div>
  )
})

TaskCardFooter.displayName = 'TaskCardFooter'

export default TaskCardFooter