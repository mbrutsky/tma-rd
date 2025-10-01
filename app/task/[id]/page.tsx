"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useGetTaskQuery } from "@/src/lib/store/api/tasksApi";
import { useGetUsersQuery } from "@/src/lib/store/api/usersApi";
import { useGetBusinessProcessesQuery } from "@/src/lib/store/api/businessProcessesApi";
import TaskDetailsDialog from "@/src/components/Dialogs/TaskDetailsDialog/TaskDetailsDialog";
import { Button } from "@/src/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { currentUserId } from "@/src/lib/app.config";

export default function TaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  // API queries
  const {
    data: task,
    isLoading: taskLoading,
    error: taskError,
  } = useGetTaskQuery(taskId);
  const { data: users = [], isLoading: usersLoading } = useGetUsersQuery({
    active: true,
  });
  const { data: businessProcesses = [], isLoading: processesLoading } =
    useGetBusinessProcessesQuery({ active: true });

  // Current user
  const currentUser = users.find((user) => user.id === currentUserId);

  // Защита от null currentUser

  // Редирект на главную при закрытии диалога
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    router.push("/");
  };

  // Редирект на главную при загрузке, если диалог закрыт
  useEffect(() => {
    if (!isDialogOpen) {
      router.push("/");
    }
  }, [isDialogOpen, router]);

  // Показываем загрузку
  if (taskLoading || usersLoading || processesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка задачи...</p>
        </div>
      </div>
    );
  }

  // Показываем ошибку
  if (taskError || !task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Задача не найдена
          </h1>
          <p className="text-gray-600 mb-6">
            Задача с ID "{taskId}" не существует или была удалена.
          </p>
          <div className="space-y-3">
            <Button onClick={() => router.push("/")} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Вернуться к задачам
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Проверка доступа пользователя
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <Shield className="h-16 w-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Доступ закрыт
          </h1>
          <p className="text-gray-600 mb-6">
            У вас нет прав доступа к этой странице.
          </p>
          <div className="space-y-3">
            <Button onClick={() => router.push("/")} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Вернуться на главную
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header для десктопа */}
      <div className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Все задачи
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {task.title}
                </h1>
                <p className="text-sm text-gray-500">Задача #{taskId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Dialog */}
      {task && (
        <TaskDetailsDialog
          task={task}
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
          users={users}
          currentUser={currentUser}
          businessProcesses={businessProcesses}
        />
      )}
    </div>
  );
}
