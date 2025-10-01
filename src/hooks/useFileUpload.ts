import { useState, useCallback, useRef, useMemo } from 'react';

interface FileUploadOptions {
  maxFileSize?: number; // в байтах
  allowedTypes?: string[];
  maxFiles?: number;
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
  onSuccess?: (urls: string[]) => void;
}

interface FileUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedFiles: string[];
}

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_FILES = 10;

export default function useFileUpload(options: FileUploadOptions = {}) {
  const {
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    allowedTypes,
    maxFiles = DEFAULT_MAX_FILES,
    onProgress,
    onError,
    onSuccess,
  } = options;

  const [state, setState] = useState<FileUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    uploadedFiles: [],
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Мемоизированная валидация файлов
  const validateFiles = useCallback((files: FileList): string | null => {
    if (files.length === 0) return 'Не выбраны файлы';
    if (files.length > maxFiles) return `Максимум ${maxFiles} файлов`;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > maxFileSize) {
        return `Файл ${file.name} превышает максимальный размер ${Math.round(maxFileSize / 1024 / 1024)}MB`;
      }
      
      if (allowedTypes && !allowedTypes.includes(file.type)) {
        return `Тип файла ${file.name} не поддерживается`;
      }
    }

    return null;
  }, [maxFileSize, maxFiles, allowedTypes]);

  // Оптимизированная функция загрузки
  const uploadMultipleFiles = useCallback(async (
    files: FileList, 
    type: 'document' | 'image' | 'avatar' = 'document'
  ): Promise<string[]> => {
    const validationError = validateFiles(files);
    if (validationError) {
      onError?.(validationError);
      throw new Error(validationError);
    }

    // Отменяем предыдущую загрузку если есть
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isUploading: true,
      progress: 0,
      error: null,
    }));

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        formData.append('userId', 'current-user-id'); // Заменить на реальный ID

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Обновляем прогресс
        const progress = Math.round(((index + 1) / files.length) * 100);
        onProgress?.(progress);
        setState(prev => ({ ...prev, progress }));

        return data.data.url;
      });

      const urls = await Promise.all(uploadPromises);

      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedFiles: [...prev.uploadedFiles, ...urls],
      }));

      onSuccess?.(urls);
      return urls;

    } catch (error: any) {
      if (error.name === 'AbortError') {
        setState(prev => ({ ...prev, isUploading: false, progress: 0 }));
        return [];
      }

      const errorMessage = error.message || 'Ошибка при загрузке файлов';
      setState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage,
      }));

      onError?.(errorMessage);
      throw error;
    }
  }, [validateFiles, onProgress, onSuccess, onError]);

  // Функция отмены загрузки
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Очистка состояния
  const clearState = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      uploadedFiles: [],
    });
  }, []);

  // Мемоизированные возвращаемые значения
  const returnValue = useMemo(() => ({
    ...state,
    uploadMultipleFiles,
    cancelUpload,
    clearState,
    canUpload: !state.isUploading,
  }), [state, uploadMultipleFiles, cancelUpload, clearState]);

  return returnValue;
}
