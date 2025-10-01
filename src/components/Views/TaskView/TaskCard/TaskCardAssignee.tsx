"use client"

import { memo, useMemo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { User } from "lucide-react"
import { DatabaseUser } from "@/src/lib/models/types"

interface TaskCardAssigneeProps {
  assignee: DatabaseUser
}

const TaskCardAssignee = memo(function TaskCardAssignee({ assignee }: TaskCardAssigneeProps) {
  // Мемоизированные данные пользователя
  const userData = useMemo(() => ({
    initials: assignee.name.charAt(0).toUpperCase(),
    position: assignee.position || "Сотрудник",
    avatarUrl: assignee.avatar || "/placeholder.svg",
    hasAvatar: Boolean(assignee.avatar)
  }), [assignee.name, assignee.position, assignee.avatar])

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        {userData.hasAvatar ? (
          <AvatarImage 
            src={userData.avatarUrl} 
            alt={assignee.name}
          />
        ) : null}
        <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
          {userData.hasAvatar ? (
            userData.initials
          ) : (
            <User className="h-3 w-3" />
          )}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col min-w-0">
        <span className="text-sm text-gray-700 font-medium truncate">
          {assignee.name}
        </span>
        <div className="flex items-center gap-1">
          {/* <User className="h-3 w-3 text-gray-400 flex-shrink-0" /> */}
          <span className="text-xs text-gray-500 truncate">
            {userData.position}
          </span>
        </div>
      </div>
    </div>
  )
})

TaskCardAssignee.displayName = 'TaskCardAssignee'

export default TaskCardAssignee