"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  memo,
} from "react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Label } from "@/src/components/ui/label";
import {
  Send,
  Image as ImageIcon,
  Loader2,
  X,
  Download,
  Eye,
  FileText,
} from "lucide-react";
import { TiptapEditor } from "@/src/components/Views/TaskView/TiptapEditor";

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface CommentEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (
    content: string,
    isResult: boolean,
    attachments?: AttachedFile[]
  ) => Promise<void>;
  onFileUpload?: (files: FileList) => Promise<string[]>;
  onImageUpload?: (file: File) => Promise<string>;
  placeholder?: string;
  isSubmitting?: boolean;
  showResultCheckbox?: boolean;
  className?: string;
  autoFocus?: boolean;
  minHeight?: number;
  maxHeight?: number;
}

// Начальное значение для комментария
const EMPTY_EDITOR_VALUE = "<p></p>";

// Мемоизированный компонент бейджа файла
const FileBadge = memo(
  ({
    fileName,
    fileSize,
    fileType,
    url,
    onRemove,
  }: {
    fileName: string;
    fileSize: number;
    fileType: string;
    url: string;
    onRemove: () => void;
  }) => {
    const formatFileSize = useCallback((bytes: number): string => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    }, []);

    const isImage = useMemo(() => fileType.startsWith("image/"), [fileType]);

    const fileIcon = useMemo(() => {
      return isImage ? ImageIcon : FileText;
    }, [isImage]);

    const handleDownload = useCallback(() => {
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, [url, fileName]);

    const handlePreview = useCallback(() => {
      window.open(url, "_blank");
    }, [url]);

    const FileIcon = fileIcon;

    return (
      <Badge variant="outline" className="flex items-center gap-2 p-2 max-w-xs">
        <FileIcon className="h-4 w-4 flex-shrink-0" />
        <div className="flex flex-col items-start min-w-0 flex-1">
          <span
            className="text-xs font-medium truncate w-full"
            title={fileName}
          >
            {fileName}
          </span>
          <span className="text-xs text-gray-500">
            {formatFileSize(fileSize)}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {isImage && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handlePreview}
              title="Предпросмотр"
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleDownload}
            title="Скачать"
          >
            <Download className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            onClick={onRemove}
            title="Удалить"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </Badge>
    );
  }
);
FileBadge.displayName = "FileBadge";

