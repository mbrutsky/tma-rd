// [data\mock-data.ts]
import {
  type Task,
  type User,
  type Department,
  type BusinessProcess,
  type Feedback,
  UserRole,
  TaskType,
  TaskStatus,
  TaskPriority,
  HistoryActionType,
  HistoryEntry,
} from "@/types/task"

const now = new Date()

// Функция для создания даты с конкретным временем
const createTaskDate = (dayOffset: number, hour: number, minute: number = 0): Date => {
  const date = new Date(now)
  date.setDate(date.getDate() + dayOffset)
  date.setHours(hour, minute, 0, 0)
  return date
}

// Планировщик задач на день
class DayScheduler {
  private currentTime: number = 9 * 60 // Начало рабочего дня в минутах (9:00)
  private readonly lunchStart = 13 * 60 // 13:00
  private readonly lunchEnd = 14 * 60 // 14:00
  private readonly dayEnd = 18 * 60 // 18:00
  private readonly maxTaskDuration = 120 // 2 часа максимум
  private dayOffset: number

  constructor(dayOffset: number) {
    this.dayOffset = dayOffset
    this.currentTime = 9 * 60
  }

  getNextTaskTime(durationMinutes: number): Date {
    // Ограничиваем длительность задачи
    const actualDuration = Math.min(durationMinutes, this.maxTaskDuration)
    
    // Проверяем, не попадаем ли на обед
    if (this.currentTime < this.lunchStart && this.currentTime + actualDuration > this.lunchStart) {
      // Задача начинается до обеда, но заканчивается после - переносим на после обеда
      this.currentTime = this.lunchEnd
    } else if (this.currentTime >= this.lunchStart && this.currentTime < this.lunchEnd) {
      // Начало попадает на обед - переносим на после обеда
      this.currentTime = this.lunchEnd
    }

    // Если задача не помещается в рабочий день, переносим на следующий день
    if (this.currentTime + actualDuration > this.dayEnd) {
      this.dayOffset++
      this.currentTime = 9 * 60 // Начинаем с утра следующего дня
    }

    const taskHour = Math.floor(this.currentTime / 60)
    const taskMinute = this.currentTime % 60
    const taskDate = createTaskDate(this.dayOffset, taskHour, taskMinute)
    
    // Обновляем текущее время для следующей задачи
    this.currentTime += actualDuration
    
    return taskDate
  }

  reset() {
    this.currentTime = 9 * 60
  }
}

export const mockUsers: User[] = [
  {
    id: "0",
    name: "Анна Иванова",
    username: "anna_iv",
    avatar: "/2.jpg",
    role: UserRole.DIRECTOR,
    position: "Директор",
    email: "anna@company.com",
    phone: "+7 (999) 123-45-67",
    isActive: true,
    simplifiedControl: false,
    notificationSettings: {
      email: true,
      telegram: true,
      realTime: true,
    },
  },
  {
    id: "1",
    name: "Алексей Петров",
    username: "alex_petr",
    avatar: "/7.jpg",
    role: UserRole.EMPLOYEE,
    position: "Специалист по закупкам",
    departmentId: "dept1",
    email: "alex.petrov@company.com",
    phone: "+7 (999) 123-45-68",
    isActive: true,
    simplifiedControl: false,
    notificationSettings: {
      email: true,
      telegram: true,
      realTime: true,
    },
  },
  {
    id: "2",
    name: "Петр Смольников",
    username: "petr_sm",
    avatar: "/1.jpg",
    role: UserRole.EMPLOYEE,
    position: "Менеджер по продажам",
    departmentId: "dept1",
    email: "petr@company.com",
    phone: "+7 (999) 123-45-68",
    isActive: true,
    simplifiedControl: false,
    notificationSettings: {
      email: true,
      telegram: true,
      realTime: true,
    },
  },
  {
    id: "3",
    name: "Алексей Соколовский",
    username: "alex_k",
    avatar: "/3.jpg",
    role: UserRole.EMPLOYEE,
    position: "Технолог",
    departmentId: "dept1",
    email: "alex@company.com",
    phone: "+7 (999) 123-45-69",
    isActive: true,
    simplifiedControl: true,
    notificationSettings: {
      email: true,
      telegram: true,
      realTime: false,
    },
  },
  {
    id: "4",
    name: "Елена Антипова",
    username: "elena_p",
    avatar: "/4.jpg",
    role: UserRole.DEPARTMENT_HEAD,
    position: "Начальник склада",
    departmentId: "dept1",
    email: "elena@company.com",
    phone: "+7 (999) 123-45-70",
    isActive: true,
    simplifiedControl: false,
    notificationSettings: {
      email: true,
      telegram: true,
      realTime: true,
    },
  },
]

export const currentUser = mockUsers[1]

export const mockDepartments: Department[] = [
  {
    id: "dept1",
    name: "Операционный отдел",
    headId: "4",
    memberIds: ["1", "2", "3", "4"],
  },
]

export const mockBusinessProcesses: BusinessProcess[] = [
  {
    id: "bp-strategic",
    name: "Стратегическое управление",
    description: "Процессы принятия ключевых решений и управления компанией",
    creatorId: "1",
    isActive: true,
    departmentIds: [],
    createdAt: new Date("2025-01-01T10:00:00"),
    updatedAt: new Date("2025-01-15T10:00:00"),
    steps: [],
  },
  {
    id: "bp-purchasing",
    name: "Закупки и снабжение",
    description: "Полный цикл закупок: планирование, заказ, контроль поставок",
    creatorId: "2",
    isActive: true,
    departmentIds: ["dept1"],
    createdAt: new Date("2025-01-05T10:00:00"),
    updatedAt: new Date("2025-01-20T10:00:00"),
    steps: [],
  },
  {
    id: "bp-production",
    name: "Производственный процесс",
    description: "Разработка продукции, контроль качества, технологические процессы",
    creatorId: "3",
    isActive: true,
    departmentIds: ["dept1"],
    createdAt: new Date("2025-01-10T10:00:00"),
    updatedAt: new Date("2025-01-25T10:00:00"),
    steps: [],
  },
  {
    id: "bp-warehouse",
    name: "Складская логистика",
    description: "Приемка, хранение, отгрузка, инвентаризация",
    creatorId: "4",
    isActive: true,
    departmentIds: ["dept1"],
    createdAt: new Date("2025-01-08T10:00:00"),
    updatedAt: new Date("2025-01-28T10:00:00"),
    steps: [],
  },
]

