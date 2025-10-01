// src/components/Views/TaskView/TasksListContent.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Star, ChevronDown, ChevronRight, Trash2, Info, Flag, Building2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/src/components/ui/collapsible";
import TaskCard from "@/src/components/Views/TaskView/TaskCard/TaskCard";
import {
  DatabaseTask,
  DatabaseUser,
  DatabaseBusinessProcess,
} from "@/src/lib/models/types";

interface TaskGroup {
  key: string;
  title: string;
  tasks: DatabaseTask[];
  icon?: React.ReactNode;
}

interface TasksListContentProps {
  tasks: DatabaseTask[];
  users: DatabaseUser[];
  currentUser: DatabaseUser;
  businessProcesses: DatabaseBusinessProcess[];
  groupBy: string; // Новое свойство для типа группировки
  onTaskClick: (task: DatabaseTask) => void;
  onUpdateTask: (task: DatabaseTask) => void;
  onDeleteTask: (taskId: string) => void;
  onSoftDelete: (taskId: string) => void;
  onRestore: (taskId: string) => void;
  onPermanentDelete: (taskId: string) => void;
  onSendReminder: (taskId: string, minutes?: number) => void;
}

export default function TasksListContent({
  tasks,
  users,
  currentUser,
  businessProcesses,
  groupBy,
  onTaskClick,
  onUpdateTask,
  onDeleteTask,
  onSoftDelete,
  onRestore,
  onPermanentDelete,
  onSendReminder,
}: TasksListContentProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Проверяем, показываем ли мы корзину
  const isTrashView = tasks.length > 0 && tasks.every(task => task.is_deleted);

  // Функция для безопасного преобразования в Date
  const ensureDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (isNaN(date.getTime())) return new Date();
    return date;
  };

  // Функция для получения названия приоритета
  const getPriorityName = (priority: number): string => {
    switch (priority) {
      case 1: return "1 - Критический";
      case 2: return "2 - Высокий";
      case 3: return "3 - Средний";
      case 4: return "4 - Низкий";
      case 5: return "5 - Очень низкий";
      default: return `${priority}`;
    }
  };

  // Функция для получения иконки приоритета
  const getPriorityIcon = (priority: number): React.ReactNode => {
    const color = priority === 1 ? "text-red-500" : 
                  priority === 2 ? "text-orange-500" : 
                  priority === 3 ? "text-yellow-500" : 
                  priority === 4 ? "text-green-500" : 
                  "text-gray-500";
    return <Flag className={`h-4 w-4 ${color}`} />;
  };

  // Группировка задач в зависимости от выбранного типа
  const groupTasksByType = (tasksList: DatabaseTask[], groupType: string): TaskGroup[] => {
    console.log("groupTasksByType: grouping", tasksList.length, "tasks by", groupType);

    if (isTrashView) {
      // Для корзины всегда группируем по дате удаления
      const groups: { [key: string]: TaskGroup } = {};

      tasksList.forEach((task) => {
        const deletedDate = task.deleted_at ? ensureDate(task.deleted_at) : new Date();
        const dateKey = deletedDate.toDateString();
        
        if (!groups[dateKey]) {
          groups[dateKey] = {
            key: dateKey,
            title: formatTrashGroupTitle(dateKey),
            tasks: [],
            icon: <Trash2 className="h-4 w-4 text-orange-500" />
          };
        }

        groups[dateKey].tasks.push(task);
      });

      const result = Object.values(groups).sort((a, b) => {
        const dateA = new Date(a.key);
        const dateB = new Date(b.key);
        return dateB.getTime() - dateA.getTime();
      });

      console.log("groupTasksByType: created", result.length, "trash groups");
      return result;
    }

    // Группировка для активных задач
    switch (groupType) {
      case "time":
        return groupByTime(tasksList);
      case "process":
        return groupByProcess(tasksList);
      case "priority":
        return groupByPriority(tasksList);
      default:
        return groupByTime(tasksList);
    }
  };

  // Группировка по времени дедлайна
  const groupByTime = (tasksList: DatabaseTask[]): TaskGroup[] => {
    const groups: { [key: string]: TaskGroup } = {};

    tasksList.forEach((task) => {
      const dueDate = ensureDate(task.due_date);
      const hour = dueDate.getHours();
      const timeKey = `${hour}:00`;

      if (!groups[timeKey]) {
        groups[timeKey] = {
          key: timeKey,
          title: timeKey,
          tasks: [],
        };
      }

      groups[timeKey].tasks.push(task);
    });

    return Object.values(groups).sort((a, b) => {
      const hourA = parseInt(a.key.split(':')[0]);
      const hourB = parseInt(b.key.split(':')[0]);
      return hourA - hourB;
    });
  };

  // Группировка по бизнес-процессу
  const groupByProcess = (tasksList: DatabaseTask[]): TaskGroup[] => {
    const groups: { [key: string]: TaskGroup } = {};

    tasksList.forEach((task) => {
      const processId = task.process_id || 'no-process';
      const processName = processId === 'no-process' 
        ? 'Без процесса' 
        : businessProcesses.find(p => p.id === processId)?.name || 'Неизвестный процесс';

      if (!groups[processId]) {
        groups[processId] = {
          key: processId,
          title: processName,
          tasks: [],
          icon: <Building2 className="h-4 w-4 text-blue-500" />
        };
      }

      groups[processId].tasks.push(task);
    });

    // Сортируем: сначала "Без процесса", потом остальные по алфавиту
    return Object.values(groups).sort((a, b) => {
      if (a.key === 'no-process') return 1;
      if (b.key === 'no-process') return -1;
      return a.title.localeCompare(b.title);
    });
  };

  // Группировка по приоритету
  const groupByPriority = (tasksList: DatabaseTask[]): TaskGroup[] => {
    const groups: { [key: string]: TaskGroup } = {};

    tasksList.forEach((task) => {
      const priorityKey = task.priority.toString();

      if (!groups[priorityKey]) {
        groups[priorityKey] = {
          key: priorityKey,
          title: getPriorityName(task.priority),
          tasks: [],
          icon: getPriorityIcon(task.priority)
        };
      }

      groups[priorityKey].tasks.push(task);
    });

    // Сортируем по приоритету (1 - самый высокий)
    return Object.values(groups).sort((a, b) => {
      const priorityA = parseInt(a.key);
      const priorityB = parseInt(b.key);
      return priorityA - priorityB;
    });
  };

  // Форматирование заголовка для групп в корзине
  const formatTrashGroupTitle = (dateKey: string): string => {
    const date = new Date(dateKey);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Сегодня";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Вчера";
    } else {
      return date.toLocaleDateString("ru-RU", { 
        day: "numeric", 
        month: "long",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined
      });
    }
  };

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const taskGroups = useMemo(() => {
    return groupTasksByType(tasks, groupBy);
  }, [tasks, groupBy, businessProcesses]);

  // Автоматически раскрываем все группы при первой загрузке
  useEffect(() => {
    if (taskGroups.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(taskGroups.map((group) => group.key)));
    }
  }, [taskGroups.length, expandedGroups.size]);

  if (taskGroups.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {isTrashView ? (
          <>
            <Trash2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <div className="text-lg mb-2">Корзина пуста</div>
            <div className="text-sm">
              Удаленные задачи будут отображаться здесь
            </div>
          </>
        ) : (
          <>
            <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <div className="text-lg mb-2">Задач не найдено</div>
            <div className="text-sm">
              Попробуйте изменить фильтры или период просмотра
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Информационное сообщение для корзины */}
      {isTrashView && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-900 mb-1">
                Корзина задач
              </h4>
              <p className="text-sm text-orange-800">
                Задачи в корзине могут быть восстановлены или удалены навсегда. 
                Доступ к корзине имеют только директоры и руководители отделов.
              </p>
            </div>
          </div>
        </div>
      )}

      {taskGroups.map((group) => {
        const isExpanded = expandedGroups.has(group.key);

        return (
          <div key={group.key} className="space-y-2">
            <Collapsible open={isExpanded} onOpenChange={() => toggleGroup(group.key)}>
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
                  {group.icon && group.icon}
                  <span className="text-lg">{group.title}</span>
                  <span className="text-sm text-gray-500 font-normal">
                    ({group.tasks.length}{" "}
                    {group.tasks.length === 1 ? "задача" : "задач"})
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
                    onClick={() => onTaskClick(task)}
                    onUpdate={onUpdateTask}
                    onSoftDelete={onSoftDelete}
                    onRestore={onRestore}
                    onPermanentDelete={onPermanentDelete}
                    onSendReminder={onSendReminder}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        );
      })}
    </div>
  );
}