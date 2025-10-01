
"use client"

import { DatabaseTask, DatabaseUser, DatabaseBusinessProcess, TaskPriority, TaskType, UserRole, TaskStatus } from "@/src/lib/models/types";
import { Maximize2, AlertTriangle, Save } from "lucide-react";
import dynamic from "next/dynamic";
import React, { useState, useCallback, useEffect, useMemo, memo } from "react"
import { Label } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import DateTimePicker from "./DateTimePicker";
import DurationInput from "./DurationInput";
import TaskBasicInfo from "./TaskBasicInfo";
import TaskDescriptionField from "./TaskDescriptionField";
import TaskParticipants from "./TaskParticipants";
import { Button } from "../../ui/button";
import { Separator } from "../../ui/separator";

const TagsSelector = dynamic(() => import("@/src/components/Views/TaskView/TagsSelector"), {
  ssr: false,
  loading: () => <div className="animate-pulse h-10 bg-gray-200 rounded" />
});

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateTask: (task: Omit<DatabaseTask, "id" | "created_at" | "updated_at" | "comments" | "history">) => Promise<void>
  users: DatabaseUser[]
  currentUser: DatabaseUser
  businessProcesses: DatabaseBusinessProcess[]
  isLoading?: boolean
  initialMode?: 'quick' | 'full'
}

interface FormState {
  title: string
  description: string
  priority: TaskPriority
  taskType: TaskType
  responsibleId: string
  creatorId: string
  assigneeIds: string[]
  observerIds: string[]
  dueDate?: Date
  tags: string[]
  estimatedDays: number
  estimatedHours: number
  estimatedMinutes: number
}

