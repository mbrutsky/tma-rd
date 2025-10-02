"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { Calendar, Users, Download, RefreshCw } from "lucide-react";
import { DatabaseUser, UserRole } from "@/src/lib/models/types";

interface ReportFiltersProps {
  period: "week" | "month" | "quarter" | "year";
  setPeriod: (period: "week" | "month" | "quarter" | "year") => void;
  selectedUserFilter: string;
  setSelectedUserFilter: (userId: string) => void;
  users: DatabaseUser[];
  onExportReport: () => Promise<void> | void;
  className?: string;
  currentUser: DatabaseUser;
}

export function ReportFilters({
  period,
  setPeriod,
  selectedUserFilter,
  setSelectedUserFilter,
  users,
  onExportReport,
  currentUser,
  className = "",
}: ReportFiltersProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportClick = async () => {
    try {
      setIsExporting(true);
      await onExportReport();
    } catch (error) {
      console.error("Ошибка при экспорте:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = () => {
    // Принудительно обновляем страницу или можно добавить логику перезагрузки данных
    window.location.reload();
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <Select value={period} onValueChange={setPeriod}>
        <SelectTrigger className="w-40">
          <Calendar className="h-4 w-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-[1000]">
          <SelectItem value="week">Неделя</SelectItem>
          <SelectItem value="month">Месяц</SelectItem>
          <SelectItem value="quarter">Квартал</SelectItem>
          <SelectItem value="year">Год</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedUserFilter} onValueChange={setSelectedUserFilter}>
        <SelectTrigger className="w-48">
          <Users className="h-4 w-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-[1000]">
          <SelectItem value="all">Все сотрудники</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {user.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentUser.role === UserRole.ADMIN && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportClick}
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span className="hidden lg:inline">Экспорт...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span className="hidden lg:inline">Экспорт</span>
            </>
          )}
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        <span className="hidden lg:inline">Обновить</span>
      </Button>
    </div>
  );
}
