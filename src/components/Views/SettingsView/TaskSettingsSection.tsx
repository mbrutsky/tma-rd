import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { Badge } from "@/src/components/ui/badge";
import {
  CheckSquare,
  AlertCircle,
} from "lucide-react";

interface TaskSettings {
  allowAssigneeEditTask: boolean;
  allowAssigneeDeleteTask: boolean;
  allowAssigneeChangeDeadline: boolean;
  allowAssigneeChangePriority: boolean;
  allowAssigneeChangeAssignees: boolean;
  requireApprovalForCompletion: boolean;
}

interface TaskSettingsSectionProps {
  taskSettings: TaskSettings;
  onTaskSettingChange: (key: keyof TaskSettings, value: boolean) => void;
}

export default function TaskSettingsSection({ 
  taskSettings, 
  onTaskSettingChange 
}: TaskSettingsSectionProps) {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckSquare className="h-5 w-5" />
          Права исполнителей задач
        </CardTitle>
        <p className="text-sm text-gray-600">
          Настройте, какие действия могут выполнять исполнители с
          назначенными им задачами
        </p>
      </CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6 pt-0">
        {/* Редактирование задач */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 border-b pb-2">
            Редактирование задач
          </h4>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 gap-3">
            <div className="space-y-1 flex-1">
              <Label className="font-medium">
                Разрешить редактирование задачи
              </Label>
              <p className="text-sm text-gray-600">
                Исполнитель может изменять название и описание задачи
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Switch
                checked={taskSettings.allowAssigneeEditTask}
                onCheckedChange={(checked) =>
                  onTaskSettingChange(
                    "allowAssigneeEditTask",
                    checked
                  )
                }
              />
              <Badge
                variant={
                  taskSettings.allowAssigneeEditTask
                    ? "default"
                    : "secondary"
                }
                className="text-xs"
              >
                {taskSettings.allowAssigneeEditTask
                  ? "Разрешено"
                  : "Запрещено"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 gap-3">
            <div className="space-y-1 flex-1">
              <Label className="font-medium">
                Разрешить удаление задач
              </Label>
              <p className="text-sm text-gray-600">
                Исполнитель может удалять назначенные ему задачи
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Switch
                checked={taskSettings.allowAssigneeDeleteTask}
                onCheckedChange={(checked) =>
                  onTaskSettingChange(
                    "allowAssigneeDeleteTask",
                    checked
                  )
                }
              />
              <Badge
                variant={
                  taskSettings.allowAssigneeDeleteTask
                    ? "default"
                    : "secondary"
                }
                className="text-xs"
              >
                {taskSettings.allowAssigneeDeleteTask
                  ? "Разрешено"
                  : "Запрещено"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Изменение параметров */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 border-b pb-2">
            Изменение параметров задачи
          </h4>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 gap-3">
            <div className="space-y-1 flex-1">
              <Label className="font-medium">Изменение дедлайна</Label>
              <p className="text-sm text-gray-600">
                Исполнитель может переносить сроки выполнения
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Switch
                checked={taskSettings.allowAssigneeChangeDeadline}
                onCheckedChange={(checked) =>
                  onTaskSettingChange(
                    "allowAssigneeChangeDeadline",
                    checked
                  )
                }
              />
              <Badge
                variant={
                  taskSettings.allowAssigneeChangeDeadline
                    ? "default"
                    : "secondary"
                }
                className="text-xs"
              >
                {taskSettings.allowAssigneeChangeDeadline
                  ? "Разрешено"
                  : "Запрещено"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 gap-3">
            <div className="space-y-1 flex-1">
              <Label className="font-medium">Изменение приоритета</Label>
              <p className="text-sm text-gray-600">
                Исполнитель может менять приоритет задачи
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Switch
                checked={taskSettings.allowAssigneeChangePriority}
                onCheckedChange={(checked) =>
                  onTaskSettingChange(
                    "allowAssigneeChangePriority",
                    checked
                  )
                }
              />
              <Badge
                variant={
                  taskSettings.allowAssigneeChangePriority
                    ? "default"
                    : "secondary"
                }
                className="text-xs"
              >
                {taskSettings.allowAssigneeChangePriority
                  ? "Разрешено"
                  : "Запрещено"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 gap-3">
            <div className="space-y-1 flex-1">
              <Label className="font-medium">
                Изменение исполнителей
              </Label>
              <p className="text-sm text-gray-600">
                Исполнитель может добавлять/удалять других исполнителей
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Switch
                checked={taskSettings.allowAssigneeChangeAssignees}
                onCheckedChange={(checked) =>
                  onTaskSettingChange(
                    "allowAssigneeChangeAssignees",
                    checked
                  )
                }
              />
              <Badge
                variant={
                  taskSettings.allowAssigneeChangeAssignees
                    ? "default"
                    : "secondary"
                }
                className="text-xs"
              >
                {taskSettings.allowAssigneeChangeAssignees
                  ? "Разрешено"
                  : "Запрещено"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Завершение задач */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 border-b pb-2">
            Завершение задач
          </h4>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 gap-3">
            <div className="space-y-1 flex-1">
              <Label className="font-medium">
                Требовать подтверждение завершения
              </Label>
              <p className="text-sm text-gray-600">
                Задача будет отправляться на контроль постановщику
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Switch
                checked={taskSettings.requireApprovalForCompletion}
                onCheckedChange={(checked) =>
                  onTaskSettingChange(
                    "requireApprovalForCompletion",
                    checked
                  )
                }
              />
              <Badge
                variant={
                  taskSettings.requireApprovalForCompletion
                    ? "default"
                    : "secondary"
                }
                className="text-xs"
              >
                {taskSettings.requireApprovalForCompletion
                  ? "Включено"
                  : "Отключено"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Информационное сообщение */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1 text-sm sm:text-base">
                Рекомендации по настройке
              </h4>
              <p className="text-xs sm:text-sm text-blue-800">
                Для строгого контроля рекомендуется запретить исполнителям
                изменение параметров задач. Постановщики и руководители
                всегда имеют полные права независимо от этих настроек.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
