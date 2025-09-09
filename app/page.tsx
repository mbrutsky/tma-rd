// [app/page.tsx]
"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import TasksView from "@/components/tasks-view"
import ProcessMapView from "@/components/process-map-view"
import ReportsAndFeedbackView from "@/components/reports-and-feedback-view"
import BottomNavigation from "@/components/bottom-navigation"
import QuickCreateDialog from "@/components/quick-create-dialog"
import { type Task, type User, type Comment, type HistoryEntry, type BusinessProcess, UserRole, TaskStatus, HistoryActionType } from "@/types/task"
import { mockUsers, mockTasks, currentUser, mockBusinessProcesses } from "@/data/mock-data"
import FullCreateDialog from "@/components/full-create-dialog"

const ensureValidDate = (dateValue: any): Date => {
  if (!dateValue) return new Date()
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue)
  if (isNaN(date.getTime())) {
    const fallback = new Date()
    fallback.setDate(fallback.getDate() + 7)
    return fallback
  }
  return date
}

const normalizeTask = (task: any): Task => {
  return {
    ...task,
    createdAt: ensureValidDate(task.createdAt),
    updatedAt: ensureValidDate(task.updatedAt),
    dueDate: ensureValidDate(task.dueDate),
    completedAt: task.completedAt ? ensureValidDate(task.completedAt) : undefined,
    // Всегда инициализируем как false
    isOverdue: false,
    isAlmostOverdue: false,
  }
}

// Создаем нормализованные задачи один раз за пределами компонента
const initialTasks = mockTasks.map(normalizeTask)
console.log("Initial tasks created outside component:", initialTasks.length)

