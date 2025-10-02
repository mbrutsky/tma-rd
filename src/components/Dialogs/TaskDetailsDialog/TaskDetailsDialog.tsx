"use client";

import { useEffect, useState, useCallback, useMemo, memo, useRef } from "react";
import {
  Play,
  Pause,
  CheckCircle,
  RotateCcw,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  DatabaseTask,
  DatabaseUser,
  DatabaseBusinessProcess,
  TaskPriority,
  UserRole,
  TaskStatus,
} from "@/src/lib/models/types";
import {
  useGetTaskQuery,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useAddCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useAddChecklistItemMutation,
  useUpdateChecklistItemMutation,
  useDeleteChecklistItemMutation,
} from "@/src/lib/store/api/tasksApi";
import { Dialog, DialogContent, DialogHeader } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Button } from "../../ui/button";
import { Alert, AlertDescription } from "../../ui/alert";

// Ленивая загрузка блоков
const TaskDescriptionSection = dynamic(
  () => import("./TaskDescriptionSection"),
  { ssr: false }
);
const TaskDetailsSection = dynamic(() => import("./TaskDetailsSection"), {
  ssr: false,
});
const TaskChecklistSection = dynamic(() => import("./TaskChecklistSection"), {
  ssr: false,
});
const TaskCommentsSection = dynamic(() => import("./TaskCommentsSection"), {
  ssr: false,
});
const TaskHistorySection = dynamic(() => import("./TaskHistorySection"), {
  ssr: false,
});
const TaskAdditionalSection = dynamic(() => import("./TaskAdditionalSection"), {
  ssr: false,
});

interface TaskDetailsDialogProps {
  task: DatabaseTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: DatabaseUser[];
  currentUser: DatabaseUser;
  businessProcesses: DatabaseBusinessProcess[];
}

