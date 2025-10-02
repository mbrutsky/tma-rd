// src/components/Views/TaskView/TaskCard/TaskCard.tsx
"use client";

import { useRef, useMemo, useCallback, memo } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/src/components/ui/sheet";
import {
  MoreVertical,
  Hourglass,
  Repeat,
  Trash2,
  Link as LinkIcon,
  Copy,
  Bell,
  RotateCcw,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  DatabaseTask,
  DatabaseUser,
  DatabaseBusinessProcess,
  DatabaseHistoryEntry,
  HistoryActionType,
  TaskStatus,
  UserRole,
} from "@/src/lib/models/types";
import { useTaskCardLogic } from "./hooks/useTaskCardLogic";
import TaskCardAssignee from "./TaskCardAssignee";
import TaskCardFooter from "./TaskCardFooter";
import TaskCardStatus from "./TaskCardStatus";

interface TaskCardProps {
  task: DatabaseTask;
  users: DatabaseUser[];
  currentUser: DatabaseUser;
  businessProcesses: DatabaseBusinessProcess[];
  onClick: () => void;
  onUpdate: (
    task: DatabaseTask,
    historyAction?: Omit<DatabaseHistoryEntry, "id" | "timestamp">
  ) => void;
  onSoftDelete: (taskId: string) => void;
  onRestore: (taskId: string) => void;
  onPermanentDelete: (taskId: string) => void;
  onSendReminder: (taskId: string, minutes?: number) => void;
}

