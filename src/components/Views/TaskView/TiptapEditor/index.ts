export { default as TiptapEditor } from './TiptapEditor';

// Экспорт типов для использования в других компонентах
export interface TiptapEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
}