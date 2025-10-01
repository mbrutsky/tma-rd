import { useCallback, useMemo, useRef, useState } from "react";
import useFileUpload from "./useFileUpload";

interface ImageUploadOptions {
  maxFileSize?: number;
  allowedFormats?: string[];
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
  onSuccess?: (url: string) => void;
}

const DEFAULT_IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function useImageUpload(options: ImageUploadOptions = {}) {
  const {
    maxFileSize = DEFAULT_IMAGE_MAX_SIZE,
    allowedFormats = DEFAULT_ALLOWED_FORMATS,
    onProgress,
    onError,
    onSuccess,
  } = options;

  const [state, setState] = useState({
    isUploading: false,
    progress: 0,
    error: null as string | null,
    uploadedImage: null as string | null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Мемоизированная валидация изображения
  const validateImage = useCallback((file: File): string | null => {
    if (!file) return 'Файл не выбран';
    if (file.size > maxFileSize) {
      return `Размер файла превышает ${Math.round(maxFileSize / 1024 / 1024)}MB`;
    }
    if (!allowedFormats.includes(file.type)) {
      return 'Неподдерживаемый формат изображения';
    }
    return null;
  }, [maxFileSize, allowedFormats]);

  // Оптимизированная загрузка изображения
  const uploadImage = useCallback(async (
    file: File,
    type: 'avatar' | 'image' = 'image'
  ): Promise<string> => {
    const validationError = validateImage(file);
    if (validationError) {
      onError?.(validationError);
      throw new Error(validationError);
    }

    // Отменяем предыдущую загрузку
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
      // Опциональное сжатие изображения
      const processedFile = await compressImageIfNeeded(file, maxFileSize);

      const formData = new FormData();
      formData.append('file', processedFile);
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

      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedImage: data.data.url,
      }));

      onSuccess?.(data.data.url);
      return data.data.url;

    } catch (error: any) {
      if (error.name === 'AbortError') {
        setState(prev => ({ ...prev, isUploading: false, progress: 0 }));
        return '';
      }

      const errorMessage = error.message || 'Ошибка при загрузке изображения';
      setState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage,
      }));

      onError?.(errorMessage);
      throw error;
    }
  }, [validateImage, maxFileSize, onProgress, onSuccess, onError]);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearState = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      uploadedImage: null,
    });
  }, []);

  return useMemo(() => ({
    ...state,
    uploadImage,
    cancelUpload,
    clearState,
    canUpload: !state.isUploading,
  }), [state, uploadImage, cancelUpload, clearState]);
}

// Утилитарная функция сжатия изображений
async function compressImageIfNeeded(file: File, maxSize: number): Promise<File> {
  // Если файл меньше максимального размера, возвращаем как есть
  if (file.size <= maxSize) {
    return file;
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      // Вычисляем новые размеры с сохранением пропорций
      const ratio = Math.min(1200 / img.width, 1200 / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Рисуем сжатое изображение
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Конвертируем в Blob с качеством 0.8
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Если сжатие не удалось, возвращаем оригинал
          }
        },
        'image/jpeg',
        0.8
      );
    };

    img.onerror = () => resolve(file); // При ошибке возвращаем оригинал
    img.src = URL.createObjectURL(file);
  });
}
