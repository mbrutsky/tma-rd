"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, ChevronDown, ChevronRight, Calendar, Users, Clock, CheckCircle, AlertCircle, Pause, Play, Minus } from 'lucide-react'
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { type Task, type User, type Comment, type BusinessProcess, type ProcessStep, TaskStatus, TaskPriority, TaskType, UserRole, HistoryActionType } from "@/types/task"
import TaskDetailsDialog from "@/components/task-details-dialog"

interface ProcessMapViewProps {
  tasks: Task[]
  users: User[]
  currentUser: User
  businessProcesses: BusinessProcess[]
  onUpdateTask: (task: Task, historyAction?: any) => void
  onCreateBusinessProcess: (processData: Omit<BusinessProcess, "id" | "createdAt" | "updatedAt">) => void
  onAddComment: (taskId: string, comment: Omit<Comment, "id" | "timestamp">) => void
  onUpdateComment: (taskId: string, commentId: string, text: string) => void
  onDeleteComment: (taskId: string, commentId: string) => void
  onSendReminder: (taskId: string, minutes?: number) => void
}

export default function ProcessMapView({
  tasks,
  users,
  currentUser,
  businessProcesses,
  onUpdateTask,
  onCreateBusinessProcess,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onSendReminder,
}: ProcessMapViewProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [expandedProcesses, setExpandedProcesses] = useState<Set<string>>(new Set())
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newProcessName, setNewProcessName] = useState("")
  const [newProcessDescription, setNewProcessDescription] = useState("")
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])

  // Группировка задач по процессам
  const getProcessTasks = (processId: string) => {
    return tasks.filter(task => task.processId === processId)
  }

  const getStepTasks = (stepId: string) => {
    return tasks.filter(task => task.stepId === stepId)
  }

  const toggleProcessExpansion = (processId: string) => {
    const newExpanded = new Set(expandedProcesses)
    if (newExpanded.has(processId)) {
      newExpanded.delete(processId)
    } else {
      newExpanded.add(processId)
    }
    setExpandedProcesses(newExpanded)
  }

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  const getUserById = (id: string) => users.find((u) => u.id === id)

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.NEW:
        return <Clock className="h-4 w-4 text-blue-500" />
      case TaskStatus.ACKNOWLEDGED:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case TaskStatus.IN_PROGRESS:
        return <Play className="h-4 w-4 text-yellow-500" />
      case TaskStatus.PAUSED:
        return <Pause className="h-4 w-4 text-gray-500" />
      case TaskStatus.WAITING_CONTROL:
        return <AlertCircle className="h-4 w-4 text-purple-500" />
      case TaskStatus.ON_CONTROL:
        return <AlertCircle className="h-4 w-4 text-indigo-500" />
      case TaskStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: TaskStatus) => {
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

  const getPriorityBadge = (priority: TaskPriority) => {
    const colors = {
      [TaskPriority.CRITICAL]: "bg-red-100 text-red-800",
      [TaskPriority.HIGH]: "bg-orange-100 text-orange-800",
      [TaskPriority.MEDIUM]: "bg-yellow-100 text-yellow-800",
      [TaskPriority.LOW]: "bg-blue-100 text-blue-800",
      [TaskPriority.VERY_LOW]: "bg-gray-100 text-gray-800",
    }

    return (
      <Badge className={`${colors[priority]} text-xs px-1.5 py-0.5`}>
        {priority}
      </Badge>
    )
  }

  const getPositionText = (role: UserRole) => {
    switch (role) {
      case UserRole.DIRECTOR:
        return "Директор"
      case UserRole.DEPARTMENT_HEAD:
        return "Руководитель отдела"
      case UserRole.EMPLOYEE:
        return "Специалист"
      default:
        return "Сотрудник"
    }
  }

  const renderProcessStep = (step: ProcessStep, level: number = 0, processId: string) => {
    const stepTasks = getStepTasks(step.id)
    const isExpanded = expandedSteps.has(step.id)
    const hasSubSteps = step.subSteps && step.subSteps.length > 0
    const completedTasks = stepTasks.filter(t => t.status === TaskStatus.COMPLETED).length
    const totalTasks = stepTasks.length
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    const indentClass = level === 0 ? "" : 
                       level === 1 ? "ml-4" :
                       level === 2 ? "ml-8" :
                       level === 3 ? "ml-12" : "ml-16"

    return (
      <div key={step.id} className={`${indentClass} border-l-2 border-gray-200 pl-3 ${level > 0 ? 'mt-2' : ''}`}>
        {/* Заголовок шага */}
        <div 
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => hasSubSteps && toggleStepExpansion(step.id)}
        >
          <div className="flex items-center gap-2 flex-1">
            {hasSubSteps && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-medium ${level === 0 ? 'text-base' : level === 1 ? 'text-sm' : 'text-xs'}`}>
                  {step.name}
                </h4>
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {getPositionText(step.assigneeRole)}
                </Badge>
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {step.estimatedHours}ч
                </Badge>
              </div>
              <p className={`text-gray-600 ${level === 0 ? 'text-sm' : 'text-xs'}`}>
                {step.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="text-center">
              <div className="font-medium">{totalTasks}</div>
              <div className="text-xs text-gray-500">Задач</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-green-600">{completedTasks}</div>
              <div className="text-xs text-gray-500">Готово</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{Math.round(progress)}%</div>
              <div className="text-xs text-gray-500">Прогресс</div>
            </div>
          </div>
        </div>

        {/* Задачи шага */}
        {stepTasks.length > 0 && (
          <div className="mt-2 space-y-1">
            {stepTasks.map((task) => {
              const assignee = getUserById(task.assigneeIds[0])
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 bg-white border rounded cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getStatusIcon(task.status)}
                    <span className="font-medium text-sm truncate">{task.title}</span>
                    {getPriorityBadge(task.priority)}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {assignee && (
                      <div className="flex items-center gap-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={assignee.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">
                            {assignee.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-600">{assignee.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span
                        className={`${
                          task.isOverdue
                            ? "text-red-600 font-medium"
                            : task.isAlmostOverdue
                              ? "text-orange-600 font-medium"
                              : "text-gray-600"
                        }`}
                      >
                        {format(task.dueDate, "d MMM", { locale: ru })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Подшаги */}
        {hasSubSteps && isExpanded && (
          <div className="mt-2 space-y-2">
            {step.subSteps!.map(subStep => 
              renderProcessStep(subStep, level + 1, processId)
            )}
          </div>
        )}
      </div>
    )
  }

  const handleCreateProcess = () => {
    if (!newProcessName.trim()) return

    const processData = {
      name: newProcessName.trim(),
      description: newProcessDescription.trim(),
      creatorId: currentUser.id,
      isActive: true,
      departmentIds: selectedDepartments,
      steps: [] as ProcessStep[],
    }

    onCreateBusinessProcess(processData)
    setNewProcessName("")
    setNewProcessDescription("")
    setSelectedDepartments([])
    setIsCreateDialogOpen(false)
  }

  const handleDepartmentChange = (departmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDepartments([...selectedDepartments, departmentId])
    } else {
      setSelectedDepartments(selectedDepartments.filter(id => id !== departmentId))
    }
  }

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Бизнес-процессы</h2>
          <p className="text-sm text-gray-500">Управление процессами и задачами</p>
        </div>
        {(currentUser.role === UserRole.DIRECTOR || currentUser.role === UserRole.DEPARTMENT_HEAD) && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-10">
                <Plus className="h-4 w-4 mr-1" />
                Создать процесс
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Создать бизнес-процесс</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="process-name">Название процесса *</Label>
                  <Input
                    id="process-name"
                    value={newProcessName}
                    onChange={(e) => setNewProcessName(e.target.value)}
                    placeholder="Введите название процесса"
                    className="h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="process-description">Описание</Label>
                  <Textarea
                    id="process-description"
                    value={newProcessDescription}
                    onChange={(e) => setNewProcessDescription(e.target.value)}
                    placeholder="Описание процесса"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Отделы</Label>
                  <div className="space-y-2 mt-2">
                    {[
                      { id: "dept1", name: "Отдел разработки" },
                      { id: "dept2", name: "Отдел маркетинга" },
                    ].map((dept) => (
                      <div key={dept.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={dept.id}
                          checked={selectedDepartments.includes(dept.id)}
                          onCheckedChange={(checked) => handleDepartmentChange(dept.id, !!checked)}
                        />
                        <Label htmlFor={dept.id} className="text-sm">{dept.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateProcess} disabled={!newProcessName.trim()} className="flex-1">
                    Создать
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Отмена
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Список процессов */}
      <div className="space-y-3">
        {businessProcesses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <div className="text-lg mb-2">Бизнес-процессы не настроены</div>
              <div className="text-sm mb-4">Создайте первый процесс для управления задачами</div>
              {(currentUser.role === UserRole.DIRECTOR || currentUser.role === UserRole.DEPARTMENT_HEAD) && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать процесс
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          businessProcesses.map((process) => {
            const processTasks = getProcessTasks(process.id)
            const isExpanded = expandedProcesses.has(process.id)
            const completedTasks = processTasks.filter(t => t.status === TaskStatus.COMPLETED).length
            const totalTasks = processTasks.length
            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

            return (
              <Card key={process.id} className="overflow-hidden">
                {/* Заголовок процесса */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleProcessExpansion(process.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base">{process.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">{process.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{totalTasks}</div>
                        <div className="text-xs text-gray-500">Задач</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">{completedTasks}</div>
                        <div className="text-xs text-gray-500">Завершено</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{Math.round(progress)}%</div>
                        <div className="text-xs text-gray-500">Прогресс</div>
                      </div>
                    </div>
                  </div>

                  {/* Прогресс-бар */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Развернутый список шагов */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4">
                    {process.steps.length === 0 ? (
                      <div className="text-center text-gray-500 py-6">
                        <div className="text-sm">В этом процессе пока нет шагов</div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {process.steps.map((step) => 
                          renderProcessStep(step, 0, process.id)
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Task Details Dialog */}
      {selectedTask && (
        <TaskDetailsDialog
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onUpdateTask={onUpdateTask}
          onAddComment={onAddComment}
          onUpdateComment={onUpdateComment}
          onDeleteComment={onDeleteComment}
          onSendReminder={onSendReminder}
          users={users}
          currentUser={currentUser}
          businessProcesses={businessProcesses}
        />
      )}
    </div>
  )
}