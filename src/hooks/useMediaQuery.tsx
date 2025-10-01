"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Опции для хука useMediaQuery
 */
export interface UseMediaQueryOptions {
  /** Значение по умолчанию при SSR или отсутствии поддержки matchMedia */
  defaultValue?: boolean;
  /** Отключить хук (полезно для условного использования) */
  disabled?: boolean;
  /** Задержка debounce для изменений в миллисекундах */
  debounceMs?: number;
}

/**
 * Предустановленные breakpoints для удобства
 */
export const BREAKPOINTS = {
  xs: '(max-width: 575.98px)',
  sm: '(min-width: 576px) and (max-width: 767.98px)',
  md: '(min-width: 768px) and (max-width: 991.98px)',
  lg: '(min-width: 992px) and (max-width: 1199.98px)',
  xl: '(min-width: 1200px) and (max-width: 1399.98px)',
  xxl: '(min-width: 1400px)',
  mobile: '(max-width: 767.98px)',
  tablet: '(min-width: 768px) and (max-width: 1023.98px)',
  desktop: '(min-width: 1024px)',
  touch: '(pointer: coarse)',
  mouse: '(pointer: fine)',
  darkMode: '(prefers-color-scheme: dark)',
  lightMode: '(prefers-color-scheme: light)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  highContrast: '(prefers-contrast: high)',
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  retina: '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
} as const;

/**
 * Утилита для debounce
 */
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => callback(...args), delay);
    }) as T,
    [callback, delay]
  );
}

/**
 * Production-ready хук для работы с CSS Media Queries
 * 
 * @param query - CSS media query строка
 * @param options - дополнительные опции
 * @returns boolean - соответствует ли текущий viewport media query
 * 
 * @example
 * ```tsx
 * // Базовое использование
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * 
 * // С предустановленными breakpoints
 * const isMobile = useMediaQuery(BREAKPOINTS.mobile);
 * 
 * // С опциями
 * const isDesktop = useMediaQuery(BREAKPOINTS.desktop, {
 *   defaultValue: false,
 *   debounceMs: 100
 * });
 * 
 * // Условное использование
 * const isLarge = useMediaQuery(BREAKPOINTS.lg, { 
 *   disabled: !shouldTrackSize 
 * });
 * ```
 */
export function useMediaQuery(
  query: string,
  options: UseMediaQueryOptions = {}
): boolean {
  const {
    defaultValue = false,
    disabled = false,
    debounceMs = 0,
  } = options;

  // Проверяем поддержку matchMedia
  const isSupported = typeof window !== 'undefined' && 'matchMedia' in window;
  
  // Инициализируем состояние
  const [matches, setMatches] = useState<boolean>(() => {
    if (disabled || !isSupported) {
      return defaultValue;
    }
    
    try {
      return window.matchMedia(query).matches;
    } catch (error) {
      console.warn(`Invalid media query: "${query}"`, error);
      return defaultValue;
    }
  });

  // Создаем debounced версию setMatches если нужно
  const debouncedSetMatches = useDebounce(setMatches, debounceMs);
  const updateMatches = debounceMs > 0 ? debouncedSetMatches : setMatches;

  useEffect(() => {
    // Если хук отключен или нет поддержки matchMedia
    if (disabled || !isSupported) {
      return;
    }

    let mediaQueryList: MediaQueryList;

    try {
      mediaQueryList = window.matchMedia(query);
    } catch (error) {
      console.warn(`Invalid media query: "${query}"`, error);
      return;
    }

    // Обновляем состояние при первом рендере
    if (mediaQueryList.matches !== matches) {
      setMatches(mediaQueryList.matches);
    }

    // Обработчик изменений
    const handleChange = (event: MediaQueryListEvent) => {
      updateMatches(event.matches);
    };

    // Добавляем слушатель
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);
    } else {
      // Fallback для старых браузеров
      mediaQueryList.addListener(handleChange);
    }

    // Cleanup функция
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleChange);
      } else {
        // Fallback для старых браузеров
        mediaQueryList.removeListener(handleChange);
      }
    };
  }, [query, disabled, isSupported, matches, updateMatches]);

  return matches;
}

/**
 * Хелпер хуки для популярных use cases
 */

/** Проверка на мобильное устройство */
export const useIsMobile = (options?: UseMediaQueryOptions) =>
  useMediaQuery(BREAKPOINTS.mobile, options);

/** Проверка на планшет */
export const useIsTablet = (options?: UseMediaQueryOptions) =>
  useMediaQuery(BREAKPOINTS.tablet, options);

/** Проверка на десктоп */
export const useIsDesktop = (options?: UseMediaQueryOptions) =>
  useMediaQuery(BREAKPOINTS.desktop, options);

/** Проверка на touch устройство */
export const useIsTouchDevice = (options?: UseMediaQueryOptions) =>
  useMediaQuery(BREAKPOINTS.touch, options);

/** Проверка темной темы */
export const useIsDarkMode = (options?: UseMediaQueryOptions) =>
  useMediaQuery(BREAKPOINTS.darkMode, options);

/** Проверка предпочтения уменьшенной анимации */
export const usePrefersReducedMotion = (options?: UseMediaQueryOptions) =>
  useMediaQuery(BREAKPOINTS.reducedMotion, options);

/** Проверка ориентации портрет */
export const useIsPortrait = (options?: UseMediaQueryOptions) =>
  useMediaQuery(BREAKPOINTS.portrait, options);

/** Проверка retina дисплея */
export const useIsRetina = (options?: UseMediaQueryOptions) =>
  useMediaQuery(BREAKPOINTS.retina, options);

/**
 * Тип для основных size breakpoints
 */
export type SizeBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

/**
 * Хук для получения текущего size breakpoint
 */
export function useCurrentBreakpoint(): SizeBreakpoint | null {
  const isXs = useMediaQuery(BREAKPOINTS.xs);
  const isSm = useMediaQuery(BREAKPOINTS.sm);
  const isMd = useMediaQuery(BREAKPOINTS.md);
  const isLg = useMediaQuery(BREAKPOINTS.lg);
  const isXl = useMediaQuery(BREAKPOINTS.xl);
  const isXxl = useMediaQuery(BREAKPOINTS.xxl);

  if (isXs) return 'xs';
  if (isSm) return 'sm';
  if (isMd) return 'md';
  if (isLg) return 'lg';
  if (isXl) return 'xl';
  if (isXxl) return 'xxl';
  
  return null;
}

/**
 * Тип для responsive значений
 */
export type ResponsiveValues<T> = {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  xxl?: T;
  default: T;
};

/**
 * Хук для responsive значений
 */
export function useResponsiveValue<T>(values: ResponsiveValues<T>): T {
  const breakpoint = useCurrentBreakpoint();
  
  if (breakpoint && values[breakpoint] !== undefined) {
    return values[breakpoint]!;
  }
  
  return values.default;
}

export default useMediaQuery;