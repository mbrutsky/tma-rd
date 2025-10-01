// import DOMPurify from 'isomorphic-dompurify';
import sanitizeHtml from 'sanitize-html';

const TIPTAP_SCHEMES = ['http','https','mailto','tel','callto','cid','xmpp','data'] as const;

function toSanitizeHtmlConfig(cfg: { ALLOWED_TAGS: string[]; ALLOWED_ATTR: string[] }) {
  return {
    allowedTags: cfg.ALLOWED_TAGS,
    // Разрешаем data-* и др. глобально
    allowedAttributes: { '*': cfg.ALLOWED_ATTR },
    allowedSchemes: TIPTAP_SCHEMES,
    // Если не нужны inline-стили — уберите 'style' из ALLOWED_ATTR (рекомендую убрать)
  } as unknown as Parameters<typeof sanitizeHtml>[1];
}

// Конфигурация для TipTap контента
const TIPTAP_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'td', 'th',
    'div', 'span'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'title',
    'class', 'data-url', 'data-filename', 'data-size', 'data-type',
    'style', 'colspan', 'rowspan', 'data-checked'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ADD_TAGS: ['#text'],
  ADD_ATTR: ['task-list-item', 'checked'],
};

/**
 * Очистка HTML контента от TipTap редактора
 */
export function sanitizeTiptapHTML(html: string): string {
  if (!html || typeof html !== 'string') return '';
  
  try {
    // Предварительная обработка для TipTap специфичных элементов
    let processedHtml = html
      // Обработка task list items
      .replace(/<li data-checked="true"([^>]*)>/gi, '<li class="task-list-item checked"$1>')
      .replace(/<li data-checked="false"([^>]*)>/gi, '<li class="task-list-item"$1>')
      // Обработка file attachments
      .replace(/<div[^>]*class[^>]*file-attachment[^>]*>/gi, (match) => {
        // Сохраняем data атрибуты для файловых вложений
        return match;
      });

    // Очистка через DOMPurify
    // const cleaned = DOMPurify.sanitize(processedHtml, TIPTAP_CONFIG);
    const cleaned = sanitizeHtml(processedHtml, toSanitizeHtmlConfig(TIPTAP_CONFIG));
    
    // Постобработка
    return cleaned
      .replace(/<p>\s*<\/p>/gi, '')
      .replace(/<br\s*\/?>\s*<\/p>/gi, '</p>')
      .replace(/(<br\s*\/?>){3,}/gi, '<br><br>')
      .trim();
  } catch (error) {
    console.error('TipTap HTML sanitization error:', error);
    return stripAllHTML(html);
  }
}

/**
 * Конвертация TipTap HTML в простой текст
 */
export function tiptapToPlainText(html: string): string {
  if (!html || typeof html !== 'string') return '';
  
  return html
    // Task list items
    .replace(/<li[^>]*class[^>]*task-list-item[^>]*>/gi, '□ ')
    .replace(/<li[^>]*class[^>]*checked[^>]*>/gi, '☑ ')
    // Tables
    .replace(/<\/td>/gi, ' | ')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<table[^>]*>/gi, '\n')
    .replace(/<\/table>/gi, '\n')
    // Block elements
    .replace(/<\/?(div|p|br|h[1-6]|li|blockquote)[^>]*>/gi, '\n')
    .replace(/<\/?(ul|ol)[^>]*>/gi, '\n\n')
    // Remove all other tags
    .replace(/<[^>]*>/g, '')
    // Decode entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Normalize whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
}

/**
 * Проверка на пустоту TipTap контента
 */
export function isTiptapContentEmpty(html: string): boolean {
  if (!html || typeof html !== 'string') return true;
  
  // Удаляем пустые параграфы и пробелы
  const cleaned = html
    .replace(/<p><\/p>/gi, '')
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/<br\s*\/?>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const textContent = stripAllHTML(cleaned).trim();
  return textContent.length === 0;
}

