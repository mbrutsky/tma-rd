"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ListChecks,
  Plus,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { DatabaseChecklistItem, DatabaseUser } from "@/src/lib/models/types";
import { useIndentChecklistItemMutation, useOutdentChecklistItemMutation, useMoveChecklistItemUpMutation, useMoveChecklistItemDownMutation } from "@/src/lib/store/api/tasksApi";
import { Input } from "../../ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../ui/collapsible";
import { Button } from "../../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Progress } from "../../ui/progress";
import { Checkbox } from "../../ui/checkbox";

interface TaskChecklistSectionProps {
  checklist: DatabaseChecklistItem[];
  canEditChecklist: boolean;
  isLoading: boolean;
  isAddingItem: boolean;
  onToggleItem: (itemId: string) => void;
  onAddItem: (text: string) => Promise<void>;
  onEditItem: (itemId: string, text: string) => Promise<void>;
  onDeleteItem: (itemId: string) => void;
  getUserById: (id: string) => DatabaseUser | undefined;
  taskId: string; // Добавляем taskId для новых мутаций
}

export default function TaskChecklistSection({
  checklist,
  canEditChecklist,
  isLoading,
  isAddingItem,
  onToggleItem,
  onAddItem,
  onEditItem,
  onDeleteItem,
  getUserById,
  taskId,
}: TaskChecklistSectionProps) {
  const [newItemText, setNewItemText] = useState("");
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isChecklistOpen, setIsChecklistOpen] = useState(
    checklist.length > 0 // Автоматически раскрывается, если есть элементы
  );

  // Новые мутации для управления структурой
  const [indentItem] = useIndentChecklistItemMutation();
  const [outdentItem] = useOutdentChecklistItemMutation();
  const [moveItemUp] = useMoveChecklistItemUpMutation();
  const [moveItemDown] = useMoveChecklistItemDownMutation();

  const checklistProgress =
    checklist.length > 0
      ? (checklist.filter((item) => item.completed).length / checklist.length) * 100
      : 0;

  const handleAddItem = async () => {
    if (!newItemText.trim() || isAddingItem) return;

    try {
      await onAddItem(newItemText.trim());
      setNewItemText("");
    } catch (error) {
      console.error("Error adding checklist item:", error);
    }
  };

  const handleEditItem = (itemId: string) => {
    const item = checklist.find((i) => i.id === itemId);
    if (item) {
      setEditingItem(itemId);
      setEditText(item.text);
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || !editingItem) return;

    try {
      await onEditItem(editingItem, editText.trim());
      setEditingItem(null);
      setEditText("");
    } catch (error) {
      console.error("Error updating checklist item:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditText("");
  };

  // Обработчики для новых действий
  const handleIndent = async (itemId: string) => {
    try {
      await indentItem({ taskId, itemId }).unwrap();
    } catch (error) {
      console.error("Error indenting item:", error);
    }
  };

  const handleOutdent = async (itemId: string) => {
    try {
      await outdentItem({ taskId, itemId }).unwrap();
    } catch (error) {
      console.error("Error outdenting item:", error);
    }
  };

  const handleMoveUp = async (itemId: string) => {
    try {
      await moveItemUp({ taskId, itemId }).unwrap();
    } catch (error) {
      console.error("Error moving item up:", error);
    }
  };

  const handleMoveDown = async (itemId: string) => {
    try {
      await moveItemDown({ taskId, itemId }).unwrap();
    } catch (error) {
      console.error("Error moving item down:", error);
    }
  };

  // Проверка возможности операций
  const canIndent = (item: DatabaseChecklistItem) => {
    return item.level < 5; // Максимум 5 уровней
  };

  const canOutdent = (item: DatabaseChecklistItem) => {
    return item.level > 0; // Минимум 0 уровень
  };

  const canMoveUp = (index: number) => {
    return index > 0;
  };

  const canMoveDown = (index: number) => {
    return index < checklist.length - 1;
  };

  // Стилизация отступов для уровней
  const getIndentStyle = (level: number) => {
    return {
      marginLeft: `${level * 16}px`,
    };
  };

  return (
    <Collapsible open={isChecklistOpen} onOpenChange={setIsChecklistOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 p-0 h-auto font-medium w-full justify-between"
        >
          <div className="flex items-center gap-2">
            {isChecklistOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <ListChecks className="h-4 w-4" />
            Чек-лист
            {checklist.length > 0 && (
              <span className="text-sm text-gray-500">
                ({checklist.filter((i) => i.completed).length}/{checklist.length})
              </span>
            )}
          </div>
          {checklist.length > 0 && (
            <span className="text-sm text-gray-500">
              {Math.round(checklistProgress)}%
            </span>
          )}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-3 mt-3">
        {/* Прогресс */}
        {checklist.length > 0 && (
          <Progress value={checklistProgress} className="h-2" />
        )}

        {/* Список пунктов */}
        <div className="space-y-2 w-full overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Загружаем чек-лист...</p>
            </div>
          ) : checklist.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-2">
              Чек-лист пуст
            </p>
          ) : (
            checklist.map((item, index) => {
              const isEditing = editingItem === item.id;
              const completedBy = item.completed_by
                ? getUserById(item.completed_by)
                : null;

              return (
                <div
                  key={item.id}
                  className={`p-2 rounded-lg border ${
                    item.completed
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-200"
                  } group hover:shadow-sm transition-all`}
                  style={getIndentStyle(item.level)}
                >
                  {/* Основная строка с чекбоксом и текстом */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => onToggleItem(item.id)}
                      disabled={!canEditChecklist}
                      className="mt-0.5"
                    />

                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="text-sm"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              disabled={!editText.trim()}
                            >
                              Сохранить
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              Отмена
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p
                            className={`text-sm ${
                              item.completed
                                ? "line-through text-gray-500"
                                : "text-gray-700"
                            }`}
                          >
                            {item.text}
                            {item.level > 0 && (
                              <span className="text-xs text-gray-400 ml-2">
                                (уровень {item.level})
                              </span>
                            )}
                          </p>
                          {item.completed && completedBy && (
                            <div className="flex items-center gap-2 mt-1">
                              <Avatar className="h-4 w-4">
                                <AvatarImage
                                  src={completedBy.avatar || "/placeholder.svg"}
                                />
                                <AvatarFallback className="text-xs">
                                  {completedBy.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-gray-500">
                                {completedBy.name} •{" "}
                                {item.completed_at &&
                                  format(item.completed_at, "d MMM, HH:mm", {
                                    locale: ru,
                                  })}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Кнопки справа на больших экранах */}
                    {canEditChecklist && !isEditing && (
                      <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Кнопки управления порядком */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleMoveUp(item.id)}
                          disabled={!canMoveUp(index)}
                          title="Переместить вверх"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleMoveDown(item.id)}
                          disabled={!canMoveDown(index)}
                          title="Переместить вниз"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                        
                        {/* Кнопки управления уровнями */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleOutdent(item.id)}
                          disabled={!canOutdent(item)}
                          title="На уровень левее"
                        >
                          <ArrowLeft className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleIndent(item.id)}
                          disabled={!canIndent(item)}
                          title="На уровень правее"
                        >
                          <ArrowRight className="h-3 w-3" />
                        </Button>

                        {/* Кнопки редактирования и удаления */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleEditItem(item.id)}
                          title="Редактировать"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          onClick={() => onDeleteItem(item.id)}
                          title="Удалить"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Кнопки внизу на мобильных устройствах */}
                  {canEditChecklist && !isEditing && (
                    <div className="sm:hidden flex gap-1 mt-2 justify-center flex-wrap">
                      {/* Кнопки управления порядком */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleMoveUp(item.id)}
                        disabled={!canMoveUp(index)}
                        title="Переместить вверх"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleMoveDown(item.id)}
                        disabled={!canMoveDown(index)}
                        title="Переместить вниз"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      
                      {/* Кнопки управления уровнями */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleOutdent(item.id)}
                        disabled={!canOutdent(item)}
                        title="На уровень левее"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleIndent(item.id)}
                        disabled={!canIndent(item)}
                        title="На уровень правее"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>

                      {/* Кнопки редактирования и удаления */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEditItem(item.id)}
                        title="Редактировать"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => onDeleteItem(item.id)}
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Добавление нового пункта */}
        {canEditChecklist && (
          <div className="flex gap-2">
            <Input
              placeholder="Добавить пункт..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !isAddingItem) {
                  handleAddItem();
                }
              }}
              className="flex-1"
              disabled={isAddingItem}
            />
            <Button
              onClick={handleAddItem}
              disabled={!newItemText.trim() || isAddingItem}
              size="sm"
            >
              {isAddingItem ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* Справка по управлению */}
        {canEditChecklist && checklist.length > 0 && (
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-1">Управление чек-листом:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1">
                <ArrowUp className="h-3 w-3" />
                <ArrowDown className="h-3 w-3" />
                <span>Переместить</span>
              </div>
              <div className="flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                <ArrowRight className="h-3 w-3" />
                <span>Изменить уровень</span>
              </div>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}