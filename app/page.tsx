// app/page.tsx (обновленная версия с новым лоадером)
"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Plus, ChevronDown } from "lucide-react";

// Ленивая загрузка компонентов
import dynamic from "next/dynamic";
import { SheetTrigger, SheetContent, Sheet } from "../src/components/ui/sheet";
import {
  DatabaseTask,
  DatabaseUser,
  DatabaseBusinessProcess,
  DatabaseHistoryEntry,
  TaskStatus,
} from "../src/lib/models/types";
import {
  useGetBusinessProcessesQuery,
  useCreateBusinessProcessMutation,
} from "../src/lib/store/api/businessProcessesApi";
import {
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
  useAddCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} from "../src/lib/store/api/tasksApi";
import { useGetUsersQuery } from "../src/lib/store/api/usersApi";
import { Button } from "../src/components/ui/button";
import LoadingScreen from "@/src/components/LoadingScreen";
import { useAppSelector } from "@/src/lib/store/hooks";
import { selectCurrentUser } from "@/src/lib/store/slices/authSlice";

// Импортируем новый компонент загрузки

const TasksView = dynamic(
  () => import("@/src/components/Views/TaskView/TasksView"),
  {
    ssr: false,
    loading: () => (
      <LoadingScreen variant="minimal" message="Загрузка задач..." />
    ),
  }
);

const ProcessMapView = dynamic(
  () => import("@/src/components/Views/ProcessMapView/ProcessMapView"),
  {
    ssr: false,
    loading: () => (
      <LoadingScreen variant="minimal" message="Загрузка процессов..." />
    ),
  }
);

const ReportsAndFeedbackView = dynamic(
  () =>
    import(
      "@/src/components/Views/ReportsAndFeedbackView/ReportsAndFeedbackView"
    ),
  {
    ssr: false,
    loading: () => (
      <LoadingScreen variant="minimal" message="Загрузка отчетов..." />
    ),
  }
);

const SettingsView = dynamic(
  () => import("@/src/components/Views/SettingsView/SettingsView"),
  {
    ssr: false,
    loading: () => (
      <LoadingScreen variant="minimal" message="Загрузка настроек..." />
    ),
  }
);

const BottomNavigation = dynamic(
  () => import("@/src/components/BottomNavigation"),
  {
    ssr: false,
  }
);

const NotificationButton = dynamic(
  () => import("@/src/components/NotificationButton"),
  {
    ssr: false,
  }
);

const CreateTaskDialog = dynamic(
  () => import("@/src/components/Dialogs/CreateTaskDialog/CreateTaskDialog"),
  {
    ssr: false,
  }
);

// Frontend Comment interface that components expect
export interface TaskComment {
  id: string;
  authorId: string;
  text: string;
  isResult: boolean;
  timestamp: Date;
}