export function sanitizeAndFormatHTML(html: string, type: 'TIPTAP' | 'PLAIN' = 'TIPTAP'): string {
  if (!html) return '';

  // Если это простой текст, обрабатываем базово
  if (type === 'PLAIN') {
    return html
      .replace(/\n/g, '<br>')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  // Для TIPTAP контента конвертируем редактируемые файловые бейджи в readonly версию
  let processedHtml = html;

  // Находим все файловые бейджи и заменяем их на readonly версию
  processedHtml = processedHtml.replace(
    /<span[^>]*data-file-badge="true"[^>]*data-url="([^"]*)"[^>]*data-filename="([^"]*)"[^>]*data-size="([^"]*)"[^>]*data-type="([^"]*)"[^>]*>.*?<\/span>/gs,
    (match, url, filename, size, type) => {
      // Декодируем URL если он закодирован
      const decodedUrl = decodeURIComponent(url);
      const decodedFilename = decodeURIComponent(filename);
      const decodedType = decodeURIComponent(type);
      
      const formatFileSize = (bytes: number | string): string => {
        const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes;
        if (!numBytes || numBytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(numBytes) / Math.log(k));
        return parseFloat((numBytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
      };

      const isImage = decodedType.startsWith('image/');
      const fileIcon = isImage ? '🖼️' : '📎';
      const formattedSize = formatFileSize(size);

      // Возвращаем readonly версию бейджа
      return `
        <div class="readonly-file-badge" style="
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          max-width: 300px;
          margin: 4px 2px;
          vertical-align: middle;
        ">
          <span style="font-size: 16px;">${fileIcon}</span>
          <div style="display: flex; flex-direction: column; min-width: 0; flex: 1;">
            <a 
              href="${decodedUrl}" 
              download="${decodedFilename}"
              target="_blank"
              rel="noopener noreferrer"
              style="
                font-weight: 500; 
                color: #2563eb; 
                text-decoration: none; 
                white-space: nowrap; 
                overflow: hidden; 
                text-overflow: ellipsis;
                cursor: pointer;
              "
              title="${decodedFilename}"
              onmouseover="this.style.textDecoration='underline'"
              onmouseout="this.style.textDecoration='none'"
            >${decodedFilename}</a>
            <span style="color: #6b7280; font-size: 12px;">${formattedSize}</span>
          </div>
          <a 
            href="${decodedUrl}" 
            download="${decodedFilename}"
            target="_blank"
            rel="noopener noreferrer"
            style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 24px;
              height: 24px;
              color: #6b7280;
              background: transparent;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              text-decoration: none;
            "
            title="Скачать файл"
            onmouseover="this.style.backgroundColor='#e5e7eb'"
            onmouseout="this.style.backgroundColor='transparent'"
          >⬇️</a>
        </div>
      `;
    }
  );

  // Базовая очистка HTML
  processedHtml = processedHtml
    // Убираем потенциально опасные теги и атрибуты
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    
    // Нормализуем пробелы
    .replace(/\s+/g, ' ')
    .trim();

  return processedHtml;
}








// Кэш для часто используемых конфигураций DOMPurify
const sanitizeConfigCache = new Map<string, any>();

// Оптимизированные конфигурации для разных контекстов
const SANITIZE_CONFIGS = {
  // Для комментариев и описаний задач
  RICH_TEXT: {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'code', 'pre',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'div', 'span'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title',
      'class', 'data-url', 'data-filename', 'data-size', 'data-type',
      'style'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  },
  
  // Для простого текста с базовым форматированием
  SIMPLE_TEXT: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u'],
    ALLOWED_ATTR: [],
    ALLOWED_URI_REGEXP: /^$/
  },
  
  // Только для отображения без редактирования
  DISPLAY_ONLY: {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'code', 'pre',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'div', 'span'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title',
      'class', 'data-url', 'data-filename', 'data-size', 'data-type'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button']
  }
} as const;

// Мемоизированная функция получения конфигурации
function getSanitizeConfig(type: keyof typeof SANITIZE_CONFIGS) {
  const cacheKey = type;
  if (!sanitizeConfigCache.has(cacheKey)) {
    sanitizeConfigCache.set(cacheKey, SANITIZE_CONFIGS[type]);
  }
  return sanitizeConfigCache.get(cacheKey)!;
}

// Кэш для обработанного HTML (LRU кэш)
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      const value = this.cache.get(key)!;
      // Перемещаем в конец для LRU
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Удаляем самый старый элемент
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey as K);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

const htmlCache = new LRUCache<string, string>(500);

/**
 * Обработка файловых вложений в HTML
 */
function processFileAttachments(html: string): string {
  return html.replace(
    /<div[^>]*class[^>]*file-attachment[^>]*>(.*?)<\/div>/gi,
    (match, content) => {
      // Извлекаем атрибуты
      const urlMatch = match.match(/data-url="([^"]+)"/);
      const filenameMatch = match.match(/data-filename="([^"]+)"/);
      const sizeMatch = match.match(/data-size="([^"]+)"/);
      const typeMatch = match.match(/data-type="([^"]+)"/);

      if (!urlMatch || !filenameMatch) return match;

      const url = decodeURIComponent(urlMatch[1]);
      const filename = decodeURIComponent(filenameMatch[1]);
      const size = sizeMatch ? parseInt(sizeMatch[1]) : 0;
      const type = typeMatch ? decodeURIComponent(typeMatch[1]) : '';

      // Форматируем размер файла
      const formatSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
      };

      const isImage = type.startsWith('image/');
      const icon = isImage ? '🖼️' : '📎';

      return `
        <div class="file-attachment-display" style="
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          margin: 4px 0;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          text-decoration: none;
          color: #374151;
        ">
          <span class="file-icon">${icon}</span>
          <a href="${url}" target="_blank" rel="noopener noreferrer" style="
            color: #2563eb;
            text-decoration: none;
            font-weight: 500;
          ">${filename}</a>
          ${size > 0 ? `<span style="color: #6b7280; font-size: 12px;">(${formatSize(size)})</span>` : ''}
        </div>
      `;
    }
  );
}

