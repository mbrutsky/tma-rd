// src/components/Views/TaskView/VirtualizedTasksList.tsx
"use client";

import React, { useMemo, useCallback, useState } from "react";
import { DatabaseTask, DatabaseUser, DatabaseBusinessProcess } from "@/src/lib/models/types";
import TaskCard from "./TaskCard/TaskCard";
import { Button } from "@/src/components/ui/button";
import { Star, Info, Trash2 } from "lucide-react";
import VirtualizedList from "./VirtualizedList";

interface TaskGroup {
  key: string;
  title: string;
  tasks: DatabaseTask[];
  icon?: React.ReactNode;
  isExpanded: boolean; // всегда true
}

interface VirtualizedTasksListProps {
  tasks: DatabaseTask[];
  users: DatabaseUser[];
  currentUser: DatabaseUser;
  businessProcesses: DatabaseBusinessProcess[];
  groupBy: string;
  onTaskClick: (task: DatabaseTask) => void;
  onUpdateTask: (task: DatabaseTask) => void;
  onDeleteTask: (taskId: string) => void;
  onSoftDelete: (taskId: string) => void;
  onRestore: (taskId: string) => void;
  onPermanentDelete: (taskId: string) => void;
  onSendReminder: (taskId: string, minutes?: number) => void;
  height?: number;
  overscanCount?: number;
}

interface VirtualItem {
  type: "group-header" | "task" | "empty";
  groupKey?: string;
  task?: DatabaseTask;
  group?: TaskGroup;
  height: number;
}

const HEADER_HEIGHT = 56;
const GUTTER = 12;
const TASK_ROW_HEIGHT = 180 + GUTTER;
const EMPTY_HEIGHT = 200;

