"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  Users,
  CheckSquare,
  Shield,
  Bell,
} from "lucide-react";
import { DatabaseUser, UserRole } from "@/src/lib/models/types";
import {
  useUpdateUserMutation,
} from "@/src/lib/store/api/usersApi";

// Импортируем декомпозированные компоненты
import PlanInfoSection from "./PlanInfoSection";
import UsersManagementSection from "./UsersManagementSection";
import TelegramGroupsSection from "./TelegramGroupsSection";
import TaskSettingsSection from "./TaskSettingsSection";
import ExportDataSection from "./ExportDataSection";
import NotificationSettingsSection from "./NotificationSettingsSection";
import EditUserDialog from "./EditUserDialog";

interface SettingsViewProps {
  currentUser: DatabaseUser;
}

interface TaskSettings {
  allowAssigneeEditTask: boolean;
  allowAssigneeDeleteTask: boolean;
  allowAssigneeChangeDeadline: boolean;
  allowAssigneeChangePriority: boolean;
  allowAssigneeChangeAssignees: boolean;
  requireApprovalForCompletion: boolean;
}

interface EditingUser {
  id: string;
  name: string;
  position: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
}

export default function SettingsView({ currentUser }: SettingsViewProps) {
  // Проверяем права доступа
  if (currentUser.role !== UserRole.DIRECTOR && currentUser.role !== UserRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <Shield className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Доступ ограничен
        </h2>
        <p className="text-gray-500">Настройки доступны только директору</p>
      </div>
    );
  }

  const [updateUser] = useUpdateUserMutation();

  // Локальные состояния
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Настройки задач
  const [taskSettings, setTaskSettings] = useState<TaskSettings>({
    allowAssigneeEditTask: false,
    allowAssigneeDeleteTask: false,
    allowAssigneeChangeDeadline: false,
    allowAssigneeChangePriority: false,
    allowAssigneeChangeAssignees: false,
    requireApprovalForCompletion: true,
  });

  // Открытие диалога редактирования пользователя
  const handleEditUser = (user: DatabaseUser) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      position: user.position || "",
      email: user.email || "",
      role: user.role,
      isActive: user.is_active,
      avatar: user.avatar || "",
    });
    setIsEditDialogOpen(true);
  };

  // Обновление аватара в форме редактирования
  const handleAvatarChange = (avatarUrl: string) => {
    if (editingUser) {
      setEditingUser({
        ...editingUser,
        avatar: avatarUrl,
      });
    }
  };

  // Сохранение изменений пользователя
  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      await updateUser({
        id: editingUser.id,
        updates: {
          name: editingUser.name,
          position: editingUser.position,
          email: editingUser.email,
          role: editingUser.role,
          is_active: editingUser.isActive,
          avatar: editingUser.avatar,
        },
      }).unwrap();

      setIsEditDialogOpen(false);
      setEditingUser(null);

      // Показываем уведомление об успехе
      showNotification("Данные пользователя обновлены", "success");
    } catch (error) {
      console.error("Error updating user:", error);
      showNotification("Ошибка при обновлении данных пользователя", "error");
    }
  };

  // Отмена редактирования
  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingUser(null);
  };

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

    // Автоматическое скрытие через 5 секунд
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

  const handleTaskSettingChange = (key: keyof TaskSettings, value: boolean) => {
    setTaskSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4 p-2 sm:p-0">
      <Tabs defaultValue="general" className="space-y-4">
        {/* <TabsList className="grid w-full grid-cols-3 h-auto"> */}
        <TabsList className="grid w-full grid-cols-1 h-auto">
          <TabsTrigger
            value="general"
            className="flex flex-col sm:flex-row w-full items-center gap-1 sm:gap-2 p-2 sm:p-3"
          >
            <Users className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Общие</span>
          </TabsTrigger>
          {/* <TabsTrigger
            value="tasks"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3"
          >
            <CheckSquare className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Задачи</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3"
          >
            <Bell className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Уведомления</span>
          </TabsTrigger> */}
        </TabsList>

        {/* Общие настройки */}
        <TabsContent value="general" className="space-y-4 pb-[120px]">
          <PlanInfoSection />
          <UsersManagementSection onEditUser={handleEditUser} />
          <TelegramGroupsSection />
        </TabsContent>

        {/* Настройки задач */}
        <TabsContent value="tasks" className="space-y-4">
          <TaskSettingsSection 
            taskSettings={taskSettings}
            onTaskSettingChange={handleTaskSettingChange}
          />
          <ExportDataSection />
        </TabsContent>

        {/* Настройки уведомлений */}
        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettingsSection />
        </TabsContent>
      </Tabs>

      {/* Диалог редактирования пользователя */}
      <EditUserDialog
        isOpen={isEditDialogOpen}
        editingUser={editingUser}
        onSave={handleSaveUser}
        onCancel={handleCancelEdit}
        onEditingUserChange={setEditingUser}
        onAvatarChange={handleAvatarChange}
      />
    </div>
  );
}