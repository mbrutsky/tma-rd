"use client";

import { DatabaseUser, UserRole } from "@/src/lib/models/types";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";
import { Switch } from "@/src/components/ui/switch";
import { X, Trash2, RotateCcw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";

interface FilterSheetProps {
  statusFilter: string;
  priorityFilter: string;
  assigneeFilter: string;
  sortBy: string;
  groupBy: string;
  users: DatabaseUser[];
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onAssigneeChange: (assignee: string) => void;
  onSortChange: (sort: string) => void;
  onGroupByChange: (groupBy: string) => void;
  onClose: () => void;
  showTrash: boolean;
  onShowTrashChange: (show: boolean) => void;
  currentUser: DatabaseUser;
}

export default function FilterSheet({
  statusFilter,
  priorityFilter,
  assigneeFilter,
  sortBy,
  groupBy,
  users,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onSortChange,
  onGroupByChange,
  onClose,
  showTrash,
  onShowTrashChange,
  currentUser,
}: FilterSheetProps) {
  const canAccessTrash = currentUser.role === UserRole.DIRECTOR || currentUser.role === UserRole.DEPARTMENT_HEAD;

  const clearAllFilters = () => {
    onStatusChange("all");
    onPriorityChange("all");
    onAssigneeChange("all");
    onSortChange("dueDate");
    onGroupByChange("time"); // Сбрасываем на группировку по времени
    onShowTrashChange(false);
  };

  const activeFiltersCount = [statusFilter, priorityFilter, assigneeFilter]
    .filter(f => f !== "all").length + (showTrash ? 1 : 0);

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Фильтры и сортировка</h3>
          {activeFiltersCount > 0 && (
            <p className="text-sm text-gray-500">
              Активных фильтров: {activeFiltersCount}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Сбросить
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Группировка */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Группировка</Label>
        <Select value={groupBy} onValueChange={onGroupByChange}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите группировку" />
          </SelectTrigger>
          <SelectContent className="z-[1001]">
            <SelectItem value="time">По времени дедлайна</SelectItem>
            <SelectItem value="process">По бизнес-процессу</SelectItem>
            <SelectItem value="priority">По приоритету</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Сортировка */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Сортировка</Label>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите сортировку" />
          </SelectTrigger>
          <SelectContent className="z-[1001]">
            <SelectItem value="dueDate">По дедлайну</SelectItem>
            <SelectItem value="priority">По приоритету</SelectItem>
            <SelectItem value="status">По статусу</SelectItem>
            <SelectItem value="createdAt">По дате создания</SelectItem>
            <SelectItem value="title">По названию</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Фильтр по статусу */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Статус</Label>
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent className="z-[1001]">
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="new">Новые</SelectItem>
            <SelectItem value="acknowledged">Ознакомлен</SelectItem>
            <SelectItem value="in_progress">В работе</SelectItem>
            <SelectItem value="paused">Приостановлены</SelectItem>
            <SelectItem value="waiting_control">Ждет контроля</SelectItem>
            <SelectItem value="on_control">На контроле</SelectItem>
            <SelectItem value="completed">Завершены</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Фильтр по приоритету */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Приоритет</Label>
        <Select value={priorityFilter} onValueChange={onPriorityChange}>
          <SelectTrigger>
            <SelectValue placeholder="Все приоритеты" />
          </SelectTrigger>
          <SelectContent className="z-[1001]">
            <SelectItem value="all">Все приоритеты</SelectItem>
            <SelectItem value="1">1 - Критический</SelectItem>
            <SelectItem value="2">2 - Высокий</SelectItem>
            <SelectItem value="3">3 - Средний</SelectItem>
            <SelectItem value="4">4 - Низкий</SelectItem>
            <SelectItem value="5">5 - Очень низкий</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Фильтр по исполнителю */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Исполнитель</Label>
        <Select value={assigneeFilter} onValueChange={onAssigneeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Все исполнители" />
          </SelectTrigger>
          <SelectContent className="z-[1001]">
            <SelectItem value="all">Все исполнители</SelectItem>
            {users
              .filter((u) => u.is_active)
              .map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Корзина (только для директоров и руководителей) */}
      {canAccessTrash && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Корзина
                </Label>
                <p className="text-xs text-gray-500">
                  Показать удаленные задачи
                </p>
              </div>
              <Switch checked={showTrash} onCheckedChange={onShowTrashChange} />
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Кнопка закрытия */}
      <Button onClick={onClose} className="w-full">
        Применить фильтры
      </Button>
    </div>
  );
}