// Отдельный компонент для контента табов
const TabContent = memo(function TabContent({
  activeTab,
  tasks,
  users,
  currentUser,
  businessProcesses,
  handleUpdateTask,
  handleCreateTask,
  handleDeleteTask,
  handleAddComment,
  handleUpdateComment,
  handleDeleteComment,
  handleSendReminder,
  handleCreateBusinessProcess,
}: {
  activeTab: string;
  tasks: DatabaseTask[];
  users: DatabaseUser[];
  currentUser: DatabaseUser;
  businessProcesses: DatabaseBusinessProcess[];
  handleUpdateTask: (
    updatedTask: DatabaseTask,
    historyAction?: Omit<DatabaseHistoryEntry, "id" | "timestamp">
  ) => Promise<void>;
  handleCreateTask: (
    taskData: Omit<
      DatabaseTask,
      "id" | "created_at" | "updated_at" | "comments" | "history"
    >
  ) => Promise<void>;
  handleDeleteTask: (taskId: string) => Promise<void>;
  handleAddComment: (
    taskId: string,
    comment: Omit<TaskComment, "id" | "timestamp">
  ) => Promise<void>;
  handleUpdateComment: (
    taskId: string,
    commentId: string,
    text: string
  ) => Promise<void>;
  handleDeleteComment: (taskId: string, commentId: string) => Promise<void>;
  handleSendReminder: (taskId: string, minutes?: number) => Promise<void>;
  handleCreateBusinessProcess: (
    processData: Omit<
      DatabaseBusinessProcess,
      "id" | "created_at" | "updated_at"
    >
  ) => Promise<void>;
}) {
  const commonProps = useMemo(
    () => ({
      users,
      currentUser,
      businessProcesses,
      onUpdateTask: handleUpdateTask,
      onAddComment: handleAddComment,
      onUpdateComment: handleUpdateComment,
      onDeleteComment: handleDeleteComment,
      onSendReminder: handleSendReminder,
    }),
    [
      users,
      currentUser,
      businessProcesses,
      handleUpdateTask,
      handleAddComment,
      handleUpdateComment,
      handleDeleteComment,
      handleSendReminder,
    ]
  );

  switch (activeTab) {
    case "tasks":
      return (
        <TasksView
          tasks={tasks}
          onCreateTask={handleCreateTask}
          onDeleteTask={handleDeleteTask}
          {...commonProps}
        />
      );
    case "processes":
      return (
        <ProcessMapView
          tasks={tasks.filter((t) => !t.is_deleted)}
          onCreateBusinessProcess={handleCreateBusinessProcess}
          {...commonProps}
        />
      );
    case "reports":
      return (
        <ReportsAndFeedbackView
          tasks={tasks.filter((t) => !t.is_deleted)}
          {...commonProps}
        />
      );
    case "settings":
      return <SettingsView currentUser={currentUser} />;
    default:
      return null;
  }
});