/**
 * Удаление всех HTML тегов (безопасная версия)
 */
export function stripAllHTML(html: string): string {
  if (!html || typeof html !== 'string') return '';
  
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Конвертация HTML в простой текст с сохранением структуры
 */
export function htmlToPlainText(html: string): string {
  if (!html || typeof html !== 'string') return '';
  
  return html
    // Заменяем блочные элементы на переносы строк
    .replace(/<\/?(div|p|br|h[1-6]|li|tr)[^>]*>/gi, '\n')
    .replace(/<\/?(ul|ol|table)[^>]*>/gi, '\n\n')
    // Удаляем все остальные теги
    .replace(/<[^>]*>/g, '')
    // Декодируем HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Нормализуем переносы строк
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
}

/**
 * Проверка содержимого HTML
 */
export function hasHTMLContent(html: string): boolean {
  if (!html || typeof html !== 'string') return false;
  
  const textContent = stripAllHTML(html).trim();
  return textContent.length > 0;
}

/**
 * Извлечение первых N символов из HTML с сохранением слов
 */
export function truncateHTML(html: string, maxLength: number = 150): string {
  if (!html || typeof html !== 'string') return '';
  
  const plainText = htmlToPlainText(html);
  
  if (plainText.length <= maxLength) return plainText;
  
  // Обрезаем по словам
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Простая хеш-функция для кэширования
 */
function hash(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Конвертируем в 32-битное число
  }
  
  return Math.abs(hash);
}

/**
 * Валидация HTML структуры
 */
export function validateHTMLStructure(html: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!html || typeof html !== 'string') {
    return { isValid: true, errors: [] };
  }
  
  try {
    // Создаем временный DOM элемент для валидации
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Проверяем на наличие потенциально опасных элементов
    const dangerousTags = tempDiv.querySelectorAll('script, object, embed, form, iframe');
    if (dangerousTags.length > 0) {
      errors.push('Найдены потенциально опасные теги');
    }
    
    // Проверяем на незакрытые теги (базовая проверка)
    const openTags = html.match(/<[^\/][^>]*[^\/]>/g) || [];
    const closeTags = html.match(/<\/[^>]+>/g) || [];
    
    if (openTags.length > closeTags.length + 5) { // Учитываем самозакрывающиеся теги
      errors.push('Возможно есть незакрытые теги');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    return {
      isValid: false,
      errors: ['Ошибка при валидации HTML структуры']
    };
  }
}

/**
 * Оптимизированная очистка кэша
 */
export function clearHTMLCache(): void {
  htmlCache.clear();
}

/**
 * Получение статистики кэша (для отладки)
 */
export function getHTMLCacheStats(): {
  size: number;
  maxSize: number;
} {
  return {
    size: (htmlCache as any).cache.size,
    maxSize: (htmlCache as any).maxSize
  };
}

/**
 * Конвертация Markdown в HTML (базовая поддержка)
 */
export function markdownToHTML(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return '';
  
  return markdown
    // Заголовки
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // Жирный текст
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/__(.*?)__/gim, '<strong>$1</strong>')
    
    // Курсив
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/_(.*?)_/gim, '<em>$1</em>')
    
    // Код
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    
    // Ссылки
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
    
    // Переносы строк
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n/gim, '<br>')
    
    // Обертываем в параграфы
    .replace(/^(.*)$/gim, '<p>$1</p>')
    
    // Очищаем пустые параграфы
    .replace(/<p><\/p>/gim, '');
}

/**
 * Экспорт всех функций как объект для удобства
 */
export const HTMLUtils = {
  sanitizeAndFormatHTML,
  sanitizeTiptapHTML,
  tiptapToPlainText,
  isTiptapContentEmpty,
  stripAllHTML,
  htmlToPlainText,
  hasHTMLContent,
  truncateHTML,
  validateHTMLStructure,
  clearHTMLCache,
  getHTMLCacheStats,
  markdownToHTML,
} as const;

export default HTMLUtils;