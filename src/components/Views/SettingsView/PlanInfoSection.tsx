// components/PlanInfoSection.tsx
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { Settings } from "lucide-react";
import { CompanyPlan } from "@/src/lib/models/types";
import { useGetCurrentUserCompanyQuery } from "@/src/lib/store/api/companiesApi";
import { useGetUsersQuery } from "@/src/lib/store/api/usersApi";
import { config } from "@/src/lib/app.config";
import Link from "next/link";

export default function PlanInfoSection() {
  const { data: company } = useGetCurrentUserCompanyQuery();
  const { data: users = [], isLoading: usersLoading } = useGetUsersQuery({});

  // Фильтруем активных пользователей для подсчета
  const activeUsersCount = users.filter((user) => user.is_active).length;

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-lg">
          <Settings className="h-5 w-5 flex-shrink-0" />
          {/* Информация о тарифе */}
          Техподдержка 
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Текущий тариф</Label>
            <div className="text-lg font-bold text-blue-600">
              {company?.plan === CompanyPlan.PRO
                ? "Бизнес Pro"
                : "Бесплатный"}
            </div>
            <div className="text-sm text-gray-500">
              {company?.plan === CompanyPlan.PRO
                ? "Активен до 25.09.2026"
                : "Базовый функционал"}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Пользователи</Label>
            <div className="text-lg font-bold text-green-600">
              {usersLoading
                ? "..."
                : `${activeUsersCount} / ${
                    company?.plan === CompanyPlan.PRO ? "50" : "5"
                  }`}
            </div>
            <div className="text-sm text-gray-500">
              Максимум пользователей
            </div>
          </div>
        </div> */}

        {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <Settings className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1 text-sm sm:text-base">
                Возможности тарифа "
                {company?.plan === CompanyPlan.PRO
                  ? "Бизнес Pro"
                  : "Бесплатный"}
                "
              </h4>
              <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                {company?.plan === CompanyPlan.PRO ? (
                  <>
                    <li>• До 50 пользователей в системе</li>
                    <li>• Неограниченное количество задач и процессов</li>
                    <li>• Приоритетная техподдержка</li>
                    <li>• Экспорт данных в Excel</li>
                    <li>• Telegram и Email уведомления</li>
                  </>
                ) : (
                  <>
                    <li>• До 5 пользователей в системе</li>
                    <li>• До 50 задач одновременно</li>
                    <li>• Базовые отчеты</li>
                    <li>• Стандартная поддержка</li>
                    <li>• Ограниченный экспорт данных</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div> */}

        <Link
          className="mt-2 inline-block"
          target="_blank"
          href={config.support.btnLink}
        >
          <Button className="flex items-center gap-2 w-full sm:w-auto">
            Написать в техподдержку
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}