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
  MessageSquare,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  useGetTelegramGroupsQuery,
  useUpdateTelegramGroupMutation,
} from "@/src/lib/store/api/telegramGroupsApi";

export default function TelegramGroupsSection() {
  const {
    data: telegramGroups = [],
    isLoading: telegramGroupsLoading,
    error: telegramGroupsError,
  } = useGetTelegramGroupsQuery();
  const [updateTelegramGroup] = useUpdateTelegramGroupMutation();

  // Функция для показа уведомлений
  const showNotification = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 transition-all duration-300 ${
      type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
    }`;

    const icon =
      type === "success"
        ? '<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>'
        : '<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>';

    notification.innerHTML = `
      ${icon}
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" class="ml-2 hover:opacity-80">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
        </svg>
      </button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.transform = "translateX(100%)";
        setTimeout(() => {
          if (notification.parentNode) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);
  };

  // Обработчики для Telegram групп
  const handleToggleTelegramGroup = async (
    groupId: string,
    isActive: boolean
  ) => {
    try {
      await updateTelegramGroup({
        id: groupId,
        isActive: !isActive,
      }).unwrap();

      showNotification(
        `Telegram группа ${!isActive ? "активирована" : "деактивирована"}`,
        "success"
      );
    } catch (error) {
      console.error("Error toggling Telegram group:", error);
      showNotification("Ошибка при изменении статуса группы", "error");
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Telegram группы
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Управление интеграцией с Telegram группами для постановки задач
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
        {/* Индикатор загрузки */}
        {telegramGroupsLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">
              Загрузка Telegram групп...
            </span>
          </div>
        )}

        {/* Ошибка загрузки */}
        {telegramGroupsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span>Ошибка загрузки Telegram групп</span>
            </div>
          </div>
        )}

        {/* Список Telegram групп */}
        {!telegramGroupsLoading && !telegramGroupsError && (
          <div className="space-y-3">
            {telegramGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <div className="text-lg mb-2">
                  Нет подключенных Telegram групп
                </div>
                <div className="text-sm">
                  Подключите Telegram бота к группам для получения задач
                </div>
              </div>
            ) : (
              telegramGroups.map((group) => (
                <div
                  key={group.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        group.isActive ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-gray-900">
                          ID Telegram Группы
                        </h4>
                        <Badge
                          variant={
                            group.isActive ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {group.isActive ? "Активна" : "Неактивна"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 font-mono break-all">
                        {group.chatId}
                      </p>
                      {group.defaultAssigneeName && (
                        <p className="text-xs text-gray-500">
                          Ответственный: {group.defaultAssigneeName}
                          {group.defaultAssigneePosition &&
                            ` (${group.defaultAssigneePosition})`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    {/* Переключатель активности */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={group.isActive}
                        onCheckedChange={() =>
                          handleToggleTelegramGroup(
                            group.id,
                            group.isActive
                          )
                        }
                      />
                      <Label
                        className="text-sm cursor-pointer"
                        onClick={() =>
                          handleToggleTelegramGroup(
                            group.id,
                            group.isActive
                          )
                        }
                      >
                        {group.isActive ? "Активна" : "Неактивна"}
                      </Label>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}