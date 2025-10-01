import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DatabaseUser, UserRole } from '@/src/lib/models/types';
import { EfficiencyStats, UserReportStats } from '@/src/components/Views/ReportsAndFeedbackView/hooks/useReportData';

interface ExportReportParams {
  period: "week" | "month" | "quarter" | "year";
  selectedUserFilter: string;
  periodStart: Date;
  periodEnd: Date;
  efficiencyStats: EfficiencyStats;
  userStats: UserReportStats[];
  users: DatabaseUser[];
}

// Функция получения названия периода
function getPeriodName(period: "week" | "month" | "quarter" | "year"): string {
  switch (period) {
    case "week":
      return "Неделя";
    case "month":
      return "Месяц";
    case "quarter":
      return "Квартал";
    case "year":
      return "Год";
    default:
      return "Неизвестный период";
  }
}

// Функция получения названия роли
function getRoleName(role: UserRole): string {
  switch (role) {
    case UserRole.DIRECTOR:
      return "Директор";
    case UserRole.DEPARTMENT_HEAD:
      return "Руководитель отдела";
    case UserRole.EMPLOYEE:
      return "Сотрудник";
    default:
      return "Неизвестная роль";
  }
}

// Функция получения имени выбранного пользователя
function getSelectedUserName(selectedUserFilter: string, users: DatabaseUser[]): string {
  if (selectedUserFilter === "all") return "Все сотрудники";
  const user = users.find(u => u.id === selectedUserFilter);
  return user ? user.name : "Неизвестный пользователь";
}

