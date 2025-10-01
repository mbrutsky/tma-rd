import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  CreateTaskRequest,
  DatabaseChecklistItem,
  DatabaseComment,
  DatabaseTask,
  UpdateTaskRequest,
} from "@/src/lib/models/types";
import { currentUserId } from "../../app.config";

// Transform database task to frontend task format
function transformDatabaseTaskToFrontend(dbTask: any): DatabaseTask {
  const result = {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description || "",
    priority: dbTask.priority,
    status: dbTask.status,
    type: dbTask.type,
    creator_id: dbTask.creatorId || dbTask.creator_id,
    responsible_id: dbTask.responsibleId || dbTask.responsible_id,
    process_id: dbTask.processId || dbTask.process_id,
    due_date: new Date(dbTask.dueDate || dbTask.due_date),
    created_at: new Date(dbTask.createdAt || dbTask.created_at),
    updated_at: new Date(dbTask.updatedAt || dbTask.updated_at),
    completed_at:
      dbTask.completedAt || dbTask.completed_at
        ? new Date(dbTask.completedAt || dbTask.completed_at)
        : undefined,
    tags: dbTask.tags || [],
    estimated_days: dbTask.estimatedDays || dbTask.estimated_days || 0,
    estimated_hours: dbTask.estimatedHours || dbTask.estimated_hours || 0,
    estimated_minutes: dbTask.estimatedMinutes || dbTask.estimated_minutes || 0,
    actual_hours: dbTask.actualHours || dbTask.actual_hours,
    result: dbTask.result,
    is_overdue: dbTask.isOverdue || dbTask.is_overdue || false,
    is_almost_overdue:
      dbTask.isAlmostOverdue || dbTask.is_almost_overdue || false,

    // поля для удаления
    is_deleted: Boolean(dbTask.isDeleted), 
    deleted_at: dbTask.deletedAt ? new Date(dbTask.deletedAt) : undefined,
    deleted_by: dbTask.deletedBy,

    // Assignees теперь массив DatabaseUser объектов
    assignees: dbTask.assignees || [],
    observers: dbTask.observers || [],
    creator: dbTask.creator,
    responsible: dbTask.responsible,
    process: dbTask.process,

    // Transform nested objects
    comments: (dbTask.comments || []).map((c: any) => ({
      id: c.id,
      task_id: c.task_id || c.taskId,
      author_id: c.authorId || c.author_id,
      text: c.text,
      created_at: new Date(c.timestamp || c.created_at),
      is_result: c.isResult || c.is_result,
      is_edited: c.isEdited || c.is_edited,
      edited_at:
        c.editedAt || c.edited_at
          ? new Date(c.editedAt || c.edited_at)
          : undefined,
      author: c.author,
    })),

    history: (dbTask.history || []).map((h: any) => ({
      id: h.id,
      task_id: h.task_id || h.taskId,
      action_type: h.actionType || h.action_type,
      user_id: h.userId || h.user_id,
      created_at: new Date(h.timestamp || h.created_at),
      description: h.description,
      old_value: h.oldValue || h.old_value,
      new_value: h.newValue || h.new_value,
      additional_data: h.additionalData || h.additional_data,
      user: h.user,
    })),

    checklist: (dbTask.checklist || []).map((c: any) => ({
      id: c.id,
      task_id: c.task_id || c.taskId,
      text: c.text,
      completed: c.completed,
      created_at: new Date(c.createdAt || c.created_at),
      created_by: c.createdBy || c.created_by,
      completed_at:
        c.completedAt || c.completed_at
          ? new Date(c.completedAt || c.completed_at)
          : undefined,
      completed_by: c.completedBy || c.completed_by,
      parent_id: c.parentId || c.parent_id,
      level: c.level || 0,
      item_order: c.order || c.item_order || 0,
      creator: c.creator,
      completedBy: c.completedByUser || c.completedBy,
    })),
  };

  return result;
}

// Остальные transform функции без изменений...
function transformChecklistItem(item: any): DatabaseChecklistItem {
  return {
    id: item.id,
    task_id: item.task_id || item.taskId,
    text: item.text,
    completed: item.completed,
    created_at: new Date(item.createdAt || item.created_at),
    created_by: item.createdBy || item.created_by,
    completed_at:
      item.completedAt || item.completed_at
        ? new Date(item.completedAt || item.completed_at)
        : undefined,
    completed_by: item.completedBy || item.completed_by,
    parent_id: item.parentId || item.parent_id,
    level: item.level || 0,
    item_order: item.order || item.item_order || 0,
    creator: item.creator,
    completedBy: item.completedByUser || item.completedBy,
  };
}