const CommentEditor = memo(function CommentEditor({
  value,
  onChange,
  onSubmit,
  onFileUpload,
  onImageUpload,
  placeholder = "Написать комментарий...",
  isSubmitting = false,
  showResultCheckbox = true,
  className = "",
  autoFocus = false,
  minHeight = 80,
  maxHeight = 200,
}: CommentEditorProps) {
  const [isResult, setIsResult] = useState(false);
  // Изменяем начальное состояние на true - редактор всегда развернут
  const [isExpanded, setIsExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Проверка пустоты контента
  const isEmpty = useCallback((content: string): boolean => {
    if (!content) return true;
    const textContent = content.replace(/<[^>]*>/g, "").trim();
    return textContent.length === 0;
  }, []);

  // 1) Детектор медиа/вложений в HTML редактора
  const hasRichNodes = useCallback((html: string): boolean => {
    if (!html) return false;

    // SSR-safe fallback
    if (typeof window === "undefined" || typeof DOMParser === "undefined") {
      return /<(img|video|audio|iframe)\b|data-file-badge|class="file-badge-inline|class="file-badge/.test(
        html
      );
    }

    const doc = new DOMParser().parseFromString(
      `<div id="wrap">${html}</div>`,
      "text/html"
    );
    const root = doc.getElementById("wrap") as HTMLElement;

    return !!root.querySelector(
      'img,video,audio,iframe,[data-file-badge],[data-file-badge="true"],.file-badge-inline,.file-badge'
    );
  }, []);

  // 2) Оставьте isEmpty как есть, но дополним hasContent:
  const hasContent = useMemo(() => {
    return !isEmpty(value) || hasRichNodes(value) || attachedFiles.length > 0;
  }, [value, attachedFiles.length, isEmpty, hasRichNodes]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Обработчики для кнопок
  const handleCancel = useCallback(() => {
    onChange(EMPTY_EDITOR_VALUE);
    setIsResult(false);
    setAttachedFiles([]);
    // Убираем сворачивание - редактор остается развернутым
  }, [onChange]);

  const removeAttachedFile = useCallback((fileId: string) => {
    setAttachedFiles((prev) => prev.filter((file) => file.id !== fileId));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!hasContent) return;
    if (isSubmitting) return;

    try {
      await onSubmit(value, isResult, attachedFiles);
      // Очищаем все данные после успешной отправки
      onChange(EMPTY_EDITOR_VALUE);
      setIsResult(false);
      setAttachedFiles([]);
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
  }, [
    value,
    attachedFiles,
    isResult,
    isSubmitting,
    onSubmit,
    onChange,
    hasContent,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Автофокус только если компонент смонтирован
  useEffect(() => {
    if (mounted && autoFocus && isExpanded) {
      // Фокус на редакторе TipTap будет обработан внутри самого компонента
    }
  }, [mounted, autoFocus, isExpanded]);

  // Поскольку редактор всегда развернут, убираем простую версию
  // и отображаем только расширенную версию
  const renderExpandedEditor = useMemo(
    () => (
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
          <div className="flex items-center gap-2">
            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                Загрузка...
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {showResultCheckbox && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-result"
                  checked={isResult}
                  onCheckedChange={(checked: boolean) => setIsResult(checked)}
                  disabled={isSubmitting || isUploading}
                />
                <Label
                  htmlFor="is-result"
                  className={`text-sm cursor-pointer select-none ${
                    isResult ? "font-medium text-green-700" : "text-gray-700"
                  }`}
                >
                  Результат выполнения
                </Label>
              </div>
            )}

            <Button
              onClick={handleCancel}
              variant="ghost"
              size="sm"
              disabled={isSubmitting || isUploading}
              className="text-xs h-7 px-2 select-none"
            >
              Очистить
            </Button>
          </div>
        </div>

        {attachedFiles.length > 0 && (
          <div className="p-3 bg-blue-50 border-b">
            <div className="text-sm text-blue-700 mb-2">
              Прикрепленные файлы:
            </div>
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file) => (
                <FileBadge
                  key={file.id}
                  fileName={file.name}
                  fileSize={file.size}
                  fileType={file.type}
                  url={file.url}
                  onRemove={() => removeAttachedFile(file.id)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="relative" ref={containerRef}>
          <TiptapEditor
            initialContent={value || EMPTY_EDITOR_VALUE}
            onContentChange={onChange}
            placeholder={placeholder}
            minHeight={Math.max(minHeight, 120)}
            maxHeight={maxHeight}
            readOnly={false}
            className="border-none"
          />

          <div className="absolute bottom-2 right-2 z-10">
            <Button
              onClick={handleSubmit}
              disabled={!hasContent || isSubmitting || isUploading}
              size="sm"
              className="h-8 px-3 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Отправка...
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Загрузка...
                </>
              ) : (
                <>
                  <Send className="h-3 w-3 mr-1" />
                  Отправить
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    ),
    [
      attachedFiles,
      isUploading,
      isSubmitting,
      showResultCheckbox,
      isResult,
      handleCancel,
      removeAttachedFile,
      value,
      onChange,
      placeholder,
      minHeight,
      maxHeight,
      handleSubmit,
      hasContent,
    ]
  );

  return (
    <div className={`comment-editor ${className}`} onKeyDown={handleKeyDown}>
      {renderExpandedEditor}
    </div>
  );
});

CommentEditor.displayName = "CommentEditor";

export default CommentEditor;
