'use client';

import React, { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { Button } from "@/src/components/ui/button";
import { Upload, Camera, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface AvatarUploadProps {
  currentAvatar?: string;
  userName: string;
  userId: string;
  onAvatarChange: (avatarUrl: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const AVATAR_SIZES = {
  sm: { container: 'h-12 w-12', text: 'text-sm' },
  md: { container: 'h-16 w-16', text: 'text-lg' },
  lg: { container: 'h-24 w-24', text: 'text-2xl' },
  xl: { container: 'h-32 w-32', text: 'text-4xl' }
};

export default function AvatarUpload({
  currentAvatar,
  userName,
  userId,
  onAvatarChange,
  className = "",
  size = 'lg'
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeConfig = AVATAR_SIZES[size];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Валидация файла
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите изображение');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError('Размер файла не должен превышать 5MB');
      return;
    }

    await uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');
      formData.append('userId', userId);

      // Симуляция прогресса загрузки
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при загрузке');
      }

      const result = await response.json();
      
      if (result.success) {
        onAvatarChange(result.data.url);
        
        // Показываем успешное завершение
        setTimeout(() => {
          setUploadProgress(0);
          setIsUploading(false);
        }, 1000);
      } else {
        throw new Error(result.error || 'Ошибка при загрузке');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      setError(error instanceof Error ? error.message : 'Неизвестная ошибка');
      setIsUploading(false);
      setUploadProgress(0);
    }

    // Сбрасываем input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    onAvatarChange('');
    setError(null);
  };

  const handleClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div className="relative">
        {/* Avatar */}
        <div 
          className={cn(
            "relative cursor-pointer group transition-all duration-200 hover:scale-105",
            sizeConfig.container,
            isUploading && "pointer-events-none"
          )}
          onClick={handleClick}
        >
          <Avatar className={cn("w-full h-full border-2 border-gray-200 transition-all", {
            "border-blue-500": isUploading,
            "group-hover:border-blue-400": !isUploading,
          })}>
            <AvatarImage 
              src={currentAvatar || "/placeholder.svg"} 
              alt={userName}
              className={cn("transition-all", {
                "opacity-50": isUploading
              })}
            />
            <AvatarFallback className={cn("bg-gray-100", sizeConfig.text)}>
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Overlay при наведении */}
          {!isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-full flex items-center justify-center">
              <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-200" />
            </div>
          )}

          {/* Прогресс загрузки */}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center">
              {uploadProgress < 100 ? (
                <div className="text-center">
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
                  <div className="text-xs text-blue-600 mt-1 font-medium">
                    {Math.round(uploadProgress)}%
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="h-6 w-6 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-xs text-green-600 mt-1 font-medium">
                    Готово!
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {isUploading ? 'Загрузка...' : 'Выбрать фото'}
        </Button>

        {currentAvatar && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveAvatar}
            disabled={isUploading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Скрытый input для выбора файла */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Сообщение об ошибке */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* Подсказка */}
      {!error && !isUploading && (
        <div className="text-xs text-gray-500 text-center max-w-xs">
          Поддерживаются форматы: JPEG, PNG, GIF, WebP. Максимальный размер: 5MB
        </div>
      )}
    </div>
  );
}