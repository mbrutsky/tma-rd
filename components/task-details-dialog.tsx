"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  CalendarIcon,
  MessageSquare,
  Send,
  Play,
  Pause,
  CheckCircle,
  RotateCcw,
  Clock,
  AlertCircle,
  Edit,
  MoreVertical,
  Save,
  X,
  Bold,
  Italic,
  Link2,
  Table,
  History,
  Bell,
  FileText,
  Timer,
  ChevronDown,
  ChevronRight,
  Plus,
  Underline,
  Strikethrough,
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  ListChecks,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  type Task,
  type Comment,
  type HistoryEntry,
  type User,
  type BusinessProcess,
  type ChecklistItem,
  TaskStatus,
  TaskPriority,
  UserRole,
  HistoryActionType,
} from "@/types/task";
import ExplanatoryNoteDialog from "./ExplanatoryNoteDialog";
import TaskCompletionDialog from "./TaskCompletionDialog";

interface TaskDetailsDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateTask: (
    task: Task,
    historyAction?: Omit<HistoryEntry, "id" | "timestamp">
  ) => void;
  onAddComment: (
    taskId: string,
    comment: Omit<Comment, "id" | "timestamp">
  ) => void;
  onUpdateComment: (taskId: string, commentId: string, text: string) => void;
  onDeleteComment: (taskId: string, commentId: string) => void;
  onSendReminder: (taskId: string, minutes?: number) => void;
  users: User[];
  currentUser: User;
  businessProcesses: BusinessProcess[];
}