export default function TasksApp() {
  console.log("TasksApp: component rendering")
  
  // Используем простую инициализацию без функции
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [users] = useState<User[]>(mockUsers)
  const [businessProcesses, setBusinessProcesses] = useState<BusinessProcess[]>(mockBusinessProcesses)
  const [activeTab, setActiveTab] = useState("tasks")
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false)
  const [isFullCreateOpen, setIsFullCreateOpen] = useState(false)
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false)

  console.log("TasksApp: current tasks count:", tasks.length)

  // Обновление статусов задач каждую минуту
  useEffect(() => {
    console.log("TasksApp: setting up status update timer")
    
    const updateStatuses = () => {
      console.log("TasksApp: updating task statuses")
      const now = new Date()
      
      setTasks(currentTasks => {
        return currentTasks.map(task => {
          const dueDate = task.dueDate
          const isOverdue = task.status !== TaskStatus.COMPLETED && now > dueDate
          const timeDiff = dueDate.getTime() - now.getTime()
          const hoursUntilDue = timeDiff / (1000 * 60 * 60)
          const isAlmostOverdue = !isOverdue && 
            task.status !== TaskStatus.COMPLETED && 
            hoursUntilDue > 0 && 
            hoursUntilDue <= 24

          // Обновляем статусы только если они изменились
          if (task.isOverdue !== isOverdue || task.isAlmostOverdue !== isAlmostOverdue) {
            console.log("Status changed for task", task.id, {
              wasOverdue: task.isOverdue,
              nowOverdue: isOverdue,
              wasAlmostOverdue: task.isAlmostOverdue,
              nowAlmostOverdue: isAlmostOverdue
            })
            
            return {
              ...task,
              isOverdue,
              isAlmostOverdue
            }
          }

          return task
        })
      })
    }

    // Обновляем статусы сразу
    updateStatuses()
    
    // И затем каждую минуту
    const interval = setInterval(updateStatuses, 60000)
    
    return () => {
      console.log("TasksApp: clearing status update timer")
      clearInterval(interval)
    }
  }, []) // Пустой массив зависимостей

  const addHistoryEntry = useCallback((taskId: string, entry: Omit<HistoryEntry, "id" | "timestamp">) => {
    console.log("TasksApp: adding history entry for task", taskId)
    
    const historyEntry: HistoryEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date(),
    }

    setTasks(prev => {
      const updated = prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              history: [...task.history, historyEntry],
              updatedAt: new Date(),
            }
          : task
      )
      console.log("TasksApp: added history entry, tasks count:", updated.length)
      return updated
    })
  }, [])

  const handleUpdateTask = useCallback((updatedTask: Task, historyAction?: Omit<HistoryEntry, "id" | "timestamp">) => {
    console.log("TasksApp: handleUpdateTask called for task", updatedTask.id)
    
    const safeTask = {
      ...updatedTask,
      updatedAt: new Date(),
      createdAt: ensureValidDate(updatedTask.createdAt),
      dueDate: ensureValidDate(updatedTask.dueDate),
      completedAt: updatedTask.completedAt ? ensureValidDate(updatedTask.completedAt) : undefined,
    }
    
    setTasks(prev => {
      const updated = prev.map(task => 
        task.id === safeTask.id ? safeTask : task
      )
      console.log("TasksApp: updated task, total count:", updated.length)
      return updated
    })
    
    if (historyAction) {
      addHistoryEntry(safeTask.id, historyAction)
    }
  }, [addHistoryEntry])

  const handleCreateTask = useCallback((taskData: Omit<Task, "id" | "createdAt" | "updatedAt" | "comments" | "history">) => {
    console.log("TasksApp: handleCreateTask called", taskData.title)
    
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: ensureValidDate(taskData.dueDate),
      isOverdue: false,
      isAlmostOverdue: false,
      comments: [],
      history: [
        {
          id: Date.now().toString(),
          actionType: HistoryActionType.CREATED,
          userId: currentUser.id,
          timestamp: new Date(),
          description: "Задача создана",
        },
      ],
    }
    
    setTasks(prev => {
      const updated = [newTask, ...prev]
      console.log("TasksApp: created new task, total count:", updated.length)
      return updated
    })
  }, [])

  const handleDeleteTask = useCallback((taskId: string) => {
    console.log("TasksApp: handleDeleteTask called for task", taskId)
    
    setTasks(prev => {
      const updated = prev.filter(task => task.id !== taskId)
      console.log("TasksApp: deleted task, remaining count:", updated.length)
      return updated
    })
  }, [])

  const handleAddComment = useCallback((taskId: string, comment: Omit<Comment, "id" | "timestamp">) => {
    console.log("TasksApp: handleAddComment called for task", taskId)
    
    const newComment: Comment = {
      ...comment,
      id: Date.now().toString(),
      timestamp: new Date(),
    }

    setTasks(prev => {
      const updated = prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              comments: [...task.comments, newComment],
              updatedAt: new Date(),
            }
          : task
      )
      console.log("TasksApp: added comment, total tasks:", updated.length)
      return updated
    })

    addHistoryEntry(taskId, {
      actionType: HistoryActionType.COMMENT_ADDED,
      userId: comment.authorId,
      description: comment.isResult ? "Добавлен результат выполнения" : "Добавлен комментарий",
    })
  }, [addHistoryEntry])

  const handleUpdateComment = useCallback((taskId: string, commentId: string, text: string) => {
    console.log("TasksApp: handleUpdateComment called for task", taskId, "comment", commentId)
    
    setTasks(prev => {
      const updated = prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              comments: task.comments.map(comment =>
                comment.id === commentId
                  ? { ...comment, text, isEdited: true, editedAt: new Date() }
                  : comment
              ),
              updatedAt: new Date(),
            }
          : task
      )
      console.log("TasksApp: updated comment, total tasks:", updated.length)
      return updated
    })
  }, [])

  const handleDeleteComment = useCallback((taskId: string, commentId: string) => {
    console.log("TasksApp: handleDeleteComment called for task", taskId, "comment", commentId)
    
    setTasks(prev => {
      const updated = prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              comments: task.comments.filter(comment => comment.id !== commentId),
              updatedAt: new Date(),
            }
          : task
      )
      console.log("TasksApp: deleted comment, total tasks:", updated.length)
      return updated
    })
  }, [])

  const handleSendReminder = useCallback((taskId: string, minutes?: number) => {
    console.log("TasksApp: handleSendReminder called for task", taskId, "minutes", minutes)
    
    addHistoryEntry(taskId, {
      actionType: HistoryActionType.REMINDER_SENT,
      userId: currentUser.id,
      description: minutes 
        ? `Отправлено напоминание (через ${minutes} мин)`
        : "Отправлено напоминание",
    })
  }, [addHistoryEntry])

  const handleCreateBusinessProcess = useCallback((processData: Omit<BusinessProcess, "id" | "createdAt" | "updatedAt">) => {
    console.log("TasksApp: handleCreateBusinessProcess called", processData.name)
    
    const newProcess: BusinessProcess = {
      ...processData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setBusinessProcesses(prev => [newProcess, ...prev])
  }, [])

  const getPageTitle = () => {
    switch (activeTab) {
      case "tasks":
        return "Задачи"
      case "processes":
        return "Процессы"
      case "reports":
        return "Рейтинг"
      default:
        return "Задачи"
    }
  }

  console.log("TasksApp: rendering with", tasks.length, "tasks")

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-[20]">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{getPageTitle()}</h1>
              <p className="text-sm text-gray-500">
                {currentUser.name} 
                {/* •{" "}
                {currentUser.role === UserRole.DIRECTOR
                  ? "Директор"
                  : currentUser.role === UserRole.DEPARTMENT_HEAD
                    ? "Руководитель"
                    : "Сотрудник"} */}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex">
                <Button
                  onClick={() => setIsQuickCreateOpen(true)}
                  size="sm"
                  className="h-10 px-4 bg-blue-600 hover:bg-blue-700 rounded-r-none border-r border-blue-500"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Создать задачу
                </Button>
                
                <Sheet open={isCreateMenuOpen} onOpenChange={setIsCreateMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      size="sm"
                      className="h-10 px-2 bg-blue-600 hover:bg-blue-700 rounded-l-none"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-auto">
                    <div className="py-4 space-y-2">
                      <h3 className="font-medium mb-4">Создать задачу</h3>
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12"
                        onClick={() => {
                          setIsCreateMenuOpen(false)
                          setIsQuickCreateOpen(true)
                        }}
                      >
                        <Plus className="h-5 w-5 mr-3" />
                        Быстрое создание
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12"
                        onClick={() => {
                          setIsCreateMenuOpen(false)
                          setIsFullCreateOpen(true)
                        }}
                      >
                        <Plus className="h-5 w-5 mr-3" />
                        Полная форма
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12"
                        onClick={() => {
                          setIsCreateMenuOpen(false)
                          alert("Создание из шаблона (в разработке)")
                        }}
                      >
                        <Plus className="h-5 w-5 mr-3" />
                        Создать из шаблона
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12"
                        onClick={() => {
                          setIsCreateMenuOpen(false)
                          alert("Создание бизнес-процесса (в разработке)")
                        }}
                      >
                        <Plus className="h-5 w-5 mr-3" />
                        Создать бизнес-процесс
                      </Button>
                      
                      <div className="border-t border-gray-200 my-2"></div>
                      
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12"
                        onClick={() => {
                          setIsCreateMenuOpen(false)
                          alert("Просмотр шаблонов задач (в разработке)")
                        }}
                      >
                        <span className="ml-8">Посмотреть шаблоны задач</span>
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {activeTab === "tasks" && (
          <TasksView
            tasks={tasks}
            users={users}
            currentUser={currentUser}
            businessProcesses={businessProcesses}
            onUpdateTask={handleUpdateTask}
            onCreateTask={handleCreateTask}
            onDeleteTask={handleDeleteTask}
            onAddComment={handleAddComment}
            onUpdateComment={handleUpdateComment}
            onDeleteComment={handleDeleteComment}
            onSendReminder={handleSendReminder}
          />
        )}

        {activeTab === "processes" && (
          <ProcessMapView
            tasks={tasks}
            users={users}
            currentUser={currentUser}
            businessProcesses={businessProcesses}
            onUpdateTask={handleUpdateTask}
            onCreateBusinessProcess={handleCreateBusinessProcess}
            onAddComment={handleAddComment}
            onUpdateComment={handleUpdateComment}
            onDeleteComment={handleDeleteComment}
            onSendReminder={handleSendReminder}
          />
        )}

        {activeTab === "reports" && (
          <ReportsAndFeedbackView tasks={tasks} users={users} currentUser={currentUser} />
        )}
      </div>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} currentUser={currentUser} />

      <QuickCreateDialog
        open={isQuickCreateOpen}
        onOpenChange={setIsQuickCreateOpen}
        onCreateTask={handleCreateTask}
        users={users}
        currentUser={currentUser}
        businessProcesses={businessProcesses}
      />

      <FullCreateDialog
        open={isFullCreateOpen}
        onOpenChange={setIsFullCreateOpen}
        onCreateTask={handleCreateTask}
        users={users}
        currentUser={currentUser}
        businessProcesses={businessProcesses}
      />
    </div>
  )
}