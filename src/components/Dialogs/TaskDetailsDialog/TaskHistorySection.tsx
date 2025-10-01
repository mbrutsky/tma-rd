"use client";


import {
  History,
  AlertTriangle,
  User,
  Calendar,
  Flag,
  FileText,
  MessageSquare,
  CheckSquare,
  Eye,
  Clock,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { DatabaseHistoryEntry, DatabaseUser, HistoryActionType } from "@/src/lib/models/types";
import { Badge } from "../../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";

interface TaskHistorySectionProps {
  history: DatabaseHistoryEntry[];
  getUserById: (id: string) => DatabaseUser | undefined;
}

// Функция для получения иконки в зависимости от типа действия
const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case HistoryActionType.CREATED:
      return <FileText className="h-4 w-4 text-green-600" />;
    case HistoryActionType.STATUS_CHANGED:
      return <Flag className="h-4 w-4 text-blue-600" />;
    case HistoryActionType.ASSIGNED:
    case HistoryActionType.ASSIGNEE_CHANGED:
      return <User className="h-4 w-4 text-purple-600" />;
    case HistoryActionType.UNASSIGNED:
      return <User className="h-4 w-4 text-gray-600" />;
    case HistoryActionType.DEADLINE_CHANGED:
      return <Calendar className="h-4 w-4 text-orange-600" />;
    case HistoryActionType.PRIORITY_CHANGED:
      return <Flag className="h-4 w-4 text-red-600" />;
    case HistoryActionType.TITLE_CHANGED:
    case HistoryActionType.DESCRIPTION_CHANGED:
      return <FileText className="h-4 w-4 text-indigo-600" />;
    case HistoryActionType.COMMENT_ADDED:
    case HistoryActionType.COMMENT_EDITED:
    case HistoryActionType.COMMENT_DELETED:
      return <MessageSquare className="h-4 w-4 text-cyan-600" />;
    case HistoryActionType.CHECKLIST_UPDATED:
      return <CheckSquare className="h-4 w-4 text-emerald-600" />;
    case HistoryActionType.OBSERVER_ADDED:
    case HistoryActionType.OBSERVER_REMOVED:
      return <Eye className="h-4 w-4 text-yellow-600" />;
    case HistoryActionType.REMINDER_SENT:
      return <Clock className="h-4 w-4 text-pink-600" />;
    case HistoryActionType.SERVICE_NOTE_SENT:
    case HistoryActionType.EXPLANATORY_NOTE_SENT:
      return <Target className="h-4 w-4 text-rose-600" />;
    default:
      return <History className="h-4 w-4 text-blue-600" />;
  }
};

// Функция для получения цвета фона в зависимости от типа действия
const getActionBgColor = (actionType: string) => {
  switch (actionType) {
    case HistoryActionType.CREATED:
      return "bg-green-100";
    case HistoryActionType.STATUS_CHANGED:
      return "bg-blue-100";
    case HistoryActionType.ASSIGNED:
    case HistoryActionType.ASSIGNEE_CHANGED:
      return "bg-purple-100";
    case HistoryActionType.UNASSIGNED:
      return "bg-gray-100";
    case HistoryActionType.DEADLINE_CHANGED:
      return "bg-orange-100";
    case HistoryActionType.PRIORITY_CHANGED:
      return "bg-red-100";
    case HistoryActionType.TITLE_CHANGED:
    case HistoryActionType.DESCRIPTION_CHANGED:
      return "bg-indigo-100";
    case HistoryActionType.COMMENT_ADDED:
    case HistoryActionType.COMMENT_EDITED:
    case HistoryActionType.COMMENT_DELETED:
      return "bg-cyan-100";
    case HistoryActionType.CHECKLIST_UPDATED:
      return "bg-emerald-100";
    case HistoryActionType.OBSERVER_ADDED:
    case HistoryActionType.OBSERVER_REMOVED:
      return "bg-yellow-100";
    case HistoryActionType.REMINDER_SENT:
      return "bg-pink-100";
    case HistoryActionType.SERVICE_NOTE_SENT:
    case HistoryActionType.EXPLANATORY_NOTE_SENT:
      return "bg-rose-100";
    default:
      return "bg-blue-100";
  }
};

// Функция для получения читаемого названия действия
const getActionLabel = (actionType: string) => {
  switch (actionType) {
    case HistoryActionType.CREATED:
      return "Создание";
    case HistoryActionType.STATUS_CHANGED:
      return "Смена статуса";
    case HistoryActionType.ASSIGNED:
      return "Назначение";
    case HistoryActionType.UNASSIGNED:
      return "Снятие назначения";
    case HistoryActionType.ASSIGNEE_CHANGED:
      return "Изменение исполнителя";
    case HistoryActionType.DEADLINE_CHANGED:
      return "Изменение дедлайна";
    case HistoryActionType.PRIORITY_CHANGED:
      return "Изменение приоритета";
    case HistoryActionType.TITLE_CHANGED:
      return "Изменение названия";
    case HistoryActionType.DESCRIPTION_CHANGED:
      return "Изменение описания";
    case HistoryActionType.COMMENT_ADDED:
      return "Добавление комментария";
    case HistoryActionType.COMMENT_EDITED:
      return "Редактирование комментария";
    case HistoryActionType.COMMENT_DELETED:
      return "Удаление комментария";
    case HistoryActionType.CHECKLIST_UPDATED:
      return "Обновление чек-листа";
    case HistoryActionType.ATTACHMENT_ADDED:
      return "Добавление вложения";
    case HistoryActionType.ATTACHMENT_REMOVED:
      return "Удаление вложения";
    case HistoryActionType.OBSERVER_ADDED:
      return "Добавление наблюдателя";
    case HistoryActionType.OBSERVER_REMOVED:
      return "Удаление наблюдателя";
    case HistoryActionType.REMINDER_SENT:
      return "Отправка напоминания";
    case HistoryActionType.SERVICE_NOTE_SENT:
      return "Служебная записка";
    case HistoryActionType.EXPLANATORY_NOTE_SENT:
      return "Объяснительная записка";
    default:
      return "Действие";
  }
};

