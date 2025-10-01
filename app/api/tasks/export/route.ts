// app/api/tasks/export/route.ts - Updated with multi-tenant support
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/lib/db';
import ExcelExporter, { ExcelFormatters, TasksExcelColumns } from '@/src/lib/utils/excelUtils';
import { CommentExportData } from '@/src/lib/models/types';
import { getUserCompanyInfo } from '@/src/lib/utils/multiTenant';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const userCompanyInfo = await getUserCompanyInfo(request);
    
    if (!userCompanyInfo.companyId) {
      return NextResponse.json(
        { success: false, error: "User not assigned to any company" },
        { status: 403 }
      );
    }

    // Получаем все задачи компании с расширенной информацией
    const tasksResult = await query(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.type,
        t.creator_id,
        t.responsible_id,
        t.process_id,
        t.due_date,
        t.created_at,
        t.updated_at,
        t.completed_at,
        t.tags,
        t.estimated_hours,
        t.actual_hours,
        t.result,
        t.is_overdue,
        t.is_almost_overdue,
        t.is_deleted,
        t.deleted_at,
        t.deleted_by,
        -- Информация о создателе
        creator.name as creator_name,
        creator.email as creator_email,
        creator.position as creator_position,
        -- Информация об ответственном
        resp.name as responsible_name,
        resp.email as responsible_email,
        resp.position as responsible_position,
        -- Информация о процессе
        bp.name as process_name,
        bp.description as process_description,
        -- Информация об удалившем пользователе
        deleter.name as deleted_by_name
      FROM tasks t
      LEFT JOIN users creator ON t.creator_id = creator.id AND creator.company_id = t.company_id
      LEFT JOIN users resp ON t.responsible_id = resp.id AND resp.company_id = t.company_id
      LEFT JOIN business_processes bp ON t.process_id = bp.id AND bp.company_id = t.company_id
      LEFT JOIN users deleter ON t.deleted_by = deleter.id AND deleter.company_id = t.company_id
      WHERE t.company_id = $1
      ORDER BY t.created_at DESC
    `, [userCompanyInfo.companyId]);

    // Получаем исполнителей для каждой задачи (только из той же компании)
    const assigneesResult = await query(`
      SELECT 
        ta.task_id,
        u.name,
        u.email,
        u.position,
        u.role
      FROM task_assignees ta
      LEFT JOIN users u ON ta.user_id = u.id
      JOIN tasks t ON ta.task_id = t.id
      WHERE t.company_id = $1 AND u.company_id = $1
      ORDER BY ta.task_id, u.name
    `, [userCompanyInfo.companyId]);

    // Получаем наблюдателей для каждой задачи (только из той же компании)
    const observersResult = await query(`
      SELECT 
        tob.task_id,
        u.name,
        u.email,
        u.position,
        u.role
      FROM task_observers tob
      LEFT JOIN users u ON tob.user_id = u.id
      JOIN tasks t ON tob.task_id = t.id
      WHERE t.company_id = $1 AND u.company_id = $1
      ORDER BY tob.task_id, u.name
    `, [userCompanyInfo.companyId]);

    // Получаем комментарии для каждой задачи (только из той же компании)
    const commentsResult = await query(`
      SELECT 
        c.task_id,
        c.text,
        c.is_result,
        c.created_at,
        u.name as author_name
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id AND u.company_id = $1
      JOIN tasks t ON c.task_id = t.id
      WHERE t.company_id = $1
      ORDER BY c.task_id, c.created_at
    `, [userCompanyInfo.companyId]);

    // Группируем данные по задачам
    const assigneesByTask = assigneesResult.rows.reduce((acc, row) => {
      if (!acc[row.task_id]) acc[row.task_id] = [];
      if (row.name) acc[row.task_id].push(`${row.name} (${row.position || row.role})`);
      return acc;
    }, {} as Record<string, string[]>);

    const observersByTask = observersResult.rows.reduce((acc, row) => {
      if (!acc[row.task_id]) acc[row.task_id] = [];
      if (row.name) acc[row.task_id].push(`${row.name} (${row.position || row.role})`);
      return acc;
    }, {} as Record<string, string[]>);

    const commentsByTask = commentsResult.rows.reduce((acc, row) => {
      if (!acc[row.task_id]) acc[row.task_id] = [];
      acc[row.task_id].push({
        text: row.text,
        isResult: row.is_result,
        createdAt: row.created_at,
        authorName: row.author_name
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Подготавливаем данные для Excel с дополнительными полями
    const excelData = tasksResult.rows.map(task => ({
      ...task,
      creator_info: ExcelFormatters.userInfo(task.creator_name, task.creator_position, task.creator_email),
      responsible_info: ExcelFormatters.userInfo(task.responsible_name, task.responsible_position, task.responsible_email),
      assignees_list: assigneesByTask[task.id]?.join('; ') || '',
      observers_list: observersByTask[task.id]?.join('; ') || '',
      comments_count: commentsByTask[task.id]?.length || 0,
      results_count: commentsByTask[task.id]?.filter((c: { isResult: any; }) => c.isResult).length || 0,
      last_comment: getLastComment(commentsByTask[task.id]) || '',
    }));

    // Создаем экспортер
    const exporter = new ExcelExporter();

    // Расширенные колонки для задач
    const extendedColumns = [
      ...TasksExcelColumns,
      { header: 'Создатель (полная информация)', key: 'creator_info', width: 35 },
      { header: 'Ответственный (полная информация)', key: 'responsible_info', width: 35 },
      { header: 'Исполнители', key: 'assignees_list', width: 30 },
      { header: 'Наблюдатели', key: 'observers_list', width: 30 },
      { header: 'Бизнес-процесс', key: 'process_name', width: 20 },
      { header: 'Описание процесса', key: 'process_description', width: 40 },
      { header: 'Дата обновления', key: 'updated_at', width: 18, formatter: ExcelFormatters.date },
      { header: 'Кем удалена', key: 'deleted_by_name', width: 20 },
      { header: 'Количество комментариев', key: 'comments_count', width: 20 },
      { header: 'Количество результатов', key: 'results_count', width: 20 },
      { header: 'Последний комментарий', key: 'last_comment', width: 40 },
    ];

    // Добавляем основной лист с задачами
    exporter.addSheet({
      name: 'Задачи',
      data: excelData,
      columns: extendedColumns
    });

    // Создаем отдельный лист с комментариями
    const commentsData: CommentExportData[] = [];
    Object.entries(commentsByTask).forEach(([taskId, comments]) => {
      const task = tasksResult.rows.find(t => t.id === taskId);
      (comments as any[]).forEach((comment: { authorName: any; createdAt: any; isResult: any; text: any; }) => {
        commentsData.push({
          task_id: taskId,
          task_title: task?.title || '',
          author_name: comment.authorName || '',
          created_at: comment.createdAt,
          is_result: comment.isResult,
          text: comment.text
        });
      });
    });

    if (commentsData.length > 0) {
      const commentsColumns = [
        { header: 'ID задачи', key: 'task_id', width: 15 },
        { header: 'Название задачи', key: 'task_title', width: 30 },
        { header: 'Автор комментария', key: 'author_name', width: 20 },
        { header: 'Дата комментария', key: 'created_at', width: 18, formatter: ExcelFormatters.date },
        { header: 'Тип', key: 'is_result', width: 12, formatter: (value: boolean) => value ? 'Результат' : 'Комментарий' },
        { header: 'Текст', key: 'text', width: 60 }
      ];

      exporter.addSheet({
        name: 'Комментарии',
        data: commentsData,
        columns: commentsColumns
      });
    }

    // Создаем статистику
    const stats = [
      { indicator: 'Общее количество задач', value: tasksResult.rows.length },
      { indicator: 'Активных задач', value: tasksResult.rows.filter(t => !t.is_deleted).length },
      { indicator: 'Удаленных задач', value: tasksResult.rows.filter(t => t.is_deleted).length },
      { indicator: 'Завершенных задач', value: tasksResult.rows.filter(t => t.status === 'completed').length },
      { indicator: 'Просроченных задач', value: tasksResult.rows.filter(t => t.is_overdue).length },
      { indicator: 'В работе', value: tasksResult.rows.filter(t => t.status === 'in_progress').length },
      { indicator: 'Новых задач', value: tasksResult.rows.filter(t => t.status === 'new').length },
      { indicator: 'Дата экспорта', value: new Date().toLocaleString('ru-RU') }
    ];

    const statsColumns = [
      { header: 'Показатель', key: 'indicator', width: 30 },
      { header: 'Значение', key: 'value', width: 20 }
    ];

    exporter.addSheet({
      name: 'Статистика',
      data: stats,
      columns: statsColumns
    });

    // Генерируем Excel файл
    const excelBuffer = exporter.generate();

    // Генерируем имя файла с датой
    const fileName = `tasks_export_${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error exporting tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export tasks' },
      { status: 500 }
    );
  }
}

// Вспомогательная функция остается без изменений
function getLastComment(comments: any[]): string {
  if (!comments || comments.length === 0) return '';
  const lastComment = comments[comments.length - 1];
  const date = new Date(lastComment.createdAt).toLocaleDateString('ru-RU');
  const preview = lastComment.text.length > 50 
    ? lastComment.text.substring(0, 50) + '...' 
    : lastComment.text;
  return `${date}: ${preview}`;
}