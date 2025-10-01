"use client";

import {
  DatabaseBusinessProcess,
  DatabaseUser,
  UserRole,
} from "@/src/lib/models/types";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@radix-ui/react-collapsible";
import {
  ChevronDown,
  ChevronRight,
  Bell,
  FileText,
  Calendar,
  Clock,
  Trash2Icon,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import TagsSelector from "../../Views/TaskView/TagsSelector";
import { DurationInput } from "../CreateTaskDialog";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";

interface TaskAdditionalSectionProps {
  // Process
  processId: string;
  process?: DatabaseBusinessProcess;
  onProcessChange: (processId: string) => void;

  // Duration
  estimatedDays?: number;
  estimatedHours?: number;
  estimatedMinutes?: number;
  onDurationChange: (days: number, hours: number, minutes: number) => void;

  // Tags
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  onTagsBlur?: () => void;

  // Business processes
  businessProcesses: DatabaseBusinessProcess[];

  // Collapsible state
  isAdditionalOpen: boolean;
  setIsAdditionalOpen: (open: boolean) => void;

  // Permissions
  canEdit?: boolean;

  // Task dates
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date;

  // User and task info
  currentUser?: DatabaseUser;
  taskCreatorId?: string;
  taskAssigneeIds?: string[];

  // NEW: принудительный CSS read-only overlay только для контента,
  // не блокируя сам триггер (разворачивание/сворачивание)
  readOnlyOverlay?: boolean;
}

export default function TaskAdditionalSection({
  processId,
  process,
  onProcessChange,
  estimatedDays = 0,
  estimatedHours = 0,
  estimatedMinutes = 0,
  onDurationChange,
  tags,
  onTagsChange,
  onTagsBlur,
  businessProcesses,
  isAdditionalOpen,
  setIsAdditionalOpen,
  canEdit = true,
  createdAt,
  updatedAt,
  deletedAt,
  currentUser,
  taskCreatorId,
  taskAssigneeIds = [],
  readOnlyOverlay = false,
}: TaskAdditionalSectionProps) {
  // Показывать ли кнопку «Служебка»
  const shouldShowServiceNoteButton = () => {
    if (!currentUser || currentUser.role !== UserRole.DIRECTOR) {
      return true; // Для не-директоров показываем
    }
    const isAssignee = taskAssigneeIds.includes(currentUser.id);
    const isCreator = taskCreatorId === currentUser.id;
    if (isAssignee) return false;
    if (!isCreator && !isAssignee) return false;
    return true;
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "—";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return format(dateObj, "d MMM yyyy, HH:mm", { locale: ru });
    } catch {
      return "—";
    }
  };

  return (
    <Collapsible open={isAdditionalOpen} onOpenChange={setIsAdditionalOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 p-0 h-auto font-medium"
        >
          {isAdditionalOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Дополнительно
        </Button>
      </CollapsibleTrigger>

      {/* Контент: отдельный контейнер с опциональным pointer-events блоком */}
      <CollapsibleContent className="mt-4">
        <div className="pl-6 border-l-2 border-gray-200 relative">
          {/* Если readOnlyOverlay = true, блокируем все события внутри контента */}
          <div className={readOnlyOverlay ? "pointer-events-none" : ""}>
            {/* Бизнес-процесс (при необходимости можно вернуть) */}

            {/* Длительность */}
            <div className="space-y-4">
              <div>
                <DurationInput
                  days={estimatedDays}
                  hours={estimatedHours}
                  minutes={estimatedMinutes}
                  onDurationChange={onDurationChange}
                  label="Длительность"
                  disabled={!canEdit}
                />
              </div>

              {/* Теги */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Теги
                </Label>
                <TagsSelector
                  selectedTags={tags}
                  onTagsChange={onTagsChange}
                  placeholder="Добавить дополнительные теги"
                  maxTags={5}
                  size="sm"
                  disabled={!canEdit}
                  allowCreate={canEdit}
                />
              </div>
            </div>

            {/* Доп. действия и даты */}
            <div className="flex gap-2 items-center pt-4 flex-wrap">
              {currentUser?.role === UserRole.ADMIN && (
                <Button
                  variant="outline"
                  size="default"
                  className="flex items-center gap-1 h-10"
                  onClick={() => alert("Функция напоминаний (в разработке)")}
                  disabled={!canEdit}
                >
                  <Bell className="h-4 w-4" />
                  Напомнить
                </Button>
              )}

              {currentUser?.role === UserRole.ADMIN && shouldShowServiceNoteButton() && (
                <Button
                  variant="outline"
                  className="flex items-center gap-1 h-10"
                  onClick={() =>
                    alert("Функция служебных записок (в разработке)")
                  }
                  disabled={!canEdit}
                >
                  <FileText className="h-4 w-4" />
                  Отправить служебку
                </Button>
              )}

              <div className="gap-2 flex items-center md:gap-4 text-sm md:ml-auto flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <Label className="text-xs font-medium text-gray-600">
                      Создана:
                    </Label>
                    <p className="text-sm text-gray-800">
                      {formatDate(createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <Label className="text-xs font-medium text-gray-600">
                      Обновлена:
                    </Label>
                    <p className="text-sm text-gray-800">
                      {formatDate(updatedAt)}
                    </p>
                  </div>
                </div>

                {deletedAt && (
                  <div className="flex items-center gap-2">
                    <Trash2Icon className="h-4 w-4 text-gray-500" />
                    <div>
                      <Label className="text-xs font-medium text-gray-600">
                        Удалена:
                      </Label>
                      <p className="text-sm text-gray-800">
                        {formatDate(deletedAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