export default function TasksApp() {
  const [activeTab, setActiveTab] = useState("tasks");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createDialogMode, setCreateDialogMode] = useState<"quick" | "full">(
    "quick"
  );
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  // API queries с оптимизацией
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    error: tasksError,
  } = useGetTasksQuery({ includeDeleted: true });
  const {
    data: users = [],
    isLoading: usersLoading,
    error: usersError,
  } = useGetUsersQuery({ active: true });
  const {
    data: businessProcesses = [],
    isLoading: processesLoading,
    error: processesError,
  } = useGetBusinessProcessesQuery({ active: true });

  // Улучшенная обработка состояния загрузки
  const isLoading = tasksLoading || usersLoading || processesLoading;
  const hasErrors = tasksError || usersError || processesError;

  const currentUser = useAppSelector(selectCurrentUser);

  // API mutations - мемоизированы для избежания пересоздания
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [addComment] = useAddCommentMutation();
  const [updateComment] = useUpdateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [createBusinessProcess] = useCreateBusinessProcessMutation();

  // Мемоизированные обработчики для предотвращения пересоздания
  const handleUpdateTask = useCallback(
    async (
      updatedTask: DatabaseTask,
      historyAction?: Omit<DatabaseHistoryEntry, "id" | "timestamp">
    ) => {
      try {
        const updates = {
          title: updatedTask.title,
          description: updatedTask.description,
          priority: updatedTask.priority,
          status: updatedTask.status,
          assigneeIds: updatedTask.assignees
            ? updatedTask.assignees.map((a) =>
                typeof a === "string" ? a : a.id
              )
            : [],
          observerIds: updatedTask.observers
            ? updatedTask.observers.map((o) =>
                typeof o === "string" ? o : o.id
              )
            : [],
          processId: updatedTask.process_id,
          dueDate: updatedTask.due_date.toISOString(),
          tags: updatedTask.tags,
          estimatedHours: updatedTask.estimated_hours,
          actualHours: updatedTask.actual_hours,
          result: updatedTask.result,
          aiScore: (updatedTask as any).aiScore,
        };

        await updateTask({ id: updatedTask.id, updates }).unwrap();
      } catch (error) {
        console.error("Error updating task:", error);
      }
    },
    [updateTask]
  );

  const handleCreateTask = useCallback(
    async (
      taskData: Omit<
        DatabaseTask,
        "id" | "created_at" | "updated_at" | "comments" | "history"
      >
    ) => {
      try {
        const createTaskRequest = {
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          type: taskData.type,
          assigneeIds: taskData.assignees
            ? taskData.assignees.map((a) => (typeof a === "string" ? a : a.id))
            : [],
          observerIds: taskData.observers
            ? taskData.observers.map((o) => (typeof o === "string" ? o : o.id))
            : [],
          processId: taskData.process_id,
          dueDate: taskData.due_date.toISOString(),
          tags: taskData.tags,
          estimatedHours: taskData.estimated_hours,
          checklist: taskData.checklist?.map((item) => ({
            text: item.text,
            level: item.level,
            order: item.item_order,
          })),
        };

        await createTask(createTaskRequest).unwrap();
      } catch (error) {
        console.error("Error creating task:", error);
      }
    },
    [createTask]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      try {
        await deleteTask(taskId).unwrap();
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    },
    [deleteTask]
  );

  const handleAddComment = useCallback(
    async (taskId: string, comment: Omit<TaskComment, "id" | "timestamp">) => {
      try {
        await addComment({
          taskId,
          text: comment.text,
          isResult: comment.isResult,
        }).unwrap();
      } catch (error) {
        console.error("Error adding comment:", error);
      }
    },
    [addComment]
  );

  const handleUpdateComment = useCallback(
    async (taskId: string, commentId: string, text: string) => {
      try {
        await updateComment({ taskId, commentId, text }).unwrap();
      } catch (error) {
        console.error("Error updating comment:", error);
      }
    },
    [updateComment]
  );

  const handleDeleteComment = useCallback(
    async (taskId: string, commentId: string) => {
      try {
        await deleteComment({ taskId, commentId }).unwrap();
      } catch (error) {
        console.error("Error deleting comment:", error);
      }
    },
    [deleteComment]
  );

  const handleSendReminder = useCallback(
    async (taskId: string, minutes?: number) => {
      console.log(
        "Sending reminder for task:",
        taskId,
        "in",
        minutes,
        "minutes"
      );
    },
    []
  );

  const handleCreateBusinessProcess = useCallback(
    async (
      processData: Omit<
        DatabaseBusinessProcess,
        "id" | "created_at" | "updated_at"
      >
    ) => {
      try {
        await createBusinessProcess({
          name: processData.name,
          description: processData.description,
        }).unwrap();
      } catch (error) {
        console.error("Error creating business process:", error);
      }
    },
    [createBusinessProcess]
  );

  // Мемоизированная функция получения заголовка страницы
  const getPageTitle = useMemo(() => {
    switch (activeTab) {
      case "tasks":
        return "Задачи";
      case "processes":
        return "Процессы";
      case "reports":
        return "Рейтинг";
      case "settings":
        return "Настройки";
      default:
        return "Задачи";
    }
  }, [activeTab]);

  // Мемоизированные обработчики диалогов
  const openQuickCreate = useCallback(() => {
    setCreateDialogMode("quick");
    setIsCreateDialogOpen(true);
    setIsCreateMenuOpen(false);
  }, []);

  const openFullCreate = useCallback(() => {
    setCreateDialogMode("full");
    setIsCreateDialogOpen(true);
    setIsCreateMenuOpen(false);
  }, []);

  // Мемоизированная проверка показа кнопок создания
  const shouldShowCreateButtons = useMemo(() => {
    return activeTab === "tasks" || activeTab === "processes";
  }, [activeTab]);

  // Эффект для обновления статуса задач (оптимизированный)
  useEffect(() => {
    const updateStatuses = () => {
      const now = new Date();
      const tasksToUpdate = tasks.filter((task) => {
        if (task.is_deleted || task.status === TaskStatus.COMPLETED)
          return false;

        const dueDate = new Date(task.due_date);
        const isOverdue = now > dueDate;
        const timeDiff = dueDate.getTime() - now.getTime();
        const hoursUntilDue = timeDiff / (1000 * 60 * 60);
        const isAlmostOverdue =
          !isOverdue && hoursUntilDue > 0 && hoursUntilDue <= 24;

        return (
          task.is_overdue !== isOverdue ||
          task.is_almost_overdue !== isAlmostOverdue
        );
      });

      if (tasksToUpdate.length > 0) {
        // Батчим обновления для производительности
        console.log(`Updating ${tasksToUpdate.length} task statuses`);
      }
    };

    const interval = setInterval(updateStatuses, 60000); // Every minute
    return () => clearInterval(interval);
  }, [tasks, updateTask]);

  // Show enhanced loading state
  if (isLoading) {
    return (
      <LoadingScreen
        variant="telegram"
        message="Загружаем рабочее пространство..."
      />
    );
  }

  // Show error state
  if (hasErrors || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Ошибка загрузки
          </h1>
          <p className="text-gray-600 mb-6">
            Не удалось загрузить данные. Проверьте подключение к интернету и
            попробуйте снова.
          </p>
          <Button onClick={() => window.location.reload()}>
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  const HEADER_MAX_HEIGHT = 81;

  return (
    <div className={`min-h-screen bg-gray-50 pb-20 ${activeTab === 'tasks' ? 'overflow-y-hidden' : ''}`}>
      {/* Mobile Header */}
      <div
        className={`bg-white border-b border-gray-200 sticky top-0 z-[20] max-h-[${HEADER_MAX_HEIGHT}px]`}
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {getPageTitle}
              </h1>
              <p className="text-sm text-gray-500">{currentUser.name}</p>
            </div>

            <div className="flex items-center gap-3">
              <NotificationButton currentUser={currentUser} />

              {shouldShowCreateButtons && (
                <div className="flex">
                  <Button
                    onClick={openQuickCreate}
                    size="sm"
                    className="h-10 px-4 bg-blue-600 hover:bg-blue-700 rounded-r-none border-r border-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Создать задачу
                  </Button>

                  <Sheet
                    open={isCreateMenuOpen}
                    onOpenChange={setIsCreateMenuOpen}
                  >
                    <SheetTrigger asChild>
                      <Button
                        size="sm"
                        className="h-10 px-2 bg-blue-600 hover:bg-blue-700 rounded-l-none"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-auto">
                      <div className="py-4 space-y-2">
                        <h3 className="font-medium mb-4">Создать задачу</h3>
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-12"
                          onClick={openQuickCreate}
                        >
                          <Plus className="h-5 w-5 mr-3" />
                          Быстрое создание
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-12"
                          onClick={openFullCreate}
                        >
                          <Plus className="h-5 w-5 mr-3" />
                          Полная форма
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          height: `calc(100vh - ${HEADER_MAX_HEIGHT}px)`, // fallback
          // @ts-ignore
          height: `calc(100svh - ${HEADER_MAX_HEIGHT}px)`, // modern
        }}
        className="px-4 py-4"
      >
        <TabContent
          activeTab={activeTab}
          tasks={tasks}
          users={users}
          currentUser={currentUser}
          businessProcesses={businessProcesses}
          handleUpdateTask={handleUpdateTask}
          handleCreateTask={handleCreateTask}
          handleDeleteTask={handleDeleteTask}
          handleAddComment={handleAddComment}
          handleUpdateComment={handleUpdateComment}
          handleDeleteComment={handleDeleteComment}
          handleSendReminder={handleSendReminder}
          handleCreateBusinessProcess={handleCreateBusinessProcess}
        />
      </div>

      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
      />

      {/* Диалог создания задач */}
      {shouldShowCreateButtons && (
        <CreateTaskDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onCreateTask={handleCreateTask}
          users={users}
          currentUser={currentUser}
          businessProcesses={businessProcesses}
          initialMode={createDialogMode}
        />
      )}
    </div>
  );
}
