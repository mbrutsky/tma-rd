// [components/tasks-view.tsx]
"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Filter, Star, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import TaskCard from "@/components/task-card"
import TaskDetailsDialog from "@/components/task-details-dialog"
import FilterSheet from "@/components/filter-sheet"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { type Task, type User, type Comment, type BusinessProcess, UserRole, TaskStatus } from "@/types/task"

// ФЛАГ: установите true, чтобы показывать вкладку "Задачи команды" всем пользователям
// установите false, чтобы показывать только директору
const SHOW_TEAM_TASKS_FOR_ALL = true

interface TasksViewProps {
  tasks: Task[]
  users: User[]
  currentUser: User
  businessProcesses: BusinessProcess[]
  onUpdateTask: (task: Task) => void
  onCreateTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "comments">) => void
  onDeleteTask: (taskId: string) => void
  onAddComment: (taskId: string, comment: Omit<Comment, "id" | "timestamp">) => void
  onUpdateComment: (taskId: string, commentId: string, text: string) => void
  onDeleteComment: (taskId: string, commentId: string) => void
  onSendReminder: (taskId: string, minutes?: number) => void
}

interface TaskGroup {
  time: string
  hour: number
  tasks: Task[]
}

export default function TasksView({
  tasks,
  users,
  currentUser,
  businessProcesses,
  onUpdateTask,
  onCreateTask,
  onDeleteTask,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onSendReminder,
}: TasksViewProps) {
  console.log("TasksView: received", tasks.length, "tasks")
  console.log("TasksView: current user", currentUser.id, currentUser.name, currentUser.role)
  
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")
  
  // Определяем начальный фильтр в зависимости от роли пользователя и флага
  const getInitialActiveFilter = () => {
    const shouldShowTeamTasks = SHOW_TEAM_TASKS_FOR_ALL || currentUser.role === UserRole.DIRECTOR
    return shouldShowTeamTasks ? "team-tasks" : "my-tasks"
  }
  
  const [activeFilter, setActiveFilter] = useState(getInitialActiveFilter())
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [sortBy, setSortBy] = useState<string>("dueDate")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"all" | "day" | "week" | "month">("all")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)

  // Функция для безопасного преобразования в Date
  const ensureDate = (dateValue: any): Date => {
    if (!dateValue) return new Date()
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue)
    if (isNaN(date.getTime())) return new Date()
    return date
  }

  // Фильтрация задач по периоду времени
  function filterTasksByPeriod(tasksList: Task[], period: "all" | "day" | "week" | "month"): Task[] {
    console.log("filterTasksByPeriod: filtering", tasksList.length, "tasks by period:", period)
    
    if (period === "all") {
      console.log("filterTasksByPeriod: period is 'all', returning all tasks:", tasksList.length)
      return tasksList
    }
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

    const filtered = tasksList.filter(task => {
      const dueDate = ensureDate(task.dueDate)
      
      switch (period) {
        case "day":
          return dueDate >= today && dueDate < tomorrow
        case "week":
          return dueDate >= today && dueDate < nextWeek
        case "month":
          return dueDate >= today && dueDate < nextMonth
        default:
          return true
      }
    })
    
    console.log("filterTasksByPeriod: filtered to", filtered.length, "tasks")
    return filtered
  }

  const getFilterTabs = () => {
    console.log("getFilterTabs: calculating filter tabs")
    
    // Применяем фильтр по периоду ко всем задачам для подсчета
    const periodFilteredTasks = filterTasksByPeriod(tasks, viewMode)
    console.log("getFilterTabs: period filtered tasks:", periodFilteredTasks.length)
    
    // Подсчет задач команды (исключая задачи текущего пользователя)
    const teamTasksCount = (() => {
      if (currentUser.role === UserRole.DIRECTOR) {
        // Для директора - показываем задачи всех сотрудников, кроме его собственных
        const teamTasks = periodFilteredTasks.filter(t => 
          !t.assigneeIds.includes(currentUser.id) && (
            t.assigneeIds.length > 0 || 
            (t.creatorId !== currentUser.id && t.observerIds.length > 0)
          )
        )
        console.log("getFilterTabs: team tasks count for director (excluding director):", teamTasks.length)
        return teamTasks.length
      } else if (currentUser.role === UserRole.DEPARTMENT_HEAD) {
        // Для руководителя отдела - задачи его отдела, кроме его собственных
        const departmentUsers = users.filter(
          u => u.departmentId === currentUser.departmentId
        )
        const departmentUserIds = departmentUsers.map(u => u.id)
        const teamTasks = periodFilteredTasks.filter(t => 
          !t.assigneeIds.includes(currentUser.id) && (
            departmentUserIds.some(id => t.assigneeIds.includes(id) || t.creatorId === id)
          )
        )
        console.log("getFilterTabs: team tasks count for department head:", teamTasks.length)
        return teamTasks.length
      } else {
        // Для обычных сотрудников - задачи их отдела, кроме их собственных
        const departmentUsers = users.filter(
          u => u.departmentId === currentUser.departmentId
        )
        const departmentUserIds = departmentUsers.map(u => u.id)
        const teamTasks = periodFilteredTasks.filter(t => 
          !t.assigneeIds.includes(currentUser.id) && (
            departmentUserIds.some(id => t.assigneeIds.includes(id) || t.creatorId === id)
          )
        )
        console.log("getFilterTabs: team tasks count for employee:", teamTasks.length)
        return teamTasks.length
      }
    })()

    const now = new Date()
    
    // Подсчет просроченных задач
    const overdueCount = periodFilteredTasks.filter((t) => {
      const dueDate = ensureDate(t.dueDate)
      return dueDate < now && t.status !== TaskStatus.COMPLETED
    }).length

    // Подсчет почти просроченных задач
    const almostOverdueCount = periodFilteredTasks.filter((t) => {
      const dueDate = ensureDate(t.dueDate)
      const timeDiff = dueDate.getTime() - now.getTime()
      const hoursUntilDue = timeDiff / (1000 * 60 * 60)
      return hoursUntilDue > 0 && hoursUntilDue <= 24 && t.status !== TaskStatus.COMPLETED
    }).length

    // Подсчет задач в работе
    const inProgressCount = periodFilteredTasks.filter((t) => 
      t.status === TaskStatus.IN_PROGRESS
    ).length

    // Подсчет задач, ждущих контроля
    const waitingControlCount = periodFilteredTasks.filter((t) => 
      t.status === TaskStatus.WAITING_CONTROL || t.status === TaskStatus.ON_CONTROL
    ).length

    // Подсчет выполненных задач
    const completedCount = periodFilteredTasks.filter((t) => 
      t.status === TaskStatus.COMPLETED
    ).length

    const baseTabs = []
    
    // Определяем, должна ли быть показана вкладка "Задачи команды"
    const shouldShowTeamTasks = SHOW_TEAM_TASKS_FOR_ALL || currentUser.role === UserRole.DIRECTOR
    
    if (shouldShowTeamTasks) {
      // Если показываем "Задачи команды", то она будет первой
      baseTabs.push({ 
        value: "team-tasks", 
        label: "Команды", 
        count: teamTasksCount
      })
      // А "Мои задачи" второй
      baseTabs.push({ 
        value: "my-tasks", 
        label: "Мои", 
        count: periodFilteredTasks.filter((t) => t.assigneeIds.includes(currentUser.id)).length 
      })
    } else {
      // Если не показываем "Задачи команды", то "Мои задачи" первая
      baseTabs.push({ 
        value: "my-tasks", 
        label: "Мои", 
        count: periodFilteredTasks.filter((t) => t.assigneeIds.includes(currentUser.id)).length 
      })
    }
    
    // Остальные вкладки для всех
    baseTabs.push(
      {
        value: "in-progress",
        label: "В работе",
        count: inProgressCount,
      },
      {
        value: "waiting-control",
        label: "Ждет контроля",
        count: waitingControlCount,
      },
      {
        value: "completed",
        label: "Выполненные",
        count: completedCount,
      },
      {
        value: "overdue",
        label: "Просроченные",
        count: overdueCount,
      },
      {
        value: "almost-overdue",
        label: "Почти просрочены",
        count: almostOverdueCount,
      }
    )

    console.log("getFilterTabs: tabs calculated:", baseTabs)
    return baseTabs
  }

  const filterTabs = getFilterTabs()

  // Группировка задач по времени начала
  const groupTasksByTime = (tasksList: Task[]): TaskGroup[] => {
    console.log("groupTasksByTime: grouping", tasksList.length, "tasks")
    
    const groups: { [key: string]: TaskGroup } = {}

    tasksList.forEach(task => {
      const dueDate = ensureDate(task.dueDate)
      const hour = dueDate.getHours()
      const timeKey = `${hour}:00`
      
      if (!groups[timeKey]) {
        groups[timeKey] = {
          time: timeKey,
          hour,
          tasks: []
        }
      }
      
      groups[timeKey].tasks.push(task)
    })

    const result = Object.values(groups).sort((a, b) => a.hour - b.hour)
    console.log("groupTasksByTime: created", result.length, "groups")
    return result
  }

  // Проверка возможности прокрутки
  const checkScrollButtons = () => {
    const el = tabsRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const x = el.scrollLeft
    const EPS = 1

    setCanScrollLeft(x > EPS)
    setCanScrollRight(x < max - EPS)
  }

  const scrollLeft = () => {
    const el = tabsRef.current
    if (!el) return
    el.scrollBy({ left: -200, behavior: "smooth" })
    setTimeout(checkScrollButtons, 250)
  }

  const scrollRight = () => {
    const el = tabsRef.current
    if (!el) return
    el.scrollBy({ left: 200, behavior: "smooth" })
    setTimeout(checkScrollButtons, 250)
  }

  useEffect(() => { 
    checkScrollButtons() 
  }, [filterTabs.length, viewMode])

  useEffect(() => {
    const el = tabsRef.current
    if (!el) return
    const ro = new ResizeObserver(() => checkScrollButtons())
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    checkScrollButtons()
    const handleResize = () => checkScrollButtons()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const timer = setTimeout(checkScrollButtons, 100)
    return () => clearTimeout(timer)
  }, [activeFilter])

  const toggleGroup = (timeKey: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(timeKey)) {
      newExpanded.delete(timeKey)
    } else {
      newExpanded.add(timeKey)
    }
    setExpandedGroups(newExpanded)
  }

  // Фильтрация и сортировка задач
  useEffect(() => {
    console.log("TasksView: filtering tasks effect started")
    console.log("TasksView: input tasks:", tasks.length)
    console.log("TasksView: filters - activeFilter:", activeFilter, "viewMode:", viewMode, "statusFilter:", statusFilter, "priorityFilter:", priorityFilter, "assigneeFilter:", assigneeFilter, "searchQuery:", searchQuery)
    
    // Начинаем с копии всех задач
    let filtered = [...tasks]
    console.log("TasksView: step 1 - initial tasks:", filtered.length)

    // Фильтр по типу задач
    if (activeFilter === "team-tasks") {
      console.log("TasksView: applying team-tasks filter")
      
      if (currentUser.role === UserRole.DIRECTOR) {
        // Для директора - показываем задачи всех сотрудников, исключая его собственные
        filtered = filtered.filter(task => 
          !task.assigneeIds.includes(currentUser.id) && (
            task.assigneeIds.length > 0 || 
            (task.creatorId !== currentUser.id && task.observerIds.length > 0)
          )
        )
        console.log("TasksView: after team filter for director (excluding director):", filtered.length)
      } else if (currentUser.role === UserRole.DEPARTMENT_HEAD) {
        // Для руководителя отдела - задачи его отдела, кроме его собственных
        const departmentUsers = users.filter(
          u => u.departmentId === currentUser.departmentId
        )
        const departmentUserIds = departmentUsers.map(u => u.id)
        filtered = filtered.filter(task => 
          !task.assigneeIds.includes(currentUser.id) && (
            departmentUserIds.some(id => task.assigneeIds.includes(id) || task.creatorId === id)
          )
        )
        console.log("TasksView: after team filter for department head:", filtered.length)
      } else {
        // Для обычных сотрудников - задачи их отдела, кроме их собственных
        const departmentUsers = users.filter(
          u => u.departmentId === currentUser.departmentId
        )
        const departmentUserIds = departmentUsers.map(u => u.id)
        filtered = filtered.filter(task => 
          !task.assigneeIds.includes(currentUser.id) && (
            departmentUserIds.some(id => task.assigneeIds.includes(id) || task.creatorId === id)
          )
        )
        console.log("TasksView: after team filter for employee:", filtered.length)
      }
    } else if (activeFilter === "my-tasks") {
      console.log("TasksView: applying my-tasks filter")
      filtered = filtered.filter((task) => task.assigneeIds.includes(currentUser.id))
      console.log("TasksView: after my-tasks filter:", filtered.length)
    } else if (activeFilter === "in-progress") {
      console.log("TasksView: applying in-progress filter")
      filtered = filtered.filter((task) => task.status === TaskStatus.IN_PROGRESS)
      console.log("TasksView: after in-progress filter:", filtered.length)
    } else if (activeFilter === "waiting-control") {
      console.log("TasksView: applying waiting-control filter")
      filtered = filtered.filter((task) => 
        task.status === TaskStatus.WAITING_CONTROL || task.status === TaskStatus.ON_CONTROL
      )
      console.log("TasksView: after waiting-control filter:", filtered.length)
    } else if (activeFilter === "completed") {
      console.log("TasksView: applying completed filter")
      filtered = filtered.filter((task) => task.status === TaskStatus.COMPLETED)
      console.log("TasksView: after completed filter:", filtered.length)
    } else if (activeFilter === "overdue") {
      console.log("TasksView: applying overdue filter")
      const now = new Date()
      filtered = filtered.filter((task) => {
        const dueDate = ensureDate(task.dueDate)
        return dueDate < now && task.status !== TaskStatus.COMPLETED
      })
      console.log("TasksView: after overdue filter:", filtered.length)
    } else if (activeFilter === "almost-overdue") {
      console.log("TasksView: applying almost-overdue filter")
      const now = new Date()
      filtered = filtered.filter((task) => {
        const dueDate = ensureDate(task.dueDate)
        const timeDiff = dueDate.getTime() - now.getTime()
        const hoursUntilDue = timeDiff / (1000 * 60 * 60)
        return hoursUntilDue > 0 && hoursUntilDue <= 24 && task.status !== TaskStatus.COMPLETED
      })
      console.log("TasksView: after almost-overdue filter:", filtered.length)
    }

    // Фильтрация по периоду времени
    console.log("TasksView: applying period filter")
    filtered = filterTasksByPeriod(filtered, viewMode)
    console.log("TasksView: after period filter:", filtered.length)

    // Дополнительные фильтры
    if (statusFilter !== "all") {
      console.log("TasksView: applying status filter:", statusFilter)
      filtered = filtered.filter((task) => task.status === statusFilter)
      console.log("TasksView: after status filter:", filtered.length)
    }
    if (priorityFilter !== "all") {
      console.log("TasksView: applying priority filter:", priorityFilter)
      filtered = filtered.filter((task) => task.priority.toString() === priorityFilter)
      console.log("TasksView: after priority filter:", filtered.length)
    }
    if (assigneeFilter !== "all") {
      console.log("TasksView: applying assignee filter:", assigneeFilter)
      filtered = filtered.filter((task) => task.assigneeIds.includes(assigneeFilter))
      console.log("TasksView: after assignee filter:", filtered.length)
    }

    // Поиск
    if (searchQuery) {
      console.log("TasksView: applying search filter:", searchQuery)
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
      console.log("TasksView: after search filter:", filtered.length)
    }

    // Сортировка
    console.log("TasksView: applying sort:", sortBy)
    filtered.sort((a, b) => {
      const aDueDate = ensureDate(a.dueDate)
      const bDueDate = ensureDate(b.dueDate)
      
      switch (sortBy) {
        case "dueDate":
          return aDueDate.getTime() - bDueDate.getTime()
        case "priority":
          return a.priority - b.priority
        case "status":
          return a.status.localeCompare(b.status)
        case "createdAt":
          return ensureDate(b.createdAt).getTime() - ensureDate(a.createdAt).getTime()
        default:
          return 0
      }
    })

    console.log("TasksView: final filtered tasks:", filtered.length)
    setFilteredTasks(filtered)
  }, [tasks, activeFilter, statusFilter, priorityFilter, assigneeFilter, searchQuery, sortBy, viewMode, currentUser, users])

  const activeFiltersCount = [statusFilter, priorityFilter, assigneeFilter].filter((f) => f !== "all").length

  const getFullTaskForDialog = (taskId: string): Task | null => {
    return tasks.find(task => task.id === taskId) || null
  }

  const taskGroups = groupTasksByTime(filteredTasks)

  useEffect(() => {
    if (taskGroups.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(taskGroups.map(group => group.time)))
    }
  }, [])

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
  }

  console.log("TasksView: rendering with", filteredTasks.length, "filtered tasks and", taskGroups.length, "groups")

  return (
    <div className="space-y-4">
      {/* Поиск и фильтры */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Поиск задач..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
        
        <div className="h-12">
          <Select value={viewMode} onValueChange={(value: "all" | "day" | "week" | "month") => setViewMode(value)}>
            <SelectTrigger className="w-24 h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="day">День</SelectItem>
              <SelectItem value="week">Неделя</SelectItem>
              <SelectItem value="month">Месяц</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-12 bg-transparent">
              <Filter className="h-4 w-4 mr-2" />
              Фильтры
              {activeFiltersCount > 0 && (
                <span className="ml-1 bg-blue-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh]">
            <FilterSheet
              statusFilter={statusFilter}
              priorityFilter={priorityFilter}
              assigneeFilter={assigneeFilter}
              sortBy={sortBy}
              users={users}
              onStatusChange={setStatusFilter}
              onPriorityChange={setPriorityFilter}
              onAssigneeChange={setAssigneeFilter}
              onSortChange={setSortBy}
              onClose={() => setIsFilterOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Фильтры-табы с прокруткой */}
      <div className="relative">
        <div className="flex items-center">
          {canScrollLeft && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-0 z-10 bg-white shadow-md rounded-full w-8 h-8 p-0"
              onClick={scrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          
          <div 
            ref={tabsRef}
            className="flex gap-2 overflow-x-auto scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onScroll={checkScrollButtons}
          >
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeFilter === tab.value
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span className="font-medium">{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      activeFilter === tab.value ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {canScrollRight && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-1/2 -translate-y-1/2 border-custom z-10 bg-white shadow-md rounded-full w-8 h-8 p-0"
              onClick={scrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Список задач с группировкой */}
      <div className="space-y-4">
        {taskGroups.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <div className="text-lg mb-2">Задач не найдено</div>
            <div className="text-sm">Попробуйте изменить фильтры или период просмотра</div>
          </div>
        ) : (
          taskGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.time)
            
            return (
              <div key={group.time} className="space-y-2">
                <Collapsible open={isExpanded} onOpenChange={() => toggleGroup(group.time)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 h-10 p-0 font-semibold text-gray-700 hover:text-gray-900"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="text-lg">{group.time}</span>
                      <span className="text-sm text-gray-500 font-normal">
                        ({group.tasks.length} {group.tasks.length === 1 ? 'задача' : 'задач'})
                      </span>
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-3">
                    {group.tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        users={users}
                        currentUser={currentUser}
                        businessProcesses={businessProcesses}
                        onClick={() => handleTaskClick(task)}
                        onUpdate={onUpdateTask}
                        onDelete={onDeleteTask}
                        onSendReminder={onSendReminder}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )
          })
        )}
      </div>

      {/* Task Details Dialog */}
      {selectedTask && (
        <TaskDetailsDialog
          task={getFullTaskForDialog(selectedTask.id) || selectedTask}
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