const TaskDetailsDialog = memo(function TaskDetailsDialog({
  task,
  open,
  onOpenChange,
  users,
  currentUser,
  businessProcesses,
}: TaskDetailsDialogProps) {
  // Локальный state
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(
    task.description || ""
  );
  const [editedDueDate, setEditedDueDate] = useState<Date>(
    new Date(task.due_date)
  );
  const [editedPriority, setEditedPriority] = useState<TaskPriority>(
    task.priority
  );
  const [editedTags, setEditedTags] = useState<string[]>(task.tags || []);
  const [editedProcessId, setEditedProcessId] = useState<string>(
    task.process_id || ""
  );
  const [editedCreatorId, setEditedCreatorId] = useState<string>(
    task.creator_id || ""
  );
  const [editedAssigneeIds, setEditedAssigneeIds] = useState<string[]>(
    task.assignees?.map((a) => a.id) || []
  );
  const [editedObserverIds, setEditedObserverIds] = useState<string[]>(
    task.observers?.map((o) => o.id) || []
  );
  const [pendingDescriptionUpdate, setPendingDescriptionUpdate] = useState<
    string | null
  >(null);
  const [editedEstimatedDays, setEditedEstimatedDays] = useState<number>(
    task.estimated_days || 0
  );
  const [editedEstimatedHours, setEditedEstimatedHours] = useState<number>(
    task.estimated_hours || 0
  );
  const [editedEstimatedMinutes, setEditedEstimatedMinutes] = useState<number>(
    task.estimated_minutes || 0
  );

  const [isAdditionalOpen, setIsAdditionalOpen] = useState<boolean>(false);
  const [titleEditMode, setTitleEditMode] = useState(false);

  // Детект смартфона
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => {
      const ua = navigator.userAgent || "";
      const mobileUA =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          ua
        );
      setIsMobile(mobileUA || window.matchMedia("(max-width: 768px)").matches);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Данные задачи
  const { data: detailedTask, isLoading } = useGetTaskQuery(task.id, {
    skip: !open,
  });
  const currentTask = useMemo(() => detailedTask || task, [detailedTask, task]);

  const isTaskDeleted = Boolean(currentTask?.is_deleted);

  // Для снятия фокуса на мобильных
  const titleRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (!open) return;
    if (isMobile && titleEditMode) {
      setTimeout(() => titleRef.current?.blur(), 100);
    }
  }, [open, isMobile, titleEditMode]);

  // Комментарии/чек-лист
  const comments = detailedTask?.comments || [];
  const checklist = detailedTask?.checklist || [];
  const commentsLoading = isLoading;
  const checklistLoading = isLoading;

  // Mutations
  const [updateTask] = useUpdateTaskMutation();
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [addCommentMutation] = useAddCommentMutation();
  const [updateCommentMutation] = useUpdateCommentMutation();
  const [deleteCommentMutation] = useDeleteCommentMutation();
  const [addChecklistItemMutation, { isLoading: isAddingChecklistItem }] =
    useAddChecklistItemMutation();
  const [updateChecklistItemMutation] = useUpdateChecklistItemMutation();
  const [deleteChecklistItemMutation] = useDeleteChecklistItemMutation();

  // Права - ВСЕ ЗАПРЕЩЕНО если задача удалена
  const permissions = useMemo(() => {
    if (isTaskDeleted) {
      return {
        canChangeStatus: false,
        canCompleteTask: false,
        canComment: false,
        canEdit: false,
        canEditChecklist: false,
      };
    }

    const isAssignee = currentTask.assignees?.some(
      (a) => a.id === currentUser.id
    );
    const isManagerOrDirector =
      currentUser.role === UserRole.DIRECTOR ||
      currentUser.role === UserRole.DEPARTMENT_HEAD;
    const isCreator = currentTask.creator_id === currentUser.id;
    const isObserver = currentTask.observers?.some(
      (o) => o.id === currentUser.id
    );

    return {
      canChangeStatus: isAssignee || isManagerOrDirector || isCreator,
      canCompleteTask: isAssignee || isManagerOrDirector,
      canComment: isManagerOrDirector || isAssignee || isCreator || isObserver,
      canEdit: isCreator || currentUser.role === UserRole.DIRECTOR,
      canEditChecklist:
        isAssignee || isCreator || currentUser.role === UserRole.DIRECTOR,
    };
  }, [currentTask, currentUser, isTaskDeleted]);

  // Helpers
  const getUserById = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users]
  );
  const getProcessById = useCallback(
    (id: string) => businessProcesses.find((p) => p.id === id),
    [businessProcesses]
  );

  const uiData = useMemo(() => {
    const creator = getUserById(editedCreatorId);
    const assignees = (editedAssigneeIds || [])
      .map((id) => getUserById(id))
      .filter((u): u is DatabaseUser => Boolean(u));
    const observers = (editedObserverIds || [])
      .map((id) => getUserById(id))
      .filter((u): u is DatabaseUser => Boolean(u));
    const process = getProcessById(editedProcessId);
    const isOverdue =
      currentTask.status !== TaskStatus.COMPLETED &&
      new Date() > new Date(currentTask.due_date);

    return { creator, assignees, observers, process, isOverdue };
  }, [
    editedCreatorId,
    editedAssigneeIds,
    editedObserverIds,
    editedProcessId,
    currentTask.status,
    currentTask.due_date,
    getUserById,
    getProcessById,
  ]);

  const statusHelpers = useMemo(
    () => ({
      getStatusIcon: (status: TaskStatus | "overdue") => {
        switch (status) {
          case TaskStatus.NEW:
            return <Clock className="h-4 w-4" />;
          case TaskStatus.ACKNOWLEDGED:
            return <CheckCircle className="h-4 w-4" />;
          case TaskStatus.IN_PROGRESS:
            return <Play className="h-4 w-4" />;
          case TaskStatus.PAUSED:
            return <Pause className="h-4 w-4" />;
          case TaskStatus.WAITING_CONTROL:
          case TaskStatus.ON_CONTROL:
            return <AlertCircle className="h-4 w-4" />;
          case TaskStatus.COMPLETED:
            return <CheckCircle className="h-4 w-4" />;
          case "overdue":
            return <AlertCircle className="h-4 w-4" />;
          default:
            return <Clock className="h-4 w-4" />;
        }
      },
      getStatusColor: (status: TaskStatus | "overdue") => {
        switch (status) {
          case TaskStatus.NEW:
            return "bg-blue-100 text-blue-800";
          case TaskStatus.ACKNOWLEDGED:
            return "bg-emerald-100 text-emerald-800";
          case TaskStatus.IN_PROGRESS:
            return "bg-yellow-100 text-yellow-800";
          case TaskStatus.PAUSED:
            return "bg-gray-100 text-gray-800";
          case TaskStatus.WAITING_CONTROL:
            return "bg-purple-100 text-purple-800";
          case TaskStatus.ON_CONTROL:
            return "bg-indigo-100 text-indigo-800";
          case TaskStatus.COMPLETED:
            return "bg-green-100 text-green-800";
          case "overdue":
            return "bg-red-100 text-red-800";
          default:
            return "bg-gray-100 text-gray-800";
        }
      },
      getStatusText: (status: TaskStatus | "overdue") => {
        switch (status) {
          case TaskStatus.NEW:
            return "Новая";
          case TaskStatus.ACKNOWLEDGED:
            return "Ознакомлен";
          case TaskStatus.IN_PROGRESS:
            return "В работе";
          case TaskStatus.PAUSED:
            return "Приостановлена";
          case TaskStatus.WAITING_CONTROL:
            return "Ждет контроль";
          case TaskStatus.ON_CONTROL:
            return "На контроле";
          case TaskStatus.COMPLETED:
            return "Завершена";
          case "overdue":
            return "Просрочена";
          default:
            return "Неизвестно";
        }
      },
    }),
    []
  );

  // SAVE - блокируем если задача удалена
  const handleSaveTaskEdit = useCallback(
    async (forcedDescription?: string) => {
      if (isTaskDeleted) {
        console.warn("Cannot save: task is in trash");
        return;
      }

      const normalizedProcessId =
        editedProcessId.trim() === "" ? undefined : editedProcessId;
      const descriptionToSave =
        forcedDescription !== undefined ? forcedDescription : editedDescription;

      try {
        await updateTask({
          id: currentTask.id,
          updates: {
            title: editedTitle,
            description: descriptionToSave,
            priority: editedPriority,
            processId: normalizedProcessId,
            dueDate: editedDueDate.toISOString(),
            tags: editedTags,
            assigneeIds: editedAssigneeIds,
            observerIds: editedObserverIds,
            estimatedDays: editedEstimatedDays,
            estimatedHours: editedEstimatedHours,
            estimatedMinutes: editedEstimatedMinutes,
          },
        }).unwrap();
        setPendingDescriptionUpdate(null);
      } catch (error) {
        console.error("Error saving task:", error);
      }
    },
    [
      isTaskDeleted,
      updateTask,
      currentTask.id,
      editedTitle,
      editedDescription,
      editedPriority,
      editedProcessId,
      editedDueDate,
      editedTags,
      editedAssigneeIds,
      editedObserverIds,
      editedEstimatedDays,
      editedEstimatedHours,
      editedEstimatedMinutes,
    ]
  );

  // Обработчики - все блокируются если задача удалена
  const handleDescriptionChange = useCallback(
    (newDescription: string) => {
      if (isTaskDeleted) return;
      setEditedDescription(newDescription);
      setPendingDescriptionUpdate(newDescription);
    },
    [isTaskDeleted]
  );

  const handleDescriptionBlur = useCallback(() => {
    if (isTaskDeleted) return;
    const descriptionToSave = pendingDescriptionUpdate || editedDescription;
    if (descriptionToSave !== currentTask.description) {
      handleSaveTaskEdit(descriptionToSave);
    }
    setPendingDescriptionUpdate(null);
  }, [
    isTaskDeleted,
    pendingDescriptionUpdate,
    editedDescription,
    currentTask.description,
    handleSaveTaskEdit,
  ]);

  const handleDurationChange = useCallback(
    (days: number, hours: number, minutes: number) => {
      if (isTaskDeleted) return;

      setEditedEstimatedDays(days);
      setEditedEstimatedHours(hours);
      setEditedEstimatedMinutes(minutes);

      // Создаем отдельную функцию сохранения с новыми значениями
      const saveDuration = async () => {
        try {
          await updateTask({
            id: currentTask.id,
            updates: {
              estimatedDays: days,
              estimatedHours: hours,
              estimatedMinutes: minutes,
            },
          }).unwrap();
        } catch (error) {
          console.error("Error saving duration:", error);
        }
      };

      // Debounce сохранение
      setTimeout(() => saveDuration(), 300);
    },
    [isTaskDeleted, updateTask, currentTask.id]
  );

  const handleTagsChange = useCallback(
    (newTags: string[]) => {
      if (isTaskDeleted) return;
      setEditedTags(newTags);
      setTimeout(() => {
        if (
          JSON.stringify(newTags) !== JSON.stringify(currentTask.tags || [])
        ) {
          handleSaveTaskEdit();
        }
      }, 300);
    },
    [isTaskDeleted, currentTask.tags, handleSaveTaskEdit]
  );

  const handleStatusChange = useCallback(
    async (newStatus: TaskStatus) => {
      if (isTaskDeleted) return;
      try {
        // Для директора при переходе из NEW сразу в IN_PROGRESS
        if (
          currentTask.status === TaskStatus.NEW &&
          newStatus === TaskStatus.IN_PROGRESS &&
          currentUser.role === UserRole.DIRECTOR
        ) {
          await addCommentMutation({
            taskId: currentTask.id,
            text: "Начал выполнение задачи",
            isResult: false,
          }).unwrap();
        }
        // Для остальных - стандартный комментарий при ознакомлении
        else if (
          currentTask.status === TaskStatus.NEW &&
          newStatus === TaskStatus.ACKNOWLEDGED
        ) {
          await addCommentMutation({
            taskId: currentTask.id,
            text: "Ознакомлен и согласен выполнять",
            isResult: false,
          }).unwrap();
        }
        
        await updateTaskStatus({
          id: currentTask.id,
          status: newStatus,
          actualHours:
            newStatus === TaskStatus.COMPLETED
              ? currentTask.actual_hours
              : undefined,
        }).unwrap();
      } catch (error) {
        console.error("Error changing status:", error);
      }
    },
    [isTaskDeleted, currentTask, currentUser, addCommentMutation, updateTaskStatus]
  );

  // Чек-лист - все блокируется если задача удалена
  const checklistHandlers = useMemo(
    () => ({
      handleAddChecklistItem: async (text: string) => {
        if (isTaskDeleted) return;
        try {
          await addChecklistItemMutation({
            taskId: currentTask.id,
            text: text.trim(),
            level: 0,
          }).unwrap();
        } catch (error) {
          console.error("Error adding checklist item:", error);
        }
      },
      handleToggleChecklistItem: async (itemId: string) => {
        if (isTaskDeleted) return;
        try {
          const item = checklist.find((i) => i.id === itemId);
          if (!item) return;
          await updateChecklistItemMutation({
            taskId: currentTask.id,
            itemId,
            completed: !item.completed,
          }).unwrap();
        } catch (error) {
          console.error("Error toggling checklist item:", error);
        }
      },
      handleEditChecklistItem: async (itemId: string, text: string) => {
        if (isTaskDeleted) return;
        try {
          await updateChecklistItemMutation({
            taskId: currentTask.id,
            itemId,
            text: text.trim(),
          }).unwrap();
        } catch (error) {
          console.error("Error editing checklist item:", error);
        }
      },
      handleDeleteChecklistItem: async (itemId: string) => {
        if (isTaskDeleted) return;
        try {
          await deleteChecklistItemMutation({
            taskId: currentTask.id,
            itemId,
          }).unwrap();
        } catch (error) {
          console.error("Error deleting checklist item:", error);
        }
      },
    }),
    [
      isTaskDeleted,
      currentTask.id,
      checklist,
      addChecklistItemMutation,
      updateChecklistItemMutation,
      deleteChecklistItemMutation,
    ]
  );

  // Комментарии - все блокируется если задача удалена
  const commentHandlers = useMemo(
    () => ({
      handleAddComment: async (text: string, isResult: boolean) => {
        if (isTaskDeleted) return;
        try {
          await addCommentMutation({
            taskId: currentTask.id,
            text: text.trim(),
            isResult,
          }).unwrap();
        } catch (error) {
          console.error("Error adding comment:", error);
        }
      },
      handleEditComment: async (commentId: string, text: string) => {
        if (isTaskDeleted) return;
        try {
          await updateCommentMutation({
            taskId: currentTask.id,
            commentId,
            text: text.trim(),
          }).unwrap();
        } catch (error) {
          console.error("Error editing comment:", error);
        }
      },
      handleDeleteComment: async (commentId: string) => {
        if (isTaskDeleted) return;
        try {
          await deleteCommentMutation({
            taskId: currentTask.id,
            commentId,
          }).unwrap();
        } catch (error) {
          console.error("Error deleting comment:", error);
        }
      },
    }),
    [
      isTaskDeleted,
      currentTask.id,
      addCommentMutation,
      updateCommentMutation,
      deleteCommentMutation,
    ]
  );

  // Поля - все блокируется если задача удалена
  const fieldHandlers = useMemo(
    () => ({
      handleAddAssignee: (userId: string) => {
        if (isTaskDeleted) return;
        if (!editedAssigneeIds.includes(userId)) {
          setEditedAssigneeIds([...editedAssigneeIds, userId]);
          setTimeout(() => handleSaveTaskEdit(), 100);
        }
      },
      handleRemoveAssignee: (userId: string) => {
        if (isTaskDeleted) return;
        setEditedAssigneeIds(editedAssigneeIds.filter((id) => id !== userId));
        setTimeout(() => handleSaveTaskEdit(), 100);
      },
      handleAddObserver: (userId: string) => {
        if (isTaskDeleted) return;
        if (!editedObserverIds.includes(userId)) {
          setEditedObserverIds([...editedObserverIds, userId]);
          setTimeout(() => handleSaveTaskEdit(), 100);
        }
      },
      handleRemoveObserver: (userId: string) => {
        if (isTaskDeleted) return;
        setEditedObserverIds(editedObserverIds.filter((id) => id !== userId));
        setTimeout(() => handleSaveTaskEdit(), 100);
      },
      handleChangeCreator: (userId: string) => {
        if (isTaskDeleted) return;
        setEditedCreatorId(userId);
        setTimeout(() => handleSaveTaskEdit(), 100);
      },
    }),
    [isTaskDeleted, editedAssigneeIds, editedObserverIds, handleSaveTaskEdit]
  );

  // Синхронизация при смене текущей задачи
  useEffect(() => {
    if (!currentTask) return;
    setEditedTitle(currentTask.title);
    setEditedDescription(currentTask.description || "");
    setEditedDueDate(new Date(currentTask.due_date));
    setEditedPriority(currentTask.priority);
    setEditedTags(currentTask.tags || []);
    setEditedProcessId(currentTask.process_id || "");
    setEditedCreatorId(currentTask.creator_id || "");
    setEditedAssigneeIds(currentTask.assignees?.map((a) => a.id) || []);
    setEditedObserverIds(currentTask.observers?.map((o) => o.id) || []);
    setEditedEstimatedDays(currentTask.estimated_days || 0);
    setEditedEstimatedHours(currentTask.estimated_hours || 0);
    setEditedEstimatedMinutes(currentTask.estimated_minutes || 0);
  }, [currentTask]);

  // Пропсы секций
  const descriptionProps = useMemo(
    () => ({
      description: editedDescription,
      status: currentTask.status,
      isOverdue: uiData.isOverdue,
      onDescriptionChange: handleDescriptionChange,
      onDescriptionBlur: handleDescriptionBlur,
      getStatusIcon: statusHelpers.getStatusIcon,
      getStatusColor: statusHelpers.getStatusColor,
      getStatusText: statusHelpers.getStatusText,
      canEdit: permissions.canEdit && !isTaskDeleted,
      currentUser,
      task: currentTask,
    }),
    [
      editedDescription,
      currentTask,
      uiData.isOverdue,
      handleDescriptionChange,
      handleDescriptionBlur,
      statusHelpers,
      permissions.canEdit,
      currentUser,
      isTaskDeleted,
    ]
  );

  const checklistProps = useMemo(
    () => ({
      checklist,
      canEditChecklist: permissions.canEditChecklist && !isTaskDeleted,
      isLoading: checklistLoading,
      isAddingItem: isAddingChecklistItem,
      onToggleItem: checklistHandlers.handleToggleChecklistItem,
      onAddItem: checklistHandlers.handleAddChecklistItem,
      onEditItem: checklistHandlers.handleEditChecklistItem,
      onDeleteItem: checklistHandlers.handleDeleteChecklistItem,
      getUserById,
      taskId: currentTask.id,
    }),
    [
      checklist,
      permissions.canEditChecklist,
      checklistLoading,
      isAddingChecklistItem,
      checklistHandlers,
      getUserById,
      currentTask.id,
      isTaskDeleted,
    ]
  );

  const detailsProps = useMemo(
    () => ({
      creatorId: editedCreatorId,
      creator: uiData.creator,
      onCreatorChange: fieldHandlers.handleChangeCreator,
      assigneeIds: editedAssigneeIds,
      assignees: uiData.assignees,
      onAddAssignee: fieldHandlers.handleAddAssignee,
      onRemoveAssignee: fieldHandlers.handleRemoveAssignee,
      dueDate: editedDueDate,
      onDueDateChange: (date: Date) => !isTaskDeleted && setEditedDueDate(date),
      priority: editedPriority,
      onPriorityChange: (p: TaskPriority) =>
        !isTaskDeleted && setEditedPriority(p),
      observerIds: editedObserverIds,
      observers: uiData.observers,
      onAddObserver: fieldHandlers.handleAddObserver,
      onRemoveObserver: fieldHandlers.handleRemoveObserver,
      processId: editedProcessId,
      process: uiData.process,
      onProcessChange: (pid: string) =>
        !isTaskDeleted && setEditedProcessId(pid),
      tags: editedTags,
      onTagsChange: handleTagsChange,
      onTagsBlur: () => {},
      users,
      businessProcesses,
      canEdit: permissions.canEdit && !isTaskDeleted,
    }),
    [
      editedCreatorId,
      uiData,
      fieldHandlers,
      editedAssigneeIds,
      editedDueDate,
      editedPriority,
      editedObserverIds,
      editedProcessId,
      editedTags,
      handleTagsChange,
      users,
      businessProcesses,
      permissions.canEdit,
      isTaskDeleted,
    ]
  );

  const commentsProps = useMemo(
    () => ({
      comments,
      isLoading: commentsLoading,
      canComment: Boolean(permissions.canComment && !isTaskDeleted),
      currentUser,
      onAddComment: commentHandlers.handleAddComment,
      onEditComment: commentHandlers.handleEditComment,
      onDeleteComment: commentHandlers.handleDeleteComment,
      getUserById,
      isTaskDeleted,
    }),
    [
      comments,
      commentsLoading,
      permissions.canComment,
      currentUser,
      commentHandlers,
      getUserById,
      isTaskDeleted,
    ]
  );

  // Кнопки действий - ВСЕ ОТКЛЮЧЕНЫ если задача удалена
  // НОВАЯ ЛОГИКА ДЛЯ ДИРЕКТОРА
  const availableActions = useMemo(() => {
    if (isTaskDeleted || !permissions.canChangeStatus) return [];

    const actions: Array<{
      label: string;
      icon: React.ReactNode;
      action: () => void;
      variant: "default" | "outline";
    }> = [];

    switch (currentTask.status) {
      case TaskStatus.NEW:
        if (currentTask.assignees?.some((a) => a.id === currentUser.id)) {
          // Директор (если он исполнитель) сразу может начать выполнение
          if (currentUser.role === UserRole.DIRECTOR) {
            actions.push({
              label: "Начать выполнение",
              icon: <Play className="h-4 w-4" />,
              action: () => handleStatusChange(TaskStatus.IN_PROGRESS),
              variant: "default",
            });
          } else {
            // Для остальных - сначала нужно ознакомиться
            actions.push({
              label: "Ознакомлен и согласен выполнять",
              icon: <CheckCircle className="h-4 w-4" />,
              action: () => handleStatusChange(TaskStatus.ACKNOWLEDGED),
              variant: "default",
            });
          }
        }
        break;
      case TaskStatus.ACKNOWLEDGED:
        actions.push({
          label: "Начать выполнение",
          icon: <Play className="h-4 w-4" />,
          action: () => handleStatusChange(TaskStatus.IN_PROGRESS),
          variant: "default",
        });
        break;
      case TaskStatus.IN_PROGRESS:
        actions.push({
          label: "Приостановить",
          icon: <Pause className="h-4 w-4" />,
          action: () => handleStatusChange(TaskStatus.PAUSED),
          variant: "outline",
        });
        if (permissions.canCompleteTask) {
          actions.push({
            label: "Завершить",
            icon: <CheckCircle className="h-4 w-4" />,
            action: () => handleStatusChange(TaskStatus.COMPLETED),
            variant: "default",
          });
        }
        break;
      case TaskStatus.PAUSED:
        actions.push({
          label: "Продолжить",
          icon: <Play className="h-4 w-4" />,
          action: () => handleStatusChange(TaskStatus.IN_PROGRESS),
          variant: "default",
        });
        break;
      case TaskStatus.COMPLETED:
        if (
          currentTask.creator_id === currentUser.id ||
          currentUser.role === UserRole.DIRECTOR
        ) {
          actions.push({
            label: "Вернуть в работу",
            icon: <RotateCcw className="h-4 w-4" />,
            action: () => handleStatusChange(TaskStatus.IN_PROGRESS),
            variant: "outline",
          });
        }
        break;
    }

    return actions;
  }, [
    isTaskDeleted,
    permissions.canChangeStatus,
    permissions.canCompleteTask,
    currentTask,
    currentUser,
    handleStatusChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl w-full h-[100svh] sm:h-[85vh] flex flex-col m-0 sm:m-4 rounded-none sm:rounded-lg max-[580px]:p-2 max-[580px]:w-screen max-[580px]:max-w-none">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 flex items-center gap-2 pr-10 pt-1">
              {isTaskDeleted ? (
                <h2 className="text-lg font-semibold text">{editedTitle}</h2>
              ) : (
                <>
                  <Input
                    ref={titleRef}
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={() => handleSaveTaskEdit()}
                    onFocus={() => setTitleEditMode(true)}
                    className="text-lg font-semibold border-none shadow-none p-0 h-auto bg-transparent focus:bg-white focus:border focus:shadow-sm"
                    style={{
                      width: `min(${Math.max(
                        editedTitle.length + 2,
                        10
                      )}ch, 90%)`,
                      minWidth: "10ch",
                      maxWidth: "90%",
                    }}
                    disabled={false}
                    autoFocus={!isMobile && !isTaskDeleted}
                  />
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Предупреждение о корзине */}
        {isTaskDeleted && (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Задача находится в корзине. Все действия заблокированы. Для
              редактирования восстановите задачу.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger className="select-none" value="details">
              Детали
            </TabsTrigger>
            <TabsTrigger className="select-none" value="comments">
              Комментарии ({comments.length})
            </TabsTrigger>
            <TabsTrigger className="select-none" value="history">
              История ({(currentTask.history || []).length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 overflow-hidden">
            <TabsContent value="details" className="h-full flex-col">
              <div className="space-y-4 p-1 flex flex-col h-full overflow-y-auto pb-8">
                <TaskDescriptionSection {...descriptionProps} />
                <TaskChecklistSection {...checklistProps} />
                <TaskDetailsSection {...detailsProps} />

                {/* Кнопки действий - все отключены если задача удалена */}
                {!isTaskDeleted && (
                  <div className="flex gap-2 flex-wrap">
                    {availableActions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant}
                        size="default"
                        onClick={action.action}
                        className="flex items-center gap-1 h-10"
                      >
                        {action.icon}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}

                <TaskAdditionalSection
                  processId={editedProcessId}
                  process={uiData.process}
                  onProcessChange={(pid: string) =>
                    !isTaskDeleted && setEditedProcessId(pid)
                  }
                  estimatedDays={editedEstimatedDays}
                  estimatedHours={editedEstimatedHours}
                  estimatedMinutes={editedEstimatedMinutes}
                  onDurationChange={handleDurationChange}
                  tags={editedTags}
                  onTagsChange={handleTagsChange}
                  onTagsBlur={() => {}}
                  businessProcesses={businessProcesses}
                  isAdditionalOpen={isAdditionalOpen}
                  setIsAdditionalOpen={setIsAdditionalOpen}
                  canEdit={permissions.canEdit && !isTaskDeleted}
                  createdAt={currentTask.created_at}
                  updatedAt={currentTask.updated_at}
                  deletedAt={currentTask.deleted_at}
                  currentUser={currentUser}
                  taskCreatorId={currentTask.creator_id}
                  taskAssigneeIds={
                    currentTask.assignees?.map((a) => a.id) || []
                  }
                  readOnlyOverlay={isTaskDeleted}
                />
              </div>
            </TabsContent>

            <TabsContent value="comments" className="h-full flex-col">
              <TaskCommentsSection {...commentsProps} />
            </TabsContent>

            <TabsContent value="history" className="h-full">
              <TaskHistorySection
                history={currentTask.history || []}
                getUserById={getUserById}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
});

TaskDetailsDialog.displayName = "TaskDetailsDialog";
export default TaskDetailsDialog;