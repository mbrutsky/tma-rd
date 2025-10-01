"use client"

import { ProcessStep, DatabaseTask, DatabaseUser, TaskStatus } from "@/src/lib/models/types"
import TaskCard from "../TaskView/TaskCard/TaskCard"
import { ProcessStepHeader } from "./ProcessStepHeader"

interface ProcessStepViewProps {
  step: ProcessStep
  level: number
  tasks: DatabaseTask[]
  users: DatabaseUser[]
  expandedSteps: Set<string>
  onToggleStep: (stepId: string) => void
  onSelectTask: (task: DatabaseTask) => void
}

export function ProcessStepView({
  step,
  level,
  tasks,
  users,
  expandedSteps,
  onToggleStep,
  onSelectTask
}: ProcessStepViewProps) {
  const stepTasks = tasks.filter(task => (task as any).stepId === step.id)
  const isExpanded = expandedSteps.has(step.id)
  const hasSubSteps = step.subSteps && step.subSteps.length > 0
  const completedTasks = stepTasks.filter(t => t.status === TaskStatus.COMPLETED).length
  const totalTasks = stepTasks.length
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const indentClass = level === 0 ? "" : 
                     level === 1 ? "ml-4" :
                     level === 2 ? "ml-8" :
                     level === 3 ? "ml-12" : "ml-16"

  const getUserById = (id: string) => users.find((u) => u.id === id)

  return (
    <div className={`${indentClass} border-l-2 border-gray-200 pl-3 ${level > 0 ? 'mt-2' : ''}`}>
      <ProcessStepHeader
        step={step}
        level={level}
        isExpanded={isExpanded}
        hasSubSteps={!!hasSubSteps}
        completedTasks={completedTasks}
        totalTasks={totalTasks}
        progress={progress}
        onToggle={() => onToggleStep(step.id)}
      />

      {/* Задачи шага */}
      {stepTasks.length > 0 && (
        <div className="mt-2 space-y-1">
          {stepTasks.map((task) => {
            return (
              <></>
              // <TaskCard
              //   key={task.id}
              //   task={task}
              //   users={users}
              //   currentUser={users.find(u => u.id === 'current-user-id') || users[0]} // Нужно передать правильного пользователя
              //   businessProcesses={[]} // Передать правильные процессы
              //   onClick={() => onSelectTask(task)}
              //   onUpdate={(updatedTask) => {
              //     // Обработать обновление задачи
              //     console.log('Task updated:', updatedTask)
              //   }}
              //   onDelete={(taskId) => {
              //     // Обработать удаление задачи
              //     console.log('Task deleted:', taskId)
              //   }}
              //   onSendReminder={(taskId, minutes) => {
              //     // Обработать отправку напоминания
              //     console.log('Reminder sent:', taskId, minutes)
              //   }}
              // />
            )
          })}
        </div>
      )}

      {/* Подшаги */}
      {hasSubSteps && isExpanded && (
        <div className="mt-2 space-y-2">
          {step.subSteps!.map((subStep) => 
            <ProcessStepView
              key={subStep.id}
              step={subStep}
              level={level + 1}
              tasks={tasks}
              users={users}
              expandedSteps={expandedSteps}
              onToggleStep={onToggleStep}
              onSelectTask={onSelectTask}
            />
          )}
        </div>
      )}
    </div>
  )
}