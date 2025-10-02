"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { UserStatsCard } from "./UserStatsCard"
import { UserReportStats } from "./hooks/useReportData"

interface UserStatsSectionProps {
  userStats: UserReportStats[]
  selectedUserFilter: string
  getSelectedUserName: () => string
}

export function UserStatsSection({ 
  userStats, 
  selectedUserFilter, 
  getSelectedUserName 
}: UserStatsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base lg:text-lg">
            {selectedUserFilter === "all" ? "Рейтинг сотрудников" : `Статистика: ${getSelectedUserName()}`}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {userStats.length > 0 ? userStats.map((stat, index) => (
            <UserStatsCard 
              key={stat.user.id} 
              stat={stat} 
              index={index} 
            />
          )) : 'Нет сотрудников'}
        </div>
      </CardContent>
    </Card>
  )
}
