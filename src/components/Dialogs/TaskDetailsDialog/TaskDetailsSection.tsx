"use client";

import { useState } from "react";
import { ChevronDown, X, Plus } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  DatabaseUser,
  TaskPriority,
  DatabaseBusinessProcess,
} from "@/src/lib/models/types";
import { Input } from "../../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar } from "../../ui/calendar";
import { Button } from "../../ui/button";

interface TaskDetailsSectionProps {
  creatorId: string;
  creator?: DatabaseUser;
  onCreatorChange: (userId: string) => void;

  assigneeIds: string[];
  assignees: DatabaseUser[];
  onAddAssignee: (userId: string) => void;
  onRemoveAssignee: (userId: string) => void;

  dueDate: Date;
  onDueDateChange: (date: Date) => void;

  priority: TaskPriority;
  onPriorityChange: (priority: TaskPriority) => void;

  observerIds: string[];
  observers: DatabaseUser[];
  onAddObserver: (userId: string) => void;
  onRemoveObserver: (userId: string) => void;

  processId: string;
  process?: DatabaseBusinessProcess;
  onProcessChange: (processId: string) => void;

  tags: string[];
  onTagsChange: (tags: string[]) => void;
  onTagsBlur: () => void;

  users: DatabaseUser[];
  businessProcesses: DatabaseBusinessProcess[];
  canEdit: boolean;
}

export default function TaskDetailsSection({
  creatorId,
  creator,
  onCreatorChange,
  assigneeIds,
  assignees,
  onAddAssignee,
  onRemoveAssignee,
  dueDate,
  onDueDateChange,
  priority,
  onPriorityChange,
  observerIds,
  observers,
  onAddObserver,
  onRemoveObserver,
  processId,
  process,
  onProcessChange,
  tags,
  onTagsChange,
  onTagsBlur,
  users,
  businessProcesses,
  canEdit,
}: TaskDetailsSectionProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const readonly = !canEdit;

  const handleDateSelect = (date: Date | undefined) => {
    if (readonly) return;
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(dueDate.getHours(), dueDate.getMinutes());
      onDueDateChange(newDate);
      setIsCalendarOpen(false);
    }
  };

  const handleTimeChange = (timeValue: string) => {
    if (readonly) return;
    const [hours, minutes] = timeValue.split(":").map(Number);
    const newDate = new Date(dueDate);
    newDate.setHours(hours, minutes);
    onDueDateChange(newDate);
  };

  return (
    <div className="grid grid-cols-2 max-[540px]:grid-cols-1 gap-4 text-sm mt-2" aria-readonly={readonly}>
      {/* Постановщик */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-1 block">Постановщик</Label>
        <Select
          value={creatorId}
          onValueChange={(val) => (!readonly ? onCreatorChange(val) : undefined)}
          disabled={readonly}
        >
          <SelectTrigger className="h-8" disabled={readonly}>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={creator?.avatar || "/placeholder.svg"} />
                <AvatarFallback>{creator?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span>{creator?.name}</span>
            </div>
          </SelectTrigger>
          <SelectContent className="z-[1000]">
            {users
              .filter((u) => u.is_active)
              .map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Исполнители */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-1 block">Исполнители</Label>
        <div
          className={`flex items-center gap-1 border border-dashed rounded-lg px-2 py-2 min-h-[40px] flex-wrap ${
            readonly ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:bg-gray-50"
          }`}
          onClick={() => {
            if (readonly) return;
            (document.querySelector("[data-assignee-select]") as HTMLButtonElement | null)?.click();
          }}
        >
          {assignees.map((assignee) => (
            <Badge key={assignee.id} variant="secondary" className="flex items-center gap-1 m-0.5">
              <Avatar className="h-4 w-4">
                <AvatarImage src={assignee.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-xs">{assignee.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-xs">{assignee.name}</span>
              {!readonly && (
                <X
                  className="h-3 w-3 cursor-pointer text-gray-500 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveAssignee(assignee.id);
                  }}
                />
              )}
            </Badge>
          ))}

          <Select onValueChange={(val) => (!readonly ? onAddAssignee(val) : undefined)} disabled={readonly}>
            <SelectTrigger
              className="h-6 w-6 border-none shadow-none p-0 bg-transparent"
              data-assignee-select
              disabled={readonly}
            >
              <Plus className="h-4 w-4 text-gray-400" />
            </SelectTrigger>
            <SelectContent className="z-[1000]">
              {users
                .filter((u) => u.is_active && !assigneeIds.includes(u.id))
                .map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {assignees.length === 0 && (
            <span className="text-gray-400 text-sm">
              {readonly ? "Нет исполнителей" : "Нажмите, чтобы добавить"}
            </span>
          )}
        </div>
      </div>

      {/* Дедлайн */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-1 block">Дедлайн</Label>
        <Popover open={!readonly ? isCalendarOpen : false} onOpenChange={!readonly ? setIsCalendarOpen : undefined}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between text-left font-normal h-8" disabled={readonly}>
              {format(dueDate, "d MMMM yyyy, HH:mm", { locale: ru })}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              captionLayout="dropdown"
              onSelect={handleDateSelect}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
              initialFocus
            />
            <div className="p-3 border-t">
              <Label className="text-sm">Время:</Label>
              <Input
                type="time"
                value={format(dueDate, "HH:mm")}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="mt-1 z-[1000] bg-background"
                readOnly={readonly}
                disabled={readonly}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Приоритет */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-1 block">Приоритет</Label>
        <Select
          value={priority.toString()}
          onValueChange={(val) => (!readonly ? onPriorityChange(Number(val) as TaskPriority) : undefined)}
          disabled={readonly}
        >
          <SelectTrigger className="h-8" disabled={readonly}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[1000]">
            <SelectItem value="1">1 - Критический</SelectItem>
            <SelectItem value="2">2 - Высокий</SelectItem>
            <SelectItem value="3">3 - Средний</SelectItem>
            <SelectItem value="4">4 - Низкий</SelectItem>
            <SelectItem value="5">5 - Очень низкий</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Наблюдатели */}
      <div className="col-span-2 max-[540px]:col-span-1">
        <Label className="text-sm font-medium text-gray-700 mb-2 block">Наблюдатели</Label>
        <div
          className={`flex items-center gap-1 border border-dashed rounded-lg px-2 py-2 min-h-[40px] flex-wrap ${
            readonly ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:bg-gray-50"
          }`}
          onClick={() => {
            if (readonly) return;
            (document.querySelector("[data-observer-select]") as HTMLButtonElement | null)?.click();
          }}
        >
          {observers.map((observer) => (
            <Badge key={observer.id} variant="outline" className="flex items-center gap-1 m-0.5">
              <Avatar className="h-4 w-4">
                <AvatarImage src={observer.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-xs">{observer.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-xs">{observer.name}</span>
              {!readonly && (
                <X
                  className="h-3 w-3 cursor-pointer text-gray-500 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveObserver(observer.id);
                  }}
                />
              )}
            </Badge>
          ))}

          <Select onValueChange={(val) => (!readonly ? onAddObserver(val) : undefined)} disabled={readonly}>
            <SelectTrigger
              className="h-6 w-6 border-none shadow-none p-0 bg-transparent"
              data-observer-select
              disabled={readonly}
            >
              <Plus className="h-4 w-4 text-gray-400" />
            </SelectTrigger>
            <SelectContent className="z-[1000]">
              {users
                .filter((u) => u.is_active && !observerIds.includes(u.id))
                .map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {observers.length === 0 && (
            <span className="text-gray-400 text-sm">
              {readonly ? "Нет наблюдателей" : "Нажмите, чтобы добавить"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
