import { TaskStatus, TaskPriority } from "@/src/lib/models/types"
import { Clock, CheckCircle, Play, Pause, AlertCircle } from 'lucide-react'
import { Badge } from "@/src/components/ui/badge"

export const getStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.NEW:
      return <Clock className="h-4 w-4 text-blue-500" />
    case TaskStatus.ACKNOWLEDGED:
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case TaskStatus.IN_PROGRESS:
      return <Play className="h-4 w-4 text-yellow-500" />
    case TaskStatus.PAUSED:
      return <Pause className="h-4 w-4 text-gray-500" />
    case TaskStatus.WAITING_CONTROL:
      return <AlertCircle className="h-4 w-4 text-purple-500" />
    case TaskStatus.ON_CONTROL:
      return <AlertCircle className="h-4 w-4 text-indigo-500" />
    case TaskStatus.COMPLETED:
      return <CheckCircle className="h-4 w-4 text-green-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-500" />
  }
}

export const getPriorityBadge = (priority: TaskPriority) => {
  const colors = {
    [TaskPriority.CRITICAL]: "bg-red-100 text-red-800",
    [TaskPriority.HIGH]: "bg-orange-100 text-orange-800",
    [TaskPriority.MEDIUM]: "bg-yellow-100 text-yellow-800",
    [TaskPriority.LOW]: "bg-blue-100 text-blue-800",
    [TaskPriority.VERY_LOW]: "bg-gray-100 text-gray-800",
  }

  return (
    <Badge className={`${colors[priority]} text-xs px-1.5 py-0.5`}>
      {priority}
    </Badge>
  )
}