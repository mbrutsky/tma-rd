"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { ThumbsUp, AlertTriangle } from 'lucide-react'
import { UserReportStats } from "./hooks/useReportData"

interface UserStatsCardProps {
  stat: UserReportStats
  index: number
}

export function UserStatsCard({ stat, index }: UserStatsCardProps) {
  return (
    <div className="border rounded-lg p-3">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={stat.user.avatar || "/placeholder.svg"} />
            <AvatarFallback>{stat.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium text-sm">{stat.user.name}</p>
            <p className="text-xs text-gray-500">
              {stat.user.position || "Не указана"}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Задач:</span>
              <span className="font-medium">{stat.totalTasks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Выполнено в срок:</span>
              <span className="font-medium text-green-600">{stat.completedOnTime}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Просрочено:</span>
              <span className="font-medium text-red-600">{stat.overdueTasks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Благодарности:</span>
              <span className="font-medium text-green-600">{stat.gratitudes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={stat.user.avatar || "/placeholder.svg"} />
            <AvatarFallback>{stat.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{stat.user.name}</p>
            <p className="text-sm text-gray-500">
              {stat.user.position || "Не указана"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium">{stat.totalTasks}</div>
            <div className="text-xs text-gray-500">Задач</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-green-600">{stat.completedOnTime}</div>
            <div className="text-xs text-gray-500">В срок</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-red-600">{stat.overdueTasks}</div>
            <div className="text-xs text-gray-500">Просрочено</div>
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <ThumbsUp className="h-4 w-4" />
            <span>{stat.gratitudes}</span>
          </div>
          <div className="flex items-center gap-1 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span>{stat.remarks}</span>
          </div>
        </div>
      </div>
    </div>
  )
}