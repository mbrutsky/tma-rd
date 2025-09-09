// components/AIResultCheckDialog.tsx
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Bot, 
  CheckCircle, 
  AlertTriangle, 
  RotateCcw, 
  ThumbsUp,
  Loader2,
  Sparkles,
  FileText
} from "lucide-react"
import { type Task, type User, TaskStatus, HistoryActionType } from "@/types/task"

export interface AttachedFile {
  file: File
  id: string
}

// Интерфейс для результата задачи с множественными файлами
export interface TaskResult {
  text: string        // Обязательное текстовое описание результата
  files: File[]       // Массив прикрепленных файлов
}

// Обновленный интерфейс для основного компонента
interface TaskCompletionDialogProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (result: TaskResult, aiScore?: number) => void
  onReturnToWork: () => void
  currentUser: User
}

// Обновленные пропсы для AIResultCheckDialog
interface AIResultCheckDialogProps {
  task: Task
  resultText: string        // Сформированный текст для отображения (включает список файлов)
  result: TaskResult       // Полный объект результата с массивом файлов
  open: boolean
  onOpenChange: (open: boolean) => void
  onReturnToWork: () => void
  onAcceptResult: (aiScore: number) => void
  currentUser: User
}

// ФЛАГ ДЛЯ ТЕСТИРОВАНИЯ: 1 - требует доработки (68%), 2 - принято (100%)
const AI_CHECK_FLAG = 2 // <-- Измените на 1 для теста с оценкой 68%

export default function AIResultCheckDialog({
  task,
  resultText,
  result,
  open,
  onOpenChange,
  onReturnToWork,
  onAcceptResult,
  currentUser,
}: AIResultCheckDialogProps) {
  const [isChecking, setIsChecking] = useState(true)
  const [checkProgress, setCheckProgress] = useState(0)
  const [checkResult, setCheckResult] = useState<{
    status: 'pending' | 'needs_improvement' | 'accepted'
    score?: number
    feedback?: string
    suggestions?: string[]
  }>({ status: 'pending' })

  useEffect(() => {
    if (open && isChecking) {
      // Симуляция процесса проверки ИИ
      const progressInterval = setInterval(() => {
        setCheckProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + 10
        })
      }, 200)

      // Через 2 секунды показываем результат
      setTimeout(() => {
        setIsChecking(false)
        
        if (AI_CHECK_FLAG === 1) {
          // Сценарий: требует доработки - 68%
          setCheckResult({
            status: 'needs_improvement',
            score: 68,
            feedback: 'Результат выполнения требует доработки',
            suggestions: [
              'Отсутствуют подписи сторон',
              'Отсутствует информация о проверке комплектности поставки',
              'Не указаны результаты проверки технического состояния оборудования',
              'Требуется подтверждение соответствия характеристик спецификации'
            ]
          })
        } else if (AI_CHECK_FLAG === 2) {
          // Сценарий: принято - 100%
          setCheckResult({
            status: 'accepted',
            score: 100,
            feedback: 'Результат выполнения соответствует требованиям',
            suggestions: [
              'Задача выполнена в полном объеме',
              'Результат детально описан',
              'Соблюдены все критерии качества',
              'Отличная работа!'
            ]
          })
        }
      }, 2000)

      return () => {
        clearInterval(progressInterval)
      }
    }
  }, [open, isChecking])

  const handleReturnToWork = () => {
    onReturnToWork()
    onOpenChange(false)
    resetState()
  }

  const handleAcceptResult = () => {
    if (checkResult.score) {
      onAcceptResult(checkResult.score)
    }
    onOpenChange(false)
    resetState()
  }

  const resetState = () => {
    setIsChecking(true)
    setCheckProgress(0)
    setCheckResult({ status: 'pending' })
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 75) return "text-yellow-600"
    if (score >= 60) return "text-orange-600"
    return "text-red-600"
  }

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 90) return "default"
    if (score >= 75) return "secondary"
    return "destructive"
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        resetState()
      }
      onOpenChange(newOpen)
    }}>
      <DialogContent className="sm:max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            ИИ-проверка результата
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isChecking ? (
            // Процесс проверки
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <div className="relative">
                  <Bot className="h-16 w-16 text-blue-600 animate-pulse" />
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin absolute -bottom-1 -right-1" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Анализ результата...</span>
                  <span className="font-medium">{checkProgress}%</span>
                </div>
                <Progress value={checkProgress} className="h-2" />
              </div>

              <div className="text-center text-sm text-gray-500">
                ИИ проверяет соответствие результата требованиям задачи
              </div>
            </div>
          ) : (
            // Результат проверки
            <div className="space-y-4">
              {checkResult.status === 'needs_improvement' ? (
                // Требует доработки
                <>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-orange-900 mb-1">
                          {checkResult.feedback}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-orange-700">Оценка:</span>
                          <Badge variant="destructive" className="text-sm">
                            {checkResult.score}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Замечания ИИ:
                    </h4>
                    <ul className="space-y-2">
                      {checkResult.suggestions?.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-orange-500 mt-0.5">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      Рекомендуется доработать результат согласно замечаниям и повторно отправить на проверку.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleReturnToWork}
                      className="flex-1"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Вернуть в работу
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Закрыть
                    </Button>
                  </div>
                </>
              ) : (
                // Принято
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-green-900 mb-1">
                          Принято
                        </h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm text-green-700">Оценка бота:</span>
                          <Badge variant="default" className="text-sm bg-green-600">
                            <Sparkles className="h-3 w-3 mr-1" />
                            {checkResult.score}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Заключение ИИ:
                    </h4>
                    <ul className="space-y-2">
                      {checkResult.suggestions?.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700 flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4" />
                      Задача успешно выполнена и прошла проверку ИИ
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleAcceptResult}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Завершить задачу
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Закрыть
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}