import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  FileSpreadsheet,
  Download,
  Loader2,
} from "lucide-react";
import { useExportTasksMutation } from "@/src/lib/store/api/tasksApi";

export default function ExportDataSection() {
  const [exportTasks, { isLoading: isExporting }] = useExportTasksMutation();

  // Функция для показа уведомлений
  const showNotification = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 transition-all duration-300 ${
      type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
    }`;

    const icon =
      type === "success"
        ? '<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>'
        : '<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>';

    notification.innerHTML = `
      ${icon}
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" class="ml-2 hover:opacity-80">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
        </svg>
      </button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.transform = "translateX(100%)";
        setTimeout(() => {
          if (notification.parentNode) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);
  };

  const handleExportTasks = async () => {
    try {
      await exportTasks().unwrap();
      showNotification("Файл загружен на ваше устройство", "success");
    } catch (error) {
      console.error("Error exporting tasks:", error);
      showNotification("Ошибка экспорта. Попробуйте позже", "error");
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileSpreadsheet className="h-5 w-5" />
          Экспорт данных
        </CardTitle>
        <p className="text-sm text-gray-600">
          Выгрузите все задачи системы в удобном формате для анализа
        </p>
      </CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6 pt-0">
        <div className="space-y-4">
          <div className="border rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">
                  Полный экспорт задач
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                  Экспортируйте все задачи со всеми полями, комментариями,
                  исполнителями и статистикой в формате Excel (XLSX).
                </p>

                <Button
                  onClick={handleExportTasks}
                  disabled={isExporting}
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Экспортирую...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5 mr-2" />
                      Скачать Excel файл
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
