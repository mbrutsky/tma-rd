// lib/models/types.ts

export enum UserRole {
  DIRECTOR = "director",
  DEPARTMENT_HEAD = "department_head",
  EMPLOYEE = "employee",
  ADMIN = "admin"
}

export enum CompanyPlan {
  FREE = "free",
  PRO = "pro",
}

export enum NotificationType {
  GENERAL = "general",
  TASK_ASSIGNED = "task_assigned",
  TASK_COMPLETED = "task_completed",
  TASK_OVERDUE = "task_overdue",
  TASK_REMINDER = "task_reminder",
  DEADLINE_APPROACHING = "deadline_approaching",
  WELCOME = "welcome",
  COMMENT_ADDED = "comment_added",
  STATUS_CHANGED = "status_changed",
  SYSTEM = "system",
}

export interface DatabaseCompany {
  id: string;
  director_telegram_user_id: number;
  director_telegram_username?: string;
  director_app_user_id?: string;
  plan: CompanyPlan;
  employee_user_ids: string[];
  connected_at: Date;
  created_at: Date;
  updated_at: Date;
  director?: DatabaseUser;
  employees?: DatabaseUser[];
}

// Новый интерфейс для уведомлений
export interface DatabaseNotification {
  id: string;
  recipient_user_id: string;
  send_to_telegram: boolean;
  send_to_email: boolean;
  message_text: string;
  created_at: Date;
  sent_at?: Date;
  is_sent: boolean;
  telegram_sent: boolean;
  email_sent: boolean;
  telegram_sent_at?: Date;
  email_sent_at?: Date;
  notification_type: NotificationType;
  task_id?: string;
  company_id?: string;
  recipient?: DatabaseUser;
  task?: DatabaseTask;
  company?: DatabaseCompany;
}

export interface DatabaseUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  role: UserRole;
  position?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  simplified_control?: boolean;
  company_id?: string;
  notification_settings?: {
    email: boolean;
    telegram: boolean;
    realTime: boolean;
  };
  created_at: Date;
  updated_at: Date;
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

export enum TaskRecurrenceEndType {
  NONE = "none",
  DATE = "date",
  COUNT = "count"
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

export interface DatabaseTask {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  type: TaskType;
  creator_id?: string;
  responsible_id?: string;
  process_id?: string;
  due_date: Date;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  tags: string[];
  estimated_hours?: number;
  estimated_days?: number;   
  estimated_minutes?: number;
  actual_hours?: number;
  actual_days?: number;      
  actual_minutes?: number;   
  result?: string;
  is_overdue: boolean;
  is_almost_overdue: boolean;
  assignees?: DatabaseUser[];
  observers?: DatabaseUser[];
  creator?: DatabaseUser;
  responsible?: DatabaseUser;
  process?: DatabaseBusinessProcess;
  comments?: DatabaseComment[];
  history?: DatabaseHistoryEntry[];
  checklist?: DatabaseChecklistItem[];
  is_deleted: boolean;
  deleted_at?: Date;
  deleted_by?: string;
  company?: DatabaseCompany;
}

export interface DatabaseComment {
  id: string;
  task_id: string;
  author_id?: string;
  text: string;
  is_result?: boolean;
  is_edited?: boolean;
  created_at: Date;
  edited_at?: Date;
  author?: DatabaseUser;
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
  SOFT_DELETED = "soft_deleted",
  RESTORED = "restored",
  PERMANENTLY_DELETED = "permanently_deleted",
}

export interface DatabaseHistoryEntry {
  id: string;
  task_id: string;
  action_type: HistoryActionType;
  user_id?: string;
  description: string;
  old_value?: any;
  new_value?: any;
  additional_data?: any;
  created_at: Date;
  user?: DatabaseUser;
}

export interface DatabaseChecklistItem {
  id: string;
  task_id: string;
  text: string;
  completed: boolean;
  created_by?: string;
  completed_by?: string;
  parent_id?: string;
  level: number;
  item_order: number;
  created_at: Date;
  completed_at?: Date;
  creator?: DatabaseUser;
  completedBy?: DatabaseUser;
}

export interface DatabaseBusinessProcess {
  id: string;
  name: string;
  description?: string;
  creator_id?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  creator?: DatabaseUser;
  company_id: string;
}

export interface ProcessStep {
  id: string
  name: string
  description: string
  assigneeRole: UserRole
  estimatedHours: number
  subSteps?: ProcessStep[]
}


export enum FeedbackType {
  GRATITUDE = "gratitude",
  REMARK = "remark"
}

export interface DatabaseFeedback {
  id: string;
  type: FeedbackType;
  from_user_id?: string;
  to_user_id: string;
  task_id?: string;
  message: string;
  is_automatic?: boolean;
  created_at: Date;
  from_user?: DatabaseUser;
  to_user?: DatabaseUser;
  task?: DatabaseTask;
}

// API Request/Response types
export interface CreateCompanyRequest {
  director_telegram_user_id: number;
  director_telegram_username?: string;
  director_app_user_id?: string;
  plan?: CompanyPlan;
  employee_user_ids?: string[];
}

export interface UpdateCompanyRequest {
  director_telegram_user_id?: number;
  director_telegram_username?: string;
  director_app_user_id?: string;
  plan?: CompanyPlan;
  employee_user_ids?: string[];
}

export interface CreateNotificationRequest {
  recipient_user_id: string;
  send_to_telegram?: boolean;
  send_to_email?: boolean;
  message_text: string;
  notification_type?: NotificationType;
  task_id?: string;
  company_id?: string;
}

export interface UpdateNotificationRequest {
  send_to_telegram?: boolean;
  send_to_email?: boolean;
  message_text?: string;
  is_sent?: boolean;
  telegram_sent?: boolean;
  email_sent?: boolean;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: number;
  type: TaskType;
  assigneeIds: string[];
  observerIds?: string[];
  processId?: string;
  dueDate: string;
  tags?: string[];
  estimatedHours?: number;
  estimatedDays?: number;   
  estimatedMinutes?: number;
  checklist?: Array<{
    text: string;
    level?: number;
    order?: number;
  }>;
}
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: number;
  status?: string;
  assigneeIds?: string[];
  observerIds?: string[];
  processId?: string;
  dueDate?: string;
  tags?: string[];
  estimatedDays?: number;
  estimatedHours?: number;
  estimatedMinutes?: number;
  actualHours?: number;
  actualDays?: number;      
  actualMinutes?: number;   
  result?: string;
  isDeleted?: boolean;
}

export interface CommentExportData {
  task_id: string;
  task_title: string;
  author_name: string;
  created_at: Date;
  is_result: boolean;
  text: string;
}

export interface CreateCommentRequest {
  text: string;
  isResult?: boolean;
}

export interface CreateUserRequest {
  name: string;
  username: string;
  avatar?: string;
  role: UserRole;
  position?: string;
  email?: string;
  phone?: string;
  company_id?: string;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  username?: string;
  avatar?: string;
  role?: UserRole;
  position?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  simplifiedControl?: boolean;
  notificationSettings?: {
    email: boolean;
    telegram: boolean;
    realTime: boolean;
  };
  company_id?: string;
}

export interface CreateBusinessProcessRequest {
  name: string;
  description?: string;
}