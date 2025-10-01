// components/EditUserDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Save } from "lucide-react";
import { UserRole } from "@/src/lib/models/types";
import AvatarUpload from "./AvatarUpload";

interface EditingUser {
  id: string;
  name: string;
  position: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
}

interface EditUserDialogProps {
  isOpen: boolean;
  editingUser: EditingUser | null;
  onSave: () => void;
  onCancel: () => void;
  onEditingUserChange: (user: EditingUser) => void;
  onAvatarChange: (avatarUrl: string) => void;
}

export default function EditUserDialog({
  isOpen,
  editingUser,
  onSave,
  onCancel,
  onEditingUserChange,
  onAvatarChange,
}: EditUserDialogProps) {
  if (!editingUser) return null;

  const isDirector = editingUser.role === UserRole.DIRECTOR;

  return (
    <Dialog open={isOpen} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактирование сотрудника</DialogTitle>
          <DialogDescription>
            Измените данные сотрудника и загрузите фото профиля
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Загрузка аватара */}
          <div className="flex justify-center">
            <AvatarUpload
              currentAvatar={editingUser.avatar}
              userName={editingUser.name}
              userId={editingUser.id}
              onAvatarChange={onAvatarChange}
              size="lg"
            />
          </div>

          {/* Остальные поля формы */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                value={editingUser.name}
                onChange={(e) =>
                  onEditingUserChange({ ...editingUser, name: e.target.value })
                }
                placeholder="Введите имя"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Должность</Label>
              <Input
                id="position"
                value={editingUser.position}
                onChange={(e) =>
                  onEditingUserChange({
                    ...editingUser,
                    position: e.target.value,
                  })
                }
                placeholder="Введите должность"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editingUser.email}
                onChange={(e) =>
                  onEditingUserChange({ ...editingUser, email: e.target.value })
                }
                placeholder="Введите email"
                disabled={isDirector}
                className={isDirector ? "bg-gray-50 text-gray-500" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Роль</Label>
              {isDirector ? (
                <div className="flex h-10 w-full rounded-md cursor-not-allowed opacity-50 border border-input bg-gray-50 px-3 py-2 text-sm text-gray-500">
                  Директор
                </div>
              ) : (
                <Select
                  value={editingUser.role}
                  onValueChange={(value: UserRole) =>
                    onEditingUserChange({ ...editingUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[1000]">
                    <SelectItem value={UserRole.EMPLOYEE}>
                      Сотрудник
                    </SelectItem>
                    <SelectItem value={UserRole.DEPARTMENT_HEAD}>
                      Руководитель отдела
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={editingUser.isActive}
                onCheckedChange={(checked) =>
                  onEditingUserChange({ ...editingUser, isActive: checked })
                }
              />
              <Label htmlFor="isActive">Активный пользователь</Label>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Отмена
          </Button>
          <Button onClick={onSave} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-1" />
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}