function transformComment(item: any): DatabaseComment {
  return {
    id: item.id,
    task_id: item.task_id || item.taskId,
    author_id: item.authorId || item.author_id,
    text: item.text,
    created_at: new Date(item.timestamp || item.created_at),
    is_result: item.isResult || item.is_result,
    is_edited: item.isEdited || item.is_edited,
    edited_at:
      item.editedAt || item.edited_at
        ? new Date(item.editedAt || item.edited_at)
        : undefined,
    author: item.author,
  };
}

export const tasksApi = createApi({
  reducerPath: "tasksApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/",
    prepareHeaders: (headers, { getState }) => {
      // ! To-Do
      headers.set("x-user-id", currentUserId);
      return headers;
    },
  }),
  tagTypes: ["Task", "Comment", "Checklist"],
  endpoints: (builder) => ({
    getTasks: builder.query<
      DatabaseTask[],
      {
        userId?: string;
        status?: string;
        assignedTo?: string;
        createdBy?: string;
        processId?: string;
        overdue?: boolean;
        almostOverdue?: boolean;
        includeDeleted?: boolean;
      }
    >({
      query: (params) => ({
        url: "tasks",
        params: {
          userId: params.userId,
          status: params.status,
          assignedTo: params.assignedTo,
          createdBy: params.createdBy,
          processId: params.processId,
          overdue: params.overdue?.toString(),
          almostOverdue: params.almostOverdue?.toString(),
          // includeDeleted: "true",
          includeDeleted: params.includeDeleted?.toString() || "false",
        },
      }),
      transformResponse: (response: { success: boolean; data: any[] }) => {
            const transformed = response.data.map(transformDatabaseTaskToFrontend);
            return transformed;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Task" as const, id })),
              { type: "Task", id: "LIST" },
            ]
          : [{ type: "Task", id: "LIST" }],
    }),

    // Остальные существующие endpoints без изменений...
    getTask: builder.query<DatabaseTask, string>({
      
      query: (id) => `tasks/${id}`,
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseTaskToFrontend(response.data);
      },
      providesTags: (result, error, id) => [{ type: "Task", id }],
    }),

    createTask: builder.mutation<DatabaseTask, CreateTaskRequest>({
      query: (task) => ({
        url: "tasks",
        method: "POST",
        body: task,
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseTaskToFrontend(response.data);
      },
      invalidatesTags: [{ type: "Task", id: "LIST" }],
    }),

    updateTask: builder.mutation<
      DatabaseTask,
      { id: string; updates: UpdateTaskRequest }
    >({
      query: ({ id, updates }) => ({
        url: `tasks/${id}`,
        method: "PUT",
        body: updates,
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseTaskToFrontend(response.data);
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Task", id },
        { type: "Task", id: "LIST" },
      ],
    }),

    updateTaskStatus: builder.mutation<
      DatabaseTask,
      {
        id: string;
        status: string;
        result?: string;
        actualHours?: number;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `tasks/${id}/status`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return {
          id: response.data.id,
          status: response.data.status,
          result: response.data.result,
          actual_hours: response.data.actualHours || response.data.actual_hours,
          completed_at:
            response.data.completedAt || response.data.completed_at
              ? new Date(
                  response.data.completedAt || response.data.completed_at
                )
              : undefined,
          updated_at: new Date(
            response.data.updatedAt || response.data.updated_at
          ),
        } as Partial<DatabaseTask> as DatabaseTask;
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Task", id },
        { type: "Task", id: "LIST" },
      ],
    }),

    // НОВЫЕ ENDPOINTS ДЛЯ УДАЛЕНИЯ И ВОССТАНОВЛЕНИЯ

    // Мягкое удаление (в корзину)
    softDeleteTask: builder.mutation<DatabaseTask, string>({
      query: (id) => ({
        url: `tasks/${id}/delete`,
        method: "POST",
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseTaskToFrontend(response.data);
      },
      invalidatesTags: (result, error, id) => [
        { type: "Task", id },
        { type: "Task", id: "LIST" },
      ],
    }),

    // Восстановление из корзины
    restoreTask: builder.mutation<DatabaseTask, string>({
      query: (id) => ({
        url: `tasks/${id}/delete`,
        method: "PUT",
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformDatabaseTaskToFrontend(response.data);
      },
      invalidatesTags: (result, error, id) => [
        { type: "Task", id },
        { type: "Task", id: "LIST" },
      ],
    }),

    // Окончательное удаление
    permanentlyDeleteTask: builder.mutation<void, string>({
      query: (id) => ({
        url: `tasks/${id}/delete`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Task", id: "LIST" }],
    }),

    // Старый endpoint для обратной совместимости (теперь делает мягкое удаление)
    deleteTask: builder.mutation<void, string>({
      query: (id) => ({
        url: `tasks/${id}/delete`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "Task", id: "LIST" }],
    }),

    addComment: builder.mutation<
      DatabaseComment,
      { taskId: string; text: string; isResult: boolean }
    >({
      query: ({ taskId, text, isResult }) => ({
        url: `tasks/${taskId}/comments`, // Убираем ведущий слеш
        method: "POST",
        body: { text, isResult },
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        if (!response.success) {
          throw new Error("Failed to add comment");
        }
        return response.data;
      },
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Comment", id: "LIST" },
        { type: "Task", id: taskId },
      ],
    }),

    updateComment: builder.mutation<
      DatabaseComment,
      { taskId: string; commentId: string; text: string }
    >({
      query: ({ taskId, commentId, text }) => ({
        url: `tasks/${taskId}/comments/${commentId}`, // Убираем ведущий слеш
        method: "PUT",
        body: { text },
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        if (!response.success) {
          throw new Error("Failed to update comment");
        }
        return response.data;
      },
      invalidatesTags: (result, error, { taskId, commentId }) => [
        { type: "Comment", id: commentId },
        { type: "Comment", id: "LIST" },
        { type: "Task", id: taskId },
      ],
    }),

    deleteComment: builder.mutation<
      void,
      { taskId: string; commentId: string }
    >({
      query: ({ taskId, commentId }) => ({
        url: `tasks/${taskId}/comments/${commentId}`, // Убираем ведущий слеш
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { taskId, commentId }) => [
        { type: "Comment", id: commentId },
        { type: "Comment", id: "LIST" },
        { type: "Task", id: taskId },
      ],
    }),

    getTaskComments: builder.query<DatabaseComment[], string>({
      query: (taskId) => `tasks/${taskId}/comments`, // Убираем ведущий слеш
      transformResponse: (response: { success: boolean; data: any[] }) => {
        if (!response.success) {
          throw new Error("Failed to fetch comments");
        }
        return response.data.map((comment) => ({
          id: comment.id,
          task_id: comment.task_id,
          author_id: comment.author_id,
          text: comment.text,
          is_result: comment.is_result,
          is_edited: comment.is_edited,
          ai_score: comment.ai_score,
          created_at: new Date(comment.created_at),
          edited_at: comment.edited_at
            ? new Date(comment.edited_at)
            : undefined,
          author: comment.author,
        }));
      },
      providesTags: (result, error, taskId) => [
        { type: "Comment", id: "LIST" },
        { type: "Task", id: taskId },
      ],
    }),

    getTaskChecklist: builder.query<DatabaseChecklistItem[], string>({
      query: (taskId) => `tasks/${taskId}/checklist`,
      transformResponse: (response: { success: boolean; data: any[] }) => {
        return response.data.map(transformChecklistItem);
      },
      providesTags: (result, error, taskId) => [
        { type: "Checklist", id: taskId },
      ],
    }),

    addChecklistItem: builder.mutation<
      DatabaseChecklistItem,
      {
        taskId: string;
        text: string;
        level?: number;
        parentId?: string;
      }
    >({
      query: ({ taskId, text, level, parentId }) => ({
        url: `tasks/${taskId}/checklist`,
        method: "POST",
        body: { text, level, parentId },
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformChecklistItem(response.data);
      },
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Checklist", id: taskId },
        { type: "Task", id: taskId },
        { type: "Task", id: "LIST" },
      ],
      async onQueryStarted(
        { taskId, text, level = 0 },
        { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
          tasksApi.util.updateQueryData("getTaskChecklist", taskId, (draft) => {
            const optimisticItem: DatabaseChecklistItem = {
              id: `temp-${Date.now()}`,
              task_id: taskId,
              text,
              completed: false,
              created_at: new Date(),
              // ! To-Do
              created_by: currentUserId,
              level,
              item_order: draft.length + 1,
            };
            draft.push(optimisticItem);
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    updateChecklistItem: builder.mutation<
      DatabaseChecklistItem,
      {
        taskId: string;
        itemId: string;
        text?: string;
        completed?: boolean;
      }
    >({
      query: ({ taskId, itemId, text, completed }) => ({
        url: `tasks/${taskId}/checklist/${itemId}`,
        method: "PUT",
        body: { text, completed },
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformChecklistItem(response.data);
      },
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Checklist", id: taskId },
        { type: "Task", id: taskId },
      ],
      async onQueryStarted(
        { taskId, itemId, text, completed },
        { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
          tasksApi.util.updateQueryData("getTaskChecklist", taskId, (draft) => {
            const item = draft.find((item) => item.id === itemId);
            if (item) {
              if (text !== undefined) item.text = text;
              if (completed !== undefined) {
                item.completed = completed;
                item.completed_at = completed ? new Date() : undefined;
                item.completed_by = completed
                // ! TO-dO
                  ? currentUserId
                  : undefined;
              }
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    indentChecklistItem: builder.mutation<
      DatabaseChecklistItem,
      {
        taskId: string;
        itemId: string;
      }
    >({
      query: ({ taskId, itemId }) => ({
        url: `tasks/${taskId}/checklist/${itemId}`,
        method: "PATCH",
        body: { action: "indent" },
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformChecklistItem(response.data);
      },
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Checklist", id: taskId },
        { type: "Task", id: taskId },
      ],
    }),

    outdentChecklistItem: builder.mutation<
      DatabaseChecklistItem,
      {
        taskId: string;
        itemId: string;
      }
    >({
      query: ({ taskId, itemId }) => ({
        url: `tasks/${taskId}/checklist/${itemId}`,
        method: "PATCH",
        body: { action: "outdent" },
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformChecklistItem(response.data);
      },
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Checklist", id: taskId },
        { type: "Task", id: taskId },
      ],
    }),

    moveChecklistItemUp: builder.mutation<
      DatabaseChecklistItem,
      {
        taskId: string;
        itemId: string;
      }
    >({
      query: ({ taskId, itemId }) => ({
        url: `tasks/${taskId}/checklist/${itemId}`,
        method: "PATCH",
        body: { action: "move", direction: "up" },
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformChecklistItem(response.data);
      },
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Checklist", id: taskId },
        { type: "Task", id: taskId },
      ],
    }),

    moveChecklistItemDown: builder.mutation<
      DatabaseChecklistItem,
      {
        taskId: string;
        itemId: string;
      }
    >({
      query: ({ taskId, itemId }) => ({
        url: `tasks/${taskId}/checklist/${itemId}`,
        method: "PATCH",
        body: { action: "move", direction: "down" },
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return transformChecklistItem(response.data);
      },
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Checklist", id: taskId },
        { type: "Task", id: taskId },
      ],
    }),

    deleteChecklistItem: builder.mutation<
      void,
      { taskId: string; itemId: string }
    >({
      query: ({ taskId, itemId }) => ({
        url: `tasks/${taskId}/checklist/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Checklist", id: taskId },
        { type: "Task", id: taskId },
      ],
      async onQueryStarted({ taskId, itemId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          tasksApi.util.updateQueryData("getTaskChecklist", taskId, (draft) => {
            const index = draft.findIndex((item) => item.id === itemId);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // Получение ссылки на задачу
    getTaskLink: builder.query<
      { url: string; taskId: string; taskTitle: string; isDeleted: boolean },
      string
    >({
      query: (taskId) => `tasks/${taskId}/link`,
      transformResponse: (response: { success: boolean; data: any }) => {
        return response.data;
      },
    }),

    // Создание защищенной ссылки на задачу
    createSecureTaskLink: builder.mutation<
      { url: string; taskId: string; expiration?: string; accessCode?: string },
      {
        taskId: string;
        expiration?: string;
        accessCode?: string;
      }
    >({
      query: ({ taskId, expiration, accessCode }) => ({
        url: `tasks/${taskId}/link`,
        method: "POST",
        body: { expiration, accessCode },
      }),
      transformResponse: (response: { success: boolean; data: any }) => {
        return response.data;
      },
    }),

    exportTasks: builder.mutation<void, void>({
      query: () => ({
        url: "tasks/export",
        method: "GET",
        responseHandler: async (response) => {
          // Получаем данные как blob
          const blob = await response.blob();

          // Создаем URL для скачивания
          const url = window.URL.createObjectURL(blob);

          // Создаем временную ссылку для скачивания
          const link = document.createElement("a");
          link.href = url;

          // Получаем имя файла из заголовков ответа
          const contentDisposition = response.headers.get(
            "content-disposition"
          );
          let fileName = "tasks_export.xlsx";

          if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
            if (fileNameMatch) {
              fileName = fileNameMatch[1];
            }
          }

          link.download = fileName;

          // Добавляем ссылку в DOM, кликаем и удаляем
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Очищаем URL
          window.URL.revokeObjectURL(url);

          return null;
        },
      }),
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
  useSoftDeleteTaskMutation,
  useRestoreTaskMutation,
  usePermanentlyDeleteTaskMutation,
  useGetTaskCommentsQuery,
  useAddCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useGetTaskChecklistQuery,
  useAddChecklistItemMutation,
  useUpdateChecklistItemMutation,
  useDeleteChecklistItemMutation,
  useIndentChecklistItemMutation,
  useOutdentChecklistItemMutation,
  useMoveChecklistItemUpMutation,
  useMoveChecklistItemDownMutation,
  useCreateSecureTaskLinkMutation,
  useGetTaskLinkQuery,
  useExportTasksMutation,
} = tasksApi;
