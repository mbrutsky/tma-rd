'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/src/components/ui/popover";
import { 
  X, 
  Plus, 
  Tag, 
  Search,
  ChevronDown,
  Hash,
  Loader2
} from "lucide-react";
import { useDebounce } from '@/src/hooks/useDebounce';
import { useGetTagsQuery } from '@/src/lib/store/api/tagsApi';

interface TagsSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags?: string[];
  placeholder?: string;
  maxTags?: number;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  allowCreate?: boolean;
}

// Мемоизированный компонент тега
const TagBadge = memo(({ 
  tag, 
  variant, 
  size, 
  showRemove = false, 
  onRemove 
}: {
  tag: string;
  variant?: 'default' | 'secondary' | 'outline';
  size: 'sm' | 'default' | 'lg';
  showRemove?: boolean;
  onRemove?: () => void;
}) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    default: "text-sm px-3 py-1", 
    lg: "text-base px-4 py-2"
  };

  return (
    <Badge
      variant={variant || "secondary"}
      className={`${sizeClasses[size]} truncate flex items-center gap-1`}
      title={tag}
    >
      <Hash className="h-3 w-3" />
      {tag}
      {showRemove && onRemove && (
        <X
          className="h-3 w-3 cursor-pointer hover:text-red-500 ml-1"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </Badge>
  );
});
TagBadge.displayName = 'TagBadge';

