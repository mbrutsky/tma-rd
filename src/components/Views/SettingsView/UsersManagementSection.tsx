import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Users,
  AlertCircle,
  Loader2,
  Edit,
} from "lucide-react";
import { DatabaseUser, UserRole } from "@/src/lib/models/types";
import { useGetUsersQuery } from "@/src/lib/store/api/usersApi";

interface UsersManagementSectionProps {
  onEditUser: (user: DatabaseUser) => void;
}

export default function UsersManagementSection({ onEditUser }: UsersManagementSectionProps) {
  const {
    data: users = [],
    isLoading: usersLoading,
    error: usersError,
  } = useGetUsersQuery({});

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case UserRole.DIRECTOR:
        return "Директор";
      case UserRole.DEPARTMENT_HEAD:
        return "Руководитель отдела";
      case UserRole.EMPLOYEE:
        return "Сотрудник";
      default:
        return role;
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Управление сотрудниками
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Управляйте данными, ролями и правами доступа сотрудников
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
        {/* Индикатор загрузки */}
        {usersLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">
              Загрузка пользователей...
            </span>
          </div>
        )}

        {/* Ошибка загрузки */}
        {usersError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span>Ошибка загрузки пользователей</span>
            </div>
          </div>
        )}

        {/* Список сотрудников */}
        {!usersLoading && !usersError && (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
                  <img
                    src={user.avatar || "/placeholder.svg"}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/placeholder.svg";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-gray-900">
                        {user.name}
                      </h4>
                      {!user.is_active && (
                        <Badge variant="secondary" className="text-xs">
                          Неактивен
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {user.position || "Должность не указана"}
                    </p>
                    <p className="text-xs text-gray-500 break-all">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <Badge variant="outline" className="text-xs">
                    {getRoleName(user.role)}
                  </Badge>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditUser(user)}
                      className="h-8 px-2"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Показать пустое состояние, если нет пользователей */}
        {!usersLoading && !usersError && users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <div className="text-lg mb-2">Пользователи не найдены</div>
            <div className="text-sm">
              Обратитесь к администратору для добавления пользователей
            </div>
          </div>
        )}

        {/* Кнопка добавления сотрудника */}
        <div className="pt-4 border-t border-gray-200">
          <Button
            onClick={() =>
              window.open("https://t.me/+79150257081", "_blank")
            }
            variant="outline"
            className="w-full"
          >
            <Users className="h-4 w-4 mr-2" />
            Добавить сотрудника
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}