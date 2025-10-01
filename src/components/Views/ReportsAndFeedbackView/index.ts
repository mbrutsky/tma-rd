// components/ReportsAndFeedbackView/index.ts

// Основной компонент
export { default as ReportsAndFeedbackView } from './ReportsAndFeedbackView';

// Подкомпоненты
export { ReportFilters } from './ReportFilters';
export { MobileFilters } from './MobileFilters';
export { PeriodInfo } from './PeriodInfo';
export { EfficiencyMetrics } from './EfficiencyMetrics';
export { UserStatsCard } from './UserStatsCard';
export { UserStatsSection } from './UserStatsSection';

// Хуки
export { default as useReportData } from './hooks/useReportData';
