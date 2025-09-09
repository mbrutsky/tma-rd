"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { BarChart3, CheckCircle, AlertTriangle, Calendar, Download, RefreshCw, ThumbsUp, Users, Filter } from 'lucide-react'
import { format, subWeeks, subMonths } from "date-fns"
import { ru } from "date-fns/locale"
import { type Task, type User, type Feedback, TaskStatus, UserRole } from "@/types/task"
import { mockFeedback } from "@/data/mock-data"

interface ReportsAndFeedbackViewProps {
  tasks: Task[]
  users: User[]
  currentUser: User
}

export default function ReportsAndFeedbackView({ tasks, users, currentUser }: ReportsAndFeedbackViewProps) {
  const [feedback] = useState<Feedback[]>(mockFeedback)
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "year">("month") 
  const [newFeedbackText, setNewFeedbackText] = useState("")
  const [newFeedbackType, setNewFeedbackType] = useState<"remark" | "gratitude">("gratitude")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [filterType, setFilterType] = useState<"all" | "remark" | "gratitude">("all")
  const [filterPeriod, setFilterPeriod] = useState<"week" | "month" | "all">("month")
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("all")
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isAddFeedbackOpen, setIsAddFeedbackOpen] = useState(false)

  // Вычисление периода
  const getPeriodDates = () => {
    const now = new Date()
    switch (period) {
      case "week":
        return { start: subWeeks(now, 1), end: now }
      case "month":
        return { start: subMonths(now, 1), end: now }
      case "quarter":
        return { start: subMonths(now, 3), end: now }
      case "year":
        return { start: subMonths(now, 12), end: now }
      default:
        return { start: subMonths(now, 1), end: now }
    }
  }

  const { start: periodStart, end: periodEnd } = getPeriodDates()

  // Фильтрация задач по периоду и пользователю
  const periodTasks = useMemo(() => {
    return tasks.filter((task) => {
      const taskDate = new Date(task.createdAt)
      const inPeriod = taskDate >= periodStart && taskDate <= periodEnd
      
      if (!inPeriod) return false
      
      if (selectedUserFilter === "all") return true
      
      return task.assigneeIds.includes(selectedUserFilter) || 
             task.creatorId === selectedUserFilter ||
             task.observerIds.includes(selectedUserFilter)
    })
  }, [tasks, periodStart, periodEnd, selectedUserFilter])

  // Статистика эффективности - фильтруем только задачи, назначенные на сотрудников (не директора)