const TaskCard = memo(function TaskCard({
  task,
  users,
  currentUser,
  businessProcesses,
  onClick,
  onUpdate,
  onSoftDelete,
  onRestore,
  onPermanentDelete,
  onSendReminder,
}: TaskCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const {
    isMenuOpen,
    setIsMenuOpen,
    isReminderMenuOpen,
    setIsReminderMenuOpen,
    isAnimatingOverdue,
    suppressCardClicks,
    clicksSuppressed,
    // getCardHeight,   // высотой больше не управляем внутри карточки
    getStatusStrip,
  } = useTaskCardLogic({ task, onUpdate });

  const getUserById = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users]
  );

  const assignee = useMemo(() => {
    if (!task.assignees || task.assignees.length === 0) return null;
    const first = task.assignees[0];
    if (typeof first === "string") return getUserById(first);
    return first;
  }, [task.assignees, getUserById]);

  const deletedByUser = useMemo(
    () => (task.deleted_by ? getUserById(task.deleted_by) : null),
    [task.deleted_by, getUserById]
  );

  const handleCopyTask = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      // ! To-Do
      setIsMenuOpen(false);
      suppressCardClicks();
    },
    [setIsMenuOpen, suppressCardClicks]
  );

  const handleGetTaskLink = useCallback(
  (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const link = `https://t.me/robodirector_bot/delegator_controller?startapp=task__${task.id}`;
    
    // Проверяем, что мы в Telegram Mini App
    if (window.Telegram?.WebApp) {
      // Используем Telegram API для чтения из буфера обмена
      // После чего записываем нашу ссылку
      try {
        // Telegram WebApp API для копирования
        const textarea = document.createElement('textarea');
        textarea.value = link;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        
        textarea.select();
        textarea.setSelectionRange(0, 99999);
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
          // Показываем уведомление через Telegram API
          window.Telegram.WebApp.showAlert('Ссылка скопирована в буфер обмена');
          
          // Тактильная обратная связь
          if (window.Telegram.WebApp.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
          }
          
          // Отправляем кастомное событие
          const event = new CustomEvent("task-link-copied", { detail: { link } });
          window.dispatchEvent(event);
        }
      } catch (err) {
        console.error('Ошибка копирования:', err);
        window.Telegram.WebApp.showAlert('Не удалось скопировать ссылку');
      }
    } else {
      // Fallback для обычного браузера
      navigator.clipboard.writeText(link).then(() => {
        const event = new CustomEvent("task-link-copied", { detail: { link } });
        window.dispatchEvent(event);
      }).catch(err => {
        console.error('Ошибка копирования:', err);
      });
    }
    
    setIsMenuOpen(false);
    suppressCardClicks();
  },
  [task.id, setIsMenuOpen, suppressCardClicks]
);

  const handleReturnToWork = useCallback(() => {
    const historyAction: Omit<DatabaseHistoryEntry, "id" | "timestamp"> = {
      task_id: task.id,
      action_type: HistoryActionType.STATUS_CHANGED,
      user_id: currentUser.id,
      old_value: task.status,
      new_value: TaskStatus.IN_PROGRESS,
      description: "Задача возвращена в работу",
      created_at: new Date(),
    };
    onUpdate(
      {
        ...task,
        status: TaskStatus.IN_PROGRESS,
        completed_at: undefined,
        updated_at: new Date(),
      },
      historyAction
    );
    setIsMenuOpen(false);
    suppressCardClicks();
  }, [task, currentUser.id, onUpdate, setIsMenuOpen, suppressCardClicks]);

  const handleSoftDelete = useCallback(() => {
    if (confirm("Переместить задачу в корзину?")) onSoftDelete(task.id);
    setIsMenuOpen(false);
    suppressCardClicks();
  }, [onSoftDelete, task.id, setIsMenuOpen, suppressCardClicks]);

  const handleRestore = useCallback(() => {
    if (confirm("Восстановить задачу из корзины?")) onRestore(task.id);
    setIsMenuOpen(false);
    suppressCardClicks();
  }, [onRestore, task.id, setIsMenuOpen, suppressCardClicks]);

  const handlePermanentDelete = useCallback(() => {
    if (confirm("Удалить задачу навсегда? Это действие нельзя отменить!"))
      onPermanentDelete(task.id);
    setIsMenuOpen(false);
    suppressCardClicks();
  }, [onPermanentDelete, task.id, setIsMenuOpen, suppressCardClicks]);

  const handleMenuOpenChange = useCallback(
    (open: boolean) => {
      setIsMenuOpen(open);
      if (!open) suppressCardClicks();
    },
    [setIsMenuOpen, suppressCardClicks]
  );

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      if (isMenuOpen || isReminderMenuOpen || clicksSuppressed()) return;
      onClick();
    },
    [isMenuOpen, isReminderMenuOpen, clicksSuppressed, onClick]
  );

  const handleSendReminder = useCallback(
    (minutes: number) => {
      onSendReminder(task.id, minutes);
      setIsReminderMenuOpen(false);
      setIsMenuOpen(false);
    },
    [onSendReminder, task.id, setIsReminderMenuOpen, setIsMenuOpen]
  );

  const durationText = useMemo(() => {
    const days = task.estimated_days || 0;
    const hours = task.estimated_hours || 0;
    const minutes = task.estimated_minutes || 0;

    const parts: string[] = [];
    if (days > 0) parts.push(`${parseInt(String(days))}д`);
    if (hours > 0) parts.push(`${parseInt(String(hours))}ч`);
    if (minutes > 0) parts.push(`${parseInt(String(minutes))}м`);
    return parts.length ? parts.join(" ") : "Не указано";
  }, [task.estimated_days, task.estimated_hours, task.estimated_minutes]);

  // Мемоизированные данные для крайнего срока
  const dueDateData = useMemo(() => {
    if (!task.due_date) return null;

    const formattedDate = format(task.due_date, "d MMM, HH:mm", { locale: ru });

    let dateColor = "text-gray-600";
    let dateIcon = <Clock className="h-4 w-4 text-gray-400" />;

    if (task.is_overdue || isAnimatingOverdue) {
      dateColor = "text-red-600 font-medium";
      dateIcon = <AlertTriangle className="h-4 w-4 text-red-500" />;
    } else if (task.is_almost_overdue) {
      dateColor = "text-orange-600 font-medium";
      dateIcon = <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }

    return {
      formattedDate,
      dateColor,
      dateIcon,
    };
  }, [
    task.due_date,
    task.is_overdue,
    task.is_almost_overdue,
    isAnimatingOverdue,
  ]);

  const statusStripColor = useMemo(
    () =>
      task.is_deleted
        ? "bg-orange-500"
        : getStatusStrip(
            task.status,
            task.is_overdue || isAnimatingOverdue,
            task.is_almost_overdue
          ),
    [
      task.is_deleted,
      task.status,
      task.is_overdue,
      task.is_almost_overdue,
      isAnimatingOverdue,
      getStatusStrip,
    ]
  );

  const menuButtons = useMemo(() => {
    const canReturnToWork = () => {
      if (task.status !== TaskStatus.COMPLETED || task.is_deleted) return false;
      const isCreator = task.creator_id === currentUser.id;
      const isDirectorOrManager =
        currentUser.role === UserRole.DIRECTOR ||
        currentUser.role === UserRole.DEPARTMENT_HEAD;
      return isCreator || isDirectorOrManager;
    };

    const canManageTask = () => {
      // Администратор, директор и руководитель отдела могут управлять любыми задачами
      if (
        currentUser.role === UserRole.ADMIN ||
        currentUser.role === UserRole.DIRECTOR ||
        currentUser.role === UserRole.DEPARTMENT_HEAD
      ) {
        return true;
      }
      
      // Создатель задачи может управлять своей задачей
      if (task.creator_id === currentUser.id) {
        return true;
      }
      
      return false;
    };

    const buttons: React.ReactNode[] = [];

    buttons.push(
      <Button
        key="copy-link"
        variant="ghost"
        className="w-full justify-start h-12"
        onClick={handleGetTaskLink}
      >
        <LinkIcon className="h-5 w-5 mr-3" />
        Скопировать ссылку
      </Button>,
      // <Button
      //   key="copy-task"
      //   variant="ghost"
      //   className="w-full justify-start h-12"
      //   onClick={handleCopyTask}
      // >
      //   <Copy className="h-5 w-5 mr-3" />
      //   Копировать задачу
      // </Button>
    );

    // if (!task.is_deleted) {
    //   buttons.push(
    //     <Button
    //       key="reminder"
    //       variant="ghost"
    //       className="w-full justify-start h-12"
    //       onClick={() => handleSendReminder(15)}
    //     >
    //       <Bell className="h-5 w-5 mr-3" />
    //       Отправить напоминание
    //     </Button>
    //   );
    // }

    if (canReturnToWork()) {
      buttons.push(
        <Button
          key="return-work"
          variant="ghost"
          className="w-full justify-start h-12"
          onClick={handleReturnToWork}
        >
          <RotateCcw className="h-5 w-5 mr-3" />
          Вернуть в работу
        </Button>
      );
    }

    if (canManageTask()) {
      if (task.is_deleted) {
        buttons.push(
          <Button
            key="restore"
            variant="ghost"
            className="w-full justify-start h-12 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={handleRestore}
          >
            <RotateCcw className="h-5 w-5 mr-3" />
            Восстановить из корзины
          </Button>,
          <Button
            key="permanent-delete"
            variant="ghost"
            className="w-full justify-start h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handlePermanentDelete}
          >
            <Trash2 className="h-5 w-5 mr-3" />
            Удалить навсегда
          </Button>
        );
      } else {
        buttons.push(
          <Button
            key="soft-delete"
            variant="ghost"
            className="w-full justify-start h-12 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            onClick={handleSoftDelete}
          >
            <Trash2 className="h-5 w-5 mr-3" />
            Переместить в корзину
          </Button>
        );
      }
    }

    return buttons;
  }, [
    task,
    currentUser,
    handleGetTaskLink,
    handleCopyTask,
    handleReturnToWork,
    handleRestore,
    handlePermanentDelete,
    handleSoftDelete,
    handleSendReminder,
  ]);

  const cardClass = `h-full hover:shadow-md transition-all duration-500 flex flex-col cursor-pointer relative overflow-hidden ${
    isAnimatingOverdue ? "animate-pulse-red" : ""
  } ${task.is_deleted ? "opacity-70 border-orange-200 bg-orange-50" : ""}`;

  return (
    <Card
      ref={cardRef}
      className={cardClass}
      style={{ height: "100%" }}
      onClick={handleCardClick}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${statusStripColor} rounded-l-lg transition-all duration-500 ${
          isAnimatingOverdue ? "animate-expand-width" : ""
        }`}
      />

      {isAnimatingOverdue && !task.is_deleted && (
        <div className="absolute inset-0 bg-red-500 opacity-0 animate-flash pointer-events-none" />
      )}

      <CardContent className="p-4 pl-6 flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              
              <div className="flex items-center gap-4">
                {/* Длительность */}
              {durationText && (
                <div
                  title={`Длительность: ${durationText}`}
                  className="flex items-center gap-2 mb-1"
                >
                  <Hourglass className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{durationText}</span>
                </div>
              )}

              {/* Крайний срок */}
              {dueDateData && (
                <div
                  title={`Крайний срок: ${dueDateData.formattedDate}`}
                  className="flex items-center gap-2 mb-1"
                >
                  {dueDateData.dateIcon}
                  <span className={`text-sm ${dueDateData.dateColor}`}>
                    {dueDateData.formattedDate}
                  </span>
                </div>
              )}
              </div>

              {/* Заголовок задачи */}
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 text-base leading-tight truncate min-w-0 flex-1">
                  {task.title}
                </h3>
                {task.type === "recurring" && (
                  <div title="Регулярная задача">
                    <Repeat className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                )}
              </div>
            </div>

            <Sheet open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 ml-2 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto">
                <div className="py-4 space-y-2">{menuButtons}</div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center justify-start gap-2">
            <TaskCardStatus
              status={task.status}
              isOverdue={!!task.is_overdue}
              isAlmostOverdue={!!task.is_almost_overdue}
              isAnimatingOverdue={isAnimatingOverdue}
              isDeleted={task.is_deleted}
            />

            {task.is_deleted && deletedByUser && task.deleted_at && (
              <div className="text-xs text-orange-600">
                Удалено {deletedByUser.name}{" "}
                {format(task.deleted_at as any, "d MMM, HH:mm", { locale: ru })}
              </div>
            )}

            <TaskCardFooter
              task={task}
              isOverdue={!!task.is_overdue}
              isAlmostOverdue={!!task.is_almost_overdue}
              isAnimatingOverdue={isAnimatingOverdue}
            />
          </div>

          {assignee && <TaskCardAssignee assignee={assignee} />}
        </div>
      </CardContent>
    </Card>
  );
});

TaskCard.displayName = "TaskCard";
export default TaskCard;
