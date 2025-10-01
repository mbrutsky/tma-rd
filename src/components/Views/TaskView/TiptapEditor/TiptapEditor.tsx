"use client";

import React, { useState, useCallback, ChangeEvent, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Mark, Extension, Node } from '@tiptap/core';

import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Link2, Image as ImageIcon, FileText,
  List, ListOrdered, Table as TableIcon,
  Undo, Redo, Palette, CheckSquare,
  Trash2, RemoveFormatting,
  Settings, Rows3, Columns3, Rows, Columns,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Loader2, File
} from 'lucide-react';

import { Button } from '@/src/components/ui/button';
import { Toggle } from '@/src/components/ui/toggle';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/src/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/src/components/ui/popover';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { Separator } from '@/src/components/ui/separator';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/src/components/ui/tooltip';

// Hooks для работы с файлами
import useFileUpload from '@/src/hooks/useFileUpload';
import useImageUpload from '@/src/hooks/useImageUpload';

/* === Types === */
interface FontSizeAttrs { fontSize: string | null; }
interface EditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
}

/* === FontSize mark === */
const FontSizeExtension = Mark.create<object, FontSizeAttrs>({
  name: 'fontSize',
  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.fontSize || null,
        renderHTML: (attrs: FontSizeAttrs) => (attrs.fontSize ? { style: `font-size:${attrs.fontSize}` } : {}),
      },
    };
  },
  parseHTML() {
    return [{
      tag: 'span',
      getAttrs: (el: HTMLElement) => (el.style.fontSize ? { fontSize: el.style.fontSize } : false),
    }];
  },
  renderHTML({ HTMLAttributes }) { return ['span', HTMLAttributes, 0]; },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ commands }) => commands.setMark(this.name, { fontSize: size }),
      unsetFontSize: () => ({ commands }) => commands.unsetMark(this.name),
    };
  },
});

