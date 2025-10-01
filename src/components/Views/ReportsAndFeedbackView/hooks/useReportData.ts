import { useMemo } from "react"
import { subWeeks, subMonths } from "date-fns"
import { DatabaseTask, DatabaseUser, TaskStatus, UserRole, FeedbackType, DatabaseFeedback } from "@/src/lib/models/types"

interface UseReportDataProps {
  tasks: DatabaseTask[]
  users: DatabaseUser[]
  feedback: DatabaseFeedback[]
  period: "week" | "month" | "quarter" | "year"
  selectedUserFilter: string
  filterType: "all" | FeedbackType
  filterPeriod: "week" | "month" | "all"
}

export interface UserReportStats {
  user: import('@/src/lib/models/types').DatabaseUser
  totalFeedback: number
  gratitudes: number
  remarks: number
  score: number
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  completedOnTime: number
  completionRate: number
}

export interface EfficiencyStats {
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  completedOnTime: number
  completionRate: number
  onTimeRate: number
  totalEstimatedHours: number
  totalActualHours: number
  timeEfficiency: number
}

export interface AutomaticRemark {
  id: string
  type: "remark"
  fromUserId: string
  toUserId: string
  taskId: string
  message: string
  createdAt: Date
  isAutomatic: true
}

export default function useReportData({
  tasks,
  users,
  feedback,
  period,
  selectedUserFilter,
  filterType,
  filterPeriod
}: UseReportDataProps) {
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
      const taskDate = new Date(task.created_at)
      const inPeriod = taskDate >= periodStart && taskDate <= periodEnd
      
      if (!inPeriod) return false
      
      if (selectedUserFilter === "all") return true
      
      const isAssignedTo = task.assignees?.some(assignee => 
        typeof assignee === 'string' ? assignee === selectedUserFilter : assignee.id === selectedUserFilter
      )
      
      return isAssignedTo || 
             task.creator_id === selectedUserFilter ||
             task.observers?.some(observer => 
               typeof observer === 'string' ? observer === selectedUserFilter : observer.id === selectedUserFilter
             )
    })
  }, [tasks, periodStart, periodEnd, selectedUserFilter])

  // Статистика эффективности
  const efficiencyStats = useMemo((): EfficiencyStats => {
    const employeeIds = users
      .filter(user => user.role !== UserRole.DIRECTOR)
      .map(user => user.id)
    
    const employeeTasks = periodTasks.filter(task => 
      task.assignees?.some(assignee => {
        const assigneeId = typeof assignee === 'string' ? assignee : assignee.id
        return employeeIds.includes(assigneeId)
      })
    )
    
    const completedTasks = employeeTasks.filter((t) => t.status === TaskStatus.COMPLETED)
    const overdueTasks = employeeTasks.filter((t) => t.is_overdue)
    const completedOnTime = completedTasks.filter((t) => !t.is_overdue)

    const totalEstimatedHours = employeeTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0)
    const totalActualHours = employeeTasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0)

    return {
      totalTasks: employeeTasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      completedOnTime: completedOnTime.length,
      completionRate: employeeTasks.length > 0 ? (completedTasks.length / employeeTasks.length) * 100 : 0,
      onTimeRate: employeeTasks.length > 0 ? (completedOnTime.length / employeeTasks.length) * 100 : 0,
      totalEstimatedHours,
      totalActualHours,
      timeEfficiency: totalEstimatedHours > 0 ? (totalEstimatedHours / totalActualHours) * 100 : 0,
    }
  }, [periodTasks, users])

  // Автоматические замечания за просрочки
  const automaticRemarks = useMemo((): AutomaticRemark[] => {
    return tasks
      .filter((task) => task.is_overdue && task.assignees && task.assignees.length > 0)
      .map((task) => ({
        id: `auto-${task.id}`,
        type: "remark" as const,
        fromUserId: "system",
        toUserId: typeof task.assignees![0] === 'string' ? task.assignees![0] : task.assignees![0].id,
        taskId: task.id,
        message: `Автоматическое замечание: просрочка задачи "${task.title}"`,
        createdAt: new Date(),
        isAutomatic: true,
      }))
  }, [tasks])

  // Статистика по пользователям
  const userStats = useMemo((): UserReportStats[] => {
    const filteredUsers = selectedUserFilter === "all" 
      ? users.filter(user => user.role !== UserRole.DIRECTOR)
      : users.filter(user => user.id === selectedUserFilter && user.role !== UserRole.DIRECTOR)

    return filteredUsers
      .map((user) => {
        const userFeedback = feedback.filter((item) => item.to_user_id === user.id)
        const gratitudes = userFeedback.filter((item) => item.type === FeedbackType.GRATITUDE)
        const remarks = userFeedback.filter((item) => item.type === FeedbackType.REMARK)

        const userTasks = tasks.filter(task => 
          task.assignees?.some(assignee => 
            typeof assignee === 'string' ? assignee === user.id : assignee.id === user.id
          )
        )
        
        const userCompletedTasks = userTasks.filter(task => task.status === TaskStatus.COMPLETED)
        const userOverdueTasks = userTasks.filter(task => task.is_overdue === true)
        const userCompletedOnTime = userCompletedTasks.filter(task => !task.is_overdue)

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
  }, [users, feedback, tasks, selectedUserFilter])

  const getSelectedUserName = () => {
    if (selectedUserFilter === "all") return "Все сотрудники"
    const user = users.find(u => u.id === selectedUserFilter)
    return user ? user.name : "Неизвестный пользователь"
  }

  return {
    periodStart,
    periodEnd,
    periodTasks,
    efficiencyStats,
    automaticRemarks,
    userStats,
    getSelectedUserName,
  }
}