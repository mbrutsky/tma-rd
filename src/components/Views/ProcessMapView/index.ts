// components/ProcessMapView/index.ts

// Основной компонент
export { default as ProcessMapView } from './ProcessMapView';

// Подкомпоненты
export { ProcessHeader } from "./ProcessHeader";
export { ProcessCreateDialog } from './ProcessCreateDialog';
export { ProcessCard } from './ProcessCard';
export { ProcessCardHeader } from './ProcessCardHeader';
export { ProcessProgressBar } from './ProcessProgressBar';
export { ProcessStepView } from './ProcessStepView';
export { ProcessStepHeader } from './ProcessStepHeader';
export { EmptyProcessList } from './EmptyProcessList';

// Утилиты
export { getStatusIcon, getPriorityBadge } from './utils/taskUtils';
export { getPositionText } from './utils/userUtils';