export const mockFeedback: Feedback[] = [
  {
    id: "f1",
    type: "gratitude",
    fromUserId: "u1",
    toUserId: "u3",
    taskId: "t1",
    message: "Хорошие сегменты, быстро собрал.",
    createdAt: createTaskDate(-1, 14)
  },
  {
    id: "f2",
    type: "remark",
    fromUserId: "u2",
    toUserId: "u4",
    taskId: "t6",
    message: "Проверь кейс закрытия меню на мобильных.",
    createdAt: createTaskDate(-1, 15)
  },
  {
    id: "f3",
    type: "gratitude",
    fromUserId: "u1",
    toUserId: "u5",
    taskId: "t4",
    message: "Описания для карточки получились сильные.",
    createdAt: createTaskDate(-2, 16)
  }
]

function createTaskHistory(taskId: string, createdAt: Date, dueDate: Date, status: TaskStatus, creatorId: string): HistoryEntry[] {
  const history: HistoryEntry[] = []
  
  history.push({
    id: `${taskId}-created`,
    actionType: HistoryActionType.CREATED,
    userId: creatorId,
    timestamp: createdAt,
    description: "Задача создана",
  })

  const nowTime = now.getTime()
  const dueTime = dueDate.getTime()
  const timeDiff = dueTime - nowTime
  const hoursUntilDue = timeDiff / (1000 * 60 * 60)
  
  if (timeDiff < 0 && status !== TaskStatus.COMPLETED) {
    const almostOverdueTime = new Date(dueTime - (24 * 60 * 60 * 1000))
    if (almostOverdueTime > createdAt) {
      history.push({
        id: `${taskId}-almost-overdue`,
        actionType: HistoryActionType.STATUS_CHANGED,
        userId: "system",
        timestamp: almostOverdueTime,
        description: "Задача скоро просрочится (осталось менее 24 часов)",
        oldValue: undefined,
        newValue: "almost_overdue",
      })
    }
    
    history.push({
      id: `${taskId}-overdue`,
      actionType: HistoryActionType.STATUS_CHANGED,
      userId: "system",
      timestamp: dueDate,
      description: "Задача просрочена. Отправьте пояснительную записку о причинах просрочки задачи",
      oldValue: undefined,
      newValue: "overdue",
    })
    
  } else if (hoursUntilDue > 0 && hoursUntilDue <= 24 && status !== TaskStatus.COMPLETED) {
    const almostOverdueTime = new Date(dueTime - (24 * 60 * 60 * 1000))
    if (almostOverdueTime <= now && almostOverdueTime > createdAt) {
      history.push({
        id: `${taskId}-almost-overdue`,
        actionType: HistoryActionType.STATUS_CHANGED,
        userId: "system",
        timestamp: almostOverdueTime,
        description: "Задача скоро просрочится (осталось менее 24 часов)",
        oldValue: undefined,
        newValue: "almost_overdue",
      })
    }
  }
  
  if (status === TaskStatus.COMPLETED) {
    const completedTime = new Date(createdAt.getTime() + Math.random() * (dueTime - createdAt.getTime()))
    history.push({
      id: `${taskId}-completed`,
      actionType: HistoryActionType.STATUS_CHANGED,
      userId: creatorId,
      timestamp: completedTime,
      description: "Задача завершена",
      oldValue: TaskStatus.IN_PROGRESS,
      newValue: TaskStatus.COMPLETED,
    })
  } else if (status === TaskStatus.IN_PROGRESS) {
    const startTime = new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000)
    history.push({
      id: `${taskId}-started`,
      actionType: HistoryActionType.STATUS_CHANGED,
      userId: creatorId,
      timestamp: startTime,
      description: "Работа над задачей начата",
      oldValue: TaskStatus.NEW,
      newValue: TaskStatus.IN_PROGRESS,
    })
  }
  
  return history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

// Создаем планировщики для разных дней
const todayScheduler = new DayScheduler(0)
const tomorrowScheduler = new DayScheduler(1)
const futureScheduler = new DayScheduler(5)

