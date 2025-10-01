// src/components/Views/TaskView/TagsFilter.tsx
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { X, Tag, ChevronDown, Search, Check } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/src/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Separator } from '@/src/components/ui/separator';

interface TagsFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onSelectedTagsChange: (tags: string[]) => void;
  tagFilterMode: 'any' | 'all';
  onTagFilterModeChange: (mode: 'any' | 'all') => void;
  className?: string;
  variant?: 'popover' | 'inline';
}

export default function TagsFilter({
  availableTags,
  selectedTags,
  onSelectedTagsChange,
  tagFilterMode,
  onTagFilterModeChange,
  className = '',
  variant = 'popover'
}: TagsFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Фильтрованные теги для поиска
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return availableTags;
    return availableTags.filter(tag => 
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableTags, searchQuery]);

  // Обработчики
  const handleTagToggle = useCallback((tag: string) => {
    if (selectedTags.includes(tag)) {
      onSelectedTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onSelectedTagsChange([...selectedTags, tag]);
    }
  }, [selectedTags, onSelectedTagsChange]);

  const handleRemoveTag = useCallback((tag: string) => {
    onSelectedTagsChange(selectedTags.filter(t => t !== tag));
  }, [selectedTags, onSelectedTagsChange]);

  const handleClearAll = useCallback(() => {
    onSelectedTagsChange([]);
    setSearchQuery('');
  }, [onSelectedTagsChange]);

  const handleSelectAll = useCallback(() => {
    onSelectedTagsChange([...availableTags]);
  }, [availableTags, onSelectedTagsChange]);

  // Компонент содержимого фильтра
  const FilterContent = useCallback(() => (
    <div className="space-y-4">
      {/* Режим фильтрации */}
      <div>
        <Label className="text-sm font-medium mb-2 block">
          Режим фильтрации
        </Label>
        <RadioGroup
          value={tagFilterMode}
          onValueChange={(value: 'any' | 'all') => onTagFilterModeChange(value)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="any" id="any" />
            <Label htmlFor="any" className="text-sm cursor-pointer">
              Любой тег
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all" className="text-sm cursor-pointer">
              Все теги
            </Label>
          </div>
        </RadioGroup>
        <p className="text-xs text-gray-500 mt-1">
          {tagFilterMode === 'any' 
            ? 'Показать задачи с любым из выбранных тегов'
            : 'Показать задачи, содержащие все выбранные теги'
          }
        </p>
      </div>

      <Separator />

      {/* Поиск тегов */}
      <div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск тегов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Действия */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          disabled={filteredTags.length === 0}
          className="text-xs"
        >
          Выбрать все
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          disabled={selectedTags.length === 0}
          className="text-xs"
        >
          Очистить
        </Button>
      </div>

      {/* Список тегов */}
      <div className="max-h-60 overflow-y-auto">
        {filteredTags.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Tag className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">
              {searchQuery ? 'Теги не найдены' : 'Нет доступных тегов'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`w-full flex items-center justify-between p-2 rounded-md text-sm transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-3 w-3" />
                    <span className="truncate">{tag}</span>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  ), [
    tagFilterMode,
    onTagFilterModeChange,
    searchQuery,
    filteredTags,
    selectedTags,
    handleTagToggle,
    handleSelectAll,
    handleClearAll
  ]);

  // Встроенный вариант
  if (variant === 'inline') {
    return (
      <div className={`space-y-4 ${className}`}>
        <FilterContent />
      </div>
    );
  }

  // Вариант с Popover
  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-10 justify-between"
            disabled={availableTags.length === 0}
          >
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span>
                {selectedTags.length === 0
                  ? 'Фильтр по тегам'
                  : `${selectedTags.length} тег${selectedTags.length === 1 ? '' : selectedTags.length < 5 ? 'а' : 'ов'}`
                }
              </span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Фильтр по тегам</h4>
              {selectedTags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-auto p-0 text-xs text-gray-500 hover:text-gray-700"
                >
                  Очистить все
                </Button>
              )}
            </div>

            <FilterContent />
          </div>
        </PopoverContent>
      </Popover>

      {/* Показываем выбранные теги под кнопкой */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1 text-xs px-2 py-1"
            >
              <Tag className="h-3 w-3" />
              <span>{tag}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-2 w-2" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}