/* === File Badge Node === */
const FileBadgeNode = Node.create({
  name: 'fileBadge',
  
  group: 'inline',
  inline: true,
  atom: true,
  
  addAttributes() {
    return {
      url: { default: null },
      filename: { default: null },
      size: { default: null },
      type: { default: null },
    };
  },

  parseHTML() {
    return [{
      tag: 'span[data-file-badge]',
      getAttrs: (el: HTMLElement) => ({
        url: el.getAttribute('data-url'),
        filename: el.getAttribute('data-filename'),
        size: el.getAttribute('data-size'),
        type: el.getAttribute('data-type'),
      }),
    }];
  },

  renderHTML({ HTMLAttributes }) {
    const { url, filename, size, type } = HTMLAttributes;
    
    const formatSize = (bytes: number | string): string => {
      const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes;
      if (!numBytes || numBytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(numBytes) / Math.log(k));
      return parseFloat((numBytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const isImage = type && type.startsWith('image/');
    
    // Используем Unicode символы вместо SVG для совместимости с sanitizer
    const fileIcon = isImage ? '🖼️' : '📎';
    const downloadIcon = '⬇️';
    const deleteIcon = '❌';

    return [
      'span',
      {
        'data-file-badge': 'true',
        'data-url': url,
        'data-filename': filename,
        'data-size': size,
        'data-type': type,
        'class': 'file-badge-inline',
        'contenteditable': 'false',
        'style': 'display: inline-block; margin: 2px; user-select: none;'
      },
      [
        'span',
        {
          'class': 'file-badge',
          'style': `
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 8px;
            background-color: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 12px;
            color: #374151;
            max-width: 250px;
            position: relative;
            user-select: none;
            vertical-align: middle;
          `
        },
        [
          'span',
          { 'class': 'file-icon', 'style': 'font-size: 14px; display: flex; align-items: center;' },
          fileIcon
        ],
        [
          'span',
          { 
            'class': 'file-name',
            'style': 'font-weight: 500; color: #2563eb; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;',
            'title': filename
          },
          filename || 'Unknown file'
        ],
        [
          'span',
          { 'style': 'color: #6b7280; font-size: 10px; margin-left: 4px;' },
          `(${formatSize(size || 0)})`
        ],
        [
          'span',
          { 'class': 'file-actions', 'style': 'display: flex; gap: 2px; margin-left: 4px;' },
          [
            'button',
            {
              'class': 'file-download-btn',
              'data-url': url,
              'style': `
                display: flex;
                align-items: center;
                justify-content: center;
                width: 16px;
                height: 16px;
                border: none;
                background: transparent;
                border-radius: 2px;
                cursor: pointer;
                color: #6b7280;
                padding: 0;
                font-size: 10px;
              `,
              'title': 'Скачать'
            },
            downloadIcon
          ],
          [
            'button',
            {
              'class': 'file-delete-btn',
              'style': `
                display: flex;
                align-items: center;
                justify-content: center;
                width: 16px;
                height: 16px;
                border: none;
                background: transparent;
                border-radius: 2px;
                cursor: pointer;
                color: #ef4444;
                padding: 0;
                font-size: 10px;
              `,
              'title': 'Удалить'
            },
            deleteIcon
          ]
        ]
      ]
    ];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      console.log('Creating FileBadge node view with attrs:', node.attrs);
      
      const span = document.createElement('span');
      span.setAttribute('data-file-badge', 'true');
      span.setAttribute('data-url', node.attrs.url);
      span.setAttribute('data-filename', node.attrs.filename);
      span.setAttribute('data-size', node.attrs.size);
      span.setAttribute('data-type', node.attrs.type);
      span.className = 'file-badge-inline';
      span.contentEditable = 'false';
      span.style.cssText = 'display: inline-block; margin: 2px; user-select: none;';

      const formatSize = (bytes: number | string): string => {
        const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes;
        if (!numBytes || numBytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(numBytes) / Math.log(k));
        return parseFloat((numBytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
      };

      const isImage = node.attrs.type && node.attrs.type.startsWith('image/');
      
      // Используем Unicode символы для совместимости
      const fileIcon = isImage ? '🖼️' : '📎';
      const downloadIcon = '⬇️';
      const deleteIcon = '❌';

      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'file-download-btn';
      downloadBtn.title = 'Скачать';
      downloadBtn.textContent = downloadIcon;
      downloadBtn.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        border: none;
        background: transparent;
        border-radius: 2px;
        cursor: pointer;
        color: #6b7280;
        padding: 0;
        font-size: 10px;
      `;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'file-delete-btn';
      deleteBtn.title = 'Удалить';
      deleteBtn.textContent = deleteIcon;
      deleteBtn.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        border: none;
        background: transparent;
        border-radius: 2px;
        cursor: pointer;
        color: #ef4444;
        padding: 0;
        font-size: 10px;
      `;

      span.innerHTML = `
        <span class="file-badge" style="
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 12px;
          color: #374151;
          max-width: 250px;
          position: relative;
          user-select: none;
          vertical-align: middle;
        ">
          <span class="file-icon" style="font-size: 14px; display: flex; align-items: center;">${fileIcon}</span>
          <span class="file-name" style="
            font-weight: 500; 
            color: #2563eb; 
            white-space: nowrap; 
            overflow: hidden; 
            text-overflow: ellipsis; 
            max-width: 120px;
          " title="${node.attrs.filename}">${node.attrs.filename || 'Unknown file'}</span>
          <span style="color: #6b7280; font-size: 10px; margin-left: 4px;">(${formatSize(node.attrs.size || 0)})</span>
          <span class="file-actions" style="display: flex; gap: 2px; margin-left: 4px;">
          </span>
        </span>
      `;

      // Вставляем кнопки в контейнер действий
      const actionsContainer = span.querySelector('.file-actions');
      if (actionsContainer) {
        actionsContainer.appendChild(downloadBtn);
        actionsContainer.appendChild(deleteBtn);
      }

      // Обработчики событий
      if (downloadBtn) {
        downloadBtn.addEventListener('mouseover', () => {
          downloadBtn.style.backgroundColor = '#e5e7eb';
        });
        downloadBtn.addEventListener('mouseout', () => {
          downloadBtn.style.backgroundColor = 'transparent';
        });
        downloadBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const link = document.createElement('a');
          link.href = node.attrs.url;
          link.download = node.attrs.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
      }

      if (deleteBtn) {
        deleteBtn.addEventListener('mouseover', () => {
          deleteBtn.style.backgroundColor = '#fee2e2';
        });
        deleteBtn.addEventListener('mouseout', () => {
          deleteBtn.style.backgroundColor = 'transparent';
        });
        deleteBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (typeof getPos === 'function') {
            const pos = getPos();
            if (typeof pos === 'number') {
              editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
            }
          }
        });
      }

      console.log('FileBadge node view created successfully');
      return { dom: span };
    };
  },
});

/* === File Attachment Extension === */
const FileAttachment = Extension.create({
  name: 'fileAttachment',
  
  addCommands() {
    return {
      insertFileAttachment: (options: { 
        url: string; 
        filename: string; 
        size: number; 
        type: string 
      }) => ({ commands, editor }) => {
        const { url, filename, size, type } = options;
        const isImage = type.startsWith('image/');
        
        console.log('FileAttachment command called with:', { url, filename, size, type, isImage });
        
        if (isImage) {
          // Для изображений используем стандартное расширение Image
          console.log('Inserting as image');
          return commands.setImage({ src: url, alt: filename });
        } else {
          // Для других файлов используем наш FileBadgeNode
          console.log('Inserting as file badge');
          
          // Используем insertContent с правильной структурой для нашего узла
          return commands.insertContent([
            {
              type: 'fileBadge',
              attrs: { 
                url, 
                filename, 
                size: size.toString(), 
                type 
              }
            },
            {
              type: 'paragraph',
              content: []
            }
          ]);
        }
      },
    };
  },
});

/* === Global styles & mobile tweaks === */
const CustomStyles = Extension.create({
  name: 'customStyles',
  addGlobalAttributes() {
    return [{ types: ['bulletList', 'orderedList', 'listItem'], attributes: { class: { default: null } } }];
  },
  onBeforeCreate() {
    const style = document.createElement('style');
    style.textContent = `
    .ProseMirror ul{list-style-type:disc;padding-left:1.5rem;margin:.5rem 0}
    .ProseMirror ul ul{list-style-type:circle;padding-left:1.5rem}
    .ProseMirror ul ul ul{list-style-type:square;padding-left:1.5rem}
    .ProseMirror ol{counter-reset:list-item;padding-left:0;margin:.5rem 0;list-style:none;position:relative}
    .ProseMirror ol>li{counter-increment:list-item;position:relative;padding-left:3em}
    .ProseMirror ol>li::before{content:counters(list-item,".") ". ";position:absolute;left:0;top:0;min-width:2.5em;padding-right:.5em;text-align:left;font-weight:500;color:#374151;white-space:nowrap}
    .ProseMirror ol ol{counter-reset:list-item;padding-left:0;margin-left:0}
    .ProseMirror ol ol>li{padding-left:4em}
    .ProseMirror ol ol>li::before{content:counters(list-item,".") ". ";min-width:3.5em}
    .ProseMirror ol ol ol>li{padding-left:5em}
    .ProseMirror ol ol ol>li::before{min-width:4.5em}
    .ProseMirror ol ol ol ol>li{padding-left:6em}
    .ProseMirror ol ol ol ol>li::before{min-width:5.5em}
    .ProseMirror table{border-collapse:collapse;table-layout:fixed;width:100%;margin:1rem 0;overflow:hidden}
    .ProseMirror td,.ProseMirror th{vertical-align:top;box-sizing:border-box;position:relative;border:1px solid #d1d5db;padding:.5rem;min-width:1em}
    .ProseMirror th{background:#f3f4f6;font-weight:700;text-align:left}
    .ProseMirror .selectedCell:after{z-index:2;position:absolute;content:"";left:0;right:0;top:0;bottom:0;background:rgba(200,200,255,.4);pointer-events:none}
    .ProseMirror .column-resize-handle{position:absolute;right:-2px;top:0;bottom:-2px;width:4px;background:#adf;pointer-events:none}
    .ProseMirror.resize-cursor{cursor:col-resize}
    .ProseMirror .file-badge-inline{display:inline-block;margin:2px;user-select:none}
    .ProseMirror .file-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;background-color:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;font-size:12px;color:#374151;max-width:250px;position:relative;user-select:none}
    .ProseMirror .file-badge .file-name{font-weight:500;color:#2563eb;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .ProseMirror .file-badge .file-actions{display:flex;gap:2px;margin-left:4px}
    .ProseMirror .file-badge button{display:flex;align-items:center;justify-content:center;width:16px;height:16px;border:none;background:transparent;border-radius:2px;cursor:pointer;padding:0}
    .ProseMirror .file-badge .file-download-btn{color:#6b7280}
    .ProseMirror .file-badge .file-delete-btn{color:#ef4444}
    .ProseMirror .file-badge button:hover{background-color:#e5e7eb}
    .ProseMirror .file-badge .file-delete-btn:hover{background-color:#fee2e2}
    .ProseMirror .readonly-file-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;max-width:300px;margin:4px 2px;vertical-align:middle}
    .ProseMirror .readonly-file-badge a{font-weight:500;color:#2563eb;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
    .ProseMirror .readonly-file-badge a:hover{text-decoration:underline}
    @media (max-width:640px){
      .ProseMirror{font-size:14px}
      .ProseMirror ol>li{padding-left:2.5em}
      .ProseMirror ol>li::before{min-width:2em;font-size:.9em}
      .ProseMirror ol ol>li{padding-left:3.5em}
      .ProseMirror ol ol>li::before{min-width:3em}
      .ProseMirror ol ol ol>li{padding-left:4.5em}
      .ProseMirror ol ol ol>li::before{min-width:4em}
      .ProseMirror table{font-size:12px;overflow-x:auto;display:block}
      .ProseMirror td,.ProseMirror th{padding:.25rem}
      .ProseMirror .file-badge{max-width:250px;font-size:12px}
    }`;
    document.head.appendChild(style);
  },
});

/* === Commands typing === */
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
    fileAttachment: {
      insertFileAttachment: (options: { 
        url: string; 
        filename: string; 
        size: number; 
        type: string 
      }) => ReturnType;
    };
  }
}

