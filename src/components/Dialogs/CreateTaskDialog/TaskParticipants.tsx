'use client';

import React from 'react';
import MultipleUserSelect from "./MultipleUserSelect";
import { DatabaseUser } from '@/src/lib/models/types';
import { Label } from '../../ui/label';

interface TaskParticipantsProps {
  assigneeIds: string[];
  onAddAssignee: (userId: string) => void;
  onRemoveAssignee: (userId: string) => void;
  observerIds: string[];
  onAddObserver: (userId: string) => void;
  onRemoveObserver: (userId: string) => void;
  users: DatabaseUser[];
  getPositionText: (user: DatabaseUser) => string;
  className?: string;
}

export default function TaskParticipants({
  assigneeIds,
  onAddAssignee,
  onRemoveAssignee,
  observerIds,
  onAddObserver,
  onRemoveObserver,
  users,
  getPositionText,
  className = "",
}: TaskParticipantsProps) {
  const availableUsers = users.filter((user) => user.is_active);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="border-t pt-4">
        <h3 className="text-base font-medium text-gray-900 mb-4">
          Участники задачи
        </h3>
        
        <div className="space-y-4">
          {/* Соисполнители */}
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Соисполнители
            </Label>
            <p className="text-xs text-gray-500 mb-2">
              Пользователи, которые будут выполнять задачу совместно с ответственным
            </p>
            <MultipleUserSelect
              users={availableUsers}
              selectedIds={assigneeIds}
              onAdd={onAddAssignee}
              onRemove={onRemoveAssignee}
              placeholder="Нажмите, чтобы добавить соисполнителей"
              getPositionText={getPositionText}
              maxSelections={10} // Ограничение на количество исполнителей
            />
          </div>

          {/* Наблюдатели */}
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Наблюдатели
            </Label>
            <p className="text-xs text-gray-500 mb-2">
              Пользователи, которые будут получать уведомления о ходе выполнения
            </p>
            <MultipleUserSelect
              users={availableUsers}
              selectedIds={observerIds}
              onAdd={onAddObserver}
              onRemove={onRemoveObserver}
              placeholder="Нажмите, чтобы добавить наблюдателей"
              getPositionText={getPositionText}
            />
          </div>
        </div>
      </div>
    </div>
  );
}