export const mockTasks: Task[] = [
  // ЗАДАЧИ ДЛЯ АЛЕКСЕЯ ПЕТРОВА (id: "1") - 12 задач
  {
    id: "t101",
    title: "Провести приемку нового оборудования для производства",
    description: "Необходимо провести полную приемку закупленного оборудования для производственной линии.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["1"],
    observerIds: ["4"],
    processId: "bp-purchasing",
    dueDate: todayScheduler.getNextTaskTime(160), // 2 часа (9:00-11:00)
    tags: ["приемка", "оборудование"],
    estimatedHours: 2,
    checklist: [
      {
        id: "cl101-1",
        text: "Проверить комплектность поставки по накладным",
        completed: false,
        createdAt: createTaskDate(-10, 9),
        createdBy: "0"
      },
      {
        id: "cl101-2",
        text: "Провести визуальный осмотр на наличие повреждений",
        completed: false,
        createdAt: createTaskDate(-10, 9),
        createdBy: "0"
      },
      {
        id: "cl101-3",
        text: "Сверить технические характеристики с заявленными в договоре",
        completed: false,
        createdAt: createTaskDate(-10, 9),
        createdBy: "0"
      },
      {
        id: "cl101-4",
        text: "Оформить акт приема-передачи оборудования",
        completed: false,
        createdAt: createTaskDate(-10, 9),
        createdBy: "0"
      }
    ],
    createdAt: createTaskDate(-2, 11),
    updatedAt: createTaskDate(-1, 12),
    comments: [],
    history: createTaskHistory("t101", createTaskDate(-10, 9), createTaskDate(0, 9), TaskStatus.IN_PROGRESS, "0")
  },
  {
    id: "t102",
    title: "Согласовать договор с поставщиком канцтоваров",
    description: "Проверить условия договора на поставку офисных принадлежностей.",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "4",
    assigneeIds: ["1"],
    observerIds: [],
    processId: "bp-purchasing",
    dueDate: todayScheduler.getNextTaskTime(60), // 1 час (11:00-12:00)
    tags: ["договор", "канцтовары"],
    estimatedHours: 1,
    checklist: [],
    createdAt: createTaskDate(-15, 10),
    updatedAt: createTaskDate(-3, 11),
    comments: [],
    history: createTaskHistory("t102", createTaskDate(-15, 10), createTaskDate(0, 11), TaskStatus.COMPLETED, "4")
  },
  {
    id: "t103",
    title: "Провести анализ поставщиков упаковочных материалов",
    description: "Сравнительный анализ цен и условий поставки от разных поставщиков.",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["1"],
    observerIds: ["4"],
    processId: "bp-purchasing",
    dueDate: todayScheduler.getNextTaskTime(60), // 1 час (12:00-13:00, перенесется на 14:00-15:00)
    tags: ["анализ", "поставщики"],
    estimatedHours: 1,
    checklist: [],
    createdAt: createTaskDate(-20, 9),
    updatedAt: createTaskDate(-5, 15),
    comments: [],
    history: createTaskHistory("t103", createTaskDate(-20, 9), createTaskDate(0, 14), TaskStatus.COMPLETED, "0")
  },
  {
    id: "t104",
    title: "Оформить заказ на закупку сырья",
    description: "Подготовить и отправить заказ поставщику на основное сырье.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "4",
    assigneeIds: ["1"],
    observerIds: [],
    processId: "bp-purchasing",
    dueDate: todayScheduler.getNextTaskTime(90), // 1.5 часа (15:00-16:30)
    tags: ["заказ", "сырье"],
    estimatedHours: 1.5,
    checklist: [],
    createdAt: createTaskDate(-12, 10),
    updatedAt: createTaskDate(-4, 16),
    comments: [],
    history: createTaskHistory("t104", createTaskDate(-12, 10), createTaskDate(0, 15), TaskStatus.COMPLETED, "4")
  },
  {
    id: "t105",
    title: "Подготовить отчет по закупкам за месяц",
    description: "Сформировать сводный отчет по всем закупкам за прошедший месяц.",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    type: TaskType.RECURRING,
    creatorId: "0",
    assigneeIds: ["1"],
    observerIds: ["4"],
    processId: "bp-purchasing",
    dueDate: todayScheduler.getNextTaskTime(90), // 1.5 часа (16:30-18:00)
    tags: ["отчет", "закупки"],
    estimatedHours: 1.5,
    checklist: [],
    createdAt: createTaskDate(-8, 9),
    updatedAt: createTaskDate(-1, 14),
    comments: [],
    history: createTaskHistory("t105", createTaskDate(-8, 9), createTaskDate(0, 16, 30), TaskStatus.COMPLETED, "0")
  },
  {
    id: "t106",
    title: "Провести переговоры с новым поставщиком",
    description: "Встреча с представителями нового поставщика для обсуждения условий сотрудничества.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "4",
    assigneeIds: ["1"],
    observerIds: ["0"],
    processId: "bp-purchasing",
    dueDate: tomorrowScheduler.getNextTaskTime(60), // Завтра 1 час
    tags: ["переговоры", "поставщик"],
    estimatedHours: 1,
    checklist: [],
    createdAt: createTaskDate(-14, 10),
    updatedAt: createTaskDate(-6, 11),
    comments: [],
    history: createTaskHistory("t106", createTaskDate(-14, 10), createTaskDate(1, 9), TaskStatus.COMPLETED, "4")
  },
  {
    id: "t107",
    title: "Актуализировать базу поставщиков",
    description: "Обновить контактную информацию и условия работы с текущими поставщиками.",
    priority: TaskPriority.LOW,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["1"],
    observerIds: [],
    processId: "bp-purchasing",
    dueDate: tomorrowScheduler.getNextTaskTime(120), // Завтра 2 часа
    tags: ["база данных", "поставщики"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-18, 9),
    updatedAt: createTaskDate(-7, 14),
    comments: [],
    history: createTaskHistory("t107", createTaskDate(-18, 9), createTaskDate(1, 10), TaskStatus.COMPLETED, "0")
  },
  {
    id: "t108",
    title: "Оформить претензию поставщику",
    description: "Подготовить претензию по качеству поставленного товара.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "4",
    assigneeIds: ["1"],
    observerIds: ["0"],
    processId: "bp-purchasing",
    dueDate: futureScheduler.getNextTaskTime(90), // Будущее 1.5 часа
    tags: ["претензия", "качество"],
    estimatedHours: 1.5,
    checklist: [],
    createdAt: createTaskDate(-11, 10),
    updatedAt: createTaskDate(-3, 15),
    comments: [],
    history: createTaskHistory("t108", createTaskDate(-11, 10), createTaskDate(5, 9), TaskStatus.COMPLETED, "4")
  },
  {
    id: "t109",
    title: "Подготовить тендерную документацию",
    description: "Разработать пакет документов для проведения тендера на поставку материалов.",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["1"],
    observerIds: ["4"],
    processId: "bp-purchasing",
    dueDate: futureScheduler.getNextTaskTime(120), // Будущее 2 часа
    tags: ["тендер", "документация"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-16, 9),
    updatedAt: createTaskDate(-5, 16),
    comments: [],
    history: createTaskHistory("t109", createTaskDate(-16, 9), createTaskDate(5, 10, 30), TaskStatus.COMPLETED, "0")
  },
  {
    id: "t110",
    title: "Провести инвентаризацию закупочных материалов",
    description: "Сверка фактического наличия с данными учета.",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "4",
    assigneeIds: ["1"],
    observerIds: [],
    processId: "bp-purchasing",
    dueDate: futureScheduler.getNextTaskTime(120), // Будущее 2 часа
    tags: ["инвентаризация", "учет"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-13, 10),
    updatedAt: createTaskDate(-4, 14),
    comments: [],
    history: createTaskHistory("t110", createTaskDate(-13, 10), createTaskDate(5, 14), TaskStatus.COMPLETED, "4")
  },
  {
    id: "t111",
    title: "Согласовать бюджет на закупки на следующий квартал",
    description: "Подготовить и защитить бюджет закупок на Q2.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["1"],
    observerIds: ["4"],
    processId: "bp-purchasing",
    dueDate: futureScheduler.getNextTaskTime(120), // Будущее 2 часа
    tags: ["бюджет", "планирование"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-5, 9),
    updatedAt: createTaskDate(-1, 14),
    comments: [],
    history: createTaskHistory("t111", createTaskDate(-5, 9), createTaskDate(5, 16), TaskStatus.IN_PROGRESS, "0")
  },
  {
    id: "t112",
    title: "Подготовить презентацию по оптимизации закупок",
    description: "Разработать предложения по снижению затрат на закупки.",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.IN_PROGRESS,
    type: TaskType.ONE_TIME,
    creatorId: "4",
    assigneeIds: ["1"],
    observerIds: ["0"],
    processId: "bp-purchasing",
    dueDate: createTaskDate(0, 12),
    tags: ["презентация", "оптимизация"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-3, 9),
    updatedAt: createTaskDate(-1, 14),
    comments: [],
    history: createTaskHistory("t112", createTaskDate(-3, 9), createTaskDate(6, 10), TaskStatus.IN_PROGRESS, "4")
  },

  // ЗАДАЧИ ДЛЯ ПЕТРА СМОЛЬНИКОВА (id: "2") - 14 задач
  // Сбрасываем планировщик для нового пользователя
  {
    id: "t201",
    title: "Отправить коммерческое предложение ключевому клиенту",
    description: "Срочно подготовить и отправить КП для важного клиента.",
    priority: TaskPriority.CRITICAL,
    status: TaskStatus.IN_PROGRESS,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["2"],
    observerIds: ["4"],
    processId: "bp-strategic",
    dueDate: createTaskDate(-2, 17), // Просроченная
    tags: ["КП", "клиент"],
    estimatedHours: 0.5,
    checklist: [],
    createdAt: createTaskDate(-7, 9),
    updatedAt: createTaskDate(-1, 10),
    comments: [],
    history: createTaskHistory("t201", createTaskDate(-7, 9), createTaskDate(-2, 17), TaskStatus.IN_PROGRESS, "0"),
    isOverdue: true
  },
  {
    id: "t202",
    title: "Провести встречу с потенциальным партнером",
    description: "Организовать и провести переговоры о партнерстве.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.ACKNOWLEDGED,
    type: TaskType.ONE_TIME,
    creatorId: "4",
    assigneeIds: ["2"],
    observerIds: ["0"],
    processId: "bp-strategic",
    dueDate: createTaskDate(-1, 14), // Просроченная
    tags: ["встреча", "партнерство"],
    estimatedHours: 1,
    checklist: [],
    createdAt: createTaskDate(-5, 11),
    updatedAt: createTaskDate(-1, 12),
    comments: [],
    history: createTaskHistory("t202", createTaskDate(-5, 11), createTaskDate(-1, 14), TaskStatus.ACKNOWLEDGED, "4"),
    isOverdue: true
  },
  {
    id: "t203",
    title: "Подготовить отчет по продажам за месяц",
    description: "Сформировать детальный отчет с анализом продаж.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.COMPLETED,
    type: TaskType.RECURRING,
    creatorId: "0",
    assigneeIds: ["2"],
    observerIds: ["4"],
    processId: "bp-strategic",
    dueDate: (() => { todayScheduler.reset(); return todayScheduler.getNextTaskTime(120); })(), // Сегодня 2 часа
    tags: ["отчет", "продажи"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-10, 9),
    updatedAt: createTaskDate(-2, 14),
    comments: [],
    history: createTaskHistory("t203", createTaskDate(-10, 9), createTaskDate(0, 9), TaskStatus.COMPLETED, "0")
  },
  {
    id: "t204",
    title: "Обзвонить базу холодных клиентов",
    description: "Провести обзвон потенциальных клиентов из CRM.",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "4",
    assigneeIds: ["2"],
    observerIds: [],
    processId: "bp-strategic",
    dueDate: todayScheduler.getNextTaskTime(120), // Сегодня 2 часа
    tags: ["звонки", "клиенты"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-12, 10),
    updatedAt: createTaskDate(-3, 15),
    comments: [],
    history: createTaskHistory("t204", createTaskDate(-12, 10), createTaskDate(0, 11), TaskStatus.COMPLETED, "4")
  },
  {
    id: "t205",
    title: "Обновить презентацию компании",
    description: "Актуализировать корпоративную презентацию для клиентов.",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["2"],
    observerIds: [],
    processId: "bp-strategic",
    dueDate: todayScheduler.getNextTaskTime(90), // Сегодня 1.5 часа
    tags: ["презентация", "маркетинг"],
    estimatedHours: 1.5,
    checklist: [],
    createdAt: createTaskDate(-15, 10),
    updatedAt: createTaskDate(-5, 16),
    comments: [],
    history: createTaskHistory("t205", createTaskDate(-15, 10), createTaskDate(0, 14), TaskStatus.COMPLETED, "0")
  },
  {
    id: "t206",
    title: "Заключить договор с новым клиентом",
    description: "Финализировать условия и подписать договор.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "4",
    assigneeIds: ["2"],
    observerIds: ["0"],
    processId: "bp-strategic",
    dueDate: todayScheduler.getNextTaskTime(90), // Сегодня 1.5 часа
    tags: ["договор", "клиент"],
    estimatedHours: 1.5,
    checklist: [],
    createdAt: createTaskDate(-8, 9),
    updatedAt: createTaskDate(-2, 14),
    comments: [],
    history: createTaskHistory("t206", createTaskDate(-8, 9), createTaskDate(0, 15, 30), TaskStatus.COMPLETED, "4")
  },
  {
    id: "t207",
    title: "Провести вебинар для клиентов",
    description: "Организовать и провести обучающий вебинар.",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["2"],
    observerIds: ["4"],
    processId: "bp-strategic",
    dueDate: todayScheduler.getNextTaskTime(60), // Сегодня 1 час
    tags: ["вебинар", "обучение"],
    estimatedHours: 1,
    checklist: [],
    createdAt: createTaskDate(-11, 10),
    updatedAt: createTaskDate(-4, 15),
    comments: [],
    history: createTaskHistory("t207", createTaskDate(-11, 10), createTaskDate(0, 17), TaskStatus.COMPLETED, "0")
  },
  {
    id: "t208",
    title: "Подготовить коммерческие условия для тендера",
    description: "Разработать конкурентное предложение для участия в тендере.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "4",
    assigneeIds: ["2"],
    observerIds: ["0"],
    processId: "bp-strategic",
    dueDate: tomorrowScheduler.getNextTaskTime(120), // Завтра 2 часа
    tags: ["тендер", "предложение"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-14, 10),
    updatedAt: createTaskDate(-6, 11),
    comments: [],
    history: createTaskHistory("t208", createTaskDate(-14, 10), createTaskDate(1, 10), TaskStatus.COMPLETED, "4")
  },
  {
    id: "t209",
    title: "Провести анализ конкурентов",
    description: "Исследовать ценовую политику и предложения конкурентов.",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["2"],
    observerIds: [],
    processId: "bp-strategic",
    dueDate: createTaskDate(5, 10),
    tags: ["анализ", "конкуренты"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-16, 9),
    updatedAt: createTaskDate(-7, 14),
    comments: [],
    history: createTaskHistory("t209", createTaskDate(-16, 9), createTaskDate(5, 10), TaskStatus.COMPLETED, "0")
  },
  {
    id: "t210",
    title: "Организовать встречу с ключевыми клиентами",
    description: "Провести ежеквартальную встречу с VIP-клиентами.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "4",
    assigneeIds: ["2"],
    observerIds: ["0"],
    processId: "bp-strategic",
    dueDate: createTaskDate(5, 14),
    tags: ["встреча", "VIP"],
    estimatedHours: 0.5,
    checklist: [],
    createdAt: createTaskDate(-13, 10),
    updatedAt: createTaskDate(-5, 15),
    comments: [],
    history: createTaskHistory("t210", createTaskDate(-13, 10), createTaskDate(5, 14), TaskStatus.COMPLETED, "4")
  },
  {
    id: "t211",
    title: "Разработать скрипты продаж",
    description: "Подготовить скрипты для отдела продаж.",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["2"],
    observerIds: ["4"],
    processId: "bp-strategic",
    dueDate: createTaskDate(6, 11),
    tags: ["скрипты", "продажи"],
    estimatedHours: 1.5,
    checklist: [],
    createdAt: createTaskDate(-17, 9),
    updatedAt: createTaskDate(-8, 14),
    comments: [],
    history: createTaskHistory("t211", createTaskDate(-17, 9), createTaskDate(6, 11), TaskStatus.COMPLETED, "0")
  },
  {
    id: "t212",
    title: "Провести обучение новых менеджеров",
    description: "Обучить новых сотрудников отдела продаж.",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "4",
    assigneeIds: ["2"],
    observerIds: [],
    processId: "bp-strategic",
    dueDate: createTaskDate(7, 10),
    tags: ["обучение", "менеджеры"],
    estimatedHours: 1,
    checklist: [],
    createdAt: createTaskDate(-9, 10),
    updatedAt: createTaskDate(-3, 15),
    comments: [],
    history: createTaskHistory("t212", createTaskDate(-9, 10), createTaskDate(7, 10), TaskStatus.COMPLETED, "4")
  },
  {
    id: "t213",
    title: "Подготовить прайс-лист на новый сезон",
    description: "Актуализировать цены на продукцию.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["2"],
    observerIds: ["4"],
    processId: "bp-strategic",
    dueDate: createTaskDate(7, 14),
    tags: ["прайс", "цены"],
    estimatedHours: 0.5,
    checklist: [],
    createdAt: createTaskDate(-6, 9),
    updatedAt: createTaskDate(-2, 14),
    comments: [],
    history: createTaskHistory("t213", createTaskDate(-6, 9), createTaskDate(7, 14), TaskStatus.COMPLETED, "0")
  },
  {
    id: "t214",
    title: "Провести аудит клиентской базы",
    description: "Проверить актуальность данных в CRM.",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "4",
    assigneeIds: ["2"],
    observerIds: [],
    processId: "bp-strategic",
    dueDate: createTaskDate(8, 15),
    tags: ["аудит", "CRM"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-10, 10),
    updatedAt: createTaskDate(-4, 16),
    comments: [],
    history: createTaskHistory("t214", createTaskDate(-10, 10), createTaskDate(8, 15), TaskStatus.COMPLETED, "4")
  },

  // ЗАДАЧИ ДЛЯ АЛЕКСЕЯ СОКОЛОВСКОГО (id: "3") - 12 задач
  {
    id: "t301",
    title: "Провести калибровку производственного оборудования",
    description: "Выполнить плановую калибровку станков в цехе.",
    priority: TaskPriority.CRITICAL,
    status: TaskStatus.IN_PROGRESS,
    type: TaskType.ONE_TIME,
    creatorId: "4",
    assigneeIds: ["3"],
    observerIds: ["0"],
    processId: "bp-production",
    dueDate: createTaskDate(-3, 16), // Просроченная
    tags: ["калибровка", "оборудование"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-8, 9),
    updatedAt: createTaskDate(-1, 11),
    comments: [],
    history: createTaskHistory("t301", createTaskDate(-8, 9), createTaskDate(-3, 16), TaskStatus.IN_PROGRESS, "4"),
    isOverdue: true
  },
  {
    id: "t302",
    title: "Подготовить технологические карты",
    description: "Разработать техкарты для новой продукции.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.ACKNOWLEDGED,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["3"],
    observerIds: ["4"],
    processId: "bp-production",
    dueDate: createTaskDate(-2, 18), // Просроченная
    tags: ["техкарты", "документация"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-10, 10),
    updatedAt: createTaskDate(-1, 12),
    comments: [],
    history: createTaskHistory("t302", createTaskDate(-10, 10), createTaskDate(-2, 18), TaskStatus.ACKNOWLEDGED, "0"),
    isOverdue: true
  },
  {
    id: "t303",
    title: "Провести контроль качества готовой продукции",
    description: "Проверка соответствия продукции стандартам качества.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.COMPLETED,
    type: TaskType.RECURRING,
    creatorId: "4",
    assigneeIds: ["3"],
    observerIds: [],
    processId: "bp-production",
    dueDate: (() => { todayScheduler.reset(); return todayScheduler.getNextTaskTime(120); })(), // Сегодня 2 часа
    tags: ["контроль", "качество"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-12, 9),
    updatedAt: createTaskDate(-3, 14),
    comments: [],
    history: createTaskHistory("t303", createTaskDate(-12, 9), createTaskDate(0, 9), TaskStatus.COMPLETED, "4")
  },
  {
    id: "t304",
    title: "Оптимизировать производственный процесс",
    description: "Внедрить улучшения в технологический процесс.",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["3"],
    observerIds: ["4"],
    processId: "bp-production",
    dueDate: todayScheduler.getNextTaskTime(120), // Сегодня 2 часа
    tags: ["оптимизация", "процесс"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-15, 10),
    updatedAt: createTaskDate(-5, 16),
    comments: [],
    history: createTaskHistory("t304", createTaskDate(-15, 10), createTaskDate(0, 11), TaskStatus.COMPLETED, "0")
  },
  {
    id: "t305",
    title: "Провести обучение персонала новым технологиям",
    description: "Обучить рабочих работе с новым оборудованием.",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "4",
    assigneeIds: ["3"],
    observerIds: [],
    processId: "bp-production",
    dueDate: todayScheduler.getNextTaskTime(120), // Сегодня 2 часа
    tags: ["обучение", "технологии"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-11, 10),
    updatedAt: createTaskDate(-4, 15),
    comments: [],
    history: createTaskHistory("t305", createTaskDate(-11, 10), createTaskDate(0, 14), TaskStatus.COMPLETED, "4")
  },
  {
    id: "t306",
    title: "Разработать план модернизации производства",
    description: "Подготовить предложения по обновлению оборудования.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["3"],
    observerIds: ["4"],
    processId: "bp-production",
    dueDate: todayScheduler.getNextTaskTime(120), // Сегодня 2 часа
    tags: ["модернизация", "планирование"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-20, 9),
    updatedAt: createTaskDate(-8, 14),
    comments: [],
    history: createTaskHistory("t306", createTaskDate(-20, 9), createTaskDate(0, 16), TaskStatus.COMPLETED, "0")
  },
  {
    id: "t307",
    title: "Провести испытания новой продукции",
    description: "Тестирование опытных образцов.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "4",
    assigneeIds: ["3"],
    observerIds: ["0"],
    processId: "bp-production",
    dueDate: createTaskDate(5, 14),
    tags: ["испытания", "продукция"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-14, 10),
    updatedAt: createTaskDate(-6, 11),
    comments: [],
    history: createTaskHistory("t307", createTaskDate(-14, 10), createTaskDate(5, 14), TaskStatus.COMPLETED, "4")
  },
  {
    id: "t308",
    title: "Подготовить отчет по браку",
    description: "Анализ причин брака и предложения по снижению.",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    type: TaskType.RECURRING,
    creatorId: "0",
    assigneeIds: ["3"],
    observerIds: ["4"],
    processId: "bp-production",
    dueDate: createTaskDate(6, 10),
    tags: ["отчет", "брак"],
    estimatedHours: 0.5,
    checklist: [],
    createdAt: createTaskDate(-9, 10),
    updatedAt: createTaskDate(-3, 15),
    comments: [],
    history: createTaskHistory("t308", createTaskDate(-9, 10), createTaskDate(6, 10), TaskStatus.COMPLETED, "0")
  },
  {
    id: "t309",
    title: "Провести техническое обслуживание оборудования",
    description: "Плановое ТО производственных линий.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.COMPLETED,
    type: TaskType.RECURRING,
    creatorId: "4",
    assigneeIds: ["3"],
    observerIds: [],
    processId: "bp-production",
    dueDate: createTaskDate(7, 11),
    tags: ["ТО", "оборудование"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-13, 10),
    updatedAt: createTaskDate(-5, 16),
    comments: [],
    history: createTaskHistory("t309", createTaskDate(-13, 10), createTaskDate(7, 11), TaskStatus.COMPLETED, "4")
  },
  {
    id: "t310",
    title: "Разработать инструкции по технике безопасности",
    description: "Обновить инструкции ТБ для производственного персонала.",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["3"],
    observerIds: ["4"],
    processId: "bp-production",
    dueDate: createTaskDate(8, 14),
    tags: ["безопасность", "инструкции"],
    estimatedHours: 1.5,
    checklist: [],
    createdAt: createTaskDate(-16, 9),
    updatedAt: createTaskDate(-7, 14),
    comments: [],
    history: createTaskHistory("t310", createTaskDate(-16, 9), createTaskDate(8, 14), TaskStatus.COMPLETED, "0")
  },
  {
    id: "t311",
    title: "Провести аудит производственных процессов",
    description: "Комплексная проверка эффективности производства.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "4",
    assigneeIds: ["3"],
    observerIds: ["0"],
    processId: "bp-production",
    dueDate: createTaskDate(9, 10),
    tags: ["аудит", "процессы"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-18, 9),
    updatedAt: createTaskDate(-9, 14),
    comments: [],
    history: createTaskHistory("t311", createTaskDate(-18, 9), createTaskDate(9, 10), TaskStatus.COMPLETED, "4")
  },
  {
    id: "t312",
    title: "Внедрить систему учета расхода материалов",
    description: "Запустить автоматизированный учет сырья.",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["3"],
    observerIds: ["4"],
    processId: "bp-production",
    dueDate: createTaskDate(10, 15),
    tags: ["учет", "материалы"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-17, 10),
    updatedAt: createTaskDate(-8, 16),
    comments: [],
    history: createTaskHistory("t312", createTaskDate(-17, 10), createTaskDate(10, 15), TaskStatus.COMPLETED, "0")
  },

  // ЗАДАЧИ ДЛЯ ЕЛЕНЫ АНТИПОВОЙ (id: "4") - 18 задач
  {
    id: "t401",
    title: "Провести инвентаризацию склада",
    description: "Полная инвентаризация товаров на центральном складе.",
    priority: TaskPriority.CRITICAL,
    status: TaskStatus.IN_PROGRESS,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["4"],
    observerIds: [],
    processId: "bp-warehouse",
    dueDate: createTaskDate(-4, 18), // Просроченная
    tags: ["инвентаризация", "склад"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-10, 9),
    updatedAt: createTaskDate(-1, 10),
    comments: [],
    history: createTaskHistory("t401", createTaskDate(-10, 9), createTaskDate(-4, 18), TaskStatus.IN_PROGRESS, "0"),
    isOverdue: true
  },
  {
    id: "t402",
    title: "Оптимизировать складское пространство",
    description: "Реорганизация размещения товаров для эффективного использования площади.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.ACKNOWLEDGED,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["4"],
    observerIds: [],
    processId: "bp-warehouse",
    dueDate: createTaskDate(-3, 16), // Просроченная
    tags: ["оптимизация", "склад"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-9, 10),
    updatedAt: createTaskDate(-1, 11),
    comments: [],
    history: createTaskHistory("t402", createTaskDate(-9, 10), createTaskDate(-3, 16), TaskStatus.ACKNOWLEDGED, "0"),
    isOverdue: true
  },
  {
    id: "t403",
    title: "Подготовить отчет по движению товаров",
    description: "Ежемесячный отчет по приходу и расходу товаров.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.PAUSED,
    type: TaskType.RECURRING,
    creatorId: "0",
    assigneeIds: ["4"],
    observerIds: [],
    processId: "bp-warehouse",
    dueDate: createTaskDate(-2, 17), // Просроченная
    tags: ["отчет", "товары"],
    estimatedHours: 1,
    checklist: [],
    createdAt: createTaskDate(-8, 11),
    updatedAt: createTaskDate(-1, 12),
    comments: [],
    history: createTaskHistory("t403", createTaskDate(-8, 11), createTaskDate(-2, 17), TaskStatus.PAUSED, "0"),
    isOverdue: true
  },
  {
    id: "t404",
    title: "Организовать отгрузку крупной партии",
    description: "Координация отгрузки для ключевого клиента.",
    priority: TaskPriority.CRITICAL,
    status: TaskStatus.IN_PROGRESS,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["4"],
    observerIds: [],
    processId: "bp-warehouse",
    dueDate: createTaskDate(-1, 14), // Просроченная
    tags: ["отгрузка", "клиент"],
    estimatedHours: 1.5,
    checklist: [],
    createdAt: createTaskDate(-5, 9),
    updatedAt: createTaskDate(-1, 14),
    comments: [],
    history: createTaskHistory("t404", createTaskDate(-5, 9), createTaskDate(-1, 14), TaskStatus.IN_PROGRESS, "0"),
    isOverdue: true
  },
  {
    id: "t405",
    title: "Провести приемку товара от поставщика",
    description: "Проверка качества и количества поступившего товара.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["4"],
    observerIds: [],
    processId: "bp-warehouse",
    dueDate: (() => { todayScheduler.reset(); return todayScheduler.getNextTaskTime(60); })(), // Сегодня 1 час
    tags: ["приемка", "поставка"],
    estimatedHours: 1,
    checklist: [],
    createdAt: createTaskDate(-7, 9),
    updatedAt: createTaskDate(-2, 14),
    comments: [],
    history: createTaskHistory("t405", createTaskDate(-7, 9), createTaskDate(0, 9), TaskStatus.COMPLETED, "0")
  },
  {
    id: "t406",
    title: "Обновить складскую документацию",
    description: "Актуализация всех складских документов и инструкций.",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["4"],
    observerIds: [],
    processId: "bp-warehouse",
    dueDate: todayScheduler.getNextTaskTime(90), // Сегодня 1.5 часа
    tags: ["документация", "склад"],
    estimatedHours: 1.5,
    checklist: [],
    createdAt: createTaskDate(-10, 10),
    updatedAt: createTaskDate(-3, 15),
    comments: [],
    history: createTaskHistory("t406", createTaskDate(-10, 10), createTaskDate(0, 10), TaskStatus.COMPLETED, "0")
  },
  {
    id: "t407",
    title: "Провести обучение складского персонала",
    description: "Обучение новой системе учета.",
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["4"],
    observerIds: [],
    processId: "bp-warehouse",
    dueDate: todayScheduler.getNextTaskTime(60), // Сегодня 1 час
    tags: ["обучение", "персонал"],
    estimatedHours: 1,
    checklist: [],
    createdAt: createTaskDate(-12, 10),
    updatedAt: createTaskDate(-4, 16),
    comments: [],
    history: createTaskHistory("t407", createTaskDate(-12, 10), createTaskDate(0, 11, 30), TaskStatus.COMPLETED, "0")
  },
  {
    id: "t408",
    title: "Организовать размещение нового товара",
    description: "Определить оптимальное размещение новой партии.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["4"],
    observerIds: [],
    processId: "bp-warehouse",
    dueDate: todayScheduler.getNextTaskTime(45), // Сегодня 45 минут
    tags: ["размещение", "товар"],
    estimatedHours: 0.75,
    checklist: [],
    createdAt: createTaskDate(-8, 11),
    updatedAt: createTaskDate(-2, 14),
    comments: [],
    history: createTaskHistory("t408", createTaskDate(-8, 11), createTaskDate(0, 14), TaskStatus.COMPLETED, "0")
  },
  {
    id: "t409",
    title: "Провести ревизию остатков",
    description: "Сверка фактических остатков с данными учета.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.COMPLETED,
    type: TaskType.RECURRING,
    creatorId: "0",
    assigneeIds: ["4"],
    observerIds: [],
    processId: "bp-warehouse",
    dueDate: todayScheduler.getNextTaskTime(120), // Сегодня 2 часа
    tags: ["ревизия", "остатки"],
    estimatedHours: 2,
    checklist: [],
    createdAt: createTaskDate(-14, 9),
    updatedAt: createTaskDate(-5, 14),
    comments: [],
    history: createTaskHistory("t409", createTaskDate(-14, 9), createTaskDate(0, 14, 45), TaskStatus.COMPLETED, "0")
  },
  {
    id: "t410",
    title: "Подготовить склад к аудиту",
    description: "Подготовка документации и территории к проверке.",
    priority: TaskPriority.HIGH,
    status: TaskStatus.COMPLETED,
    type: TaskType.ONE_TIME,
    creatorId: "0",
    assigneeIds: ["4"],
    observerIds: [],
    processId: "bp-warehouse",
    dueDate: todayScheduler.getNextTaskTime(75), // Сегодня 1 час 15 минут
    tags: ["аудит", "подготовка"],
    estimatedHours: 1.25,
    checklist: [],
    createdAt: createTaskDate(-15, 10),
    updatedAt: createTaskDate(-6, 15),
    comments: [],
    history: createTaskHistory("t410", createTaskDate(-15, 10), createTaskDate(0, 16, 45), TaskStatus.COMPLETED, "0")
  },
  {
    id: "t411",
    title: "Оптимизировать маршруты комплектации",
    description: "Разработать эффективные маршруты для сборщиков.",
   priority: TaskPriority.MEDIUM,
   status: TaskStatus.COMPLETED,
   type: TaskType.ONE_TIME,
   creatorId: "0",
   assigneeIds: ["4"],
   observerIds: [],
   processId: "bp-warehouse",
   dueDate: createTaskDate(5, 9),
   tags: ["оптимизация", "маршруты"],
   estimatedHours: 1.5,
   checklist: [],
   createdAt: createTaskDate(-16, 9),
   updatedAt: createTaskDate(-7, 14),
   comments: [],
   history: createTaskHistory("t411", createTaskDate(-16, 9), createTaskDate(5, 9), TaskStatus.COMPLETED, "0")
 },
 {
   id: "t412",
   title: "Провести списание испорченного товара",
   description: "Оформить акты списания и утилизацию.",
   priority: TaskPriority.MEDIUM,
   status: TaskStatus.COMPLETED,
   type: TaskType.ONE_TIME,
   creatorId: "0",
   assigneeIds: ["4"],
   observerIds: [],
   processId: "bp-warehouse",
   dueDate: createTaskDate(5, 11),
   tags: ["списание", "утилизация"],
   estimatedHours: 0.5,
   checklist: [],
   createdAt: createTaskDate(-11, 10),
   updatedAt: createTaskDate(-4, 15),
   comments: [],
   history: createTaskHistory("t412", createTaskDate(-11, 10), createTaskDate(5, 11), TaskStatus.COMPLETED, "0")
 },
 {
   id: "t413",
   title: "Внедрить систему штрихкодирования",
   description: "Запуск системы учета по штрих-кодам.",
   priority: TaskPriority.HIGH,
   status: TaskStatus.COMPLETED,
   type: TaskType.ONE_TIME,
   creatorId: "0",
   assigneeIds: ["4"],
   observerIds: [],
   processId: "bp-warehouse",
   dueDate: createTaskDate(5, 14),
   tags: ["штрихкоды", "учет"],
   estimatedHours: 2,
   checklist: [],
   createdAt: createTaskDate(-20, 9),
   updatedAt: createTaskDate(-9, 14),
   comments: [],
   history: createTaskHistory("t413", createTaskDate(-20, 9), createTaskDate(5, 14), TaskStatus.COMPLETED, "0")
 },
 {
   id: "t414",
   title: "Организовать зону временного хранения",
   description: "Создать и организовать буферную зону.",
   priority: TaskPriority.MEDIUM,
   status: TaskStatus.COMPLETED,
   type: TaskType.ONE_TIME,
   creatorId: "0",
   assigneeIds: ["4"],
   observerIds: [],
   processId: "bp-warehouse",
   dueDate: createTaskDate(6, 10),
   tags: ["зона", "хранение"],
   estimatedHours: 1.5,
   checklist: [],
   createdAt: createTaskDate(-13, 10),
   updatedAt: createTaskDate(-5, 15),
   comments: [],
   history: createTaskHistory("t414", createTaskDate(-13, 10), createTaskDate(6, 10), TaskStatus.COMPLETED, "0")
 },
 {
   id: "t415",
   title: "Провести анализ складских затрат",
   description: "Анализ и оптимизация расходов на складскую логистику.",
   priority: TaskPriority.MEDIUM,
   status: TaskStatus.COMPLETED,
   type: TaskType.ONE_TIME,
   creatorId: "0",
   assigneeIds: ["4"],
   observerIds: [],
   processId: "bp-warehouse",
   dueDate: createTaskDate(6, 14),
   tags: ["анализ", "затраты"],
   estimatedHours: 1,
   checklist: [],
   createdAt: createTaskDate(-17, 10),
   updatedAt: createTaskDate(-8, 16),
   comments: [],
   history: createTaskHistory("t415", createTaskDate(-17, 10), createTaskDate(6, 14), TaskStatus.COMPLETED, "0")
 },
 {
   id: "t416",
   title: "Обновить правила техники безопасности",
   description: "Актуализация инструкций ТБ для складского персонала.",
   priority: TaskPriority.HIGH,
   status: TaskStatus.COMPLETED,
   type: TaskType.ONE_TIME,
   creatorId: "0",
   assigneeIds: ["4"],
   observerIds: [],
   processId: "bp-warehouse",
   dueDate: createTaskDate(7, 11),
   tags: ["безопасность", "инструкции"],
   estimatedHours: 0.5,
   checklist: [],
   createdAt: createTaskDate(-18, 9),
   updatedAt: createTaskDate(-10, 14),
   comments: [],
   history: createTaskHistory("t416", createTaskDate(-18, 9), createTaskDate(7, 11), TaskStatus.COMPLETED, "0")
 },
 {
   id: "t417",
   title: "Провести контроль сроков годности",
   description: "Проверка и ротация товаров с ограниченным сроком хранения.",
   priority: TaskPriority.HIGH,
   status: TaskStatus.COMPLETED,
   type: TaskType.RECURRING,
   creatorId: "0",
   assigneeIds: ["4"],
   observerIds: [],
   processId: "bp-warehouse",
   dueDate: createTaskDate(7, 15),
   tags: ["контроль", "сроки"],
   estimatedHours: 1,
   checklist: [],
   createdAt: createTaskDate(-9, 10),
   updatedAt: createTaskDate(-3, 15),
   comments: [],
   history: createTaskHistory("t417", createTaskDate(-9, 10), createTaskDate(7, 15), TaskStatus.COMPLETED, "0")
 },
 {
   id: "t418",
   title: "Организовать учет возвратов",
   description: "Внедрить систему обработки возвратов от клиентов.",
   priority: TaskPriority.MEDIUM,
   status: TaskStatus.COMPLETED,
   type: TaskType.ONE_TIME,
   creatorId: "0",
   assigneeIds: ["4"],
   observerIds: [],
   processId: "bp-warehouse",
   dueDate: createTaskDate(8, 10),
   tags: ["возвраты", "учет"],
   estimatedHours: 1.5,
   checklist: [],
   createdAt: createTaskDate(-19, 9),
   updatedAt: createTaskDate(-11, 14),
   comments: [],
   history: createTaskHistory("t418", createTaskDate(-19, 9), createTaskDate(8, 10), TaskStatus.COMPLETED, "0")
 },

 // ЗАДАЧИ ДЛЯ ГЕНЕРАЛЬНОГО ДИРЕКТОРА (Анна Иванова) - 3 задачи
 {
   id: "t1",
   title: "Утвердить бюджет на 2025 год",
   description: "Рассмотреть предложения департаментов, внести корректировки, принять окончательное решение по бюджету компании на следующий год.",
   priority: TaskPriority.CRITICAL,
   status: TaskStatus.IN_PROGRESS,
   type: TaskType.ONE_TIME,
   creatorId: "0",
   assigneeIds: ["0"],
   observerIds: ["4"],
   processId: "bp-strategic",
   dueDate: (() => { todayScheduler.reset(); return todayScheduler.getNextTaskTime(60); })(), // Сегодня 1 час
   tags: ["бюджет", "стратегия"],
   estimatedHours: 1,
   checklist: [],
   createdAt: createTaskDate(-5, 9),
   updatedAt: createTaskDate(-1, 10),
   comments: [],
   history: createTaskHistory("t1", createTaskDate(-5, 9), createTaskDate(0, 9), TaskStatus.IN_PROGRESS, "0")
 },
 {
   id: "t2",
   title: "Провести совещание с руководителями отделов",
   description: "Обсудить итоги месяца, планы на следующий период, решить текущие вопросы координации между отделами.",
   priority: TaskPriority.HIGH,
   status: TaskStatus.NEW,
   type: TaskType.RECURRING,
   creatorId: "0",
   assigneeIds: ["0"],
   observerIds: ["2", "3", "4"],
   processId: "bp-strategic",
   dueDate: todayScheduler.getNextTaskTime(90), // Сегодня 30 минут
   tags: ["совещание", "управление"],
   estimatedHours: 0.5,
   checklist: [],
   createdAt: createTaskDate(-3, 10),
   updatedAt: createTaskDate(-1, 11),
   comments: [],
   history: createTaskHistory("t2", createTaskDate(-3, 10), createTaskDate(0, 10), TaskStatus.NEW, "0")
 },
 {
   id: "t3",
   title: "Согласовать новую систему мотивации персонала",
   description: "Рассмотреть предложения по изменению системы премирования и KPI для сотрудников всех уровней.",
   priority: TaskPriority.HIGH,
   status: TaskStatus.ACKNOWLEDGED,
   type: TaskType.ONE_TIME,
   creatorId: "0",
   assigneeIds: ["0"],
   observerIds: ["4"],
   processId: "bp-strategic",
   dueDate: todayScheduler.getNextTaskTime(120), // Сегодня 1.5 часа
   tags: ["HR", "мотивация"],
   estimatedHours: 1.5,
   checklist: [],
   createdAt: createTaskDate(-2, 10),
   updatedAt: createTaskDate(-1, 12),
   comments: [],
   history: createTaskHistory("t3", createTaskDate(-2, 11), createTaskDate(0, 10, 30), TaskStatus.ACKNOWLEDGED, "0")
 },
]

export function getTaskStatistics() {
 const total = mockTasks.length
 const overdue = mockTasks.filter(t => t.isOverdue).length
 const almostOverdue = mockTasks.filter(t => t.isAlmostOverdue).length
 const critical = mockTasks.filter(t => t.priority === 1).length
 const high = mockTasks.filter(t => t.priority === 2).length
 
 const byUser = mockUsers.map(user => ({
   userId: user.id,
   userName: user.name,
   position: user.position,
   tasksCount: mockTasks.filter(t => t.assigneeIds.includes(user.id)).length,
   overdueCount: mockTasks.filter(t => t.assigneeIds.includes(user.id) && t.isOverdue).length,
   criticalCount: mockTasks.filter(t => t.assigneeIds.includes(user.id) && t.priority === 1).length,
 }))
 
 return {
   total,
   overdue,
   almostOverdue,
   critical,
   high,
   byUser,
 }
}