"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarIcon, Clock, ChevronDown } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { type Task, type User, type BusinessProcess, TaskStatus, TaskPriority, TaskType, UserRole } from "@/types/task"

interface QuickCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "comments" | "history">) => void
  users: User[]
  currentUser: User
  businessProcesses: BusinessProcess[]
}

export default function QuickCreateDialog({
  open,
  onOpenChange,
  onCreateTask,
  users,
  currentUser,
  businessProcesses,
}: QuickCreateDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [assigneeId, setAssigneeId] = useState("")
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM)
  const [processId, setProcessId] = useState("")
  const [dueDate, setDueDate] = useState<Date>()
  const [dueTime, setDueTime] = useState("18:00")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !assigneeId || !dueDate || !processId) {
      return
    }

    const finalDueDate = new Date(dueDate)
    const [hours, minutes] = dueTime.split(':').map(Number)
    finalDueDate.setHours(hours, minutes, 0, 0)

    onCreateTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      status: TaskStatus.NEW,
      type: TaskType.ONE_TIME,
      creatorId: currentUser.id,
      assigneeIds: [assigneeId],
      observerIds: [],
      dueDate: finalDueDate,
      processId,
      tags: [],
      checklist: [],
    })

    // Reset form
    setTitle("")
    setDescription("")
    setAssigneeId("")
    setPriority(TaskPriority.MEDIUM)
    setProcessId("")
    setDueDate(undefined)
    setDueTime("18:00")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full h-full sm:h-auto max-h-none sm:max-h-[90vh] m-0 sm:m-4 rounded-none sm:rounded-lg">
        <DialogHeader>
          <DialogTitle>Быстрое создание задачи</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="title">Название *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Что нужно сделать?"
              required
              autoFocus
              className="h-10 text-sm"
            />
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробности задачи..."
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-3">
            <div>
              <Label>Приоритет</Label>
              <Select value={priority.toString()} onValueChange={(value) => setPriority(Number(value) as TaskPriority)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Исполнитель *</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId} required>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Выберите исполнителя" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((user) => user.isActive)
                    .map((user) => (
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
          </div>

          <div>
            <Label>Дедлайн *</Label>
            <div className="flex gap-2">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 justify-between font-normal bg-transparent h-10"
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

          <div className="flex gap-2 pt-3">
            <Button type="submit" className="flex-1 h-10">
              Создать
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-10">
              Отмена
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}