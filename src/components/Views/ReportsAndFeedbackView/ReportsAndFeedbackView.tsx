"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { ReportFilters } from "./ReportFilters";
import { MobileFilters } from "./MobileFilters";
import { PeriodInfo } from "./PeriodInfo";
import { EfficiencyMetrics } from "./EfficiencyMetrics";
import { UserStatsSection } from "./UserStatsSection";
import {
  DatabaseTask,
  DatabaseUser,
  FeedbackType,
  UserRole,
} from "@/src/lib/models/types";
import { useGetFeedbackQuery } from "@/src/lib/store/api/feedbackApi";
import useReportData from "./hooks/useReportData";
import { exportReportToXLSX } from "@/src/lib/utils/exportReport";
import { Download } from "lucide-react";

interface ReportsAndFeedbackViewProps {
  tasks: DatabaseTask[];
  users: DatabaseUser[];
  currentUser: DatabaseUser;
}

export default function ReportsAndFeedbackView({
  tasks,
  users,
  currentUser,
}: ReportsAndFeedbackViewProps) {
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "year">(
    "month"
  );
  const [filterType, setFilterType] = useState<"all" | FeedbackType>("all");
  const [filterPeriod, setFilterPeriod] = useState<"week" | "month" | "all">(
    "month"
  );
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Загружаем отзывы из API
  const {
    data: feedback = [],
    isLoading: feedbackLoading,
    error: feedbackError,
  } = useGetFeedbackQuery({
    type: filterType === "all" ? undefined : filterType,
    period: filterPeriod,
  });

  const {
    periodStart,
    periodEnd,
    efficiencyStats,
    userStats,
    getSelectedUserName,
  } = useReportData({
    tasks,
    users,
    feedback,
    period,
    selectedUserFilter,
    filterType,
    filterPeriod,
  });

  const handleExportReport = async () => {
    try {
      setIsExporting(true);

      const exportParams = {
        period,
        selectedUserFilter,
        periodStart,
        periodEnd,
        efficiencyStats,
        userStats,
        users,
      };

      const filename = exportReportToXLSX(exportParams);

      // Показываем уведомление об успешном экспорте
      // alert(`Отчет успешно экспортирован: ${filename}`)
    } catch (error) {
      console.error("Ошибка при экспорте отчета:", error);
      // alert('Произошла ошибка при экспорте отчета. Попробуйте еще раз.')
    } finally {
      setIsExporting(false);
    }
  };

  // Показываем загрузку
  if (feedbackLoading) {
    return (
      <div className="space-y-4 lg:space-y-6 p-2 sm:p-0">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Загружаем данные...</p>
        </div>
      </div>
    );
  }

  // Показываем ошибку
  if (feedbackError) {
    return (
      <div className="space-y-4 lg:space-y-6 p-2 sm:p-0">
        <div className="text-center py-8 text-red-600">
          <p className="mb-2">Ошибка при загрузке данных</p>
          <Button onClick={() => window.location.reload()}>
            Обновить страницу
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6 p-2 sm:p-0 pb-[120px]">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4">
        {/* Desktop filters - скрыты на мобильных */}
        <div className="hidden lg:block w-full">
          <ReportFilters
            period={period}
            setPeriod={setPeriod}
            selectedUserFilter={selectedUserFilter}
            setSelectedUserFilter={setSelectedUserFilter}
            users={users}
            onExportReport={handleExportReport}
            className="hidden lg:flex"
            currentUser={currentUser}
          />
        </div>

        {/* Mobile header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Mobile controls row */}
          <div className="flex items-center justify-between gap-2">
            <MobileFilters
              isOpen={isFiltersOpen}
              onOpenChange={setIsFiltersOpen}
              period={period}
              setPeriod={setPeriod}
              selectedUserFilter={selectedUserFilter}
              setSelectedUserFilter={setSelectedUserFilter}
              users={users}
            />

            {/* Mobile export button */}
            {currentUser.role === UserRole.ADMIN && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportReport}
                disabled={isExporting}
                className="lg:hidden flex items-center gap-2 px-3"
              >
                {isExporting ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Экспорт
                  </>
                )}
                <span className="hidden xs:inline">
                  {isExporting ? "Экспорт..." : "Экспорт"}
                </span>
              </Button>
            )}
          </div>

          {/* Period info */}
          <PeriodInfo
            periodStart={periodStart}
            periodEnd={periodEnd}
            selectedUserName={getSelectedUserName()}
          />
        </div>
      </div>

      {/* Efficiency Metrics */}
      <EfficiencyMetrics stats={efficiencyStats} />

      {/* User Stats */}
      <UserStatsSection
        userStats={userStats}
        selectedUserFilter={selectedUserFilter}
        getSelectedUserName={getSelectedUserName}
      />
    </div>
  );
}
