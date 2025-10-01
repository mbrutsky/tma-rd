// src/components/Views/TaskView/TasksSearchHeader.tsx (обновленная версия)
"use client";

import { useState, useCallback, memo } from "react";
import { Search, Filter, Calendar, Users, Flag, Trash2, SortAsc, BarChart3, Clock, Grid3X3, Tag } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/src/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import { DatabaseUser, UserRole } from "@/src/lib/models/types";
import TagsFilter from "./TagsFilter";

interface TasksSearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: "all" | "day" | "week" | "month";
  onViewModeChange: (mode: "all" | "day" | "week" | "month") => void;
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
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  showTrash: boolean;
  onShowTrashChange: (show: boolean) => void;
  currentUser: DatabaseUser;
  
  // Новые пропсы для фильтрации по тегам
  selectedTags: string[];
  onSelectedTagsChange: (tags: string[]) => void;
  availableTags: string[];
  tagFilterMode: 'any' | 'all';
  onTagFilterModeChange: (mode: 'any' | 'all') => void;
}

const TasksSearchHeader = memo(function TasksSearchHeader({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
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
  isFilterOpen,
  onFilterOpenChange,
  showTrash,
  onShowTrashChange,
  currentUser,
  selectedTags,
  onSelectedTagsChange,
  availableTags,
  tagFilterMode,
  onTagFilterModeChange,
}: TasksSearchHeaderProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearchQuery);
  }, [localSearchQuery, onSearchChange]);

  const handleSearchChange = useCallback((value: string) => {
    setLocalSearchQuery(value);
    // Реактивный поиск с задержкой
    const timeoutId = setTimeout(() => {
      onSearchChange(value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [onSearchChange]);

  const clearAllFilters = useCallback(() => {
    onSearchChange("");
    setLocalSearchQuery("");
    onStatusChange("all");
    onPriorityChange("all");
    onAssigneeChange("all");
    onSelectedTagsChange([]);
    onViewModeChange("all");
  }, [
    onSearchChange,
    onStatusChange,
    onPriorityChange,
    onAssigneeChange,
    onSelectedTagsChange,
    onViewModeChange
  ]);

  const canShowTrash = currentUser.role === UserRole.DIRECTOR || currentUser.role === UserRole.DEPARTMENT_HEAD;

  // Подсчет активных фильтров
  const activeFiltersCount = [
    statusFilter !== 'all' ? statusFilter : '',
    priorityFilter !== 'all' ? priorityFilter : '',
    assigneeFilter !== 'all' ? assigneeFilter : '',
    selectedTags.length > 0 ? 'tags' : '',
    viewMode !== 'all' ? 'timeRange' : ''
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Основная строка поиска */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Поиск задач..."
            value={localSearchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4 h-10"
          />
        </div>

        {/* Кнопка фильтров */}
        <Sheet open={isFilterOpen} onOpenChange={onFilterOpenChange}>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-10 relative">
              <Filter className="h-4 w-4 mr-2" />
              Фильтры
              {activeFiltersCount > 0 && (
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </div>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
            <div className="py-4 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Фильтры и настройки</h3>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Очистить все
                  </Button>
                )}
              </div>

              {/* Временной диапазон */}
              <div>
                <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Период времени
                </Label>
                <Select value={viewMode} onValueChange={onViewModeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[1000]">
                    <SelectItem value="all">Все задачи</SelectItem>
                    <SelectItem value="day">Сегодня</SelectItem>
                    <SelectItem value="week">Эта неделя</SelectItem>
                    <SelectItem value="month">Этот месяц</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Статус */}
              <div>
                <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Статус
                </Label>
                <Select value={statusFilter} onValueChange={onStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все статусы" />
                  </SelectTrigger>
                   <SelectContent className="z-[1000]">
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="new">Новая</SelectItem>
                    <SelectItem value="acknowledged">Ознакомлен</SelectItem>
                    <SelectItem value="in_progress">В работе</SelectItem>
                    <SelectItem value="paused">Приостановлена</SelectItem>
                    <SelectItem value="waiting_control">Ждет контроля</SelectItem>
                    <SelectItem value="on_control">На контроле</SelectItem>
                    <SelectItem value="completed">Завершена</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Приоритет */}
              <div>
                <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  Приоритет
                </Label>
                <Select value={priorityFilter} onValueChange={onPriorityChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все приоритеты" />
                  </SelectTrigger>
                 <SelectContent className="z-[1000]">
                    <SelectItem value="all">Все приоритеты</SelectItem>
                    <SelectItem value="1">1 - Критичный</SelectItem>
                    <SelectItem value="2">2 - Высокий</SelectItem>
                    <SelectItem value="3">3 - Средний</SelectItem>
                    <SelectItem value="4">4 - Низкий</SelectItem>
                    <SelectItem value="5">5 - Очень низкий</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Исполнитель */}
              <div>
                <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Исполнитель
                </Label>
                <Select value={assigneeFilter} onValueChange={onAssigneeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все исполнители" />
                  </SelectTrigger>
                  <SelectContent className="z-[1000]">
                    <SelectItem value="all">Все исполнители</SelectItem>
                    {users
                      .filter(user => user.is_active)
                      .map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Фильтр по тегам */}
              <div>
                <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Теги
                </Label>
                <TagsFilter
                  availableTags={availableTags}
                  selectedTags={selectedTags}
                  onSelectedTagsChange={onSelectedTagsChange}
                  tagFilterMode={tagFilterMode}
                  onTagFilterModeChange={onTagFilterModeChange}
                  variant="inline"
                />
              </div>

              <Separator />

              {/* Сортировка */}
              <div>
                <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <SortAsc className="h-4 w-4" />
                  Сортировка
                </Label>
                <Select value={sortBy} onValueChange={onSortChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                   <SelectContent className="z-[1000]">
                    <SelectItem value="dueDate">По дедлайну</SelectItem>
                    <SelectItem value="priority">По приоритету</SelectItem>
                    <SelectItem value="status">По статусу</SelectItem>
                    <SelectItem value="created">По дате создания</SelectItem>
                    <SelectItem value="title">По названию</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Группировка */}
              <div>
                <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Группировка
                </Label>
                <Select value={groupBy} onValueChange={onGroupByChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                    <SelectContent className="z-[1000]">
                    <SelectItem value="time">По времени</SelectItem>
                    <SelectItem value="process">По процессам</SelectItem>
                    <SelectItem value="priority">По приоритету</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Корзина - только для директоров и руководителей */}
              {canShowTrash && (
                <div>
                  <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                    Дополнительно
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={showTrash ? "default" : "outline"}
                      size="sm"
                      onClick={() => onShowTrashChange(!showTrash)}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      {showTrash ? "Скрыть корзину" : "Показать корзину"}
                    </Button>
                  </div>
                  {showTrash && (
                    <p className="text-xs text-gray-500 mt-2">
                      Показаны удаленные задачи, которые можно восстановить или удалить навсегда.
                    </p>
                  )}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </form>

      {/* Быстрые фильтры по тегам */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.slice(0, 3).map((tag) => (
            <div
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs border border-blue-200"
            >
              <Tag className="h-3 w-3" />
              <span>{tag}</span>
              <button
                onClick={() => onSelectedTagsChange(selectedTags.filter(t => t !== tag))}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
              >
                ×
              </button>
            </div>
          ))}
          {selectedTags.length > 3 && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-xs border border-gray-200">
              <Tag className="h-3 w-3" />
              <span>+{selectedTags.length - 3} тегов</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

TasksSearchHeader.displayName = 'TasksSearchHeader';

export default TasksSearchHeader;