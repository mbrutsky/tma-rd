"use client"

import { Card, CardContent } from "@/src/components/ui/card"
import { BarChart3, CheckCircle, AlertTriangle } from 'lucide-react'
import { EfficiencyStats } from "./hooks/useReportData"

interface EfficiencyMetricsProps {
  stats: EfficiencyStats
}

export function EfficiencyMetrics({ stats }: EfficiencyMetricsProps) {
  return (
    <div className="grid grid-cols-[auto,auto,auto] sm:grid-cols-[auto,auto,auto] lg:grid-cols-3 gap-3 lg:gap-4">
      <Card className="col-span-1 sm:col-span-1 lg:col-span-1">
        <CardContent className="p-3 lg:p-4 h-full">
          <div className="flex flex-col h-full justify-between lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-2 lg:mb-0">
              <p className="text-xs lg:text-sm text-gray-600">Всего задач</p>
              <p className="text-xl lg:text-2xl font-bold">{stats.totalTasks}</p>
            </div>
            <BarChart3 className="h-6 w-6 lg:h-8 lg:w-8 text-blue-500 self-end lg:self-auto" />
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1">
        <CardContent className="p-3 lg:p-4 h-full">
          <div className="flex flex-col h-full justify-between lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-2 lg:mb-0">
              <p className="text-xs lg:text-sm text-gray-600">Выполнено в срок</p>
              <p className="text-xl lg:text-2xl font-bold text-green-600">{stats.completedOnTime}</p>
              <p className="text-xs text-gray-500">{stats.onTimeRate.toFixed(1)}%</p>
            </div>
            <CheckCircle className="h-6 w-6 lg:h-8 lg:w-8 text-green-500 self-end lg:self-auto" />
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1">
        <CardContent className="p-3 lg:p-4 h-full">
          <div className="flex flex-col h-full justify-between lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-2 lg:mb-0">
              <p className="text-xs lg:text-sm text-gray-600">Просрочено</p>
              <p className="text-xl lg:text-2xl font-bold text-red-600">{stats.overdueTasks}</p>
            </div>
            <AlertTriangle className="h-6 w-6 lg:h-8 lg:w-8 text-red-500 self-end lg:self-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}