"use client"

import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Clock, CheckCircle, AlertCircle, Pause, Play, Repeat, MoreVertical, Link, Copy, Trash2, RotateCcw, Bell, Timer, Hourglass } from 'lucide-react'
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { type Task, type User, type HistoryEntry, type BusinessProcess, TaskStatus, TaskPriority, TaskType, UserRole, HistoryActionType } from "@/types/task"

interface TaskCardProps {
  task: Task
  users: User[]
  currentUser: User
  businessProcesses: BusinessProcess[]
  onClick: () => void
  onUpdate: (task: Task, historyAction?: Omit<HistoryEntry, "id" | "timestamp">) => void
  onDelete: (taskId: string) => void
  onSendReminder: (taskId: string, minutes?: number) => void
}

export default function TaskCard({
  task,
  users,
  currentUser,
  businessProcesses,
  onClick,
  onUpdate,
  onDelete,
  onSendReminder,
}: TaskCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isReminderMenuOpen, setIsReminderMenuOpen] = useState(false)
  const suppressUntilRef = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)
  
  // Состояние для анимированного статуса
  const [isAnimatingOverdue, setIsAnimatingOverdue] = useState(false)
  
  // Эффект для задачи совещания
  useEffect(() => {
    if (task.title === "Подготовить презентацию по оптимизации закупок" && !task.isOverdue) {
      const timer = setTimeout(() => {
        // Запускаем анимацию
        setIsAnimatingOverdue(true)
        
        // Через 500мс обновляем саму задачу
        setTimeout(() => {
          const historyAction = {
            actionType: HistoryActionType.STATUS_CHANGED,
            userId: "system",
            description: "Задача просрочена",
            oldValue: task.status,
            newValue: "overdue",
          }
          
          onUpdate({
            ...task,
            isOverdue: true,
            isAlmostOverdue: false,
            updatedAt: new Date(),
            history: [
              ...task.history,
              {
                id: `${task.id}-auto-overdue`,
                actionType: HistoryActionType.STATUS_CHANGED,
                userId: "system",
                timestamp: new Date(),
                description: "Задача просрочена. Отправьте пояснительную записку о причинах просрочки задачи",
                oldValue: undefined,
                newValue: "overdue",
              }
            ]
          }, historyAction)
        }, 2000)
      }, 11000) // 5 секунд задержка
      
      return () => clearTimeout(timer)
    }
  }, [task.id, task.title, task.isOverdue, onUpdate])

  function suppressCardClicks(ms = 400) {
    suppressUntilRef.current = performance.now() + ms
  }
  function clicksSuppressed() {
    return performance.now() < suppressUntilRef.current
  }

  const getUserById = (id: string) => users.find((user) => user.id === id)
  const assignee = getUserById(task.assigneeIds[0])

  const getStatusIcon = (status: TaskStatus) => {
    // Проверяем сначала флаги просрочки
    if (task.isOverdue) {
      return <AlertCircle className="h-4 w-4" /> // или Clock, в зависимости от того, какую иконку вы хотите использовать везде
    }

    switch (status) {
      case TaskStatus.NEW:
        return <Clock className="h-4 w-4" />
      case TaskStatus.ACKNOWLEDGED:
        return <CheckCircle className="h-4 w-4" />
      case TaskStatus.IN_PROGRESS:
        return <AlertCircle className="h-4 w-4" />
      case TaskStatus.PAUSED:
        return <Pause className="h-4 w-4" />
      case TaskStatus.WAITING_CONTROL:
      case TaskStatus.ON_CONTROL:
        return <AlertCircle className="h-4 w-4" />
      case TaskStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: TaskStatus, isOverdue: boolean, isAlmostOverdue: boolean) => {
    if (isAnimatingOverdue || isOverdue) return "bg-red-100 text-red-800 border-red-200"
    if (isAlmostOverdue) return "bg-orange-100 text-orange-800 border-orange-200"
    switch (status) {
      case TaskStatus.NEW:
        return "bg-blue-100 text-blue-800 border-blue-200"
      case TaskStatus.ACKNOWLEDGED:
        return "bg-green-100 text-green-800 border-green-200"
      case TaskStatus.IN_PROGRESS:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case TaskStatus.PAUSED:
        return "bg-gray-100 text-gray-800 border-gray-200"
      case TaskStatus.WAITING_CONTROL:
        return "bg-purple-100 text-purple-800 border-purple-200"
      case TaskStatus.ON_CONTROL:
        return "bg-indigo-100 text-indigo-800 border-indigo-200"
      case TaskStatus.COMPLETED:
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: TaskStatus, isOverdue: boolean, isAlmostOverdue: boolean) => {
    if (isAnimatingOverdue || isOverdue) return "Просрочена"
    if (isAlmostOverdue) return "Почти просрочена"
    switch (status) {
      case TaskStatus.NEW:
        return "Новая"
      case TaskStatus.ACKNOWLEDGED:
        return "Ознакомлен"
      case TaskStatus.IN_PROGRESS:
        return "В работе"
      case TaskStatus.PAUSED:
        return "Приостановлена"
      case TaskStatus.WAITING_CONTROL:
        return "Ждет контроля"
      case TaskStatus.ON_CONTROL:
        return "На контроле"
      case TaskStatus.COMPLETED:
        return "Завершена"
      default:
        return "Неизвестно"
    }
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

  const formatDuration = (hours?: number) => {
    if (!hours) return "Не указано"
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    if (h === 0) return `${m} мин`
    if (m === 0) return `${h} ч`
    return `${h} ч ${m} мин`
  }

  const getCardHeight = () => {
    const baseHeight = 140
    const hourHeight = 50
    const hours = Math.max(0, task.estimatedHours ?? 1)
    const effectiveHours = hours <= 1 ? 2 : 2 + (hours - 1)
    const maxHeight = 300
    const calculatedHeight = baseHeight + effectiveHours * hourHeight
    return Math.min(calculatedHeight, maxHeight)
  }

  const reminderOptions = [
    { id: "5min", label: "Через 5 минут", minutes: 5 },
    { id: "15min", label: "Через 15 минут", minutes: 15 },
    { id: "30min", label: "Через 30 минут", minutes: 30 },
    { id: "1hour", label: "Через 1 час", minutes: 60 },
    { id: "2hours", label: "Через 2 часа", minutes: 120 },
    { id: "1day_before", label: "За 1 день до крайнего срока", minutes: -1440 },
    { id: "3hours_before", label: "За 3 часа до крайнего срока", minutes: -180 },
    { id: "1hour_before", label: "За 1 час до крайнего срока", minutes: -60 },
    { id: "tomorrow", label: "Завтра в 9:00", minutes: -1 },
  ]

  const handleCopyTask = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    const copiedTask = {
      ...task,
      title: `${task.title} (копия)`,
      status: TaskStatus.NEW,
      creatorId: currentUser.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      result: undefined,
      completedAt: undefined,
    }
    setIsMenuOpen(false)
    suppressCardClicks()
  }

  const handleGetTaskLink = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    const link = `${window.location.origin}/task/${task.id}`
    navigator.clipboard.writeText(link)
    alert("Ссылка скопирована")
    setIsMenuOpen(false)
    suppressCardClicks()
  }

  const handleReturnToWork = (e: React.MouseEvent) => {
    e.stopPropagation()
    const historyAction = {
      actionType: "STATUS_CHANGED" as any,
      userId: currentUser.id,
      oldValue: task.status,
      newValue: TaskStatus.IN_PROGRESS,
      description: "Задача возвращена в работу",
    }
    onUpdate({ ...task, status: TaskStatus.IN_PROGRESS, completedAt: undefined, updatedAt: new Date() }, historyAction)
    setIsMenuOpen(false)
    suppressCardClicks()
  }

  const handleMenuOpenChange = (open: boolean) => {
    setIsMenuOpen(open)
    if (!open) suppressCardClicks()
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (isMenuOpen || isReminderMenuOpen || clicksSuppressed()) return
    onClick()
  }

  const canReturnToWork =
    task.status === TaskStatus.COMPLETED &&
    (task.creatorId === currentUser.id || currentUser.role === UserRole.DIRECTOR)

  const canDelete = task.creatorId === currentUser.id || currentUser.role === UserRole.DIRECTOR

  return (
    <Card
      ref={cardRef}
      className={`hover:shadow-md transition-all duration-500 flex flex-col cursor-pointer relative overflow-hidden ${
        isAnimatingOverdue ? 'animate-pulse-red' : ''
      }`}
      style={{ height: `${getCardHeight()}px` }}
      onClick={handleCardClick}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusStrip(
          task.status,
          task.isOverdue || isAnimatingOverdue,
          task.isAlmostOverdue
        )} rounded-l-lg transition-all duration-500 ${
          isAnimatingOverdue ? 'animate-expand-width' : ''
        }`}
      />
      
      {/* Оверлей для эффекта вспышки */}
      {isAnimatingOverdue && (
        <div className="absolute inset-0 bg-red-500 opacity-0 animate-flash pointer-events-none" />
      )}

      <CardContent className="p-4 pl-6 flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div title={`Длительность: ${formatDuration(task.estimatedHours)}`} className="flex items-center gap-2 mb-1">
                <Hourglass className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-600">{formatDuration(task.estimatedHours)}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 text-base leading-tight">{task.title}</h3>
                {task.type === TaskType.RECURRING && (
                  <div title="Регулярная задача">
                    <Repeat className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                )}
              </div>
            </div>

            <Sheet open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 ml-2 flex-shrink-0"
                  data-menu-trigger="true"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="h-auto"
                data-menu-content="true"
                onInteractOutside={() => suppressCardClicks()}
                onEscapeKeyDown={() => suppressCardClicks()}
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <div className="py-4 space-y-2">
                  <Button variant="ghost" className="w-full justify-start h-12" onClick={handleGetTaskLink}>
                    <Link className="h-5 w-5 mr-3" />
                    Скопировать ссылку
                  </Button>

                  <Button variant="ghost" className="w-full justify-start h-12" onClick={handleCopyTask}>
                    <Copy className="h-5 w-5 mr-3" />
                    Копировать задачу
                  </Button>

                  <Sheet
                    open={isReminderMenuOpen}
                    onOpenChange={(open) => {
                      setIsReminderMenuOpen(open)
                      if (!open) suppressCardClicks()
                    }}
                  >
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Bell className="h-5 w-5 mr-3" />
                        Отправить напоминание
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="bottom"
                      className="h-auto"
                      data-menu-content="true"
                      onInteractOutside={() => suppressCardClicks()}
                      onEscapeKeyDown={() => suppressCardClicks()}
                      onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                      <div className="py-4 space-y-2">
                        <h3 className="font-medium mb-4">Когда напомнить?</h3>
                        {reminderOptions.map((option) => (
                          <Button
                            key={option.id}
                            variant="ghost"
                            className="w-full justify-start h-12"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSendReminder(task.id, option.minutes)
                              setIsReminderMenuOpen(false)
                              setIsMenuOpen(false)
                              suppressCardClicks()
                            }}
                          >
                            <Timer className="h-5 w-5 mr-3" />
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </SheetContent>
                  </Sheet>

                  {canReturnToWork && (
                    <Button variant="ghost" className="w-full justify-start h-12" onClick={handleReturnToWork}>
                      <RotateCcw className="h-5 w-5 mr-3" />
                      Вернуть в работу
                    </Button>
                  )}

                  {canDelete && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm("Удалить задачу?")) onDelete(task.id)
                        setIsMenuOpen(false)
                        suppressCardClicks()
                      }}
                    >
                      <Trash2 className="h-5 w-5 mr-3" />
                      Удалить
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center justify-between">
            <Badge
              className={`${getStatusColor(
                task.status,
                !!task.isOverdue || isAnimatingOverdue,
                !!task.isAlmostOverdue
              )} flex items-center gap-1 px-3 py-1 transition-all duration-500`}
            >
              {getStatusIcon(task.status)}
              <span className="text-sm font-medium">
                {getStatusText(task.status, !!task.isOverdue || isAnimatingOverdue, !!task.isAlmostOverdue)}
              </span>
            </Badge>
          </div>

          {assignee && (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={assignee.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-xs">{assignee.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm text-gray-700">{assignee.name}</span>
                <span className="text-xs text-gray-500">{assignee.position || "Сотрудник"}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-gray-100 space-y-2">
          <div className="text-sm text-gray-600">Приоритет: {task.priority}</div>
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-4 w-4 text-gray-400" />
            <span
              className={
                task.isOverdue || isAnimatingOverdue
                  ? "text-red-600 font-medium"
                  : task.isAlmostOverdue
                  ? "text-orange-600 font-medium"
                  : "text-gray-600"
              }
            >
              {format(task.dueDate, "d MMM, HH:mm", { locale: ru })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}