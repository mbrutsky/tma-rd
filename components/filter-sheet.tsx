"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { TaskStatus } from "@/types/task"

interface FilterSheetProps {
  statusFilter: string
  priorityFilter: string
  assigneeFilter: string
  sortBy: string
  users: Array<{ id: string; name: string; avatar?: string }>
  onStatusChange: (value: string) => void
  onPriorityChange: (value: string) => void
  onAssigneeChange: (value: string) => void
  onSortChange: (value: string) => void
  onClose: () => void
}

export default function FilterSheet({
  statusFilter,
  priorityFilter,
  assigneeFilter,
  sortBy,
  users,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onSortChange,
  onClose,
}: FilterSheetProps) {
  const handleReset = () => {
    onStatusChange("all")
    onPriorityChange("all")
    onAssigneeChange("all")
    onSortChange("dueDate")
  }

  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle>Фильтры и сортировка</SheetTitle>
      </SheetHeader>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Статус</label>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value={TaskStatus.NEW}>Новые</SelectItem>
              <SelectItem value={TaskStatus.IN_PROGRESS}>В работе</SelectItem>
              <SelectItem value={TaskStatus.PAUSED}>Приостановлены</SelectItem>
              <SelectItem value={TaskStatus.WAITING_CONTROL}>Ждет контроля</SelectItem>
              <SelectItem value={TaskStatus.ON_CONTROL}>На контроле</SelectItem>
              <SelectItem value={TaskStatus.COMPLETED}>Завершенные</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Приоритет</label>
          <Select value={priorityFilter} onValueChange={onPriorityChange}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все приоритеты</SelectItem>
              <SelectItem value="1">1 - Критичный</SelectItem>
              <SelectItem value="2">2 - Высокий</SelectItem>
              <SelectItem value="3">3 - Средний</SelectItem>
              <SelectItem value="4">4 - Низкий</SelectItem>
              <SelectItem value="5">5 - Очень низкий</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Исполнитель</label>
          <Select value={assigneeFilter} onValueChange={onAssigneeChange}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все исполнители</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Сортировка</label>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dueDate">По дедлайну</SelectItem>
              <SelectItem value="priority">По приоритету (1-5)</SelectItem>
              <SelectItem value="status">По статусу</SelectItem>
              <SelectItem value="createdAt">По дате создания</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button onClick={handleReset} variant="outline" className="flex-1 h-12 bg-transparent">
          Сбросить
        </Button>
        <Button onClick={onClose} className="flex-1 h-12">
          Применить
        </Button>
      </div>
    </div>
  )
}