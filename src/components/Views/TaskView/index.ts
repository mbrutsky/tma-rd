// Основной компонент
export { default as TasksView } from './TasksView';

// Подкомпоненты
export { default as TasksSearchHeader } from '@/src/components/Views/TaskView/TasksSearchHeader';
export { default as TasksFilterTabs } from '@/src/components/Views/TaskView/TasksFilterTabs';
export { default as TasksListContent } from '@/src/components/Views/TaskView/TasksListContent';

// Хуки
export { default as useTasksFilters } from '@/src/components/Views/TaskView/hooks/useTasksFilters';