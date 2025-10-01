// components/TaskCompletionDialog.tsx
"use client"

import { useState, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Textarea } from "@/src/components/ui/textarea"
import { Label } from "@/src/components/ui/label"
import { CheckCircle, Send, Paperclip, X, FileText, Image, File, Upload } from "lucide-react"
import AIResultCheckDialog from "./AIResultCheckDialog"
import { DatabaseTask, DatabaseUser } from "@/src/lib/models/types"

interface AttachedFile {
  file: File
  id: string
}

interface TaskResult {
  text: string
  files: File[]
}

interface TaskCompletionDialogProps {
  task: DatabaseTask
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (result: TaskResult, aiScore?: number) => void
  onReturnToWork: () => void
  currentUser: DatabaseUser
}

export default function TaskCompletionDialog({
  task,
  open,
  onOpenChange,
  onComplete,
  onReturnToWork,
  currentUser,
}: TaskCompletionDialogProps) {
  const [textResult, setTextResult] = useState("")
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAICheck, setShowAICheck] = useState(false)
  const [submittedResult, setSubmittedResult] = useState<TaskResult | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Функция для получения иконки файла по типу
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-3 w-3 text-blue-500" />
    } else if (fileType.includes('text') || fileType.includes('document')) {
      return <FileText className="h-3 w-3 text-green-500" />
    } else {
      return <File className="h-3 w-3 text-gray-500" />
    }
  }

  // Функция для форматирования размера файла
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Функция для добавления файлов
  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const newFiles: AttachedFile[] = fileArray.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9)
    }))

    setAttachedFiles(prev => [...prev, ...newFiles])
  }, [])

  // Обработка выбора файлов через input
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      addFiles(files)
    }
    event.target.value = ''
  }

  // Drag & Drop обработчики
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => prev + 1)
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => prev - 1)
    
    if (dragCounter === 1) {
      setIsDragOver(false)
    }
  }, [dragCounter])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setDragCounter(0)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
      e.dataTransfer.clearData()
    }
  }, [addFiles])

  // Удаление файла
  const removeFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  // Проверка валидности формы - теперь достаточно либо текста, либо файла
  const isFormValid = () => {
    return textResult.trim().length > 0 || attachedFiles.length > 0
  }

  // Вычисление высоты области для файлов
  const getFilesAreaHeight = () => {
    const filesCount = attachedFiles.length
    if (filesCount === 0) return 0
    
    const rows = Math.ceil(filesCount / 1)
    return Math.min(rows * 36 + 8, 120)
  }

  const handleSubmit = async () => {
    if (!isFormValid()) return

    setIsSubmitting(true)

    // Если нет текста, но есть файлы, создаем автоматическое описание
    const resultText = textResult.trim() || 
      (attachedFiles.length > 0 ? `Прикреплен${attachedFiles.length > 1 ? 'ы' : ''} файл${attachedFiles.length > 1 ? 'ы' : ''} с результатом выполнения задачи` : '')

    const result: TaskResult = {
      text: resultText,
      files: attachedFiles.map(af => af.file)
    }

    setSubmittedResult(result)

    try {
      onOpenChange(false)
      
      setTimeout(() => {
        setShowAICheck(true)
      }, 100)
      
    } catch (error) {
      console.error("Ошибка при завершении задачи:", error)
      alert("Произошла ошибка при завершении задачи. Попробуйте еще раз.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAIAccept = (aiScore: number) => {
    if (submittedResult) {
      onComplete(submittedResult, aiScore)
      setShowAICheck(false)
      resetForm()
    }
  }

  const handleAIReturnToWork = () => {
    onReturnToWork()
    setShowAICheck(false)
    setSubmittedResult(null)
  }

  const resetForm = () => {
    setTextResult("")
    setAttachedFiles([])
    setSubmittedResult(null)
    setIsDragOver(false)
    setDragCounter(0)
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  // Получение текста для отображения в AI-проверке
  const getResultDisplayText = () => {
    if (!submittedResult) return ""
    
    let displayText = submittedResult.text
    
    if (submittedResult.files.length > 0) {
      displayText += `\n\nПрикрепленные файлы (${submittedResult.files.length}):\n`
      submittedResult.files.forEach((file, index) => {
        displayText += `${index + 1}. ${file.name} (${formatFileSize(file.size)})\n`
      })
    }
    
    return displayText
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Завершение задачи
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Информация о задаче */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-700">
                <div className="font-medium mb-1">Задача: "{task.title}"</div>
                <div className="text-xs">
                  Укажите результат выполнения или прикрепите файл с результатом
                </div>
              </div>
            </div>

            {/* Поле результата с файлами */}
            <div className="space-y-3">
              <Label htmlFor="result" className="text-sm font-medium">
                Результат выполнения задачи
                <span className="text-gray-500 font-normal ml-1">(необязательно при наличии файла)</span>
              </Label>
              
              {/* Контейнер с textarea и drag & drop */}
              <div 
                ref={containerRef}
                className={`relative transition-all duration-200 ${
                  isDragOver 
                    ? 'ring-2 ring-blue-400 ring-opacity-50 bg-blue-50' 
                    : ''
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Textarea
                  ref={textareaRef}
                  id="result"
                  value={textResult}
                  onChange={(e) => setTextResult(e.target.value)}
                  placeholder="Опишите что было сделано, какие результаты достигнуты... (можно оставить пустым при наличии файла)"
                  rows={6}
                  className={`resize-none pr-3 transition-all duration-200 ${
                    isDragOver ? 'border-blue-400 bg-blue-50' : ''
                  }`}
                  style={{
                    paddingBottom: attachedFiles.length > 0 ? `${getFilesAreaHeight() + 8}px` : '12px'
                  }}
                />
                
                {/* Drag overlay */}
                {isDragOver && (
                  <div className="absolute inset-0 bg-blue-100 bg-opacity-80 border-2 border-dashed border-blue-400 rounded-md flex items-center justify-center pointer-events-none">
                    <div className="text-center text-blue-600">
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-sm font-medium">Отпустите файлы для прикрепления</div>
                    </div>
                  </div>
                )}
                
                {/* Файловые badges внутри textarea */}
                {attachedFiles.length > 0 && (
                  <div 
                    className="absolute bottom-2 left-3 right-3 overflow-y-auto"
                    style={{ height: `${getFilesAreaHeight()}px` }}
                  >
                    <div className="space-y-1">
                      {attachedFiles.map((attachedFile) => (
                        <div 
                          key={attachedFile.id}
                          className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-2 py-1 shadow-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {getFileIcon(attachedFile.file.type)}
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium truncate">
                                {attachedFile.file.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatFileSize(attachedFile.file.size)}
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(attachedFile.id)}
                            className="flex-shrink-0 h-6 w-6 p-0 hover:bg-red-50"
                          >
                            <X className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Кнопка добавления файлов и счетчик */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-input')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Paperclip className="h-4 w-4" />
                    {attachedFiles.length > 0 ? 'Добавить файлы' : 'Прикрепить файлы'}
                  </Button>
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="*/*"
                  />
                  {attachedFiles.length > 0 && (
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {attachedFiles.length} файл{attachedFiles.length === 1 ? '' : attachedFiles.length < 5 ? 'а' : 'ов'}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  Максимум 10 МБ
                </span>
              </div>

              <div className="text-xs text-gray-500">
                {attachedFiles.length > 0 
                  ? "Можно отправить только файл без текстового описания."
                  : "Результат будет проверен ИИ перед завершением задачи."}
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid() || isSubmitting}
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
                    Отправить на проверку
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог ИИ-проверки */}
      {submittedResult && (
        <AIResultCheckDialog
          task={task}
          resultText={getResultDisplayText()}
          result={submittedResult}
          open={showAICheck}
          onOpenChange={setShowAICheck}
          onReturnToWork={handleAIReturnToWork}
          onAcceptResult={handleAIAccept}
          currentUser={currentUser}
        />
      )}
    </>
  )
}