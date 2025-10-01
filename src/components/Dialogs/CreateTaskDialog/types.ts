import { DatabaseBusinessProcess, DatabaseTask, DatabaseUser, RecurrenceType } from "@/src/lib/models/types"

export interface RecurrenceSettings {
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

export interface MultipleUserSelectProps {
  users: DatabaseUser[]
  selectedIds: string[]
  onAdd: (userId: string) => void
  onRemove: (userId: string) => void
  placeholder: string
  getPositionText: (user: DatabaseUser) => string
  maxSelections?: number; 
}