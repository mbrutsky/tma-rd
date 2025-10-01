// lib/utils/excelUtils.ts
import * as XLSX from 'xlsx';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  formatter?: (value: any) => string;
}

export interface ExcelSheetData {
  name: string;
  data: any[];
  columns?: ExcelColumn[];
}

export class ExcelExporter {
  private workbook: XLSX.WorkBook;

  constructor() {
    this.workbook = XLSX.utils.book_new();
  }

  addSheet(sheetData: ExcelSheetData) {
    let worksheet: XLSX.WorkSheet;

    if (sheetData.columns) {
      // Если заданы колонки с настройками, используем их
      const formattedData = sheetData.data.map(row => {
        const formattedRow: any = {};
        sheetData.columns!.forEach(col => {
          const value = this.getNestedValue(row, col.key);
          formattedRow[col.header] = col.formatter ? col.formatter(value) : value;
        });
        return formattedRow;
      });

      worksheet = XLSX.utils.json_to_sheet(formattedData);
      
      // Устанавливаем ширину колонок
      const colWidths = sheetData.columns.map(col => ({
        wch: col.width || this.calculateColumnWidth(col.header, formattedData.map(row => String(row[col.header] || '')))
      }));
      worksheet['!cols'] = colWidths;
    } else {
      // Используем стандартное преобразование
      worksheet = XLSX.utils.json_to_sheet(sheetData.data);
      
      // Автоматическая ширина колонок
      if (sheetData.data.length > 0) {
        const headers = Object.keys(sheetData.data[0]);
        const colWidths = headers.map(header => ({
          wch: this.calculateColumnWidth(header, sheetData.data.map(row => String(row[header] || '')))
        }));
        worksheet['!cols'] = colWidths;
      }
    }

    XLSX.utils.book_append_sheet(this.workbook, worksheet, sheetData.name);
  }

  private getNestedValue(obj: any, key: string): any {
    return key.split('.').reduce((value, k) => value?.[k], obj);
  }

  private calculateColumnWidth(header: string, values: string[]): number {
    const maxLength = Math.max(
      header.length,
      ...values.map(v => v.length)
    );
    return Math.min(maxLength + 2, 50); // Максимум 50 символов
  }

  generate(): Buffer {
    return XLSX.write(this.workbook, {
      bookType: 'xlsx',
      type: 'buffer',
      compression: true
    });
  }

  generateWithStyles(): Buffer {
    // Здесь можно добавить стили для ячеек
    return this.generate();
  }
}

// Предустановленные форматеры
export const ExcelFormatters = {
  date: (value: any) => {
    if (!value) return '';
    const date = new Date(value);
    return isNaN(date.getTime()) ? '' : date.toLocaleString('ru-RU');
  },

  dateOnly: (value: any) => {
    if (!value) return '';
    const date = new Date(value);
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString('ru-RU');
  },

  boolean: (value: any) => {
    if (value === null || value === undefined) return '';
    return value ? 'Да' : 'Нет';
  },

  array: (separator: string = ', ') => (value: any[]) => {
    if (!Array.isArray(value)) return '';
    return value.join(separator);
  },

  priority: (value: any) => {
    const priorities: Record<number, string> = {
      1: '1 - Критичный',
      2: '2 - Высокий', 
      3: '3 - Средний',
      4: '4 - Низкий',
      5: '5 - Очень низкий'
    };
    return priorities[value] || `${value}`;
  },

  status: (value: any) => {
    const statuses: Record<string, string> = {
      'new': 'Новая',
      'acknowledged': 'Ознакомлен',
      'in_progress': 'В работе',
      'paused': 'Приостановлена',
      'waiting_control': 'Ждет контроля',
      'on_control': 'На контроле',
      'completed': 'Завершена'
    };
    return statuses[value] || value;
  },

  taskType: (value: any) => {
    return value === 'recurring' ? 'Регулярная' : 'Разовая';
  },

  hours: (value: any) => {
    if (!value || value === 0) return '';
    return `${value} ч`;
  },

  userInfo: (name?: string, position?: string, email?: string) => {
    const parts = [name, position, email].filter(Boolean);
    return parts.join(' | ');
  }
};

// Предустановленные колонки для задач
export const TasksExcelColumns: ExcelColumn[] = [
  { header: 'ID задачи', key: 'id', width: 15 },
  { header: 'Название', key: 'title', width: 30 },
  { header: 'Описание', key: 'description', width: 40 },
  { header: 'Приоритет', key: 'priority', width: 15, formatter: ExcelFormatters.priority },
  { header: 'Статус', key: 'status', width: 15, formatter: ExcelFormatters.status },
  { header: 'Тип', key: 'type', width: 12, formatter: ExcelFormatters.taskType },
  { header: 'Создатель', key: 'creator_name', width: 20 },
  { header: 'Ответственный', key: 'responsible_name', width: 20 },
  { header: 'Дедлайн', key: 'due_date', width: 18, formatter: ExcelFormatters.date },
  { header: 'Дата создания', key: 'created_at', width: 18, formatter: ExcelFormatters.date },
  { header: 'Дата завершения', key: 'completed_at', width: 18, formatter: ExcelFormatters.date },
  { header: 'Планируемое время', key: 'estimated_hours', width: 16, formatter: ExcelFormatters.hours },
  { header: 'Фактическое время', key: 'actual_hours', width: 16, formatter: ExcelFormatters.hours },
  { header: 'Результат', key: 'result', width: 40 },
  { header: 'Просрочена', key: 'is_overdue', width: 12, formatter: ExcelFormatters.boolean },
  { header: 'Удалена', key: 'is_deleted', width: 10, formatter: ExcelFormatters.boolean },
  { header: 'Дата удаления', key: 'deleted_at', width: 18, formatter: ExcelFormatters.date },
  { header: 'Теги', key: 'tags', width: 25, formatter: ExcelFormatters.array() },
];

export default ExcelExporter;