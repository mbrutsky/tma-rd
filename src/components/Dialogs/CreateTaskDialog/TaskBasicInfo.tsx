"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { TaskPriority, DatabaseUser } from "@/src/lib/models/types";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../../ui/select";
import { Label } from "../../ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";

interface TaskBasicInfoProps {
  title: string;
  onTitleChange: (title: string) => void;
  priority: TaskPriority;
  onPriorityChange: (priority: TaskPriority) => void;
  responsibleId: string;
  onResponsibleChange: (userId: string) => void;
  users: DatabaseUser[];
  getPositionText: (user: DatabaseUser) => string;
  errors?: {
    title?: string;
    responsible?: string;
    creator?: string;
  };
}

// Определение приоритетов с цветами без описаний
const PRIORITY_CONFIG = {
  [TaskPriority.CRITICAL]: {
    label: "1 - Критический",
    color: "bg-red-500",
  },
  [TaskPriority.HIGH]: {
    label: "2 - Высокий",
    color: "bg-orange-500",
  },
  [TaskPriority.MEDIUM]: {
    label: "3 - Средний",
    color: "bg-yellow-500",
  },
  [TaskPriority.LOW]: {
    label: "4 - Низкий",
    color: "bg-green-500",
  },
  [TaskPriority.VERY_LOW]: {
    label: "5 - Очень низкий",
    color: "bg-gray-500",
  },
};

export default function TaskBasicInfo({
  title,
  onTitleChange,
  priority,
  onPriorityChange,
  responsibleId,
  onResponsibleChange,
  users,
  getPositionText,
  errors = {},
}: TaskBasicInfoProps) {
  const availableUsers = users.filter((user) => user.is_active);
  const selectedResponsible = availableUsers.find(
    (u) => u.id === responsibleId
  );

  // Рендер пользователя для селекта
  const renderUserOption = (user: DatabaseUser) => (
    <div className="flex items-center gap-3 py-1">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={user.avatar || "/placeholder.svg"} />
        <AvatarFallback className="text-sm">
          {user.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start min-w-0 flex-1">
        <span className="font-medium text-sm truncate w-full">{user.name}</span>
        {/* <span className="text-xs text-gray-500 truncate text-start w-full">
          {getPositionText(user)}
        </span> */}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Название задачи */}
      <div>
        <Label htmlFor="title" className="text-sm font-medium">
          Название задачи <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Введите название задачи"
          required
          className={`h-12 text-base mt-1 ${
            errors.title ? "border-red-500" : ""
          }`}
        />
        {errors.title && (
          <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.title}</span>
          </div>
        )}
      </div>

      {/* Первая строка */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ответственный */}
        <div>
          <Label className="text-sm font-medium">
            Ответственный <span className="text-red-500">*</span>
          </Label>
          <Select value={responsibleId} onValueChange={onResponsibleChange}>
            <SelectTrigger
              className={`h-12 mt-1 ${
                errors.responsible ? "border-red-500" : ""
              }`}
            >
              {selectedResponsible ? (
                renderUserOption(selectedResponsible)
              ) : (
                <span className="text-gray-400">Выберите ответственного</span>
              )}
            </SelectTrigger>
            <SelectContent className="z-[1000]">
              <div className="p-2 border-b">
                <p className="text-xs text-gray-600">
                  Основной исполнитель, отвечающий за результат
                </p>
              </div>
              {availableUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {renderUserOption(user)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.responsible && (
            <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.responsible}</span>
            </div>
          )}
        </div>

        {/* Приоритет */}
        <div>
          <Label className="text-sm font-medium">Приоритет</Label>
          <Select
            value={priority.toString()}
            onValueChange={(value) =>
              onPriorityChange(Number(value) as TaskPriority)
            }
          >
            <SelectTrigger className="h-12 mt-1">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 ${PRIORITY_CONFIG[priority].color} rounded-full`}
                ></div>
                <span>{PRIORITY_CONFIG[priority].label}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="z-[1000]">
              {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 ${config.color} rounded-full`}
                    ></div>
                    <span className="font-medium">{config.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