const TiptapEditor: React.FC<EditorProps> = ({
  initialContent = '<p>Начните печатать здесь...</p>',
  onContentChange,
  placeholder = 'Начните печатать здесь...',
  readOnly = false,
  className = '',
  minHeight = 300,
  maxHeight,
}) => {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedFontSize, setSelectedFontSize] = useState('16px');
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);

  // Используем хуки для загрузки файлов
  const { uploadMultipleFiles, isUploading: isUploadingFiles } = useFileUpload({
    maxFileSize: 10 * 1024 * 1024, // 10MB
    onError: (error) => console.error('File upload error:', error),
  });

  const { uploadImage, isUploading: isUploadingImage } = useImageUpload({
    maxFileSize: 5 * 1024 * 1024, // 5MB
    onError: (error) => console.error('Image upload error:', error),
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: { keepMarks: true, keepAttributes: false, HTMLAttributes: { class: 'bullet-list' } },
        orderedList: { keepMarks: true, keepAttributes: false, HTMLAttributes: { class: 'ordered-list' } },
        listItem: { HTMLAttributes: { class: 'list-item' } },
      }),
      CustomStyles,
      FileBadgeNode, // Добавляем наш новый узел для файлов
      FileAttachment, // Расширение для команд работы с файлами
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-blue-500 underline cursor-pointer hover:text-blue-700' },
      }),
      Image.configure({ HTMLAttributes: { class: 'max-w-full h-auto rounded-lg my-4' } }),
      Table.configure({ resizable: true, HTMLAttributes: { class: 'border-collapse table-auto w-full' } }),
      TableRow.configure({ HTMLAttributes: { class: 'table-row' } }),
      TableCell.configure({ HTMLAttributes: { class: 'table-cell border border-gray-300 p-2' } }),
      TableHeader.configure({ HTMLAttributes: { class: 'table-header border border-gray-300 p-2 bg-gray-100 font-bold' } }),
      TaskList.configure({ HTMLAttributes: { class: 'task-list space-y-2' } }),
      TaskItem.configure({ nested: true, HTMLAttributes: { class: 'task-item flex items-start' } }),
      TextStyle,
      Color,
      FontSizeExtension,
    ],
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => onContentChange?.(editor.getHTML()),
    immediatelyRender: false,
  });

  React.useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [readOnly, editor]);

  /* === Throttled force re-render on selection/update === */
  const [, force] = React.useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const rerender = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => force(v => v + 1), 100);
  }, []);
  
  React.useEffect(() => {
    if (!editor) return;
    editor.on('selectionUpdate', rerender);
    editor.on('update', rerender);
    return () => {
      editor.off('selectionUpdate', rerender);
      editor.off('update', rerender);
    };
  }, [editor, rerender]);

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl) editor.chain().focus().setLink({ href: linkUrl }).run();
    else editor.chain().focus().unsetLink().run();
    setLinkUrl('');
    setLinkDialogOpen(false);
  }, [editor, linkUrl]);

  const handleSetImage = useCallback(async () => {
    if (!editor || !imageUrl) return;
    
    try {
      // Если это URL, вставляем напрямую
      if (imageUrl.startsWith('http') || imageUrl.startsWith('data:')) {
        editor.chain().focus().setImage({ src: imageUrl }).run();
      } else {
        // Если это не URL, пытаемся загрузить как файл
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new (File as any)([blob], 'image.jpg', { type: blob.type });
        const uploadedUrl = await uploadImage(file);
        editor.chain().focus().setImage({ src: uploadedUrl }).run();
      }
    } catch (error) {
      console.error('Error setting image:', error);
      // Fallback: пытаемся вставить как есть
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
    
    setImageUrl('');
    setImageDialogOpen(false);
  }, [editor, imageUrl, uploadImage]);

  const handleColorChange = useCallback((color: string) => {
    if (!editor) return;
    setSelectedColor(color);
    editor.chain().focus().setColor(color).run();
    setColorPopoverOpen(false);
  }, [editor]);

  const handleFontSizeChange = useCallback((size: string) => {
    if (!editor) return;
    setSelectedFontSize(size);
    editor.chain().focus().setFontSize(size).run();
  }, [editor]);

  // Обработчик загрузки файлов через input
  const handleFileUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    if (!editor) {
      console.log('Editor not available');
      return;
    }
    
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    console.log('Starting file upload, files:', files.length);

    try {
      const urls = await uploadMultipleFiles(files, 'document');
      console.log('Upload successful, URLs:', urls);
      
      // Вставляем каждый файл
      for (let i = 0; i < files.length && i < urls.length; i++) {
        const file = files[i];
        const url = urls[i];
        
        console.log('Inserting file:', {
          filename: file.name,
          size: file.size,
          type: file.type,
          url: url
        });
        
        const success = editor.commands.insertFileAttachment({
          url,
          filename: file.name,
          size: file.size,
          type: file.type,
        });
        
        console.log('Insert file result:', success);
        
        // Альтернативный способ вставки, если основной не работает
        if (!success) {
          console.log('Trying alternative insertion method');
          const isImage = file.type.startsWith('image/');
          
          if (isImage) {
            editor.chain().focus().setImage({ src: url, alt: file.name }).run();
          } else {
            // Прямая вставка узла
            editor.chain().focus().insertContent({
              type: 'fileBadge',
              attrs: {
                url: url,
                filename: file.name,
                size: file.size.toString(),
                type: file.type
              }
            }).run();
          }
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    }
    
    // Очищаем input
    e.target.value = '';
  }, [editor, uploadMultipleFiles]);

  // Обработчик загрузки изображений через drag & drop или paste
  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return;
    
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }, [editor, uploadImage]);

  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const openLinkDialog = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setLinkDialogOpen(true);
  }, [editor]);

  if (!editor) return <div className="w-full max-w-5xl mx-auto p-4">Загрузка редактора...</div>;

  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];
  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'];

  /* === Table & history capabilities === */
  const isInTable =
    editor.isActive('table') ||
    editor.isActive('tableRow') ||
    editor.isActive('tableCell') ||
    editor.isActive('tableHeader');

  const canAddColumnBefore = editor.can().chain().focus().addColumnBefore().run();
  const canAddColumnAfter  = editor.can().chain().focus().addColumnAfter().run();
  const canDeleteColumn    = editor.can().chain().focus().deleteColumn().run();
  const canAddRowBefore    = editor.can().chain().focus().addRowBefore().run();
  const canAddRowAfter     = editor.can().chain().focus().addRowAfter().run();
  const canDeleteRow       = editor.can().chain().focus().deleteRow().run();
  const canDeleteTable     = editor.can().chain().focus().deleteTable().run();
  const canMergeCells      = editor.can().chain().focus().mergeCells().run();
  const canSplitCell       = editor.can().chain().focus().splitCell().run();

  const canUndo            = editor.can().chain().focus().undo().run();
  const canRedo            = editor.can().chain().focus().redo().run();

  const isUploading = isUploadingFiles || isUploadingImage;

  return (
    <TooltipProvider>
      <div className={`w-full space-y-0 ${className}`}>
        {/* Toolbar - показываем только если редактирование разрешено */}
        {!readOnly && (
          <div className="border border-gray-200 rounded-t-lg p-1.5 sm:p-2 bg-white overflow-x-auto">
            <div className="flex flex-wrap items-center gap-1 min-w-fit">
              {/* B I U S */}
              <div className="flex items-center gap-0.5">
                <Tooltip><TooltipTrigger asChild>
                  <Toggle pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()} disabled={readOnly} size="sm" aria-label="Жирный" className="shrink-0"><Bold className="h-4 w-4" /></Toggle>
                </TooltipTrigger><TooltipContent>Жирный</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild>
                  <Toggle pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()} disabled={readOnly} size="sm" aria-label="Курсив" className="shrink-0"><Italic className="h-4 w-4" /></Toggle>
                </TooltipTrigger><TooltipContent>Курсив</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild>
                  <Toggle pressed={editor.isActive('underline')} onPressedChange={() => editor.chain().focus().toggleUnderline().run()} disabled={readOnly} size="sm" aria-label="Подчеркнутый" className="shrink-0"><UnderlineIcon className="h-4 w-4" /></Toggle>
                </TooltipTrigger><TooltipContent>Подчеркнутый</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild>
                  <Toggle pressed={editor.isActive('strike')} onPressedChange={() => editor.chain().focus().toggleStrike().run()} disabled={readOnly} size="sm" aria-label="Зачеркнутый" className="shrink-0"><Strikethrough className="h-4 w-4" /></Toggle>
                </TooltipTrigger><TooltipContent>Зачеркнутый</TooltipContent></Tooltip>
              </div>

              <Separator orientation="vertical" className="h-6 hidden sm:block" />

              {/* Color / Font size — desktop */}
              <div className="hidden sm:flex items-center gap-1">
                <Popover open={colorPopoverOpen} onOpenChange={setColorPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={readOnly} className="h-8 px-2">
                      <Palette className="h-4 w-4 mr-1" />
                      <div className="w-4 h-3 rounded border border-gray-300" style={{ backgroundColor: selectedColor }} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2 z-50">
                    <div className="grid grid-cols-3 gap-2">
                      {colors.map((color) => (
                        <button key={color} onClick={() => handleColorChange(color)}
                          className="w-8 h-8 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }} aria-label={`Цвет ${color}`} />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Select value={selectedFontSize} onValueChange={handleFontSizeChange} disabled={readOnly}>
                  <SelectTrigger className="w-20 h-8 text-xs select-none"><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[1000]">
                    {fontSizes.map((size) => (<SelectItem key={size} value={size}>{size}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Lists */}
              <div className="flex items-center gap-0.5">
                <Tooltip><TooltipTrigger asChild>
                  <Toggle pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()} disabled={readOnly} size="sm" aria-label="Маркированный список" className="shrink-0"><List className="h-4 w-4" /></Toggle>
                </TooltipTrigger><TooltipContent>Маркированный список</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild>
                  <Toggle pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()} disabled={readOnly} size="sm" aria-label="Нумерованный список" className="shrink-0"><ListOrdered className="h-4 w-4" /></Toggle>
                </TooltipTrigger><TooltipContent>Нумерованный список</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild>
                  <Toggle pressed={editor.isActive('taskList')} onPressedChange={() => editor.chain().focus().toggleTaskList().run()} disabled={readOnly} size="sm" aria-label="Чек-лист" className="shrink-0"><CheckSquare className="h-4 w-4" /></Toggle>
                </TooltipTrigger><TooltipContent>Чек-лист</TooltipContent></Tooltip>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Links / media */}
              <div className="flex items-center gap-0.5">
                <Tooltip><TooltipTrigger asChild>
                  <Toggle pressed={editor.isActive('link')} onPressedChange={openLinkDialog} disabled={readOnly} size="sm" aria-label="Ссылка" className="shrink-0"><Link2 className="h-4 w-4" /></Toggle>
                </TooltipTrigger><TooltipContent>Ссылка</TooltipContent></Tooltip>

                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => setImageDialogOpen(true)} disabled={readOnly || isUploading} className="h-8 px-2 shrink-0">
                    {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger><TooltipContent>Изображение</TooltipContent></Tooltip>

                <Tooltip><TooltipTrigger asChild>
                  <div>
                    <Input 
                      type="file" 
                      onChange={handleFileUpload} 
                      disabled={readOnly || isUploading} 
                      className="hidden" 
                      id="file-upload" 
                      multiple
                      accept="*/*"
                    />
                    <Label htmlFor="file-upload"
                           className={`inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-2 hover:bg-accent hover:text-accent-foreground cursor-pointer shrink-0 ${readOnly || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {isUploadingFiles ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    </Label>
                  </div>
                </TooltipTrigger><TooltipContent>Прикрепить файл</TooltipContent></Tooltip>
              </div>

              {/* --- TABLES --- */}
<Separator orientation="vertical" className="h-6" />

<div className="flex items-center gap-0.5">
  {/* Вставить таблицу 3×3 */}
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        onClick={insertTable}
        disabled={readOnly}
        className="h-8 px-2 shrink-0"
        aria-label="Вставить таблицу"
      >
        <TableIcon className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Вставить таблицу 3×3</TooltipContent>
  </Tooltip>

  {/* Настройки таблицы */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        title="Настройки таблицы"
        className="h-8 px-2 shrink-0"
        disabled={readOnly || !isInTable}
        aria-label="Настройки таблицы"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="start" className="w-56 z-[1000]">
      <DropdownMenuLabel>Столбцы</DropdownMenuLabel>
      <DropdownMenuItem disabled={!canAddColumnBefore}
        onClick={() => editor.chain().focus().addColumnBefore().run()}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Вставить слева
      </DropdownMenuItem>
      <DropdownMenuItem disabled={!canAddColumnAfter}
        onClick={() => editor.chain().focus().addColumnAfter().run()}>
        <ArrowRight className="h-4 w-4 mr-2" /> Вставить справа
      </DropdownMenuItem>
      <DropdownMenuItem disabled={!canDeleteColumn}
        onClick={() => editor.chain().focus().deleteColumn().run()}>
        <Columns className="h-4 w-4 mr-2" /> Удалить столбец
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuLabel>Строки</DropdownMenuLabel>
      <DropdownMenuItem disabled={!canAddRowBefore}
        onClick={() => editor.chain().focus().addRowBefore().run()}>
        <ArrowUp className="h-4 w-4 mr-2" /> Вставить выше
      </DropdownMenuItem>
      <DropdownMenuItem disabled={!canAddRowAfter}
        onClick={() => editor.chain().focus().addRowAfter().run()}>
        <ArrowDown className="h-4 w-4 mr-2" /> Вставить ниже
      </DropdownMenuItem>
      <DropdownMenuItem disabled={!canDeleteRow}
        onClick={() => editor.chain().focus().deleteRow().run()}>
        <Rows className="h-4 w-4 mr-2" /> Удалить строку
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuLabel>Ячейки</DropdownMenuLabel>
      <DropdownMenuItem disabled={!canMergeCells}
        onClick={() => editor.chain().focus().mergeCells().run()}>
        <Rows3 className="h-4 w-4 mr-2" /> Объединить
      </DropdownMenuItem>
      <DropdownMenuItem disabled={!canSplitCell}
        onClick={() => editor.chain().focus().splitCell().run()}>
        <Columns3 className="h-4 w-4 mr-2" /> Разделить
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem disabled={!canDeleteTable}
        onClick={() => editor.chain().focus().deleteTable().run()}>
        <Trash2 className="h-4 w-4 mr-2" /> Удалить таблицу
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>

              
              <Separator orientation="vertical" className="h-6" />

              {/* Clear / Undo / Redo */}
              <div className="flex items-center gap-0.5">
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} disabled={readOnly} className="h-8 px-2 shrink-0">
                    <RemoveFormatting className="h-4 w-4" />
                  </Button>
                </TooltipTrigger><TooltipContent>Очистить форматирование</TooltipContent></Tooltip>

                <Separator orientation="vertical" className="h-6 hidden sm:block" />

                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={readOnly || !canUndo} className="h-8 px-2 shrink-0">
                    <Undo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger><TooltipContent>Отменить</TooltipContent></Tooltip>

                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={readOnly || !canRedo} className="h-8 px-2 shrink-0">
                    <Redo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger><TooltipContent>Повторить</TooltipContent></Tooltip>
              </div>
            </div>
          </div>
        )}

        {/* Editor */}
        <div 
          className={`border ${!readOnly ? 'border-t-0' : ''} border-gray-200 ${!readOnly ? 'rounded-b-lg' : 'rounded-lg'} ${readOnly ? 'bg-gray-50' : 'bg-white'}`}
          style={{ 
            minHeight: `${minHeight}px`, 
            maxHeight: maxHeight ? `${maxHeight}px` : undefined 
          }}
        >
          <EditorContent
            editor={editor}
            className="prose prose-sm sm:prose lg:prose-lg max-w-none p-3 sm:p-4 focus:outline-none [&_.ProseMirror]:outline-none overflow-x-auto"
            style={{ 
              minHeight: `${minHeight - 24}px`, 
              maxHeight: maxHeight ? `${maxHeight - 24}px` : undefined,
              overflow: 'auto'
            }}
          />
        </div>

        {/* Loading indicator */}
        {isUploading && (
          <div className="flex items-center justify-center gap-2 p-2 text-sm text-blue-600 bg-blue-50 rounded">
            <Loader2 className="h-4 w-4 animate-spin" />
            Загрузка файлов...
          </div>
        )}

        {/* Link dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Добавить ссылку</DialogTitle>
              <DialogDescription>Введите URL. Пусто — удалить ссылку.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="url" className="text-right">URL</Label>
                <Input id="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Отмена</Button>
              <Button onClick={handleSetLink}>{linkUrl ? 'Добавить' : 'Удалить ссылку'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image dialog */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Добавить изображение</DialogTitle>
              <DialogDescription>Введите URL изображения или загрузите файл.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image-url" className="text-right">URL</Label>
                <Input id="image-url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="col-span-3" />
              </div>
              <div className="text-center text-sm text-gray-500">или</div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image-file" className="text-right">Файл</Label>
                <Input 
                  id="image-file" 
                  type="file" 
                  accept="image/*" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      await handleImageUpload(file);
                      setImageDialogOpen(false);
                    }
                  }}
                  className="col-span-3" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImageDialogOpen(false)}>Отмена</Button>
              <Button onClick={handleSetImage} disabled={!imageUrl || isUploadingImage}>
                {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Добавить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default TiptapEditor;