export default function VirtualizedTasksList({
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
  height = 600,
  overscanCount = 5,
}: VirtualizedTasksListProps) {
  // Группы всегда развернуты — состояние не требуется
  const [/*unused*/, setDummy] = useState(0); // оставлено, если понадобится форс-рендер в будущем

  const isTrashView = tasks.length > 0 && tasks.every((t) => t.is_deleted);

  const ensureDate = useCallback((v: any): Date => {
    const d = v ? (v instanceof Date ? v : new Date(v)) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  }, []);

  const getPriorityName = useCallback((p: number) => {
    switch (p) {
      case 1: return "1 - Критический";
      case 2: return "2 - Высокий";
      case 3: return "3 - Средний";
      case 4: return "4 - Низкий";
      case 5: return "5 - Очень низкий";
      default: return `${p}`;
    }
  }, []);

  const getPriorityIcon = useCallback((p: number) => {
    const color = p === 1 ? "text-red-500" :
                  p === 2 ? "text-orange-500" :
                  p === 3 ? "text-yellow-500" :
                  p === 4 ? "text-green-500" : "text-gray-500";
    return <span className={`inline-block w-3 h-3 rounded-full ${color.replace("text-", "bg-")}`} />;
  }, []);

  const formatTrashGroupTitle = useCallback((dateKey: string): string => {
    const date = new Date(dateKey);
    const today = new Date();
    const y = new Date(today); y.setDate(y.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Сегодня";
    if (date.toDateString() === y.toDateString()) return "Вчера";
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
  }, []);

  const taskGroups = useMemo(() => {
    if (isTrashView) {
      const groups: Record<string, TaskGroup> = {};
      tasks.forEach((t) => {
        const dk = (t.deleted_at ? ensureDate(t.deleted_at) : new Date()).toDateString();
        groups[dk] ??= { key: dk, title: formatTrashGroupTitle(dk), tasks: [], icon: <Trash2 className="h-4 w-4 text-orange-500" />, isExpanded: true };
        groups[dk].tasks.push(t);
      });
      return Object.values(groups).sort((a, b) => +new Date(b.key) - +new Date(a.key));
    }

    const groups: Record<string, TaskGroup> = {};
    switch (groupBy) {
      case "time":
        tasks.forEach((t) => {
          const hour = ensureDate(t.due_date).getHours();
          const key = `${hour}:00`;
          groups[key] ??= { key, title: key, tasks: [], isExpanded: true };
          groups[key].tasks.push(t);
        });
        return Object.values(groups).sort((a, b) => parseInt(a.key, 10) - parseInt(b.key, 10));

      case "process":
        tasks.forEach((t) => {
          const pid = t.process_id || "no-process";
          const name = pid === "no-process" ? "Без процесса" : (businessProcesses.find((p) => p.id === pid)?.name || "Неизвестный процесс");
          groups[pid] ??= { key: pid, title: name, tasks: [], icon: <span className="inline-block w-3 h-3 rounded bg-blue-500" />, isExpanded: true };
          groups[pid].tasks.push(t);
        });
        return Object.values(groups).sort((a, b) => {
          if (a.key === "no-process") return 1;
          if (b.key === "no-process") return -1;
          return a.title.localeCompare(b.title);
        });

      case "priority":
        tasks.forEach((t) => {
          const key = String(t.priority);
          groups[key] ??= { key, title: getPriorityName(t.priority), tasks: [], icon: getPriorityIcon(t.priority), isExpanded: true };
          groups[key].tasks.push(t);
        });
        return Object.values(groups).sort((a, b) => parseInt(a.key, 10) - parseInt(b.key, 10));

      default:
        return [];
    }
  }, [tasks, groupBy, businessProcesses, isTrashView, ensureDate, formatTrashGroupTitle, getPriorityName, getPriorityIcon]);

  // текущие виртуальные элементы: все группы раскрыты
  const virtualItems = useMemo<VirtualItem[]>(() => {
    if (taskGroups.length === 0) return [{ type: "empty", height: EMPTY_HEIGHT }];
    const out: VirtualItem[] = [];
    if (isTrashView) out.push({ type: "group-header", height: 100, groupKey: "trash-info" });
    taskGroups.forEach((g) => {
      out.push({ type: "group-header", group: g, groupKey: g.key, height: HEADER_HEIGHT });
      g.tasks.forEach((t) => out.push({ type: "task", task: t, groupKey: g.key, height: TASK_ROW_HEIGHT }));
    });
    return out;
  }, [taskGroups, isTrashView]);

  const getItemHeight = useCallback((i: number) => virtualItems[i]?.height ?? TASK_ROW_HEIGHT, [virtualItems]);

  const renderItem = useCallback(({ item: it }: { item: VirtualItem; index: number }) => {
    if (it.type === "empty") {
      return (
        <div className="h-full flex items-center justify-center text-gray-500">
          {isTrashView ? (
            <div className="text-center">
              <Trash2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <div className="text-lg mb-2">Корзина пуста</div>
              <div className="text-sm">Удаленные задачи будут отображаться здесь</div>
            </div>
          ) : (
            <div className="text-center">
              <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <div className="text-lg mb-2">Задач не найдено</div>
              <div className="text-sm">Измените фильтры или период</div>
            </div>
          )}
        </div>
      );
    }

    if (it.type === "group-header") {
      if (it.groupKey === "trash-info") {
        return (
          <div className="h-full flex items-center">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 w-full">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-900 mb-1">Корзина задач</h4>
                  <p className="text-sm text-orange-800">Задачи можно восстановить или удалить навсегда. В корзине задачи не редактируются.</p>
                </div>
              </div>
            </div>
          </div>
        );
      }
      const g = it.group!;
      return (
        <div className="h-full flex items-center">
          <Button
            variant="ghost"
            className="flex pointer-events-none items-center gap-2 h-10 p-0 font-semibold _text-gray-700 _hover:text-gray-900"
            // disabled
          >
            {/* <ChevronDown className="h-4 w-4" /> */}
            {g.icon && g.icon}
            <span className="text-lg">{g.title}</span>
            <span className="text-sm text-gray-500 font-normal">
              ({g.tasks.length} {g.tasks.length === 1 ? "задача" : "задач"})
            </span>
          </Button>
        </div>
      );
    }

    const task = it.task!;
    return (
      <div className="h-full box-border pb-[12px]">
        <TaskCard
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
      </div>
    );
  }, [
    isTrashView,
    users,
    currentUser,
    businessProcesses,
    onTaskClick,
    onUpdateTask,
    onSoftDelete,
    onRestore,
    onPermanentDelete,
    onSendReminder,
  ]);

  const emptyComponent = useMemo(
    () => (
      <div className="text-center py-12 text-gray-500">
        {isTrashView ? (
          <>
            <Trash2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <div className="text-lg mb-2">Корзина пуста</div>
            <div className="text-sm">Удаленные задачи будут отображаться здесь</div>
          </>
        ) : (
          <>
            <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <div className="text-lg mb-2">Задач не найдено</div>
            <div className="text-sm">Попробуйте изменить фильтры или период</div>
          </>
        )}
      </div>
    ),
    [isTrashView]
  );

  return (
    <div className="space-y-4 overflow-y-auto h-full [&>div]:h-full [&>div>div]:!h-full [&>div>div>div]:!h-full [&>div>div>div>div]:pb-[100px] [&>div>div>div>div]:box-content">
      <VirtualizedList
        items={virtualItems}
        renderItem={renderItem}
        itemHeight={getItemHeight}
        height={height}
        overscanCount={overscanCount}
        emptyComponent={emptyComponent}
        estimatedItemSize={TASK_ROW_HEIGHT}
        getItemKey={(index, item) => {
          const v = item as VirtualItem;
          if (v.type === "empty") return "empty";
          if (v.type === "group-header") return `header-${v.groupKey}`;
          if (v.type === "task") return `task-${v.task!.id}`;
          return `item-${index}`;
        }}
        invalidateFromIndex={null}
      />
    </div>
  );
}
