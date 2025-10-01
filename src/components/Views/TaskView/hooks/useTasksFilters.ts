// src/components/Views/TaskView/hooks/useTasksFilters.ts (обновленная версия)
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import {
  DatabaseTask,
  DatabaseUser,
  TaskStatus,
  UserRole,
} from "@/src/lib/models/types";

export interface FilterTab {
  value: string;
  label: string;
  count: number;
}

export interface UseTasksFiltersProps {
  tasks: DatabaseTask[];
  currentUser: DatabaseUser;
  showTeamTasksForAll?: boolean;
}

export interface UseTasksFiltersReturn {
  filteredTasks: DatabaseTask[];
  filterTabs: FilterTab[];
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  assigneeFilter: string;
  setAssigneeFilter: (assignee: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  groupBy: string;
  setGroupBy: (groupBy: string) => void;
  viewMode: "all" | "day" | "week" | "month";
  setViewMode: (mode: "all" | "day" | "week" | "month") => void;
  showTrash: boolean;
  setShowTrash: (show: boolean) => void;

  // Новые поля для фильтрации по тегам
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  availableTags: string[];
  tagFilterMode: "any" | "all";
  setTagFilterMode: (mode: "any" | "all") => void;
}

export default function useTasksFilters({
  tasks,
  currentUser,
  showTeamTasksForAll = false,
}: UseTasksFiltersProps): UseTasksFiltersReturn {
  const [activeFilter, setActiveFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("dueDate");
  const [groupBy, setGroupBy] = useState("time");
  const [viewMode, setViewMode] = useState<"all" | "day" | "week" | "month">(
    "all"
  );
  const [showTrash, setShowTrash] = useState(false);

  // Новые состояния для фильтрации по тегам
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagFilterMode, setTagFilterMode] = useState<"any" | "all">("any");

  // Мемоизированный список всех доступных тегов
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach((task) => {
      if (task.tags && Array.isArray(task.tags)) {
        task.tags.forEach((tag) => {
          if (tag && typeof tag === "string") {
            tagSet.add(tag);
          }
        });
      }
    });
    return Array.from(tagSet).sort();
  }, [tasks]);

  // Мемоизированная функция получения временного диапазона
  const getDateRange = useCallback(() => {
    const now = new Date();
    switch (viewMode) {
      case "day":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "week":
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      default:
        return null;
    }
  }, [viewMode]);

  // Мемоизированная функция фильтрации по базовым критериям
  const getBaseFilteredTasks = useCallback(
    (tasks: DatabaseTask[]) => {
      let filtered = tasks;

      // Фильтр корзины (только один раз!)
      if (showTrash) {
        filtered = filtered.filter((task) => task.is_deleted === true);
      } else {
        filtered = filtered.filter((task) => !task.is_deleted);
      }

      // Временной фильтр
      const dateRange = getDateRange();
      if (dateRange) {
        filtered = filtered.filter((task) => {
          const dueDate = new Date(task.due_date);
          return dueDate >= dateRange.start && dueDate <= dateRange.end;
        });
      }

      // Фильтр по статусу
      if (statusFilter && statusFilter !== "all") {
        filtered = filtered.filter((task) => task.status === statusFilter);
      }

      // Фильтр по приоритету
      if (priorityFilter && priorityFilter !== "all") {
        filtered = filtered.filter(
          (task) => task.priority.toString() === priorityFilter
        );
      }

      // Фильтр по исполнителю
      if (assigneeFilter && assigneeFilter !== "all") {
        filtered = filtered.filter((task) => {
          if (!task.assignees || !Array.isArray(task.assignees)) return false;
          return task.assignees.some((assignee) => {
            const assigneeId =
              typeof assignee === "string" ? assignee : assignee.id;
            return assigneeId === assigneeFilter;
          });
        });
      }

      // Поиск по тексту
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((task) => {
          return (
            task.title.toLowerCase().includes(query) ||
            (task.description &&
              task.description.toLowerCase().includes(query)) ||
            (task.tags &&
              task.tags.some((tag) => tag.toLowerCase().includes(query)))
          );
        });
      }

      // Новая фильтрация по тегам
      if (selectedTags.length > 0) {
        filtered = filtered.filter((task) => {
          if (!task.tags || !Array.isArray(task.tags)) return false;

          if (tagFilterMode === "all") {
            // Все выбранные теги должны присутствовать
            return selectedTags.every((selectedTag) =>
              task.tags.includes(selectedTag)
            );
          } else {
            // Любой из выбранных тегов должен присутствовать
            return selectedTags.some((selectedTag) =>
              task.tags.includes(selectedTag)
            );
          }
        });
      }

      return filtered;
    },
    [
      showTrash,
      getDateRange,
      statusFilter,
      priorityFilter,
      assigneeFilter,
      searchQuery,
      selectedTags,
      tagFilterMode,
    ]
  );

  // Мемоизированная функция получения задач по фильтрам
  const getFilteredTasksByType = useCallback(
    (filterType: string) => {
      const baseFiltered = getBaseFilteredTasks(tasks);

      switch (filterType) {
        case "my":
          return baseFiltered.filter((task) => {
            if (!task.assignees || !Array.isArray(task.assignees)) return false;
            return task.assignees.some((assignee) => {
              const assigneeId =
                typeof assignee === "string" ? assignee : assignee.id;
              return assigneeId === currentUser.id;
            });
          });

        case "created":
          return baseFiltered.filter(
            (task) => task.creator_id === currentUser.id
          );

        case "team":
          if (!showTeamTasksForAll && currentUser.role === UserRole.EMPLOYEE) {
            return [];
          }
          return baseFiltered.filter((task) => {
            if (!task.assignees || !Array.isArray(task.assignees)) return false;
            return task.assignees.some((assignee) => {
              const assigneeId =
                typeof assignee === "string" ? assignee : assignee.id;
              return assigneeId !== currentUser.id;
            });
          });

        case "overdue":
          return baseFiltered.filter((task) => task.is_overdue);

        case "almost_overdue":
          return baseFiltered.filter((task) => task.is_almost_overdue);

        case "completed":
          return baseFiltered.filter(
            (task) => task.status === TaskStatus.COMPLETED
          );

        case "in_progress":
          return baseFiltered.filter(
            (task) => task.status === TaskStatus.IN_PROGRESS
          );

        case "new":
          return baseFiltered.filter((task) => task.status === TaskStatus.NEW);

        case "paused":
          return baseFiltered.filter(
            (task) => task.status === TaskStatus.PAUSED
          );

        case "high_priority":
          return baseFiltered.filter((task) => task.priority <= 2);

        case "low_priority":
          return baseFiltered.filter((task) => task.priority >= 4);

        case "all":
        default:
          return baseFiltered;
      }
    },
    [tasks, currentUser, showTeamTasksForAll, getBaseFilteredTasks]
  );

  // Мемоизированные вкладки фильтров с подсчетом
  const filterTabs = useMemo(() => {
    const tabs: FilterTab[] = [
      {
        value: "all",
        label: "Все",
        count: getFilteredTasksByType("all").length,
      },
      { value: "my", label: "Мои", count: getFilteredTasksByType("my").length },
      // { value: "created", label: "Созданные", count: getFilteredTasksByType("created").length },
    ];

    if (showTeamTasksForAll || currentUser.role !== UserRole.EMPLOYEE) {
      tabs.push({
        value: "team",
        label: "Команда",
        count: getFilteredTasksByType("team").length,
      });
    }

    tabs.push(
      {
        value: "overdue",
        label: "Просроченные",
        count: getFilteredTasksByType("overdue").length,
      },
      {
        value: "in_progress",
        label: "В работе",
        count: getFilteredTasksByType("in_progress").length,
      },
      {
        value: "completed",
        label: "Завершенные",
        count: getFilteredTasksByType("completed").length,
      }
    );

    return tabs;
  }, [getFilteredTasksByType, showTeamTasksForAll, currentUser.role]);

  // Мемоизированные отфильтрованные задачи
  const filteredTasks = useMemo(() => {
    let filtered = getFilteredTasksByType(activeFilter);

    // Сортировка
    filtered.sort((a, b) => {
      const dateA = new Date(a.due_date);
      const dateB = new Date(b.due_date);

      switch (sortBy) {
        case "dueDate":
          return dateA.getTime() - dateB.getTime();
        case "priority":
          return a.priority - b.priority;
        case "status":
          const statusOrder = {
            [TaskStatus.NEW]: 0,
            [TaskStatus.ACKNOWLEDGED]: 1,
            [TaskStatus.IN_PROGRESS]: 2,
            [TaskStatus.PAUSED]: 3,
            [TaskStatus.WAITING_CONTROL]: 4,
            [TaskStatus.ON_CONTROL]: 5,
            [TaskStatus.COMPLETED]: 6,
          };
          return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
        case "created":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return dateA.getTime() - dateB.getTime();
      }
    });

    return filtered;
  }, [activeFilter, getFilteredTasksByType, sortBy]);

  useEffect(() => {
    console.log("Filter state changed:", {
      showTrash,
      totalTasks: tasks.length,
      filteredCount: filteredTasks.length,
    });
  }, [showTrash, tasks.length, filteredTasks.length]);

  return {
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

    // Новые возвращаемые значения для тегов
    selectedTags,
    setSelectedTags,
    availableTags,
    tagFilterMode,
    setTagFilterMode,
  };
}