// Статистика эффективности - фильтруем только задачи, назначенные на сотрудников (не директора)
const efficiencyStats = useMemo(() => {
  // Получаем ID всех сотрудников (исключая директора)
  const employeeIds = users
    .filter(user => user.role !== UserRole.DIRECTOR)
    .map(user => user.id)
  
  // Фильтруем задачи только тех, что назначены на сотрудников
  const employeeTasks = periodTasks.filter(task => 
    task.assigneeIds.some(id => employeeIds.includes(id))
  )
  
  const completedTasks = employeeTasks.filter((t) => t.status === TaskStatus.COMPLETED)
  const overdueTasks = employeeTasks.filter((t) => t.isOverdue)
  const completedOnTime = completedTasks.filter((t) => !t.isOverdue)

  const totalEstimatedHours = employeeTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)
  const totalActualHours = employeeTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)

  return {
    totalTasks: employeeTasks.length,
    completedTasks: completedTasks.length,
    overdueTasks: overdueTasks.length,
    completedOnTime: completedOnTime.length,
    completionRate: employeeTasks.length > 0 ? (completedTasks.length / employeeTasks.length) * 100 : 0,
    // Исправленная формула: процент выполненных в срок от ВСЕХ задач, а не только от выполненных
    onTimeRate: employeeTasks.length > 0 ? (completedOnTime.length / employeeTasks.length) * 100 : 0,
    totalEstimatedHours,
    totalActualHours,
    timeEfficiency: totalEstimatedHours > 0 ? (totalEstimatedHours / totalActualHours) * 100 : 0,
  }
}, [periodTasks, users])

  // Автоматические замечания за просрочки
  const automaticRemarks = useMemo(() => {
    return tasks
      .filter((task) => task.isOverdue && task.assigneeIds.length > 0)
      .map((task) => ({
        id: `auto-${task.id}`,
        type: "remark" as const,
        fromUserId: "system",
        toUserId: task.assigneeIds[0],
        taskId: task.id,
        message: `Автоматическое замечание: просрочка задачи "${task.title}"`,
        createdAt: new Date(),
        isAutomatic: true,
      }))
  }, [tasks])

  // Объединение обычных отзывов и автоматических замечаний с фильтрацией
  const allFeedback = useMemo(() => {
    return [...feedback, ...automaticRemarks]
      .filter((item) => {
        if (filterType !== "all" && item.type !== filterType) return false

        if (filterPeriod !== "all") {
          const now = new Date()
          const itemDate = new Date(item.createdAt)
          const daysDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24)

          if (filterPeriod === "week" && daysDiff > 7) return false
          if (filterPeriod === "month" && daysDiff > 30) return false
        }

        if (selectedUserFilter !== "all") {
          return item.toUserId === selectedUserFilter || item.fromUserId === selectedUserFilter
        }

        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [feedback, automaticRemarks, filterType, filterPeriod, selectedUserFilter])

  // Статистика по пользователям
  const userStats = useMemo(() => {
    const filteredUsers = selectedUserFilter === "all" 
      ? users.filter(user => user.role !== UserRole.DIRECTOR) // Исключаем директора
      : users.filter(user => user.id === selectedUserFilter && user.role !== UserRole.DIRECTOR)

    return filteredUsers
      .map((user) => {
        const userFeedback = allFeedback.filter((item) => item.toUserId === user.id)
        const gratitudes = userFeedback.filter((item) => item.type === "gratitude")
        const remarks = userFeedback.filter((item) => item.type === "remark")

        // Фильтруем только задачи, где пользователь является исполнителем
        const userTasks = tasks.filter(task => 
          task.assigneeIds.includes(user.id)
        )
        
        // Подсчитываем выполненные задачи
        const userCompletedTasks = userTasks.filter(task => task.status === TaskStatus.COMPLETED)
        
        // Подсчитываем просроченные задачи (включая выполненные с просрочкой)
        const userOverdueTasks = userTasks.filter(task => task.isOverdue === true)
        
        // Подсчитываем выполненные в срок (выполненные БЕЗ просрочки)
        const userCompletedOnTime = userCompletedTasks.filter(task => !task.isOverdue)

        return {
          user,
          totalFeedback: userFeedback.length,
          gratitudes: gratitudes.length,
          remarks: remarks.length,
          score: gratitudes.length - remarks.length,
          totalTasks: userTasks.length,
          completedTasks: userCompletedTasks.length,
          overdueTasks: userOverdueTasks.length,
          completedOnTime: userCompletedOnTime.length,
          completionRate: userTasks.length > 0 ? (userCompletedTasks.length / userTasks.length) * 100 : 0,
        }
      })
      .sort((a, b) => b.score - a.score)
  }, [users, allFeedback, tasks, selectedUserFilter])

  const handleSendFeedback = () => {
    if (!newFeedbackText.trim() || !selectedUserId) return

    console.log("Отправка отзыва:", {
      type: newFeedbackType,
      toUserId: selectedUserId,
      message: newFeedbackText,
      fromUserId: currentUser.id,
    })

    setNewFeedbackText("")
    setSelectedUserId("")
    setIsAddFeedbackOpen(false)
  }

  const handleExportReport = () => {
    alert("Экспорт отчета (функция в разработке)")
  }

  const getUserById = (id: string) => {
    if (id === "system") return { id: "system", name: "Система", avatar: "" }
    return users.find((u) => u.id === id)
  }

  const getRelatedTask = (taskId?: string) => {
    return taskId ? tasks.find((t) => t.id === taskId) : null
  }

  const getSelectedUserName = () => {
    if (selectedUserFilter === "all") return "Все сотрудники"
    const user = users.find(u => u.id === selectedUserFilter)
    return user ? user.name : "Неизвестный пользователь"
  }

  // Показываем всех сотрудников в рейтинге
  const displayedUserStats = userStats

  // Mobile Filters Component
  const MobileFilters = () => (
    <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <Filter className="h-4 w-4 mr-1" />
          Фильтры
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Фильтры</SheetTitle>
          <SheetDescription>
            Настройте параметры отображения данных
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Период</label>
            <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Неделя</SelectItem>
                <SelectItem value="month">Месяц</SelectItem>
                <SelectItem value="quarter">Квартал</SelectItem>
                <SelectItem value="year">Год</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Сотрудник</label>
            <Select value={selectedUserFilter} onValueChange={setSelectedUserFilter}>
              <SelectTrigger>
                <Users className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все сотрудники</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {user.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <div className="space-y-4 lg:space-y-6">
          {/* Mobile Header */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="hidden lg:block w-full sm:w-auto">              
              {/* Desktop filters */}
              <div className="hidden lg:flex items-center gap-4">
                <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                  <SelectTrigger className="w-40">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Неделя</SelectItem>
                    <SelectItem value="month">Месяц</SelectItem>
                    <SelectItem value="quarter">Квартал</SelectItem>
                    <SelectItem value="year">Год</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedUserFilter} onValueChange={setSelectedUserFilter}>
                  <SelectTrigger className="w-48">
                    <Users className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все сотрудники</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {user.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full">
              
             <div className="flex items-center justify-between w-full">
               <MobileFilters />
                        {/* Period info */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg flex justify-between items-center">
            <div className="flex flex-col">
              <div>{format(periodStart, "d MMM", { locale: ru })} - {format(periodEnd, "d MMM yyyy", { locale: ru })}</div>
              <div className="mt-1">{getSelectedUserName()}</div>
            </div>
          </div>
             </div>
              
              <Button variant="outline" size="sm" onClick={handleExportReport} className="hidden sm:flex">
                <Download className="h-4 w-4 mr-1" />
                <span className="hidden lg:inline">Экспорт</span>
              </Button>
              
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <RefreshCw className="h-4 w-4 mr-1" />
                <span className="hidden lg:inline">Обновить</span>
              </Button>
            </div>
          </div>

          {/* Metrics - Mobile optimized grid with new layout */}
          <div className="grid grid-cols-[auto,auto,auto] sm:grid-cols-[auto,auto,auto] lg:grid-cols-3 gap-3 lg:gap-4">
            {/* Всего задач - на всю ширину на мобильных */}
            <Card className="col-span-1 sm:col-span-1 lg:col-span-1">
              <CardContent className="p-3 lg:p-4 h-full">
                <div className="flex flex-col h-full justify-between lg:flex-row lg:items-center lg:justify-between">
                  <div className="mb-2 lg:mb-0">
                    <p className="text-xs lg:text-sm text-gray-600">Всего задач</p>
                    <p className="text-xl lg:text-2xl font-bold">{efficiencyStats.totalTasks}</p>
                  </div>
                  <BarChart3 className="h-6 w-6 lg:h-8 lg:w-8 text-blue-500 self-end lg:self-auto" />
                </div>
              </CardContent>
            </Card>

            {/* Выполнено в срок */}
            <Card className="col-span-1">
              <CardContent className="p-3 lg:p-4 h-full">
                <div className="flex flex-col h-full justify-between lg:flex-row lg:items-center lg:justify-between">
                  <div className="mb-2 lg:mb-0">
                    <p className="text-xs lg:text-sm text-gray-600">Выполнено в срок</p>
                    <p className="text-xl lg:text-2xl font-bold text-green-600">{efficiencyStats.completedOnTime}</p>
                    <p className="text-xs text-gray-500">{efficiencyStats.onTimeRate.toFixed(1)}%</p>
                  </div>
                  <CheckCircle className="h-6 w-6 lg:h-8 lg:w-8 text-green-500 self-end lg:self-auto" />
                </div>
              </CardContent>
            </Card>

            {/* Просрочено */}
            <Card className="col-span-1">
              <CardContent className="p-3 lg:p-4 h-full">
                <div className="flex flex-col h-full justify-between lg:flex-row lg:items-center lg:justify-between">
                  <div className="mb-2 lg:mb-0">
                    <p className="text-xs lg:text-sm text-gray-600">Просрочено</p>
                    <p className="text-xl lg:text-2xl font-bold text-red-600">{efficiencyStats.overdueTasks}</p>
                  </div>
                  <AlertTriangle className="h-6 w-6 lg:h-8 lg:w-8 text-red-500 self-end lg:self-auto" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Stats - Mobile optimized */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base lg:text-lg">
                  {selectedUserFilter === "all" ? "Рейтинг сотрудников" : `Статистика: ${getSelectedUserName()}`}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayedUserStats.map((stat, index) => (
                  <div key={stat.user.id} className="border rounded-lg p-3">
                    {/* Mobile Layout */}
                    <div className="lg:hidden">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={stat.user.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{stat.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{stat.user.name}</p>
                          <p className="text-xs text-gray-500">
                           {stat.user.position || "Не указана"}
                          </p>
                        </div>
                        {/* <Badge variant={stat.score >= 0 ? "default" : "destructive"} className="text-xs">
                          {stat.score >= 0 ? "+" : ""}{stat.score}
                        </Badge> */}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Задач:</span>
                            <span className="font-medium">{stat.totalTasks}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Выполнено в срок:</span>
                            <span className="font-medium text-green-600">{stat.completedOnTime}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Просрочено:</span>
                            <span className="font-medium text-red-600">{stat.overdueTasks}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Благодарности:</span>
                            <span className="font-medium text-green-600">{stat.gratitudes}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={stat.user.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{stat.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{stat.user.name}</p>
                          <p className="text-sm text-gray-500">
                            {stat.user.position || "Не указана"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{stat.totalTasks}</div>
                          <div className="text-xs text-gray-500">Задач</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-600">{stat.completedOnTime}</div>
                          <div className="text-xs text-gray-500">В срок</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-red-600">{stat.overdueTasks}</div>
                          <div className="text-xs text-gray-500">Просрочено</div>
                        </div>
                        <div className="flex items-center gap-1 text-green-600">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{stat.gratitudes}</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{stat.remarks}</span>
                        </div>
                        {/* <Badge variant={stat.score >= 0 ? "default" : "destructive"}>
                          {stat.score >= 0 ? "+" : ""}{stat.score}
                        </Badge> */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
    </div>
  )
}