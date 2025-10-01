'use client';

import React from 'react';
import { Label } from "@/src/components/ui/label";
import { AlertCircle } from "lucide-react";
import TagsSelector from './TagsSelector';

interface TaskTagsFieldProps {
  tags: string;
  onTagsChange: (tags: string) => void;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  maxTags?: number;
}

export default function TaskTagsField({
  tags,
  onTagsChange,
  label = "Теги",
  description,
  error,
  required = false,
  disabled = false,
  className = "",
  size = "default",
  maxTags = 10
}: TaskTagsFieldProps) {
  // Преобразуем строку тегов в массив
  const selectedTags = tags
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);

  // Обработчик изменения тегов
  const handleTagsChange = (newTags: string[]) => {
    onTagsChange(newTags.join(', '));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <TagsSelector
        selectedTags={selectedTags}
        onTagsChange={handleTagsChange}
        placeholder={selectedTags.length > 0 ? `${selectedTags.length} тег${selectedTags.length === 1 ? '' : selectedTags.length < 5 ? 'а' : 'ов'} выбрано` : "Выберите или создайте теги"}
        maxTags={maxTags}
        size={size}
        disabled={disabled}
        allowCreate={true}
        className={error ? 'border-red-500' : ''}
      />
      
      {error && (
        <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      {description && !error && (
        <p className="text-xs text-gray-500 mt-1">
          {description}
        </p>
      )}
      
      {/* Подсказка о популярных тегах */}
      {!error && !description && selectedTags.length === 0 && (
        <p className="text-xs text-gray-400 mt-1">
          Популярные: срочно, важно, презентация, документы, встреча
        </p>
      )}
      
      {/* Счетчик тегов */}
      {selectedTags.length > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          {selectedTags.length} из {maxTags} тегов выбрано
        </p>
      )}
    </div>
  );
}