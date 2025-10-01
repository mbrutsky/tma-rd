"use client"

import { DatabaseBusinessProcess, DatabaseTask, DatabaseUser, ProcessStep, TaskStatus } from "@/src/lib/models/types"
import { Card } from "../../ui/card"
import { ProcessCardHeader } from "./ProcessCardHeader"
import { ProcessStepView } from "./ProcessStepView"

interface ProcessCardProps {
  process: DatabaseBusinessProcess
  tasks: DatabaseTask[]
  users: DatabaseUser[]
  steps: ProcessStep[]
  isExpanded: boolean
  expandedSteps: Set<string>
  onToggleProcess: () => void
  onToggleStep: (stepId: string) => void
  onSelectTask: (task: DatabaseTask) => void
}

export function ProcessCard({
  process,
  tasks,
  users,
  steps,
  isExpanded,
  expandedSteps,
  onToggleProcess,
  onToggleStep,
  onSelectTask
}: ProcessCardProps) {
  const processTasks = tasks.filter(task => task.process_id === process.id)
  const completedTasks = processTasks.filter(t => t.status === TaskStatus.COMPLETED).length
  const totalTasks = processTasks.length
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  return (
    <Card className="overflow-hidden">
      <ProcessCardHeader
        name={process.name}
        description={process.description ?? ''}
        isExpanded={isExpanded}
        totalTasks={totalTasks}
        completedTasks={completedTasks}
        progress={progress}
        onToggle={onToggleProcess}
      />

      {isExpanded && (
        <div className="border-t bg-gray-50 p-4">
          {steps.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              <div className="text-sm">В этом процессе пока нет шагов</div>
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((step) => (
                <ProcessStepView
                  key={step.id}
                  step={step}
                  level={0}
                  tasks={tasks}
                  users={users}
                  expandedSteps={expandedSteps}
                  onToggleStep={onToggleStep}
                  onSelectTask={onSelectTask}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}