'use client';

import React, { memo, useCallback } from 'react';
import { Download, FileText, Image as ImageIcon } from 'lucide-react';

interface ReadOnlyFileBadgeProps {
  url: string;
  filename: string;
  size: number;
  type: string;
}

const ReadOnlyFileBadge = memo(function ReadOnlyFileBadge({
  url,
  filename,
  size,
  type
}: ReadOnlyFileBadgeProps) {
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  const handleDownload = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [url, filename]);

  const isImage = type && type.startsWith('image/');
  const FileIcon = isImage ? ImageIcon : FileText;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm max-w-xs hover:bg-gray-100 transition-colors">
      <FileIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
      
      <div className="flex flex-col min-w-0 flex-1">
        <button 
          className="font-medium text-blue-600 truncate cursor-pointer hover:text-blue-800 text-left transition-colors" 
          title={filename}
          onClick={handleDownload}
        >
          {filename}
        </button>
        <span className="text-xs text-gray-500">
          {formatFileSize(size)}
        </span>
      </div>
      
      <button
        onClick={handleDownload}
        className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
        title="Скачать файл"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
});

ReadOnlyFileBadge.displayName = 'ReadOnlyFileBadge';

export default ReadOnlyFileBadge;