"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarIcon, X, Bold, Italic, Link2, Table, Plus, Trash2, Clock, Upload, Image as ImageIcon, Underline, Strikethrough, ChevronDown } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { type Task, type User, type ChecklistItem, type BusinessProcess, TaskStatus, TaskPriority, TaskType, UserRole, RecurrenceType } from "@/types/task"

// Компонент для множественного выбора пользователей
interface MultipleUserSelectProps {
  users: User[]
  selectedIds: string[]
  onAdd: (userId: string) => void
  onRemove: (userId: string) => void
  placeholder: string
  getPositionText: (user: User) => string
}

function MultipleUserSelect({ users, selectedIds, onAdd, onRemove, placeholder, getPositionText }: MultipleUserSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Фильтруем только доступных пользователей (не выбранных)
  const availableUsers = users.filter(user => !selectedIds.includes(user.id))
  // Получаем выбранных пользователей
  const selectedUsers = users.filter(user => selectedIds.includes(user.id))
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-1 border rounded-lg px-2 py-1 min-h-[48px] cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedUsers.map((user) => (
              <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {user.name}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-500" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(user.id)
                  }} 
                />
              </Badge>
            ))}
            {selectedIds.length === 0 && (
              <span className="text-gray-400 text-sm">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {availableUsers.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-2">Нет доступных пользователей</div>
          ) : (
            availableUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  onAdd(user.id)
                  setIsOpen(false)
                }}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="font-medium text-sm">{user.name}</span>
                  <span className="text-xs text-gray-500">{getPositionText(user)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface FullCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "comments" | "history">) => void
  users: User[]
  currentUser: User
  businessProcesses: BusinessProcess[]
}

interface RecurrenceSettings {
  type: "none" | RecurrenceType
  interval: number
  // Для ежедневных
  dailyType: "workdays" | "alldays"
  // Для еженедельных
  weekdays: boolean[]
  // Для ежемесячных
  monthlyType: "date" | "weekday"
  monthDay: number
  weekdayPosition: "first" | "second" | "third" | "fourth" | "last"
  weekdayName: number // 0 = воскресенье, 1 = понедельник и т.д.
  // Для ежегодных
  yearlyType: "date" | "weekday"
  yearMonth: number
  // Общие настройки
  endType: "never" | "date" | "count"
  endDate?: Date
  endCount?: number
  createTime: "now" | "scheduled"
  startDate?: Date
}

