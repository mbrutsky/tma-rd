// components/ExplanatoryNoteDialog.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Textarea } from "@/src/components/ui/textarea"
import { Label } from "@/src/components/ui/label"
import { AlertTriangle, Send, Clock, CalendarPlus, CheckCircle } from "lucide-react"
import { format, addDays } from "date-fns"
import { ru } from "date-fns/locale"
import { DatabaseHistoryEntry, DatabaseTask, DatabaseUser, HistoryActionType, TaskStatus } from "@/src/lib/models/types"

interface ExplanatoryNoteDialogProps {
  task: DatabaseTask
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateTask: (task: DatabaseTask, historyAction?: Omit<DatabaseHistoryEntry, "id" | "created_at">) => void
  currentUser: DatabaseUser
}

export default function ExplanatoryNoteDialog({
  task,
  open,
  onOpenChange,
  onUpdateTask,
  currentUser,
}: ExplanatoryNoteDialogProps) {
  const [explanation, setExplanation] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isNoteSent, setIsNoteSent] = useState(false)
  const [isExtending, setIsExtending] = useState(false)

  const handleSubmit = async () => {
    if (!explanation.trim()) return

    setIsSubmitting(true)

    try {
      // Создаем запись в истории о том, что была отправлена объяснительная записка
      const historyAction = {
        task_id: task.id,
        action_type: HistoryActionType.EXPLANATORY_NOTE_SENT,
        user_id: currentUser.id,
        description: `Отправлена объяснительная записка по просрочке: "${explanation.trim()}"`,
        additional_data: {
          explanation: explanation.trim(),
          overdueDate: task.due_date,
          daysPastDue: Math.ceil((new Date().getTime() - task.due_date.getTime()) / (1000 * 60 * 60 * 24))
        }
      }

      // Обновляем задачу с новой записью в истории
      onUpdateTask({ ...task, updated_at: new Date() }, historyAction)

      // Помечаем, что записка отправлена
      setIsNoteSent(true)
      
    } catch (error) {
      console.error("Ошибка при отправке пояснительной записки:", error)
      alert("Произошла ошибка при отправке. Попробуйте еще раз.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExtendDeadline = async () => {
    setIsExtending(true)

    try {
      // Новый дедлайн - текущая дата + 2 дня
      const newDueDate = addDays(new Date(), 2)
      newDueDate.setHours(18, 0, 0, 0) // Устанавливаем время на 18:00

      // Создаем запись в истории о переносе дедлайна
      const historyAction = {
        task_id: task.id,
        action_type: HistoryActionType.DEADLINE_CHANGED,
        user_id: currentUser.id,
        description: `Дедлайн перенесен на ${format(newDueDate, "d MMMM yyyy, HH:mm", { locale: ru })} после отправки объяснительной записки`,
        old_value: JSON.stringify(task.due_date),
        new_value: JSON.stringify(newDueDate),
      }

      // Обновляем задачу: меняем дедлайн, статус и убираем флаги просрочки
      const updatedTask = {
        ...task,
        due_date: newDueDate,
        status: TaskStatus.IN_PROGRESS,
        is_overdue: false,
        is_almost_overdue: false,
        updated_at: new Date(),
      }

      onUpdateTask(updatedTask, historyAction)

      // Закрываем диалог и очищаем форму
      setExplanation("")
      setIsNoteSent(false)
      onOpenChange(false)
      
      // Показываем уведомление об успешном переносе
      alert(`Дедлайн перенесен на ${format(newDueDate, "d MMMM yyyy", { locale: ru })}. Задача переведена в статус "В работе"`)
      
    } catch (error) {
      console.error("Ошибка при переносе дедлайна:", error)
      alert("Произошла ошибка при переносе дедлайна. Попробуйте еще раз.")
    } finally {
      setIsExtending(false)
    }
  }

  const handleCancel = () => {
    setExplanation("")
    setIsNoteSent(false)
    onOpenChange(false)
  }

  // Рассчитываем количество дней просрочки
  const daysPastDue = Math.ceil((new Date().getTime() - task.due_date.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        setExplanation("")
        setIsNoteSent(false)
      }
      onOpenChange(newOpen)
    }}>
      <DialogContent className="sm:max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            {isNoteSent ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-600">Объяснительная отправлена</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5" />
                Объяснительная записка
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isNoteSent ? (
            <>
              {/* Информация о просрочке */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Задача просрочена</span>
                </div>
                <div className="text-sm text-red-700 space-y-1">
                  <div>
                    <span className="font-medium">Дедлайн:</span>{" "}
                    {format(task.due_date, "d MMMM yyyy, HH:mm", { locale: ru })}
                  </div>
                  <div>
                    <span className="font-medium">Просрочено на:</span>{" "}
                    {daysPastDue} {daysPastDue === 1 ? "день" : daysPastDue < 5 ? "дня" : "дней"}
                  </div>
                  <div className="font-medium">
                    Задача: "{task.title}"
                  </div>
                </div>
              </div>

              {/* Форма пояснительной записки */}
              <div className="space-y-3">
                <Label htmlFor="explanation" className="text-sm font-medium">
                  Объясните причины просрочки выполнения задачи
                </Label>
                <Textarea
                  id="explanation"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Укажите объективные причины, которые привели к просрочке выполнения задачи. Это поможет руководству понять ситуацию и принять соответствующие меры."
                  rows={6}
                  className="resize-none"
                  required
                />
                <div className="text-xs text-gray-500">
                  Объяснительная записка будет отправлена руководству и добавлена в историю задачи.
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!explanation.trim() || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Отправляется...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Отправить
                    </div>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Отмена
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Сообщение об успешной отправке */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-700 space-y-2">
                  <p className="font-medium">Объяснительная записка успешно отправлена руководству.</p>
                  <p>Теперь вы можете запросить перенос дедлайна для продолжения работы над задачей.</p>
                </div>
              </div>

              {/* Информация о новом дедлайне */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <CalendarPlus className="h-4 w-4" />
                  <span className="font-medium">Перенос дедлайна</span>
                </div>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>
                    <span className="font-medium">Текущий дедлайн:</span>{" "}
                    {format(task.due_date, "d MMMM yyyy, HH:mm", { locale: ru })}
                  </div>
                  <div>
                    <span className="font-medium">Новый дедлайн:</span>{" "}
                    {format(addDays(new Date(), 2), "d MMMM yyyy", { locale: ru })}, 18:00
                  </div>
                  <div className="text-xs mt-2">
                    Задача будет переведена в статус "В работе"
                  </div>
                </div>
              </div>

              {/* Кнопки действий после отправки */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleExtendDeadline}
                  disabled={isExtending}
                  className="flex-1"
                >
                  {isExtending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Переносится...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CalendarPlus className="h-4 w-4" />
                      +2 дня к сроку
                    </div>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isExtending}
                >
                  Закрыть
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}