export default function TaskDetailsDialog({
  task,
  open,
  onOpenChange,
  onUpdateTask,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onSendReminder,
  users,
  currentUser,
  businessProcesses,
}: TaskDetailsDialogProps) {
  const [newComment, setNewComment] = useState("");
  const [isCommentResult, setIsCommentResult] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description);
  const [editedDueDate, setEditedDueDate] = useState<Date>(task.dueDate);
  const [editedPriority, setEditedPriority] = useState<TaskPriority>(
    task.priority
  );
  const [editedTags, setEditedTags] = useState<string>(task.tags.join(", "));
  const [editedProcessId, setEditedProcessId] = useState<string>(
    task.processId || ""
  );
  const [editedCreatorId, setEditedCreatorId] = useState<string>(
    task.creatorId
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [editedAssigneeIds, setEditedAssigneeIds] = useState<string[]>(
    task.assigneeIds
  );
  const [editedObserverIds, setEditedObserverIds] = useState<string[]>(
    task.observerIds
  );
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(false);
  const [isExplanatoryNoteOpen, setIsExplanatoryNoteOpen] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);

  // Состояние для чек-листа
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    task.checklist || []
  );
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [editingChecklistItem, setEditingChecklistItem] = useState<
    string | null
  >(null);
  const [editChecklistText, setEditChecklistText] = useState("");
  const [isChecklistOpen, setIsChecklistOpen] = useState(checklist.length > 0);

  useEffect(() => {
    setIsChecklistOpen(checklist.length > 0);
  }, [checklist.length]);

  const getUserById = (id: string) => {
    return users.find((user) => user.id === id);
  };

  const getProcessById = (id: string) => {
    return businessProcesses.find((process) => process.id === id);
  };

  const creator = getUserById(editedCreatorId);
  const assignees = editedAssigneeIds
    .map((id) => getUserById(id))
    .filter(Boolean);
  const observers = editedObserverIds
    .map((id) => getUserById(id))
    .filter(Boolean);
  const process = getProcessById(editedProcessId);

  const isOverdue =
    task.status !== TaskStatus.COMPLETED && new Date() > task.dueDate;
  const actualStatus = isOverdue ? "overdue" : task.status;

  const canChangeStatus =
    task.assigneeIds.includes(currentUser.id) ||
    task.creatorId === currentUser.id;
  const canComment =
    currentUser.role === UserRole.DIRECTOR ||
    currentUser.role === UserRole.DEPARTMENT_HEAD ||
    task.assigneeIds.includes(currentUser.id) ||
    task.creatorId === currentUser.id ||
    task.observerIds.includes(currentUser.id);
  const canEdit =
    task.creatorId === currentUser.id || currentUser.role === UserRole.DIRECTOR;
  const canEditChecklist =
    task.assigneeIds.includes(currentUser.id) ||
    task.creatorId === currentUser.id ||
    currentUser.role === UserRole.DIRECTOR;

  const canSendExplanatoryNote =
    isOverdue &&
    (task.assigneeIds.includes(currentUser.id) ||
      task.creatorId === currentUser.id);

  // Функции для работы с чек-листом
  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newChecklistItem.trim(),
      completed: false,
      createdAt: new Date(),
      createdBy: currentUser.id,
    };

    const updatedChecklist = [...checklist, newItem];
    setChecklist(updatedChecklist);
    setNewChecklistItem("");

    const updatedTask = {
      ...task,
      checklist: updatedChecklist,
      updatedAt: new Date(),
    };
    onUpdateTask(updatedTask);
  };

  const handleToggleChecklistItem = (itemId: string) => {
    const updatedChecklist = checklist.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          completed: !item.completed,
          completedAt: !item.completed ? new Date() : undefined,
          completedBy: !item.completed ? currentUser.id : undefined,
        };
      }
      return item;
    });

    setChecklist(updatedChecklist);

    const updatedTask = {
      ...task,
      checklist: updatedChecklist,
      updatedAt: new Date(),
    };
    onUpdateTask(updatedTask);
  };

  const handleEditChecklistItem = (itemId: string) => {
    const item = checklist.find((i) => i.id === itemId);
    if (item) {
      setEditingChecklistItem(itemId);
      setEditChecklistText(item.text);
    }
  };

  const handleSaveChecklistEdit = () => {
    if (!editChecklistText.trim() || !editingChecklistItem) return;

    const updatedChecklist = checklist.map((item) => {
      if (item.id === editingChecklistItem) {
        return {
          ...item,
          text: editChecklistText.trim(),
        };
      }
      return item;
    });

    setChecklist(updatedChecklist);
    setEditingChecklistItem(null);
    setEditChecklistText("");

    const updatedTask = {
      ...task,
      checklist: updatedChecklist,
      updatedAt: new Date(),
    };
    onUpdateTask(updatedTask);
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    const updatedChecklist = checklist.filter((item) => item.id !== itemId);
    setChecklist(updatedChecklist);

    const updatedTask = {
      ...task,
      checklist: updatedChecklist,
      updatedAt: new Date(),
    };
    onUpdateTask(updatedTask);
  };

  const checklistProgress =
    checklist.length > 0
      ? (checklist.filter((item) => item.completed).length / checklist.length) *
        100
      : 0;

  const getStatusIcon = (status: TaskStatus | "overdue") => {
    switch (status) {
      case TaskStatus.NEW:
        return <Clock className="h-4 w-4" />;
      case TaskStatus.ACKNOWLEDGED:
        return <CheckCircle className="h-4 w-4" />;
      case TaskStatus.IN_PROGRESS:
        return <Play className="h-4 w-4" />;
      case TaskStatus.PAUSED:
        return <Pause className="h-4 w-4" />;
      case TaskStatus.WAITING_CONTROL:
        return <AlertCircle className="h-4 w-4" />;
      case TaskStatus.ON_CONTROL:
        return <AlertCircle className="h-4 w-4" />;
      case TaskStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: TaskStatus | "overdue") => {
    switch (status) {
      case TaskStatus.NEW:
        return "bg-blue-100 text-blue-800";
      case TaskStatus.ACKNOWLEDGED:
        return "bg-emerald-100 text-emerald-800";
      case TaskStatus.IN_PROGRESS:
        return "bg-yellow-100 text-yellow-800";
      case TaskStatus.PAUSED:
        return "bg-gray-100 text-gray-800";
      case TaskStatus.WAITING_CONTROL:
        return "bg-purple-100 text-purple-800";
      case TaskStatus.ON_CONTROL:
        return "bg-indigo-100 text-indigo-800";
      case TaskStatus.COMPLETED:
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: TaskStatus | "overdue") => {
    switch (status) {
      case TaskStatus.NEW:
        return "Новая";
      case TaskStatus.ACKNOWLEDGED:
        return "Ознакомлен";
      case TaskStatus.IN_PROGRESS:
        return "В работе";
      case TaskStatus.PAUSED:
        return "Приостановлена";
      case TaskStatus.WAITING_CONTROL:
        return "Ждет контроля";
      case TaskStatus.ON_CONTROL:
        return "На контроле";
      case TaskStatus.COMPLETED:
        return "Завершена";
      case "overdue":
        return "Просрочена";
      default:
        return "Неизвестно";
    }
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (
      task.status === TaskStatus.NEW &&
      newStatus === TaskStatus.ACKNOWLEDGED
    ) {
      onAddComment(task.id, {
        authorId: currentUser.id,
        text: "Ознакомлен и согласен выполнять",
        isResult: false,
      });
    }

    const historyAction = {
      actionType: HistoryActionType.STATUS_CHANGED,
      userId: currentUser.id,
      oldValue: task.status,
      newValue: newStatus,
      description: `Статус изменен с '${getStatusText(
        task.status
      )}' на '${getStatusText(newStatus)}'`,
    };

    const updatedTask = {
      ...task,
      status: newStatus,
      updatedAt: new Date(),
      completedAt:
        newStatus === TaskStatus.COMPLETED ? new Date() : task.completedAt,
    };
    onUpdateTask(updatedTask, historyAction);
  };

  const handleCompleteWithResult = (resultText: string, aiScore?: number) => {
    // Добавляем комментарий с результатом и оценкой ИИ
    const commentText = aiScore
      ? `${resultText}\n\n🤖 Оценка ИИ: ${aiScore}%`
      : resultText;

    onAddComment(task.id, {
      authorId: currentUser.id,
      text: commentText,
      isResult: true,
      aiScore, // Добавьте это поле в тип Comment если нужно
    });

    const historyAction = {
      actionType: HistoryActionType.STATUS_CHANGED,
      userId: currentUser.id,
      oldValue: task.status,
      newValue: TaskStatus.COMPLETED,
      description: aiScore
        ? `Задача завершена с результатом (оценка ИИ: ${aiScore}%)`
        : `Задача завершена с результатом`,
    };

    const updatedTask = {
      ...task,
      status: TaskStatus.COMPLETED,
      updatedAt: new Date(),
      completedAt: new Date(),
      aiScore, // Сохраняем оценку ИИ в задаче
    };
    onUpdateTask(updatedTask, historyAction);
  };

  const handleReturnToWork = () => {
    const historyAction = {
      actionType: HistoryActionType.STATUS_CHANGED,
      userId: currentUser.id,
      oldValue: task.status,
      newValue: TaskStatus.IN_PROGRESS,
      description: "Задача возвращена в работу после проверки ИИ",
    };

    const updatedTask = {
      ...task,
      status: TaskStatus.IN_PROGRESS,
      updatedAt: new Date(),
    };
    onUpdateTask(updatedTask, historyAction);
  };

  const handleCompleteTask = () => {
    if (task.assigneeIds.includes(currentUser.id)) {
      setIsCompletionDialogOpen(true);
    } else {
      handleStatusChange(TaskStatus.COMPLETED);
    }
  };

  const handleSendServiceNote = () => {
    const historyAction = {
      actionType: HistoryActionType.SERVICE_NOTE_SENT,
      userId: currentUser.id,
      description: "Отправлена служебная записка",
    };
    onUpdateTask({ ...task, updatedAt: new Date() }, historyAction);
    alert("Служебная записка отправлена");
  };

  const handleSaveTaskEdit = () => {
    const historyActions: Omit<HistoryEntry, "id" | "timestamp">[] = [];

    if (editedTitle !== task.title) {
      historyActions.push({
        actionType: HistoryActionType.TITLE_CHANGED,
        userId: currentUser.id,
        oldValue: task.title,
        newValue: editedTitle,
        description: `Название изменено`,
      });
    }

    if (editedDescription !== task.description) {
      historyActions.push({
        actionType: HistoryActionType.DESCRIPTION_CHANGED,
        userId: currentUser.id,
        oldValue: task.description,
        newValue: editedDescription,
        description: "Описание изменено",
      });
    }

    if (editedDueDate.getTime() !== task.dueDate.getTime()) {
      historyActions.push({
        actionType: HistoryActionType.DEADLINE_CHANGED,
        userId: currentUser.id,
        oldValue: task.dueDate,
        newValue: editedDueDate,
        description: `Дедлайн изменен на ${format(
          editedDueDate,
          "d MMMM yyyy, HH:mm",
          { locale: ru }
        )}`,
      });
    }

    if (editedPriority !== task.priority) {
      historyActions.push({
        actionType: HistoryActionType.PRIORITY_CHANGED,
        userId: currentUser.id,
        oldValue: task.priority,
        newValue: editedPriority,
        description: "Приоритет изменен",
      });
    }

    const newTags = editedTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const updatedTask = {
      ...task,
      title: editedTitle,
      description: editedDescription,
      dueDate: editedDueDate,
      priority: editedPriority,
      processId: editedProcessId,
      creatorId: editedCreatorId,
      tags: newTags,
      assigneeIds: editedAssigneeIds,
      observerIds: editedObserverIds,
      updatedAt: new Date(),
    };

    onUpdateTask(updatedTask, historyActions[0]);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    onAddComment(task.id, {
      authorId: currentUser.id,
      text: newComment.trim(),
      isResult: isCommentResult,
    });

    setNewComment("");
    setIsCommentResult(false);
  };

  const insertTextAtCursor = (textarea: HTMLTextAreaElement, text: string) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const newValue = value.substring(0, start) + text + value.substring(end);

    setEditedDescription(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleFormatDescription = (format: string) => {
    const textarea = document.querySelector(
      'textarea[placeholder="Описание не указано"]'
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    switch (format) {
      case "bold":
        insertTextAtCursor(textarea, "**текст**");
        break;
      case "italic":
        insertTextAtCursor(textarea, "*текст*");
        break;
      case "underline":
        insertTextAtCursor(textarea, "<u>текст</u>");
        break;
      case "strikethrough":
        insertTextAtCursor(textarea, "~~текст~~");
        break;
      case "link":
        insertTextAtCursor(textarea, "[текст ссылки](https://example.com)");
        break;
      case "table":
        insertTextAtCursor(
          textarea,
          "\n| Колонка 1 | Колонка 2 |\n|-----------|----------|\n| Ячейка 1  | Ячейка 2  |\n"
        );
        break;
    }
  };

  const insertCommentTextAtCursor = (
    textarea: HTMLTextAreaElement,
    text: string
  ) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const newValue = value.substring(0, start) + text + value.substring(end);

    setNewComment(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleFormatComment = (format: string) => {
    const textarea = document.querySelector(
      'textarea[placeholder="Написать комментарий..."]'
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    switch (format) {
      case "bold":
        insertCommentTextAtCursor(textarea, "**текст**");
        break;
      case "italic":
        insertCommentTextAtCursor(textarea, "*текст*");
        break;
      case "underline":
        insertCommentTextAtCursor(textarea, "<u>текст</u>");
        break;
      case "strikethrough":
        insertCommentTextAtCursor(textarea, "~~текст~~");
        break;
      case "link":
        insertCommentTextAtCursor(
          textarea,
          "[текст ссылки](https://example.com)"
        );
        break;
      case "table":
        insertCommentTextAtCursor(
          textarea,
          "\n| Колонка 1 | Колонка 2 |\n|-----------|----------|\n| Ячейка 1  | Ячейка 2  |\n"
        );
        break;
    }
  };

  const handleFileUpload = () => {
    alert("Функция загрузки файлов (в разработке)");
  };

  const handleImageUpload = () => {
    alert("Функция загрузки изображений (в разработке)");
  };

  const getAvailableActions = () => {
    if (!canChangeStatus) return [];

    const actions = [];

    switch (task.status) {
      case TaskStatus.NEW:
        if (task.assigneeIds.includes(currentUser.id)) {
          actions.push({
            label: "Ознакомлен и согласен выполнять",
            icon: <CheckCircle className="h-4 w-4" />,
            action: () => handleStatusChange(TaskStatus.ACKNOWLEDGED),
            variant: "default" as const,
          });
        }
        break;

      case TaskStatus.ACKNOWLEDGED:
        actions.push({
          label: "Начать выполнение",
          icon: <Play className="h-4 w-4" />,
          action: () => handleStatusChange(TaskStatus.IN_PROGRESS),
          variant: "default" as const,
        });
        break;

      case TaskStatus.IN_PROGRESS:
        actions.push({
          label: "Приостановить",
          icon: <Pause className="h-4 w-4" />,
          action: () => handleStatusChange(TaskStatus.PAUSED),
          variant: "outline" as const,
        });
        actions.push({
          label: "Завершить",
          icon: <CheckCircle className="h-4 w-4" />,
          action: handleCompleteTask,
          variant: "default" as const,
        });
        break;

      case TaskStatus.PAUSED:
        actions.push({
          label: "Продолжить",
          icon: <Play className="h-4 w-4" />,
          action: () => handleStatusChange(TaskStatus.IN_PROGRESS),
          variant: "default" as const,
        });
        break;

      case TaskStatus.COMPLETED:
        if (
          task.creatorId === currentUser.id ||
          currentUser.role === UserRole.DIRECTOR
        ) {
          actions.push({
            label: "Вернуть в работу",
            icon: <RotateCcw className="h-4 w-4" />,
            action: () => handleStatusChange(TaskStatus.IN_PROGRESS),
            variant: "outline" as const,
          });
        }
        break;
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  const handleAddAssignee = (userId: string) => {
    if (!editedAssigneeIds.includes(userId)) {
      setEditedAssigneeIds([...editedAssigneeIds, userId]);
      handleSaveTaskEdit();
    }
  };

  const handleRemoveAssignee = (userId: string) => {
    setEditedAssigneeIds(editedAssigneeIds.filter((id) => id !== userId));
    handleSaveTaskEdit();
  };

  const handleAddObserver = (userId: string) => {
    if (!editedObserverIds.includes(userId)) {
      setEditedObserverIds([...editedObserverIds, userId]);
      handleSaveTaskEdit();
    }
  };

  const handleRemoveObserver = (userId: string) => {
    setEditedObserverIds(editedObserverIds.filter((id) => id !== userId));
    handleSaveTaskEdit();
  };

  const handleChangeCreator = (userId: string) => {
    setEditedCreatorId(userId);
    handleSaveTaskEdit();
  };

  const getHistoryEntryContent = (entry: HistoryEntry) => {
    const isOverdueEntry =
      entry.description.includes("просрочена") &&
      entry.description.includes("пояснительную записку");

    if (isOverdueEntry && canSendExplanatoryNote) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-700">{entry.description}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setIsExplanatoryNoteOpen(true);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <FileText className="h-4 w-4 mr-1" />
            Отправить
          </Button>
        </div>
      );
    }

    return <p className="text-sm text-gray-700">{entry.description}</p>;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl xs w-full h-[100svh] sm:h-[85vh] flex flex-col m-0 sm:m-4 rounded-none sm:rounded-lg max-[480px]:p-2">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 flex items-center gap-2 pr-10 pt-1">
<Input
  value={editedTitle}
  onChange={(e) => setEditedTitle(e.target.value)}
  onBlur={handleSaveTaskEdit}
  size={Math.max(editedTitle.length, 10)}
  className="text-lg font-semibold border-none shadow-none p-0 h-auto bg-transparent focus:bg-white focus:border focus:shadow-sm w-auto min-w-0"
/>
                <Edit className="h-4 w-4 text-gray-400 relative top-[3px]" />
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="details">Детали</TabsTrigger>
              <TabsTrigger value="comments">
                Комментарии ({task.comments.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                История ({task.history.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0 overflow-hidden">
              <TabsContent value="details" className="h-full flex-col">
                {/* <ScrollArea className="flex-1 [&>div>div]:!w-auto [&>div>div]:!block"> */}
                <div className="space-y-4 p-1 flex flex-col h-full overflow-y-auto pb-8">
                  {/* Описание */}
                  <div>
                    <div className="flex items-center justify-between pb-1">
                      <Label className="text-sm font-medium text-gray-700 m-0 block">
                        Описание
                      </Label>
                      <div className="flex gap- h-7 items-center">
                        <Badge
                          className={`${getStatusColor(
                            actualStatus
                          )} flex items-center gap-1`}
                        >
                          {getStatusIcon(actualStatus)}
                          <span className="text-xs">
                            {getStatusText(actualStatus)}
                          </span>
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-t-md border-b">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFormatDescription("bold")}
                            className="h-8 w-8 p-0"
                            title="Жирный текст"
                          >
                            <Bold className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFormatDescription("italic")}
                            className="h-8 w-8 p-0"
                            title="Курсив"
                          >
                            <Italic className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFormatDescription("underline")}
                            className="h-8 w-8 p-0"
                            title="Подчеркнутый"
                          >
                            <Underline className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleFormatDescription("strikethrough")
                            }
                            className="h-8 w-8 p-0"
                            title="Зачеркнутый"
                          >
                            <Strikethrough className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFormatDescription("link")}
                            className="h-8 w-8 p-0"
                            title="Ссылка"
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFormatDescription("table")}
                            className="h-8 w-8 p-0"
                            title="Таблица"
                          >
                            <Table className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleFileUpload}
                            className="h-8 px-2 text-sm"
                            title="Загрузить файл"
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Файл
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleImageUpload}
                            className="h-8 px-2 text-sm"
                            title="Загрузить изображение"
                          >
                            <ImageIcon className="h-4 w-4 mr-1" />
                            Фото
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        onBlur={handleSaveTaskEdit}
                        placeholder="Описание не указано"
                        rows={3}
                        className="text-sm resize-none rounded-t-none"
                      />
                    </div>
                  </div>

                  {/* Чек-лист */}
                  <Collapsible
                    open={isChecklistOpen}
                    onOpenChange={setIsChecklistOpen}
                  >
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
                              ({checklist.filter((i) => i.completed).length}/
                              {checklist.length})
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
                      <div className="space-y-2">
                        {checklist.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-2">
                            Чек-лист пуст
                          </p>
                        ) : (
                          checklist.map((item) => {
                            const isEditing = editingChecklistItem === item.id;
                            const completedBy = item.completedBy
                              ? getUserById(item.completedBy)
                              : null;

                            return (
                              <div
                                key={item.id}
                                className={`flex items-start gap-3 p-2 rounded-lg border ${
                                  item.completed
                                    ? "bg-green-50 border-green-200"
                                    : "bg-white border-gray-200"
                                } group hover:shadow-sm transition-all`}
                              >
                                <Checkbox
                                  checked={item.completed}
                                  onCheckedChange={() =>
                                    handleToggleChecklistItem(item.id)
                                  }
                                  disabled={!canEditChecklist}
                                  className="mt-0.5"
                                />

                                <div className="flex-1">
                                  {isEditing ? (
                                    <div className="space-y-2">
                                      <Input
                                        value={editChecklistText}
                                        onChange={(e) =>
                                          setEditChecklistText(e.target.value)
                                        }
                                        className="text-sm"
                                        autoFocus
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={handleSaveChecklistEdit}
                                          disabled={!editChecklistText.trim()}
                                        >
                                          Сохранить
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setEditingChecklistItem(null);
                                            setEditChecklistText("");
                                          }}
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
                                      </p>
                                      {item.completed && completedBy && (
                                        <div className="flex items-center gap-2 mt-1">
                                          <Avatar className="h-4 w-4">
                                            <AvatarImage
                                              src={
                                                completedBy.avatar ||
                                                "/placeholder.svg"
                                              }
                                            />
                                            <AvatarFallback className="text-xs">
                                              {completedBy.name.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-xs text-gray-500">
                                            {completedBy.name} •{" "}
                                            {item.completedAt &&
                                              format(
                                                item.completedAt,
                                                "d MMM, HH:mm",
                                                { locale: ru }
                                              )}
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>

                                {canEditChecklist && !isEditing && (
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() =>
                                        handleEditChecklistItem(item.id)
                                      }
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                      onClick={() =>
                                        handleDeleteChecklistItem(item.id)
                                      }
                                    >
                                      <Trash2 className="h-3 w-3" />
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
                            value={newChecklistItem}
                            onChange={(e) =>
                              setNewChecklistItem(e.target.value)
                            }
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handleAddChecklistItem();
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            onClick={handleAddChecklistItem}
                            disabled={!newChecklistItem.trim()}
                            size="sm"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Основная информация */}
                  <div className="grid grid-cols-2 max-[540px]:grid-cols-1 gap-4 text-sm mt-2">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-1 block">
                        Постановщик
                      </Label>
                      <Select
                        value={editedCreatorId}
                        onValueChange={handleChangeCreator}
                      >
                        <SelectTrigger className="h-auto p-2 border-dashed">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={creator?.avatar || "/placeholder.svg"}
                              />
                              <AvatarFallback>
                                {creator?.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{creator?.name}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {users
                            .filter((u) => u.isActive)
                            .map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage
                                      src={user.avatar || "/placeholder.svg"}
                                    />
                                    <AvatarFallback className="text-xs">
                                      {user.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{user.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-1 block">
                        Исполнители
                      </Label>
                      <div
                        className="flex items-center gap-1 border border-dashed rounded-lg px-2 py-2 min-h-[40px] flex-wrap cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          const selectTrigger = document.querySelector(
                            "[data-assignee-select]"
                          ) as HTMLButtonElement;
                          if (selectTrigger) selectTrigger.click();
                        }}
                      >
                        {assignees.map((assignee) => (
                          <Badge
                            key={assignee?.id}
                            variant="secondary"
                            className="flex items-center gap-1 m-0.5"
                          >
                            <Avatar className="h-4 w-4">
                              <AvatarImage
                                src={assignee?.avatar || "/placeholder.svg"}
                              />
                              <AvatarFallback className="text-xs">
                                {assignee?.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{assignee?.name}</span>
                            {canEdit && (
                              <X
                                className="h-3 w-3 cursor-pointer text-gray-500 hover:text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveAssignee(assignee?.id ?? "");
                                }}
                              />
                            )}
                          </Badge>
                        ))}
                        <Select onValueChange={handleAddAssignee}>
                          <SelectTrigger
                            className="h-6 w-6 border-none shadow-none p-0 bg-transparent opacity-0"
                            data-assignee-select
                          >
                            <Plus className="h-4 w-4 text-gray-400" />
                          </SelectTrigger>
                          <SelectContent>
                            {users
                              .filter(
                                (u) =>
                                  u.isActive &&
                                  !editedAssigneeIds.includes(u.id)
                              )
                              .map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage
                                        src={user.avatar || "/placeholder.svg"}
                                      />
                                      <AvatarFallback className="text-xs">
                                        {user.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{user.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {assignees.length === 0 && (
                          <span className="text-gray-400 text-sm">
                            Нажмите, чтобы добавить
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-1 block">
                        Дедлайн
                      </Label>
                      <Popover
                        open={isCalendarOpen}
                        onOpenChange={setIsCalendarOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between text-left font-normal h-8"
                          >
                            {format(editedDueDate, "d MMMM yyyy, HH:mm", {
                              locale: ru,
                            })}
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto overflow-hidden p-0"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={editedDueDate}
                            captionLayout="dropdown"
                            onSelect={(date) => {
                              if (date) {
                                const newDate = new Date(date);
                                newDate.setHours(
                                  editedDueDate.getHours(),
                                  editedDueDate.getMinutes()
                                );
                                setEditedDueDate(newDate);
                                setIsCalendarOpen(false);
                                handleSaveTaskEdit();
                              }
                            }}
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
                              value={format(editedDueDate, "HH:mm")}
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value
                                  .split(":")
                                  .map(Number);
                                const newDate = new Date(editedDueDate);
                                newDate.setHours(hours, minutes);
                                setEditedDueDate(newDate);
                                handleSaveTaskEdit();
                              }}
                              className="mt-1 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-1 block">
                        Приоритет
                      </Label>
                      <Select
                        value={editedPriority.toString()}
                        onValueChange={(value) => {
                          setEditedPriority(Number(value) as TaskPriority);
                          handleSaveTaskEdit();
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Критический</SelectItem>
                          <SelectItem value="2">2 - Высокий</SelectItem>
                          <SelectItem value="3">3 - Средний</SelectItem>
                          <SelectItem value="4">4 - Низкий</SelectItem>
                          <SelectItem value="5">5 - Очень низкий</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Наблюдатели */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Наблюдатели
                    </Label>
                    <div
                      className="flex items-center gap-1 border border-dashed rounded-lg px-2 py-2 min-h-[40px] flex-wrap cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        const selectTrigger = document.querySelector(
                          "[data-observer-select]"
                        ) as HTMLButtonElement;
                        if (selectTrigger) selectTrigger.click();
                      }}
                    >
                      {observers.map((observer) => (
                        <Badge
                          key={observer?.id}
                          variant="outline"
                          className="flex items-center gap-1 m-0.5"
                        >
                          <Avatar className="h-4 w-4">
                            <AvatarImage
                              src={observer?.avatar || "/placeholder.svg"}
                            />
                            <AvatarFallback className="text-xs">
                              {observer?.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{observer?.name}</span>
                          {canEdit && (
                            <X
                              className="h-3 w-3 cursor-pointer text-gray-500 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveObserver(observer?.id ?? "");
                              }}
                            />
                          )}
                        </Badge>
                      ))}
                      <Select onValueChange={handleAddObserver}>
                        <SelectTrigger
                          className="h-6 w-6 border-none shadow-none p-0 bg-transparent opacity-0"
                          data-observer-select
                        >
                          <Plus className="h-4 w-4 text-gray-400" />
                        </SelectTrigger>
                        <SelectContent>
                          {users
                            .filter(
                              (u) =>
                                u.isActive && !editedObserverIds.includes(u.id)
                            )
                            .map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage
                                      src={user.avatar || "/placeholder.svg"}
                                    />
                                    <AvatarFallback className="text-xs">
                                      {user.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{user.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {observers.length === 0 && (
                        <span className="text-gray-400 text-sm">
                          Нажмите, чтобы добавить
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {availableActions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant}
                        size="default"
                        onClick={action.action}
                        className="flex items-center gap-1 h-10"
                      >
                        {action.icon}
                        {action.label}
                      </Button>
                    ))}

                    {/* {canSendExplanatoryNote && (
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => setIsExplanatoryNoteOpen(true)}
                        className="flex items-center gap-1 h-10 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <FileText className="h-4 w-4" />
                        Объяснительная записка
                      </Button>
                    )} */}
                  </div>

                  {/* Дополнительно */}
                  <Collapsible
                    open={isAdditionalOpen}
                    onOpenChange={setIsAdditionalOpen}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 p-0 h-auto font-medium"
                      >
                        {isAdditionalOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        Дополнительно
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 mt-4 pl-6 border-l-2 border-gray-200">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Бизнес-процесс
                        </Label>
                        <Select
                          value={editedProcessId}
                          onValueChange={(value) => {
                            setEditedProcessId(value);
                            handleSaveTaskEdit();
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Выберите процесс" />
                          </SelectTrigger>
                          <SelectContent>
                            {businessProcesses
                              .filter((p) => p.isActive)
                              .map((process) => (
                                <SelectItem key={process.id} value={process.id}>
                                  {process.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {process && (
                          <p className="text-xs text-gray-500 mt-1">
                            {process.description}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Теги
                        </Label>
                        <Input
                          value={editedTags}
                          onChange={(e) => setEditedTags(e.target.value)}
                          onBlur={handleSaveTaskEdit}
                          placeholder="Введите теги через запятую"
                          className="h-8"
                        />
                      </div>

                      <div className="flex gap-2 items-center">
                        <Button
                          variant="outline"
                          size="default"
                          className="flex items-center gap-1 h-10"
                          onClick={() =>
                            alert("Функция напоминаний (в разработке)")
                          }
                        >
                          <Bell className="h-4 w-4" />
                          Напомнить
                        </Button>

                        <Button
                          variant="outline"
                          onClick={handleSendServiceNote}
                        >
                          <FileText className="h-4 w-4" />
                          Отправить служебку
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
                {/* </ScrollArea> */}
              </TabsContent>

              <TabsContent value="comments" className="h-full flex-col">
                <div className="flex-1 flex flex-col min-h-0 h-full pb-8">
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-3">
                      {task.comments.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Комментариев пока нет
                        </p>
                      ) : (
                        task.comments.map((comment) => {
                          const author = getUserById(comment.authorId);
                          const isEditing = editingComment === comment.id;

                          return (
                            <div
                              key={comment.id}
                              className={`flex gap-3 group ${
                                comment.isResult
                                  ? "bg-green-50 p-3 rounded-lg border border-green-200"
                                  : ""
                              }`}
                            >
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage
                                  src={author?.avatar || "/placeholder.svg"}
                                />
                                <AvatarFallback>
                                  {author?.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">
                                      {author?.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {format(
                                        comment.timestamp,
                                        "d MMM, HH:mm",
                                        { locale: ru }
                                      )}
                                    </span>
                                    {comment.isResult && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        Результат
                                      </Badge>
                                    )}
                                    {comment.isEdited && (
                                      <span className="text-xs text-gray-400">
                                        (изменено)
                                      </span>
                                    )}
                                  </div>

                                  {(comment.authorId === currentUser.id ||
                                    currentUser.role === UserRole.DIRECTOR) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                      onClick={() =>
                                        confirm("Удалить комментарий?") &&
                                        onDeleteComment(task.id, comment.id)
                                      }
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>

                                {isEditing ? (
                                  <div className="space-y-2">
                                    <Textarea
                                      value={editCommentText}
                                      onChange={(e) =>
                                        setEditCommentText(e.target.value)
                                      }
                                      rows={2}
                                      className="text-sm resize-none"
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          if (editCommentText.trim()) {
                                            onUpdateComment(
                                              task.id,
                                              comment.id,
                                              editCommentText.trim()
                                            );
                                            setEditingComment(null);
                                            setEditCommentText("");
                                          }
                                        }}
                                        disabled={!editCommentText.trim()}
                                      >
                                        Сохранить
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingComment(null);
                                          setEditCommentText("");
                                        }}
                                      >
                                        Отмена
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {comment.text}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>

                  {canComment && (
                    <div className="flex-shrink-0 mt-4 pt-3 border-t">
                      <div className="flex gap-2 flex-col">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-t-md border-b">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFormatComment("bold")}
                                className="h-8 w-8 p-0"
                                type="button"
                              >
                                <Bold className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFormatComment("italic")}
                                className="h-8 w-8 p-0"
                                type="button"
                              >
                                <Italic className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={isCommentResult}
                                  onChange={(e) =>
                                    setIsCommentResult(e.target.checked)
                                  }
                                  className="rounded"
                                />
                                Результат
                              </label>
                            </div>
                          </div>
                          <Textarea
                            placeholder="Написать комментарий..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                            className="resize-none text-sm rounded-t-none"
                          />
                          <div className="flex justify-end">
                            <Button
                              onClick={handleAddComment}
                              disabled={!newComment.trim()}
                              size="sm"
                              className="h-8"
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Отправить
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="h-full">
                <div className="h-full">
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-3">
                      {task.history.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          История изменений пуста
                        </p>
                      ) : (
                        task.history
                          .sort(
                            (a, b) =>
                              new Date(b.timestamp).getTime() -
                              new Date(a.timestamp).getTime()
                          )
                          .map((entry) => {
                            const user = getUserById(entry.userId);
                            const isSystemEntry = entry.userId === "system";

                            return (
                              <div
                                key={entry.id}
                                className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                              >
                                <div
                                  className={`p-2 rounded-full h-fit ${
                                    isSystemEntry
                                      ? "bg-orange-100"
                                      : "bg-blue-100"
                                  }`}
                                >
                                  {isSystemEntry ? (
                                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                                  ) : (
                                    <History className="h-4 w-4 text-blue-600" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex-1">
                                      {getHistoryEntryContent(entry)}
                                    </div>
                                    <span className="text-xs text-gray-500 ml-4">
                                      {format(entry.timestamp, "d MMM, HH:mm", {
                                        locale: ru,
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 italic">
                                    {isSystemEntry ? "Система" : user?.name}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ExplanatoryNoteDialog
        task={task}
        open={isExplanatoryNoteOpen}
        onOpenChange={setIsExplanatoryNoteOpen}
        onUpdateTask={onUpdateTask}
        currentUser={currentUser}
      />

      <TaskCompletionDialog
        task={task}
        open={isCompletionDialogOpen}
        onOpenChange={setIsCompletionDialogOpen}
        onComplete={handleCompleteWithResult}
        onReturnToWork={handleReturnToWork}
        currentUser={currentUser}
      />
    </>
  );
}