export function exportReportToXLSX(params: ExportReportParams) {
  const {
    period,
    selectedUserFilter,
    periodStart,
    periodEnd,
    efficiencyStats,
    userStats,
    users,
  } = params;

  // Создаем новую книгу
  const workbook = XLSX.utils.book_new();

  // === ЛИСТ 1: Общая информация ===
  
  // Заголовок отчета
  const summaryData = [
    ['ОТЧЕТ ПО ЭФФЕКТИВНОСТИ СОТРУДНИКОВ'],
    [''],
    ['Параметры отчета:'],
    ['Период:', getPeriodName(period)],
    ['Даты:', `${format(periodStart, "d MMMM yyyy", { locale: ru })} - ${format(periodEnd, "d MMMM yyyy", { locale: ru })}`],
    ['Сотрудник:', getSelectedUserName(selectedUserFilter, users)],
    ['Дата создания:', format(new Date(), "d MMMM yyyy, HH:mm", { locale: ru })],
    [''],
    ['ОБЩАЯ СТАТИСТИКА:'],
    [''],
    ['Показатель', 'Значение', 'Единица измерения'],
    ['Всего задач', efficiencyStats.totalTasks, 'шт.'],
    ['Выполнено задач', efficiencyStats.completedTasks, 'шт.'],
    ['Выполнено в срок', efficiencyStats.completedOnTime, 'шт.'],
    ['Просрочено задач', efficiencyStats.overdueTasks, 'шт.'],
    [''],
    ['ОТНОСИТЕЛЬНЫЕ ПОКАЗАТЕЛИ:'],
    [''],
    ['Показатель', 'Значение', 'Единица измерения'],
    ['Процент выполнения', Math.round(efficiencyStats.completionRate * 100) / 100, '%'],
    ['Процент выполнения в срок', Math.round(efficiencyStats.onTimeRate * 100) / 100, '%'],
    ['Процент просрочек', Math.round(((efficiencyStats.overdueTasks / efficiencyStats.totalTasks) * 100) * 100) / 100, '%'],
  ];

  // Создаем лист с общей информацией
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

  // Настраиваем ширину колонок для первого листа
  summarySheet['!cols'] = [
    { wch: 25 }, // Колонка A - названия показателей
    { wch: 15 }, // Колонка B - значения
    { wch: 20 }, // Колонка C - единицы измерения
  ];

  // Стилизация заголовков (делаем жирным первую строку)
  summarySheet['A1'].s = {
    font: { bold: true, sz: 14 },
    alignment: { horizontal: 'center' },
  };

  // Выделяем заголовки разделов жирным
  ['A3', 'A9', 'A17', 'A23'].forEach(cell => {
    if (summarySheet[cell]) {
      summarySheet[cell].s = { font: { bold: true } };
    }
  });

  // Выделяем заголовки таблиц
  ['A11', 'B11', 'C11', 'A19', 'B19', 'C19', 'A25', 'B25', 'C25'].forEach(cell => {
    if (summarySheet[cell]) {
      summarySheet[cell].s = { 
        font: { bold: true }, 
        fill: { fgColor: { rgb: "E3F2FD" } },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        }
      };
    }
  });

  // Добавляем лист в книгу
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Общая информация');

  // === ЛИСТ 2: Детальная таблица по сотрудникам ===

  // Заголовок таблицы
  const detailsData = [
    ['ДЕТАЛЬНАЯ СТАТИСТИКА ПО СОТРУДНИКАМ'],
    [''],
    [
      '№',
      'ФИО сотрудника',
      'Должность',
      'Роль',
      'Всего задач',
      'Выполнено',
      'В срок',
      'Просрочено',
      '% выполнения',
      '% в срок',
      'Благодарности',
      'Замечания',
    ]
  ];

  // Добавляем данные по каждому сотруднику
  userStats.forEach((stat, index) => {
    const completionPercentage = stat.totalTasks > 0 
      ? Math.round((stat.completedTasks / stat.totalTasks * 100) * 100) / 100
      : 0;

    const onTimePercentage = stat.totalTasks > 0 
      ? Math.round((stat.completedOnTime / stat.totalTasks * 100) * 100) / 100
      : 0;

    detailsData.push([
      index + 1,
      stat.user.name,
      stat.user.position || 'Не указана',
      getRoleName(stat.user.role),
      stat.totalTasks,
      stat.completedTasks,
      stat.completedOnTime,
      stat.overdueTasks,
      completionPercentage,
      onTimePercentage,
      stat.gratitudes,
      stat.remarks,
      stat.score
    ] as any);
  });

  // Добавляем итоговую строку
  if (userStats.length > 0) {
    const totalTasks = userStats.reduce((sum, stat) => sum + stat.totalTasks, 0);
    const totalCompleted = userStats.reduce((sum, stat) => sum + stat.completedTasks, 0);
    const totalOnTime = userStats.reduce((sum, stat) => sum + stat.completedOnTime, 0);
    const totalOverdue = userStats.reduce((sum, stat) => sum + stat.overdueTasks, 0);
    const totalGratitudes = userStats.reduce((sum, stat) => sum + stat.gratitudes, 0);
    const totalRemarks = userStats.reduce((sum, stat) => sum + stat.remarks, 0);

    const avgCompletion = totalTasks > 0 
      ? Math.round((totalCompleted / totalTasks * 100) * 100) / 100
      : 0;

    const avgOnTime = totalTasks > 0 
      ? Math.round((totalOnTime / totalTasks * 100) * 100) / 100
      : 0;

    detailsData.push([
      '',
      'ИТОГО:',
      '',
      '',
      totalTasks,
      totalCompleted,
      totalOnTime,
      totalOverdue,
      avgCompletion,
      avgOnTime,
      totalGratitudes,
      totalRemarks,
    ] as any);
  }

  // Создаем лист с детальной информацией
  const detailsSheet = XLSX.utils.aoa_to_sheet(detailsData);

  // Настраиваем ширину колонок для второго листа
  detailsSheet['!cols'] = [
    { wch: 5 },  // № п/п
    { wch: 25 }, // ФИО
    { wch: 20 }, // Должность
    { wch: 15 }, // Роль
    { wch: 10 }, // Всего задач
    { wch: 10 }, // Выполнено
    { wch: 8 },  // В срок
    { wch: 10 }, // Просрочено
    { wch: 12 }, // % выполнения
    { wch: 10 }, // % в срок
    { wch: 15 }, // Благодарности
    { wch: 12 }, // Замечания
    { wch: 10 }, // Рейтинг
  ];

  // Стилизация заголовка
  detailsSheet['A1'].s = {
    font: { bold: true, sz: 14 },
    alignment: { horizontal: 'center' },
  };

  // Стилизация заголовков таблицы (строка 3)
  const headerRange = XLSX.utils.decode_range('A3:M3');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 2, c: col }); // строка 3 (индекс 2)
    if (detailsSheet[cellRef]) {
      detailsSheet[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E3F2FD" } },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        },
        alignment: { horizontal: 'center' }
      };
    }
  }

  // Стилизация итоговой строки (если есть)
  if (userStats.length > 0) {
    const totalRowIndex = detailsData.length - 1;
    const totalRange = XLSX.utils.decode_range(`A${totalRowIndex + 1}:M${totalRowIndex + 1}`);
    for (let col = totalRange.s.c; col <= totalRange.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: totalRowIndex, c: col });
      if (detailsSheet[cellRef]) {
        detailsSheet[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "FFF3E0" } },
          border: {
            top: { style: "medium" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
          }
        };
      }
    }
  }

  // Добавляем границы для всей таблицы данных
  const dataStartRow = 3; // Начинаем с заголовков (строка 3)
  const dataEndRow = detailsData.length;
  const dataRange = XLSX.utils.decode_range(`A${dataStartRow}:M${dataEndRow}`);
  
  for (let row = dataRange.s.r; row <= dataRange.e.r; row++) {
    for (let col = dataRange.s.c; col <= dataRange.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      if (detailsSheet[cellRef]) {
        if (!detailsSheet[cellRef].s) detailsSheet[cellRef].s = {};
        detailsSheet[cellRef].s.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        };
      }
    }
  }

  // Добавляем лист в книгу
  XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Детальная статистика');

  // Генерируем имя файла с текущей датой
  const filename = `Отчет_эффективности_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;

  // Сохраняем файл
  XLSX.writeFile(workbook, filename);

  return filename;
}