// Функция для форматирования дополнительной информации
const formatAdditionalInfo = (entry: DatabaseHistoryEntry) => {
  if (!entry.old_value && !entry.new_value && !entry.additional_data) {
    return null;
  }

  const renderValue = (value: any, label: string) => {
    if (!value) return null;

    // Если значение - объект, попробуем извлечь полезную информацию
    if (typeof value === "object") {
      if (value.name) return `${label}: ${value.name}`;
      if (value.title) return `${label}: ${value.title}`;
      return `${label}: ${JSON.stringify(value)}`;
    }

    return `${label}: ${value}`;
  };

  return (
    <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
      {entry.old_value && <div>{renderValue(entry.old_value, "Было")}</div>}
      {entry.new_value && <div>{renderValue(entry.new_value, "Стало")}</div>}
      {entry.additional_data && typeof entry.additional_data === "object" && (
        <div className="mt-1">
          {Object.entries(entry.additional_data).map(([key, value]) => (
            <div key={key}>
              {key}:{" "}
              {typeof value === "object"
                ? JSON.stringify(value)
                : String(value)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function TaskHistorySection({
  history,
  getUserById,
}: TaskHistorySectionProps) {
  const sortedHistory = [...history].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="h-full">
      <div className="h-full pr-4 pb-6 overflow-y-auto">
        <div className="space-y-3">
          {sortedHistory.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm text-gray-500">История изменений пуста</p>
              <p className="text-xs text-gray-400 mt-1">
                Все изменения задачи будут отображаться здесь
              </p>
            </div>
          ) : (
            <>
              {/* Заголовок с общей информацией */}
              <div className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">
                    История изменений
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {sortedHistory.length} записей
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Показаны последние изменения в хронологическом порядке
                </p>
              </div>

              {/* Список записей истории */}
              {sortedHistory.map((entry, index) => {
                const user = getUserById(entry.user_id || "");
                const isSystemEntry =
                  entry.user_id === "system" || !entry.user_id;
                const isFirstEntry = index === sortedHistory.length - 1; // Самая старая запись
                const isLastEntry = index === 0; // Самая новая запись

                return (
                  <div
                    key={entry.id}
                    className={`relative flex gap-3 p-4 rounded-lg border transition-all hover:shadow-sm ${
                      isLastEntry
                        ? "bg-blue-50 border-blue-200"
                        : isSystemEntry
                        ? "bg-orange-50 border-orange-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    {/* Линия соединения между записями */}
                    {!isFirstEntry && (
                      <div className="absolute left-7 -bottom-3 w-0.5 h-6 bg-gray-200" />
                    )}

                    {/* Иконка действия */}
                    <div
                      className={`flex-shrink-0 p-2 rounded-full h-fit ${getActionBgColor(
                        entry.action_type
                      )}`}
                    >
                      {isSystemEntry ? (
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                      ) : (
                        getActionIcon(entry.action_type)
                      )}
                    </div>

                    {/* Содержимое записи */}
                    <div className="flex-1 min-w-0">
                      {/* Заголовок с информацией о действии */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {!isFirstEntry && (
                              <Badge
                                variant="outline"
                                className="text-xs font-medium"
                              >
                                {getActionLabel(entry.action_type)}
                              </Badge>
                            )}
                            {!isFirstEntry && isLastEntry && (
                              <Badge
                                variant="default"
                                className="text-xs bg-blue-600"
                              >
                                Последнее
                              </Badge>
                            )}
                            {isFirstEntry && (
                              <Badge
                                variant="outline"
                                className="text-xs border-green-300 text-green-700"
                              >
                                Создание
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-gray-700 leading-relaxed">
                            {entry.description}
                          </p>

                          {/* Дополнительная информация о изменениях */}
                          {formatAdditionalInfo(entry)}
                        </div>

                        {/* Время */}
                        <div className="flex-shrink-0 ml-4 text-right">
                          <span className="text-xs text-gray-500">
                            {format(entry.created_at, "d MMM", { locale: ru })}
                          </span>
                          <br />
                          <span className="text-xs text-gray-400">
                            {format(entry.created_at, "HH:mm", { locale: ru })}
                          </span>
                        </div>
                      </div>

                      {/* Информация о пользователе */}
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200">
                        {isSystemEntry ? (
                          <>
                            <div className="w-5 h-5 rounded-full bg-orange-200 flex items-center justify-center">
                              <AlertTriangle className="h-3 w-3 text-orange-600" />
                            </div>
                            <span className="text-xs text-gray-600 italic">
                              Системное действие
                            </span>
                          </>
                        ) : user ? (
                          <>
                            <Avatar className="h-5 w-5">
                              <AvatarImage
                                src={user.avatar || "/placeholder.svg"}
                                alt={user.name}
                              />
                              <AvatarFallback className="text-xs">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-gray-600">
                              {user.name}
                            </span>
                            {user.position && (
                              <span className="text-xs text-gray-400">
                                • {user.position}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-3 w-3 text-gray-500" />
                            </div>
                            <span className="text-xs text-gray-500 italic">
                              Неизвестный пользователь
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