// Мемоизированный компонент элемента тега в списке
const TagListItem = memo(({ 
  tag, 
  count, 
  onClick, 
  disabled 
}: {
  tag: string;
  count?: number;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <div className="flex items-center gap-2">
      <Hash className="h-3 w-3 text-gray-400" />
      <span className="text-sm">{tag}</span>
    </div>
    {count && (
      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
        {count}
      </span>
    )}
  </button>
));
TagListItem.displayName = 'TagListItem';

const TagsSelector = memo(function TagsSelector({
  selectedTags = [],
  onTagsChange,
  availableTags,
  placeholder = "Выберите теги",
  maxTags = 10,
  className = "",
  size = "default",
  disabled = false,
  allowCreate = true
}: TagsSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Дебаунс для поискового запроса
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Загружаем теги из API с условной загрузкой
  const { data: apiTags = [], isLoading: tagsLoading } = useGetTagsQuery({
    search: debouncedSearch,
    limit: 50,
    includeCount: true
  }, {
    skip: !isOpen // Загружаем только когда попап открыт
  });

  // Мемоизированные вычисления
  const allTags = useMemo(() => {
    const combined = [...(availableTags || []), ...apiTags.map(tag => tag.name)];
    return [...new Set(combined)];
  }, [availableTags, apiTags]);

  const filteredTags = useMemo(() => {
    if (!searchQuery) return [];
    
    return allTags.filter(tag => 
      tag.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedTags.includes(tag)
    );
  }, [allTags, searchQuery, selectedTags]);

  const popularTags = useMemo(() => {
    return apiTags
      .filter(tag => !selectedTags.includes(tag.name))
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 12);
  }, [apiTags, selectedTags]);

  const recentTags = useMemo(() => {
    try {
      const recent = localStorage.getItem('recentTags');
      const recentList = recent ? JSON.parse(recent) : [];
      
      return recentList
        .filter((tag: string) => !selectedTags.includes(tag))
        .slice(0, 6);
    } catch {
      return [];
    }
  }, [selectedTags]);

  // Мемоизированные размеры
  const triggerSizeClasses = useMemo(() => ({
    sm: "h-8 text-xs",
    default: "h-10 text-sm", 
    lg: "h-12 text-base"
  }), []);

  // Обработчики
  const addTag = useCallback((tag: string) => {
    if (selectedTags.length >= maxTags) return;
    if (!selectedTags.includes(tag)) {
      onTagsChange([...selectedTags, tag]);
      
      // Сохраняем в недавние теги
      try {
        const recent = localStorage.getItem('recentTags');
        const recentList = recent ? JSON.parse(recent) : [];
        const updatedRecent = [tag, ...recentList.filter((t: string) => t !== tag)].slice(0, 10);
        localStorage.setItem('recentTags', JSON.stringify(updatedRecent));
      } catch {
        // Игнорируем ошибки localStorage
      }
    }
    setSearchQuery("");
    setShowCreateForm(false);
    setNewTagInput("");
  }, [selectedTags, maxTags, onTagsChange]);

  const removeTag = useCallback((tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  }, [selectedTags, onTagsChange]);

  const createTag = useCallback(() => {
    const tag = newTagInput.trim();
    if (tag && !allTags.includes(tag) && !selectedTags.includes(tag)) {
      addTag(tag);
    }
  }, [newTagInput, allTags, selectedTags, addTag]);

  const handleCreateKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      createTag();
    } else if (e.key === 'Escape') {
      setShowCreateForm(false);
      setNewTagInput("");
    }
  }, [createTag]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleNewTagInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTagInput(e.target.value);
  }, []);

  const toggleCreateForm = useCallback(() => {
    setShowCreateForm(!showCreateForm);
    setNewTagInput("");
  }, [showCreateForm]);

  // Эффекты
  useEffect(() => {
    if (showCreateForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCreateForm]);

  // Мемоизированный контент попапа
  const popoverContent = useMemo(() => (
    <div className="flex flex-col max-h-80">
      {/* Поиск */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Поиск тегов..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 h-9"
          />
          {tagsLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
          )}
        </div>
      </div>

      {/* Выбранные теги */}
      {selectedTags.length > 0 && (
        <div className="p-3 border-b bg-blue-50">
          <div className="text-xs font-medium text-blue-700 mb-2">
            Выбранные теги ({selectedTags.length}/{maxTags})
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedTags.map((tag) => (
              <TagBadge
                key={tag}
                tag={tag}
                variant="default"
                size="sm"
                showRemove={!disabled}
                onRemove={() => removeTag(tag)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Результаты поиска */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery ? (
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-gray-700">
                Результаты поиска
              </div>
              {tagsLoading && (
                <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
              )}
            </div>
            {filteredTags.length > 0 ? (
              <div className="space-y-1">
                {filteredTags.slice(0, 10).map((tag) => {
                  const tagData = apiTags.find(t => t.name === tag);
                  return (
                    <TagListItem
                      key={tag}
                      tag={tag}
                      count={tagData?.count}
                      onClick={() => addTag(tag)}
                      disabled={selectedTags.length >= maxTags}
                    />
                  );
                })}
              </div>
            ) : !tagsLoading ? (
              <div className="text-sm text-gray-500 text-center py-4">
                Теги не найдены
                {allowCreate && searchQuery.trim() && (
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewTagInput(searchQuery.trim());
                        setShowCreateForm(true);
                      }}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Создать тег "{searchQuery.trim()}"
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            {/* Недавние теги */}
            {recentTags.length > 0 && (
              <div className="p-3 border-b">
                <div className="text-xs font-medium text-gray-700 mb-2">
                  Недавние
                </div>
                <div className="flex flex-wrap gap-1">
                  {recentTags.map((tag: string) => (
                    <Button
                      key={tag}
                      variant="ghost"
                      size="sm"
                      onClick={() => addTag(tag)}
                      className="h-7 text-xs px-2 py-1 hover:bg-blue-50 hover:text-blue-700"
                      disabled={selectedTags.length >= maxTags}
                    >
                      <Hash className="h-3 w-3 mr-1" />
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Популярные теги */}
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-gray-700">
                  Популярные теги
                </div>
                {tagsLoading && (
                  <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                )}
              </div>
              {popularTags.length > 0 ? (
                <div className="space-y-1">
                  {popularTags.map((tag) => (
                    <TagListItem
                      key={tag.name}
                      tag={tag.name}
                      count={tag.count}
                      onClick={() => addTag(tag.name)}
                      disabled={selectedTags.length >= maxTags}
                    />
                  ))}
                </div>
              ) : !tagsLoading ? (
                <div className="text-sm text-gray-500 text-center py-2">
                  Нет доступных тегов
                </div>
              ) : null}
            </div>
          </>
        )}

        {/* Форма создания нового тега */}
        {showCreateForm && allowCreate && (
          <div className="p-3 border-t bg-gray-50">
            <div className="text-xs font-medium text-gray-700 mb-2">
              Создать новый тег
            </div>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={newTagInput}
                onChange={handleNewTagInputChange}
                onKeyDown={handleCreateKeyDown}
                placeholder="Название тега"
                className="h-8 text-sm flex-1"
                maxLength={20}
              />
              <Button
                size="sm"
                onClick={createTag}
                disabled={!newTagInput.trim()}
                className="h-8 px-3"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Нажмите Enter для создания
            </div>
          </div>
        )}

        {/* Кнопка создания тега */}
        {!showCreateForm && allowCreate && !searchQuery && (
          <div className="p-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCreateForm}
              className="w-full justify-center h-8 text-xs text-gray-600 border-dashed"
            >
              <Plus className="h-3 w-3 mr-2" />
              Создать новый тег
            </Button>
          </div>
        )}
      </div>

      {/* Информация о лимите */}
      {selectedTags.length >= maxTags && (
        <div className="p-2 bg-yellow-50 border-t">
          <div className="text-xs text-yellow-700 text-center">
            Достигнут максимум тегов ({maxTags})
          </div>
        </div>
      )}
    </div>
  ), [
    searchQuery, handleSearchChange, tagsLoading, selectedTags, maxTags, removeTag,
    disabled, filteredTags, apiTags, addTag, allowCreate, recentTags, popularTags,
    showCreateForm, newTagInput, handleNewTagInputChange, handleCreateKeyDown,
    createTag, toggleCreateForm
  ]);

  // Мемоизированный триггер
  const triggerContent = useMemo(() => (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <Tag className="h-4 w-4 flex-shrink-0 text-gray-400" />
      
      {selectedTags.length > 0 ? (
        <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
          {selectedTags.slice(0, 3).map((tag) => (
            <TagBadge
              key={tag}
              tag={tag}
              size={size}
              variant="secondary"
            />
          ))}
          {selectedTags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{selectedTags.length - 3} еще
            </span>
          )}
        </div>
      ) : (
        <span className="truncate">{placeholder}</span>
      )}
    </div>
  ), [selectedTags, size, placeholder]);

  return (
    <div className={`tags-selector ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-between font-normal ${triggerSizeClasses[size]} ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              selectedTags.length > 0 ? 'text-left' : 'text-gray-500'
            }`}
            disabled={disabled}
          >
            {triggerContent}
            <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0" align="start" sideOffset={4}>
          {popoverContent}
        </PopoverContent>
      </Popover>
    </div>
  );
});

TagsSelector.displayName = 'TagsSelector';

export default TagsSelector;