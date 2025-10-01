"use client";

import { useState, useCallback } from "react";
import { Edit, MoreVertical, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { DatabaseComment, DatabaseUser } from "@/src/lib/models/types";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { ScrollArea } from "../../ui/scroll-area";
import { Button } from "../../ui/button";
import CommentEditor from "../../Views/TaskView/CommentEditor";
import ReadOnlyFileBadge from "../../Views/TaskView/TiptapEditor/ReadOnlyFileBadge";

interface TaskCommentsSectionProps {
  comments: DatabaseComment[];
  isLoading: boolean;
  canComment: boolean;
  currentUser: DatabaseUser;
  onAddComment: (text: string, isResult: boolean) => Promise<void>;
  onEditComment: (commentId: string, text: string) => Promise<void>;
  onDeleteComment: (commentId: string) => void;
  getUserById: (id: string) => DatabaseUser | undefined;
  isTaskDeleted?: boolean;
}

function parseCommentContent(html: string) {
  if (!html)
    return {
      content: "",
      files: [] as Array<{
        url: string;
        filename: string;
        size: number;
        type: string;
        id: string;
      }>,
    };
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return { content: html, files: [] };
  }
  const doc = new DOMParser().parseFromString(
    `<div id="__wrap">${html}</div>`,
    "text/html"
  );
  const root = doc.getElementById("__wrap") as HTMLElement;
  const files: Array<{
    url: string;
    filename: string;
    size: number;
    type: string;
    id: string;
  }> = [];
  const candidates = Array.from(
    root.querySelectorAll<HTMLElement>(
      '[data-file-badge="true"], [data-file-badge], .file-badge-inline, .file-badge'
    )
  );
  candidates.forEach((n, idx) => {
    const host =
      n.closest<HTMLElement>("[data-file-badge]") ||
      n.closest<HTMLElement>(".file-badge-inline") ||
      n.closest<HTMLElement>(".file-badge") ||
      n;
    const url =
      host.getAttribute("data-url") ||
      host
        .querySelector<HTMLElement>(".file-download-btn")
        ?.getAttribute("data-url") ||
      "";
    const filename =
      host.getAttribute("data-filename") ||
      host.querySelector<HTMLElement>(".file-name")?.getAttribute("title") ||
      host.querySelector<HTMLElement>(".file-name")?.textContent ||
      "file";
    const sizeAttr = host.getAttribute("data-size") || "";
    const size = Number.parseInt(sizeAttr, 10) || 0;
    const type = host.getAttribute("data-type") || "";
    files.push({ url, filename, size, type, id: `file-${Date.now()}-${idx}` });
    host.remove();
  });
  root
    .querySelectorAll(".file-name, .file-actions")
    .forEach((el) => el.remove());
  root.querySelectorAll("p").forEach((p) => {
    if ((p.textContent || "").trim() === "") p.remove();
  });
  const content = root.innerHTML.trim();
  return { content, files };
}

export default function TaskCommentsSection({
  comments,
  isLoading,
  canComment,
  currentUser,
  onAddComment,
  onEditComment,
  onDeleteComment,
  getUserById,
  isTaskDeleted = false,
}: TaskCommentsSectionProps) {
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [commentValue, setCommentValue] = useState("");

  const canEditComments = canComment && !isTaskDeleted;
  const canModifyComments = canComment && !isTaskDeleted;

  const handleAddComment = useCallback(
    async (content: string, isResult: boolean) => {
      if (!canEditComments) return;
      setIsAddingComment(true);
      try {
        await onAddComment(content, isResult);
        setCommentValue(""); // Очищаем после отправки
      } finally {
        setIsAddingComment(false);
      }
    },
    [onAddComment, canEditComments]
  );

  const handleEditComment = async (commentId: string, text: string) => {
    if (!canModifyComments) return;
    await onEditComment(commentId, text);
    setEditingComment(null);
    setEditCommentText("");
  };

  const startEditing = (comment: DatabaseComment) => {
    if (!canModifyComments) return;
    setEditingComment(comment.id);
    setEditCommentText(comment.text || "");
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditCommentText("");
  };

  const handleDeleteCommentClick = (commentId: string) => {
    if (!canModifyComments) return;
    if (confirm("Удалить комментарий?")) onDeleteComment(commentId);
  };

  return (
    <div className="flex flex-col h-full">
      {isTaskDeleted && (
        <div className="mb-2 flex items-center gap-2 text-orange-800">
          <AlertCircle className="h-5 w-5" />
          <span className="text-xs font-medium">
            Задача в корзине — только чтение
          </span>
        </div>
      )}

      <ScrollArea className="flex-1 pr-2">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">
            Загрузка комментариев…
          </div>
        ) : comments.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Комментариев пока нет
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => {
              const author = getUserById(c.author_id || "");
              const { content, files } = parseCommentContent(c.text || "");
              const isEditing = editingComment === c.id;

              return (
                <div key={c.id} className="rounded-md border p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={author?.avatar || "/placeholder.svg"}
                        />
                        <AvatarFallback className="text-xs">
                          {author?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-xs">
                        <div className="font-medium">
                          {author?.name || "Пользователь"}
                        </div>
                        <div className="text-muted-foreground">
                          {format(new Date(c.created_at), "d MMM yyyy, HH:mm", {
                            locale: ru,
                          })}
                        </div>
                      </div>
                    </div>

                    {canModifyComments && !isEditing && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(c)}
                          className="h-7 w-7"
                          title="Редактировать"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCommentClick(c.id)}
                          className="h-7 w-7"
                          title="Удалить"
                        >
                          <MoreVertical className="h-4 w-4 rotate-90" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-sm prose prose-sm max-w-none">
                    {!isEditing ? (
                      <>
                        <div
                          dangerouslySetInnerHTML={{ __html: content || "" }}
                        />
                        {files?.length ? (
                          <div className="mt-2 flex gap-2 flex-wrap">
                            {files.map((f) => (
                              <ReadOnlyFileBadge 
                                key={f.id} 
                                url={f.url}
                                filename={f.filename}
                                size={f.size}
                                type={f.type}
                              />
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <CommentEditor
                        value={editCommentText}
                        onChange={setEditCommentText}
                        onSubmit={async (html, asResult) => {
                          await handleEditComment(c.id, html);
                        }}
                        isSubmitting={false}
                        autoFocus={false}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Добавление нового комментария — скрыто, если нельзя комментировать */}
      {canEditComments ? (
        <div className="mt-2">
          <CommentEditor
            value={commentValue}
            onChange={setCommentValue}
            onSubmit={async (html, asResult) => {
              await handleAddComment(html, !!asResult);
            }}
            isSubmitting={isAddingComment}
            autoFocus={false}
          />
        </div>
      ) : (
        <div className="mt-2 text-xs text-muted-foreground">
          Добавление комментариев недоступно
        </div>
      )}
    </div>
  );
}