const CreateTaskDialog = memo(function CreateTaskDialog({
  open,
  onOpenChange,
  onCreateTask,
  users,
  currentUser,
  businessProcesses,
  isLoading = false,
  initialMode = 'quick'
}: CreateTaskDialogProps) {
  const [mode, setMode] = useState<'quick' | 'full'>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Начальное состояние формы
  const initialFormState = useMemo((): FormState => ({
    title: "",
    description: "",
    priority: TaskPriority.MEDIUM,
    taskType: TaskType.ONE_TIME,
    responsibleId: "",
    creatorId: currentUser.id,
    assigneeIds: [],
    observerIds: [],
    dueDate: undefined,
    tags: [],
    estimatedDays: 0,
    estimatedHours: 0,
    estimatedMinutes: 0,
  }), [currentUser.id]);

  const [formState, setFormState] = useState<FormState>(initialFormState);

  // Мемоизированная функция получения позиции
  const getPositionText = useCallback((user: DatabaseUser) => {
    if (user.position) return user.position;
    
    switch (user.role) {
      case UserRole.DIRECTOR: return "Директор";
      case UserRole.DEPARTMENT_HEAD: return "Руководитель отдела";
      case UserRole.EMPLOYEE: return "Специалист";
      default: return "Сотрудник";
    }
  }, []);

  // Мемоизированные пользователи
  const availableUsers = useMemo(() => 
    users.filter((user) => user.is_active), 
    [users]
  );

  // Сброс режима при открытии диалога
  useEffect(() => {
    if (open) {
      setMode(initialMode);
    }
  }, [open, initialMode]);

  // Мемоизированная функция обновления состояния
  const updateFormState = useCallback((updates: Partial<FormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
    // Очищаем ошибки валидации при изменении
    if (Object.keys(validationErrors).length > 0) {
      setValidationErrors({});
    }
  }, [validationErrors]);

  // Мемоизированная валидация
  const validateForm = useCallback((): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!formState.title.trim()) {
      errors.title = "Название задачи обязательно";
    }

    if (mode === 'full') {
      if (!formState.responsibleId && formState.assigneeIds.length === 0) {
        errors.responsible = "Необходимо указать ответственного или исполнителей";
      }
    } else {
      if (formState.assigneeIds.length === 0) {
        errors.responsible = "Необходимо выбрать исполнитель";
      }
    }

    if (!formState.dueDate) {
      errors.dueDate = "Необходимо указать дедлайн";
    } else if (formState.dueDate < new Date()) {
      errors.dueDate = "Дедлайн не может быть в прошлом";
    }

    return errors;
  }, [formState, mode]);

  // Мемоизированные обработчики
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setValidationErrors({});

    try {
      const finalDueDate = new Date(formState.dueDate!);
      
      let finalAssigneeIds: string[];
      let responsibleId: string;

      if (mode === 'quick') {
        finalAssigneeIds = formState.assigneeIds;
        responsibleId = formState.assigneeIds[0] || "";
      } else {
        finalAssigneeIds = formState.assigneeIds.length > 0 
          ? formState.assigneeIds 
          : formState.responsibleId 
            ? [formState.responsibleId] 
            : [];
        responsibleId = formState.responsibleId || finalAssigneeIds[0] || "";
      }

      const totalEstimatedHours = formState.estimatedDays * 24 + 
        formState.estimatedHours + 
        (formState.estimatedMinutes / 60);

      const taskData = {
        title: formState.title.trim(),
        description: formState.description.trim(),
        priority: formState.priority,
        status: TaskStatus.NEW,
        type: formState.taskType,
        creator_id: formState.creatorId,
        responsible_id: responsibleId,
        assignees: finalAssigneeIds,
        observers: formState.observerIds,
        process_id: undefined,
        due_date: finalDueDate,
        tags: formState.tags,
        estimated_hours: totalEstimatedHours > 0 ? totalEstimatedHours : undefined,
        checklist: [],
      } as any;

      await onCreateTask(taskData);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating task:', error);
      setValidationErrors({ submit: 'Произошла ошибка при создании задачи' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, mode, validateForm, onCreateTask, onOpenChange]);

  const resetForm = useCallback(() => {
    setFormState(initialFormState);
    setValidationErrors({});
    setIsSubmitting(false);
    setMode(initialMode);
  }, [initialFormState, initialMode]);

  const handleCancel = useCallback(() => {
    resetForm();
    onOpenChange(false);
  }, [resetForm, onOpenChange]);

  // Проверка на изменения
  const hasChanges = useMemo(() => (
    formState.title.trim() !== "" || 
    formState.description.trim() !== "" || 
    formState.assigneeIds.length > 0 || 
    formState.observerIds.length > 0 ||
    formState.responsibleId !== "" ||
    formState.dueDate !== undefined ||
    formState.tags.length > 0
  ), [formState]);

  const expandToFullMode = useCallback(() => {
    setMode('full');
  }, []);

  // Мемоизированные обработчики тегов
  const handleTagsChange = useCallback((tags: string[]) => {
    updateFormState({ tags });
  }, [updateFormState]);

  // Рендер быстрой формы
  const renderQuickForm = useMemo(() => (
    <form onSubmit={handleSubmit} className="space-y-3 flex-1 overflow-y-auto p-[6px]">
      <TaskBasicInfo
        title={formState.title}
        onTitleChange={(title) => updateFormState({ title })}
        priority={formState.priority}
        onPriorityChange={(priority) => updateFormState({ priority })}
        responsibleId={formState.assigneeIds[0] || ""}
        onResponsibleChange={(userId) => updateFormState({ assigneeIds: [userId] })}
        users={availableUsers}
        getPositionText={getPositionText}
        errors={validationErrors}
      />

      <TaskDescriptionField
        description={formState.description}
        onDescriptionChange={(description) => updateFormState({ description })}
        placeholder="Краткое описание задачи..."
        showExpanded={false}
        minHeight={80}
        maxHeight={150}
      />

      <DateTimePicker
        label="Дедлайн"
        date={formState.dueDate}
        onDateChange={(dueDate) => updateFormState({ dueDate })}
        required={true}
        error={validationErrors.dueDate}
      />

      <div className="border-t pt-3">
        <Button
          type="button"
          variant="outline"
          onClick={expandToFullMode}
          className="w-full h-10 text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <Maximize2 className="h-4 w-4 mr-2" />
          Развернуть полную форму
        </Button>
      </div>

      <div className="flex gap-2 pt-3">
        <Button type="submit" className="flex-1 h-10" disabled={isSubmitting}>
          {isSubmitting ? 'Создание...' : 'Создать'}
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel} className="h-10">
          Отмена
        </Button>
      </div>
    </form>
  ), [
    formState, updateFormState, availableUsers, getPositionText, validationErrors,
    expandToFullMode, handleSubmit, isSubmitting, handleCancel
  ]);

  // Рендер полной формы
  const renderFullForm = useMemo(() => (
    <div className="flex-1 overflow-y-auto px-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основная информация */}
          <TaskBasicInfo
            title={formState.title}
            onTitleChange={(title) => updateFormState({ title })}
            priority={formState.priority}
            onPriorityChange={(priority) => updateFormState({ priority })}
            responsibleId={formState.responsibleId}
            onResponsibleChange={(userId) => updateFormState({ responsibleId: userId })}
            users={availableUsers}
            getPositionText={getPositionText}
            errors={validationErrors}
          />

          {/* Участники задачи */}
          <TaskParticipants
            assigneeIds={formState.assigneeIds}
            onAddAssignee={(userId) => updateFormState({ 
              assigneeIds: [...formState.assigneeIds, userId] 
            })}
            onRemoveAssignee={(userId) => updateFormState({ 
              assigneeIds: formState.assigneeIds.filter(id => id !== userId) 
            })}
            observerIds={formState.observerIds}
            onAddObserver={(userId) => updateFormState({ 
              observerIds: [...formState.observerIds, userId] 
            })}
            onRemoveObserver={(userId) => updateFormState({ 
              observerIds: formState.observerIds.filter(id => id !== userId) 
            })}
            users={availableUsers}
            getPositionText={getPositionText}
          />

          <Separator />

          {/* Описание с полным редактором */}
          <TaskDescriptionField
            description={formState.description}
            onDescriptionChange={(description) => updateFormState({ description })}
            placeholder="Подробное описание задачи, требования, ссылки на документы..."
            showExpanded={true}
            minHeight={150}
            maxHeight={300}
          />

          <Separator />

          {/* Даты и время */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DateTimePicker
              label="Дедлайн"
              date={formState.dueDate}
              onDateChange={(dueDate) => updateFormState({ dueDate })}
              required={true}
              error={validationErrors.dueDate}
            />
            
            <DurationInput
              days={formState.estimatedDays}
              hours={formState.estimatedHours}
              minutes={formState.estimatedMinutes}
              onDurationChange={(days, hours, minutes) => updateFormState({ 
                estimatedDays: days, 
                estimatedHours: hours, 
                estimatedMinutes: minutes 
              })}
              label="Оценка времени"
            />
          </div>

          <Separator />

          {/* Теги */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Теги
            </Label>
            <TagsSelector
              selectedTags={formState.tags}
              onTagsChange={handleTagsChange}
              placeholder="Выберите или создайте теги"
              maxTags={8}
              size="default"
              allowCreate={true}
            />
          </div>
        </form>
    </div>
  ), [
    formState, updateFormState, availableUsers, getPositionText, validationErrors,
    handleTagsChange, handleSubmit
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`w-full ${mode === 'quick' ? 'h-auto' : 'h-full sm:h-[90vh]'} p-2 max-[580px]:max-w-none max-[580px]:w-screen max-h-none m-0 sm:m-4 rounded-none sm:rounded-lg overflow-hidden flex flex-col ${
        mode === 'full' ? 'sm:max-w-4xl' : 'sm:max-w-md'
      }`}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {mode === 'quick' ? 'Быстрое создание задачи' : 'Создать задачу'}
          </DialogTitle>
        </DialogHeader>

        {/* Ошибки валидации */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mx-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-900 text-sm">
                  Необходимо исправить ошибки:
                </h4>
                <ul className="mt-1 text-sm text-red-800 space-y-1">
                  {Object.values(validationErrors).map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Контент */}
        {mode === 'quick' ? renderQuickForm : renderFullForm}

        {/* Кнопки для полного режима */}
        {mode === 'full' && (
          <div className="flex-shrink-0 border-t bg-gray-50 px-6 py-4">
            <div className="flex gap-3">
              <Button 
                onClick={handleSubmit}
                className="flex-1 h-12" 
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Создание задачи...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Создать задачу
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel} 
                className="h-12 px-8"
                disabled={isSubmitting}
              >
                Отмена
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
});

CreateTaskDialog.displayName = 'CreateTaskDialog';

export default CreateTaskDialog;