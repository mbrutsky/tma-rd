"use client";

import { useCallback, useRef, useMemo, useEffect } from "react";
import { UserRole } from "@/src/lib/models/types";
import { TiptapEditor } from "../../Views/TaskView/TiptapEditor";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import TaskCardStatus from "../../Views/TaskView/TaskCard/TaskCardStatus";

interface TaskDescriptionSectionProps {
  description: string;
  status: any;
  isOverdue: boolean;
  onDescriptionChange: (description: string) => void;
  onDescriptionBlur: () => void;
  onFileUpload?: (files: FileList) => Promise<string[]>;
  onImageUpload?: (file: File) => Promise<string>;
  getStatusIcon: (status: any) => React.ReactNode;
  getStatusColor: (status: any) => string;
  getStatusText: (status: any) => string;
  canEdit?: boolean;
  currentUser?: any;
  task?: any;
}

export default function TaskDescriptionSection({
  description,
  status,
  isOverdue,
  onDescriptionChange,
  onDescriptionBlur,
  onFileUpload: externalOnFileUpload,
  onImageUpload: externalOnImageUpload,
  getStatusIcon,
  getStatusColor,
  getStatusText,
  canEdit = true,
  currentUser,
  task,
}: TaskDescriptionSectionProps) {
  const actualStatus = isOverdue ? "overdue" : status;
  const blurTimeoutRef = useRef<NodeJS.Timeout>();

  // Разрешение на редактирование: запрещаем при is_deleted вне зависимости от роли
  const hasEditPermission = useMemo(() => {
    if (!task) return !!canEdit;
    if (task?.is_deleted) return false;
    if (!currentUser) return !!canEdit;
    // Базовые ролевые проверки (оставлены как у вас)
    const isDirector =
      currentUser.role === UserRole.DIRECTOR || currentUser.role === UserRole.DEPARTMENT_HEAD;
    const isCreator = task.creator_id === currentUser.id;
    return !!canEdit && (isDirector || isCreator);
  }, [task, canEdit, currentUser]);

  const handleContentChange = useCallback(
    (content: string) => {
      if (!hasEditPermission) return;
      onDescriptionChange(content);
    },
    [hasEditPermission, onDescriptionChange]
  );

  const handleBlur = useCallback(() => {
    if (!hasEditPermission) return;
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(() => {
      onDescriptionBlur();
    }, 200);
  }, [hasEditPermission, onDescriptionBlur]);

  const hasContent = useMemo(() => {
    if (!description) return false;
    const textContent = description.replace(/<[^>]*>/g, "").trim();
    return textContent.length > 0;
  }, [description]);

  return (
    <div>
      <div className="flex items-center justify-between pb-2">
        <Label className="text-sm font-medium text-gray-700 m-0 block">
          Описание задачи
        </Label>

        <div className="flex gap-2 h-7 items-center">
          <Badge className={`${getStatusColor(actualStatus)} flex items-center gap-1 pointer-events-none`}>
            {getStatusIcon(actualStatus)}
            <span className="text-xs">{getStatusText(actualStatus)}</span>
          </Badge>
        </div>
      </div>

      <div className="mt-2" onBlur={handleBlur}>
        <TiptapEditor
          initialContent={description || "<p>Добавьте описание задачи.</p>"}
          onContentChange={handleContentChange}
          placeholder="Добавьте описание задачи."
          readOnly={!hasEditPermission}
          className="border border-gray-300 rounded-lg"
          minHeight={hasEditPermission ? 150 : 120}
          maxHeight={400}
        />
      </div>

      {!hasEditPermission && hasContent && (
        <p className="text-xs text-gray-500 mt-1">Описание доступно только для просмотра</p>
      )}
    </div>
  );
}
