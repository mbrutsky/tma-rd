"use client"


import { ChevronDown, ChevronRight } from 'lucide-react'
import { getPositionText } from "./utils/userUtils"
import { ProcessStep } from '@/src/lib/models/types'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'

interface ProcessStepHeaderProps {
  step: ProcessStep
  level: number
  isExpanded: boolean
  hasSubSteps: boolean
  completedTasks: number
  totalTasks: number
  progress: number
  onToggle: () => void
}

export function ProcessStepHeader({
  step,
  level,
  isExpanded,
  hasSubSteps,
  completedTasks,
  totalTasks,
  progress,
  onToggle
}: ProcessStepHeaderProps) {
  return (
    <div 
      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => hasSubSteps && onToggle()}
    >
      <div className="flex items-center gap-2 flex-1">
        {hasSubSteps && (
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-medium ${level === 0 ? 'text-base' : level === 1 ? 'text-sm' : 'text-xs'}`}>
              {step.name}
            </h4>
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              {getPositionText(step.assigneeRole)}
            </Badge>
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              {step.estimatedHours}ч
            </Badge>
          </div>
          <p className={`text-gray-600 ${level === 0 ? 'text-sm' : 'text-xs'}`}>
            {step.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <div className="text-center">
          <div className="font-medium">{totalTasks}</div>
          <div className="text-xs text-gray-500">Задач</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-green-600">{completedTasks}</div>
          <div className="text-xs text-gray-500">Готово</div>
        </div>
        <div className="text-center">
          <div className="font-medium">{Math.round(progress)}%</div>
          <div className="text-xs text-gray-500">Прогресс</div>
        </div>
      </div>
    </div>
  )
}