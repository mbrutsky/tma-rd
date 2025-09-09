export enum UserRole {
  DIRECTOR = "director",
  DEPARTMENT_HEAD = "department_head",
  EMPLOYEE = "employee",
}

export enum TaskStatus {
  NEW = "new",
  ACKNOWLEDGED = "acknowledged",
  IN_PROGRESS = "in_progress",
  PAUSED = "paused",
  WAITING_CONTROL = "waiting_control",
  ON_CONTROL = "on_control",
  COMPLETED = "completed",
}

export enum TaskPriority {
  CRITICAL = 1,
  HIGH = 2,
  MEDIUM = 3,
  LOW = 4,
  VERY_LOW = 5,
  VERY_HIGH = 1,
}

export enum TaskType {
  ONE_TIME = "one_time",
  RECURRING = "recurring",
}

export enum RecurrenceType {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export enum HistoryActionType {
  CREATED = "created",
  STATUS_CHANGED = "status_changed",
  ASSIGNED = "assigned",
  UNASSIGNED = "unassigned",
  ASSIGNEE_CHANGED = "assignee_changed",
  DEADLINE_CHANGED = "deadline_changed",
  PRIORITY_CHANGED = "priority_changed",
  TITLE_CHANGED = "title_changed",
  DESCRIPTION_CHANGED = "description_changed",
  COMMENT_ADDED = "comment_added",
  COMMENT_EDITED = "comment_edited",
  COMMENT_DELETED = "comment_deleted",
  CHECKLIST_UPDATED = "checklist_updated",
  ATTACHMENT_ADDED = "attachment_added",
  ATTACHMENT_REMOVED = "attachment_removed",
  OBSERVER_ADDED = "observer_added",
  OBSERVER_REMOVED = "observer_removed",
  REMINDER_SENT = "reminder_sent",
  SERVICE_NOTE_SENT = "service_note_sent",
  EXPLANATORY_NOTE_SENT = "EXPLANATORY_NOTE_SENT",
}

export interface User {
  id: string
  name: string
  username: string
  avatar?: string
  role: UserRole
  position?: string
  departmentId?: string
  email?: string
  phone?: string
  isActive: boolean
  simplifiedControl?: boolean
  notificationSettings?: {
    email: boolean
    telegram: boolean
    realTime: boolean
  }
}

export interface Department {
  id: string
  name: string
  headId: string
  memberIds: string[]
}

export interface Comment {
  id: string
  authorId: string
  text: string
  timestamp: Date
  isResult?: boolean
  isEdited?: boolean
  editedAt?: Date
}

export interface HistoryEntry {
  id: string
  actionType: HistoryActionType
  userId: string
  timestamp: Date
  description: string
  oldValue?: any
  newValue?: any
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  createdAt: Date
  createdBy: string
  completedAt?: Date
  completedBy?: string
  parentId?: string
  level?: number
  order?: number
}

export interface TaskRecurrence {
  type: RecurrenceType
  interval: number
  weekDays?: number[]
  monthDay?: number
  monthWeek?: number
  monthWeekDay?: number
  yearMonth?: number
  creationTime: string
  startDate?: Date
  endType: "none" | "date" | "count"
  endDate?: Date
  endCount?: number
}

export interface Task {
  id: string
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  type: TaskType
  creatorId: string
  assigneeIds: string[]
  observerIds: string[]
  processId?: string
  stepId?: string
  dueDate: Date
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  tags: string[]
  estimatedHours?: number
  actualHours?: number
  checklist: ChecklistItem[]
  comments: Comment[]
  history: HistoryEntry[]
  isOverdue?: boolean
  isAlmostOverdue?: boolean
  recurrence?: TaskRecurrence
  
  // Битрикс-подобные поля
  responsibleId?: string
  coWorkersIds?: string[]
  result?: string
}

export interface ProcessStep {
  id: string
  name: string
  description: string
  assigneeRole: UserRole
  estimatedHours: number
  requiredFields?: string[]
  nextStepId?: string
  subSteps?: ProcessStep[]
}

export interface BusinessProcess {
  id: string
  name: string
  description: string
  creatorId: string
  isActive: boolean
  departmentIds?: string[]
  createdAt: Date
  updatedAt: Date
  steps: ProcessStep[]
}

export interface Feedback {
  id: string
  type: "gratitude" | "remark"
  fromUserId: string
  toUserId: string
  taskId?: string
  message: string
  createdAt: Date
  isAutomatic?: boolean
}