export default function FullCreateDialog({
  open,
  onOpenChange,
  onCreateTask,
  users,
  currentUser,
  businessProcesses,
}: FullCreateDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM)
  const [processId, setProcessId] = useState("")
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [responsibleId, setResponsibleId] = useState("")
  const [observerIds, setObserverIds] = useState<string[]>([])
  const [creatorId, setCreatorId] = useState(currentUser.id)
  const [dueDate, setDueDate] = useState<Date>()
  const [dueTime, setDueTime] = useState("18:00")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [tags, setTags] = useState("")
  const [estimatedHours, setEstimatedHours] = useState("")
  const [taskType, setTaskType] = useState<TaskType>(TaskType.ONE_TIME)
  
  // Checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [newChecklistItem, setNewChecklistItem] = useState("")

  // Recurrence settings
  const [recurrence, setRecurrence] = useState<RecurrenceSettings>({
    type: "none",
    interval: 1,
    dailyType: "workdays",
    weekdays: [false, true, true, true, true, true, false], // пн-пт по умолчанию
    monthlyType: "date",
    monthDay: 1,
    weekdayPosition: "first",
    weekdayName: 1, // понедельник
    yearlyType: "date",
    yearMonth: 1, // январь
    endType: "never",
    createTime: "now",
  })

  const getPositionText = (user: User) => {
    if (user.position) return user.position
    
    switch (user.role) {
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

  const weekdayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ]
  const positionNames = ["первый", "второй", "третий", "четвертый", "последний"]

  const insertTextAtCursor = (textarea: HTMLTextAreaElement, text: string) => {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = textarea.value
    const newValue = value.substring(0, start) + text + value.substring(end)
    
    setDescription(newValue)
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    }, 0)
  }

  const handleFormatText = (format: string) => {
    const textarea = document.querySelector('textarea[placeholder="Подробное описание задачи"]') as HTMLTextAreaElement
    if (!textarea) return

    switch (format) {
      case 'bold':
        insertTextAtCursor(textarea, '**текст**')
        break
      case 'italic':
        insertTextAtCursor(textarea, '*текст*')
        break
      case 'underline':
        insertTextAtCursor(textarea, '<u>текст</u>')
        break
      case 'strikethrough':
        insertTextAtCursor(textarea, '~~текст~~')
        break
      case 'link':
        insertTextAtCursor(textarea, '[текст ссылки](https://example.com)')
        break
      case 'table':
        insertTextAtCursor(textarea, '\n| Колонка 1 | Колонка 2 |\n|-----------|----------|\n| Ячейка 1  | Ячейка 2  |\n')
        break
    }
  }

  const handleFileUpload = () => {
    alert("Функция загрузки файлов (в разработке)")
  }

  const handleImageUpload = () => {
    alert("Функция загрузки изображений (в разработке)")
  }

  const handleAddChecklistItem = (parentId?: string, level: number = 0) => {
    if (!newChecklistItem.trim()) return

    const maxOrder = Math.max(0, ...checklist.map(item => item.order || 0))
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newChecklistItem.trim(),
      completed: false,
      createdAt: new Date(),
      createdBy: currentUser.id,
      parentId,
      level,
      order: maxOrder + 1,
    }

    setChecklist([...checklist, newItem])
    setNewChecklistItem("")
  }

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id && item.parentId !== id))
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = dueTime.split(':').map(Number)
      date.setHours(hours, minutes, 0, 0)
      setDueDate(date)
      setIsCalendarOpen(false)
    }
  }

  const handleTimeChange = (time: string) => {
    setDueTime(time)
    if (dueDate) {
      const [hours, minutes] = time.split(':').map(Number)
      const newDate = new Date(dueDate)
      newDate.setHours(hours, minutes, 0, 0)
      setDueDate(newDate)
    }
  }

  const handleWeekdayToggle = (dayIndex: number) => {
    const newWeekdays = [...recurrence.weekdays]
    newWeekdays[dayIndex] = !newWeekdays[dayIndex]
    setRecurrence({ ...recurrence, weekdays: newWeekdays })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || (assigneeIds.length === 0 && !responsibleId) || !dueDate || !processId) {
      return
    }

    const finalDueDate = new Date(dueDate)
    const [hours, minutes] = dueTime.split(':').map(Number)
    finalDueDate.setHours(hours, minutes, 0, 0)

    // Преобразуем настройки повторения в правильный формат
    let taskRecurrence = undefined
    if (taskType === TaskType.RECURRING && recurrence.type !== "none") {
      taskRecurrence = {
        type: recurrence.type as any,
        interval: recurrence.interval,
        daysOfWeek: recurrence.type === "weekly" ? recurrence.weekdays.map((selected, index) => selected ? index : -1).filter(day => day !== -1) : undefined,
        dayOfMonth: recurrence.type === "monthly" && recurrence.monthlyType === "date" ? recurrence.monthDay : undefined,
        weekOfMonth: recurrence.type === "monthly" && recurrence.monthlyType === "weekday" ? 
          (recurrence.weekdayPosition === "first" ? 1 : 
           recurrence.weekdayPosition === "second" ? 2 :
           recurrence.weekdayPosition === "third" ? 3 :
           recurrence.weekdayPosition === "fourth" ? 4 : -1) : undefined,
        dayOfWeek: recurrence.type === "monthly" && recurrence.monthlyType === "weekday" ? recurrence.weekdayName : undefined,
        monthOfYear: recurrence.type === "yearly" ? recurrence.yearMonth + 1 : undefined,
        endDate: recurrence.endType === "date" ? recurrence.endDate : undefined,
        maxOccurrences: recurrence.endType === "count" ? recurrence.endCount : undefined,
        creationTime: recurrence.createTime === "now" ? "immediate" as const : "scheduled" as const,
        startDate: recurrence.createTime === "scheduled" ? recurrence.startDate : undefined,
      }
    }

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      priority,
      status: TaskStatus.NEW,
      type: taskType,
      creatorId: creatorId,
      assigneeIds: assigneeIds.length > 0 ? assigneeIds : (responsibleId ? [responsibleId] : []),
      observerIds,
      processId,
      dueDate: finalDueDate,
      tags: tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0),
      estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
      checklist,
      
      // Битрикс-подобные поля
      responsibleId: responsibleId || undefined,
      
      // Настройки повторения в правильном формате
      recurrence: taskRecurrence,
    }

    onCreateTask(taskData as any)
    resetForm()
    onOpenChange(false)
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setPriority(TaskPriority.MEDIUM)
    setProcessId("")
    setAssigneeIds([])
    setResponsibleId("")
    setObserverIds([])
    setCreatorId(currentUser.id)
    setDueDate(undefined)
    setDueTime("18:00")
    setTags("")
    setEstimatedHours("")
    setTaskType(TaskType.ONE_TIME)
    setChecklist([])
    setNewChecklistItem("")
    setRecurrence({
      type: "none",
      interval: 1,
      dailyType: "workdays",
      weekdays: [false, true, true, true, true, true, false],
      monthlyType: "date",
      monthDay: 1,
      weekdayPosition: "first",
      weekdayName: 1,
      yearlyType: "date",
      yearMonth: 1,
      endType: "never",
      createTime: "now",
    })
  }

  const availableUsers = users.filter((user) => user.isActive)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const handleAddAssignee = (userId: string) => {
    if (!assigneeIds.includes(userId)) {
      setAssigneeIds([...assigneeIds, userId])
    }
  }

  const handleRemoveAssignee = (userId: string) => {
    setAssigneeIds(assigneeIds.filter(id => id !== userId))
  }

  const handleAddObserver = (userId: string) => {
    if (!observerIds.includes(userId)) {
      setObserverIds([...observerIds, userId])
    }
  }

  const handleRemoveObserver = (userId: string) => {
    setObserverIds(observerIds.filter(id => id !== userId))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl w-full h-[95vh] sm:h-[90vh] flex flex-col m-0 sm:m-4 rounded-none sm:rounded-lg overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Создать задачу</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 p-1">
            <div>
              <Label htmlFor="title">Название задачи *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введите название задачи"
                required
                className="h-12 text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Бизнес-процесс *</Label>
                <Select value={processId} onValueChange={setProcessId} required>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Выберите процесс" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessProcesses.filter(p => p.isActive).map((process) => (
                      <SelectItem key={process.id} value={process.id}>
                        {process.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Тип задачи</Label>
                <Select value={taskType} onValueChange={(value: TaskType) => setTaskType(value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskType.ONE_TIME}>Разовая</SelectItem>
                    <SelectItem value={TaskType.RECURRING}>Регулярная</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Описание</Label>
              <div className="space-y-2">
                {/* Панель форматирования и загрузки файлов */}
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-t-md border-b">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFormatText('bold')}
                      className="h-8 w-8 p-0"
                      title="Жирный текст"
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFormatText('italic')}
                      className="h-8 w-8 p-0"
                      title="Курсив"
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFormatText('underline')}
                      className="h-8 w-8 p-0"
                      title="Подчеркнутый"
                    >
                      <Underline className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFormatText('strikethrough')}
                      className="h-8 w-8 p-0"
                      title="Зачеркнутый"
                    >
                      <Strikethrough className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFormatText('link')}
                      className="h-8 w-8 p-0"
                      title="Ссылка"
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFormatText('table')}
                      className="h-8 w-8 p-0"
                      title="Таблица"
                    >
                      <Table className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleFileUpload}
                      className="h-8 px-2 text-sm"
                      title="Загрузить файл"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Файл
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleImageUpload}
                      className="h-8 px-2 text-sm"
                      title="Загрузить изображение"
                    >
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Фото
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Подробное описание задачи"
                  rows={6}
                  className="text-base rounded-t-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Приоритет</Label>
                <Select value={priority.toString()} onValueChange={(value) => setPriority(Number(value) as TaskPriority)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Критический</SelectItem>
                    <SelectItem value="2">2 - Высокий</SelectItem>
                    <SelectItem value="3">3 - Средний</SelectItem>
                    <SelectItem value="4">4 - Низкий</SelectItem>
                    <SelectItem value="5">5 - Очень низкий</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Дедлайн *</Label>
                <div className="flex gap-2">
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 justify-between text-left font-normal bg-transparent h-12"
                        type="button"
                      >
                        {dueDate ? format(dueDate, "d MMM yyyy", { locale: ru }) : "Выберите дату"}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        captionLayout="dropdown"
                        onSelect={handleDateSelect}
                        disabled={(date) => date < today}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Input
                    type="time"
                    value={dueTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="w-24 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
              </div>
            </div>
       
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tags">Теги</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Введите теги через запятую"
                  className="h-12"
                />
              </div>

              <div>
                <Label htmlFor="estimatedHours">Оценка времени (часы)</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  placeholder="Сколько часов потребуется"
                  className="h-12"
                />
              </div>
            </div>

            {/* Участники */}
            <div className="space-y-4">
              {/* Постановщик */}
              <div>
                <Label>Постановщик</Label>
                <Select value={creatorId} onValueChange={setCreatorId}>
                  <SelectTrigger className="h-12">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={users.find(u => u.id === creatorId)?.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">{users.find(u => u.id === creatorId)?.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{users.find(u => u.id === creatorId)?.name}</span>
                        <span className="text-xs text-gray-500">{getPositionText(users.find(u => u.id === creatorId)!)}</span>
                      </div>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-xs text-gray-500">{getPositionText(user)}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ответственный */}
              <div>
                <Label>Ответственный</Label>
                <Select value={responsibleId} onValueChange={setResponsibleId}>
                  <SelectTrigger className="h-12">
                    {responsibleId ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={users.find(u => u.id === responsibleId)?.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">{users.find(u => u.id === responsibleId)?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{users.find(u => u.id === responsibleId)?.name}</span>
                          <span className="text-xs text-gray-500">{getPositionText(users.find(u => u.id === responsibleId)!)}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Выберите ответственного</span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-xs text-gray-500">{getPositionText(user)}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Исполнители */}
              <div>
                <Label>Исполнители</Label>
                <MultipleUserSelect
                  users={availableUsers}
                  selectedIds={assigneeIds}
                  onAdd={handleAddAssignee}
                  onRemove={handleRemoveAssignee}
                  placeholder="Нажмите, чтобы добавить исполнителей"
                  getPositionText={getPositionText}
                />
              </div>

              {/* Наблюдатели */}
              <div>
                <Label>Наблюдатели</Label>
                <MultipleUserSelect
                  users={availableUsers}
                  selectedIds={observerIds}
                  onAdd={handleAddObserver}
                  onRemove={handleRemoveObserver}
                  placeholder="Нажмите, чтобы добавить наблюдателей"
                  getPositionText={getPositionText}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t">
              <Button 
                type="submit" 
                className="flex-1 h-12" 
                disabled={!title.trim() || (assigneeIds.length === 0 && !responsibleId) || !dueDate || !processId}
              >
                Создать задачу
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-12">
                Отмена
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}