"use client"

import { ChevronDown, ChevronRight } from 'lucide-react'
import { ProcessProgressBar } from "./ProcessProgressBar"
import { Button } from '../../ui/button'

interface ProcessCardHeaderProps {
  name: string
  description: string
  isExpanded: boolean
  totalTasks: number
  completedTasks: number
  progress: number
  onToggle: () => void
}

export function ProcessCardHeader({
  name,
  description,
  isExpanded,
  totalTasks,
  completedTasks,
  progress,
  onToggle
}: ProcessCardHeaderProps) {
  return (
    <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={onToggle}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base">{name}</h3>
            </div>
            <p className="text-sm text-gray-600 line-clamp-1">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium">{totalTasks}</div>
            <div className="text-xs text-gray-500">Задач</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-green-600">{completedTasks}</div>
            <div className="text-xs text-gray-500">Завершено</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{Math.round(progress)}%</div>
            <div className="text-xs text-gray-500">Прогресс</div>
          </div>
        </div>
      </div>

      <ProcessProgressBar progress={progress} />
    </div>
  )
}
