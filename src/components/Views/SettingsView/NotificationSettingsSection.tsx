import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Bell,
  MessageSquare,
  AlertCircle,
  Settings,
} from "lucide-react";

export default function NotificationSettingsSection() {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5" />
          Управление уведомлениями
        </CardTitle>
        <p className="text-sm text-gray-600">
          Настройки отправки уведомлений пользователям системы
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
        {/* Настройки типов уведомлений */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 border-b pb-2">
            Типы уведомлений
          </h4>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <h5 className="font-medium text-sm sm:text-base">
                  Уведомления о задачах
                </h5>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-3">
                Назначение, изменение статуса, приближение дедлайнов
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded"
                  />
                  <span className="text-xs sm:text-sm">Telegram</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded"
                  />
                  <span className="text-xs sm:text-sm">Email</span>
                </label>
              </div>
            </div>

            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <h5 className="font-medium text-sm sm:text-base">
                  Просрочки и напоминания
                </h5>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-3">
                Просроченные задачи и автоматические напоминания
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded"
                  />
                  <span className="text-xs sm:text-sm">Telegram</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded"
                  />
                  <span className="text-xs sm:text-sm">Email</span>
                </label>
              </div>
            </div>

            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <h5 className="font-medium text-sm sm:text-base">
                  Комментарии и результаты
                </h5>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-3">
                Новые комментарии и результаты выполнения
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded"
                  />
                  <span className="text-xs sm:text-sm">Telegram</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded"
                  />
                  <span className="text-xs sm:text-sm">Email</span>
                </label>
              </div>
            </div>

            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Settings className="h-5 w-5 text-gray-600" />
                <h5 className="font-medium text-sm sm:text-base">
                  Системные уведомления
                </h5>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-3">
                Обновления системы, изменения настроек
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-xs sm:text-sm">Telegram</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded"
                  />
                  <span className="text-xs sm:text-sm">Email</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Расписание отправки */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 border-b pb-2">
            Расписание отправки
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Рабочие часы</Label>
              <div className="flex gap-2 mt-2">
                <Select defaultValue="9">
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[1000]">
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="self-center">—</span>
                <Select defaultValue="18">
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[1000]">
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Рабочие дни</Label>
              <div className="grid grid-cols-7 gap-1 sm:flex sm:gap-2 mt-2 text-xs sm:text-sm">
                {["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"].map(
                  (day, index) => (
                    <label
                      key={day}
                      className="flex flex-col sm:flex-row items-center justify-center sm:justify-start"
                    >
                      <input
                        type="checkbox"
                        defaultChecked={index < 5}
                        className="rounded mb-1 sm:mb-0 sm:mr-1"
                      />
                      <span className="text-xs">{day}</span>
                    </label>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs sm:text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Уведомления вне рабочих часов будут отправляться в начале
              следующего рабочего дня
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}