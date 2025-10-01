// src/components/Views/TaskView/TasksView.tsx (исправленная версия)
"use client";

import { useState, useMemo, useCallback } from "react";
import { memo } from "react";
import dynamic from 'next/dynamic';
import { DatabaseBusinessProcess, DatabaseTask, DatabaseUser } from "@/src/lib/models/types";
import useTasksFilters from "@/src/components/Views/TaskView/hooks/useTasksFilters";
import { TaskComment } from "@/app/page";
import { 
  useSoftDeleteTaskMutation, 
  useRestoreTaskMutation, 
  usePermanentlyDeleteTaskMutation 
} from "@/src/lib/store/api/tasksApi";
import LoadingScreen from "../../LoadingScreen";

// Ленивая загрузка компонентов БЕЗ memo внутри dynamic
const TaskDetailsDialog = dynamic(
  () => import("@/src/components/Dialogs/TaskDetailsDialog/TaskDetailsDialog"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }
);

const TasksSearchHeader = dynamic(
  () => import("./TasksSearchHeader"),
  { ssr: false }
);

const TasksFilterTabs = dynamic(
  () => import("./TasksFilterTabs"),
  { ssr: false }
);

const VirtualizedTasksList = dynamic(
  () => import("./VirtualizedTasksList"),
  {
    ssr: false,
    loading: () => <LoadingScreen variant="minimal" message="Загрузка задач..." />
  }
);

interface TasksViewProps {
  tasks: DatabaseTask[];
  users: DatabaseUser[];
  currentUser: DatabaseUser;
  businessProcesses: DatabaseBusinessProcess[];
  onUpdateTask: (task: DatabaseTask) => void;
  onCreateTask: (
    task: Omit<DatabaseTask, "id" | "created_at" | "updated_at" | "comments">
  ) => void;
  onDeleteTask: (taskId: string) => void;
  onAddComment: (taskId: string, comment: Omit<TaskComment, "id" | "timestamp">) => Promise<void>;
  onUpdateComment: (taskId: string, commentId: string, text: string) => Promise<void>;
  onDeleteComment: (taskId: string, commentId: string) => void;
  onSendReminder: (taskId: string, minutes?: number) => void;
}

function TasksViewComponent({
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
  // ВСЕ хуки должны быть вызваны до любых условных возвратов
  const [selectedTask, setSelectedTask] = useState<DatabaseTask | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // RTK Query mutations для работы с корзиной
  const [softDeleteTask] = useSoftDeleteTaskMutation();
  const [restoreTask] = useRestoreTaskMutation();
  const [permanentlyDeleteTask] = usePermanentlyDeleteTaskMutation();

  // Используем хук для управления фильтрами
  const {
    filteredTasks,
    filterTabs,
    activeFilter,
    setActiveFilter,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    assigneeFilter,
    setAssigneeFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    groupBy,
    setGroupBy,
    viewMode,
    setViewMode,
    showTrash,
    setShowTrash,
    selectedTags,
    setSelectedTags,
    availableTags,
    tagFilterMode,
    setTagFilterMode,
  } = useTasksFilters({
    tasks,
    currentUser,
  });

  // Мемоизированные обработчики
  const handleSoftDelete = useCallback(async (taskId: string) => {
    try {
      await softDeleteTask(taskId).unwrap();
      console.log("Task moved to trash:", taskId);
    } catch (error) {
      console.error("Error moving task to trash:", error);
      alert("Ошибка при перемещении в корзину");
    }
  }, [softDeleteTask]);

  const handleRestore = useCallback(async (taskId: string) => {
    try {
      await restoreTask(taskId).unwrap();
      console.log("Task restored from trash:", taskId);
    } catch (error) {
      console.error("Error restoring task:", error);
      alert("Ошибка при восстановлении задачи");
    }
  }, [restoreTask]);

  const handlePermanentDelete = useCallback(async (taskId: string) => {
    try {
      await permanentlyDeleteTask(taskId).unwrap();
      console.log("Task permanently deleted:", taskId);
      
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(null);
      }
    } catch (error) {
      console.error("Error permanently deleting task:", error);
      alert("Ошибка при окончательном удалении");
    }
  }, [permanentlyDeleteTask, selectedTask]);

  const handleTaskClick = useCallback((task: DatabaseTask) => {
    setSelectedTask(task);
  }, []);

  const handleCloseDialog = useCallback((open: boolean) => {
    if (!open) {
      setSelectedTask(null);
    }
  }, []);

  const getFullTaskForDialog = useCallback((taskId: string): DatabaseTask | null => {
    return tasks.find((task) => task.id === taskId) || null;
  }, [tasks]);

  // Мемоизированные пропсы
  const searchHeaderProps = useMemo(() => ({
    searchQuery,
    onSearchChange: setSearchQuery,
    viewMode,
    onViewModeChange: setViewMode,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    sortBy,
    groupBy,
    users,
    onStatusChange: setStatusFilter,
    onPriorityChange: setPriorityFilter,
    onAssigneeChange: setAssigneeFilter,
    onSortChange: setSortBy,
    onGroupByChange: setGroupBy,
    isFilterOpen,
    onFilterOpenChange: setIsFilterOpen,
    showTrash,
    onShowTrashChange: setShowTrash,
    currentUser,
    selectedTags,
    onSelectedTagsChange: setSelectedTags,
    availableTags,
    tagFilterMode,
    onTagFilterModeChange: setTagFilterMode,
  }), [
    searchQuery, setSearchQuery, viewMode, setViewMode,
    statusFilter, priorityFilter, assigneeFilter, sortBy, groupBy,
    users, setStatusFilter, setPriorityFilter, setAssigneeFilter, setSortBy, setGroupBy,
    isFilterOpen, setIsFilterOpen, showTrash, setShowTrash, currentUser,
    selectedTags, setSelectedTags, availableTags, tagFilterMode, setTagFilterMode
  ]);

  const listContentProps = useMemo(() => ({
    tasks: filteredTasks,
    users,
    currentUser,
    businessProcesses,
    groupBy,
    onTaskClick: handleTaskClick,
    onUpdateTask: onUpdateTask,
    onDeleteTask: onDeleteTask,
    onSoftDelete: handleSoftDelete,
    onRestore: handleRestore,
    onPermanentDelete: handlePermanentDelete,
    onSendReminder: onSendReminder,
    height: 600,
    overscanCount: 5,
  }), [
    filteredTasks, users, currentUser, businessProcesses, groupBy,
    handleTaskClick, onUpdateTask, onDeleteTask,
    handleSoftDelete, handleRestore, handlePermanentDelete, onSendReminder
  ]);

  const selectedFullTask = useMemo(() => {
    return selectedTask ? (getFullTaskForDialog(selectedTask.id) || selectedTask) : null;
  }, [selectedTask, getFullTaskForDialog]);

  return (
    <div className="space-y-4 h-full flex flex-col">
      <TasksSearchHeader {...searchHeaderProps} />
      
      <TasksFilterTabs
        tabs={filterTabs}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <VirtualizedTasksList {...listContentProps} />

      {selectedFullTask && (
        <TaskDetailsDialog
          task={selectedFullTask}
          open={!!selectedTask}
          onOpenChange={handleCloseDialog}
          users={users}
          currentUser={currentUser}
          businessProcesses={businessProcesses}
        />
      )}
    </div>
  );
}

// Мемоизируем компонент отдельно от dynamic
const TasksView = memo(TasksViewComponent);
TasksView.displayName = 'TasksView';

export default TasksView;