"use client";

import React, { useState, useCallback, useMemo } from "react";

import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../ui/collapsible";
import { Button } from "../../ui/button";
import useFileUpload from "@/src/hooks/useFileUpload";
import useImageUpload from "@/src/hooks/useImageUpload";
import { TiptapEditor } from "../../Views/TaskView/TiptapEditor";
import { Label } from "../../ui/label";

interface TaskDescriptionFieldProps {
  description: string;
  onDescriptionChange: (description: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  showExpanded?: boolean;
}

export default function TaskDescriptionField({
  description,
  onDescriptionChange,
  label = "Описание",
  placeholder = "Подробное описание задачи...",
  error,
  required = false,
  disabled = false,
  className = "",
  minHeight = 120,
  maxHeight = 300,
  showExpanded = false,
}: TaskDescriptionFieldProps) {
  const [isExpanded, setIsExpanded] = useState(showExpanded);
  
  // Используем хуки для загрузки файлов
  const { uploadMultipleFiles, isUploading: isUploadingFiles } = useFileUpload({
    maxFileSize: 10 * 1024 * 1024,
    onError: (error) => {
      console.error('File upload error:', error);
      alert(`Ошибка загрузки файла: ${error}`);
    }
  });

  const { uploadImage, isUploading: isUploadingImage } = useImageUpload({
    maxFileSize: 5 * 1024 * 1024,
    onError: (error: any) => {
      console.error('Image upload error:', error);
      alert(`Ошибка загрузки изображения: ${error}`);
    }
  });

  // Обработчики загрузки файлов
  const handleFileUpload = useCallback(async (files: FileList): Promise<string[]> => {
    try {
      return await uploadMultipleFiles(files, 'document');
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  }, [uploadMultipleFiles]);

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    try {
      return await uploadImage(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }, [uploadImage]);

  // Проверка наличия контента
  const hasContent = useMemo(() => {
    if (!description) return false;
    const textContent = description.replace(/<[^>]*>/g, '').trim();
    return textContent.length > 0;
  }, [description]);

  const isUploading = isUploadingFiles || isUploadingImage;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 h-auto p-1 text-xs text-gray-600 hover:text-gray-900"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Свернуть
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Развернуть редактор
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      </div>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <div className="mt-2">
            <TiptapEditor
              initialContent={description || '<p></p>'}
              onContentChange={onDescriptionChange}
              placeholder={placeholder}
              readOnly={disabled}
              className={error ? 'border-red-500' : ''}
              minHeight={minHeight}
              maxHeight={maxHeight}
            />

            {/* Индикатор загрузки */}
            {isUploading && (
              <div className="flex items-center gap-2 mt-2 p-2 text-sm text-blue-600 bg-blue-50 rounded">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Загрузка файлов...
              </div>
            )}
          </div>
        </CollapsibleContent>

        {/* Простое поле для краткого описания когда свернуто */}
        <div className={isExpanded ? 'hidden' : 'block'}>
          <textarea
            value={description ? description.replace(/<[^>]*>/g, '').trim() : ''}
            onChange={(e) => onDescriptionChange(`<p>${e.target.value}</p>`)}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? 'border-red-500' : 'border-gray-300'
            } ${disabled ? 'bg-gray-100' : 'bg-white'}`}
            rows={3}
          />
        </div>
      </Collapsible>

      {error && (
        <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Подсказка */}
      {!error && !hasContent && (
        <p className="text-xs text-gray-500 mt-1">
          {isExpanded 
            ? 'Используйте расширенный редактор для форматирования текста, добавления списков, таблиц и файлов'
            : 'Нажмите "Развернуть редактор" для расширенного форматирования'
          }
        </p>
      )}

      {/* Счетчик символов для развернутого режима */}
      {isExpanded && hasContent && (
        <p className="text-xs text-gray-500 mt-1">
          Символов: {description.replace(/<[^>]*>/g, '').length}
        </p>
      )}
    </div>
  );
}
