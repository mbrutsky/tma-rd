"use client"

import { useState } from "react"
import { EmptyProcessList } from "./EmptyProcessList"
import { ProcessCard } from "./ProcessCard"
import { ProcessCreateDialog } from "./ProcessCreateDialog"
import { ProcessHeader } from "./ProcessHeader"
import { TaskComment } from "@/app/page"
import { DatabaseTask, DatabaseUser, DatabaseBusinessProcess, ProcessStep } from "@/src/lib/models/types"
import { TaskDetailsDialog } from "../../Dialogs/TaskDetailsDialog"

interface ProcessMapViewProps {
  tasks: DatabaseTask[]
  users: DatabaseUser[]
  currentUser: DatabaseUser
  businessProcesses: DatabaseBusinessProcess[]
  onUpdateTask: (task: DatabaseTask, historyAction?: any) => void
  onCreateBusinessProcess: (processData: Omit<DatabaseBusinessProcess, "id" | "created_at" | "updated_at">) => void
  onAddComment: (taskId: string, comment: Omit<TaskComment, "id" | "timestamp">) => Promise<void>
  onUpdateComment: (taskId: string, commentId: string, text: string) => Promise<void>
  onDeleteComment: (taskId: string, commentId: string) => void
  onSendReminder: (taskId: string, minutes?: number) => void
}

export default function ProcessMapView({
  tasks,
  users,
  currentUser,
  businessProcesses,
  onUpdateTask,
  onCreateBusinessProcess,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onSendReminder,
}: ProcessMapViewProps) {
  const [selectedTask, setSelectedTask] = useState<DatabaseTask | null>(null)
  const [expandedProcesses, setExpandedProcesses] = useState<Set<string>>(new Set())
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Бизнес-логика
  const getProcessTasks = (processId: string) => {
    return tasks.filter(task => task.process_id === processId)
  }

  const getProcessSteps = (processId: string): ProcessStep[] => {
    // В реальном приложении это должно загружаться из базы данных
    // Для демонстрации возвращаем пустой массив
    return []
  }

  const toggleProcessExpansion = (processId: string) => {
    const newExpanded = new Set(expandedProcesses)
    if (newExpanded.has(processId)) {
      newExpanded.delete(processId)
    } else {
      newExpanded.add(processId)
    }
    setExpandedProcesses(newExpanded)
  }

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  const handleCreateProcess = (data: {
    name: string
    description: string
    departments: string[]
  }) => {
    const processData = {
      name: data.name,
      description: data.description,
      creator_id: currentUser.id,
      is_active: true,
    }

    // onCreateBusinessProcess(processData)
  }

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <ProcessHeader 
        currentUserRole={currentUser.role}
        onCreateProcess={() => setIsCreateDialogOpen(true)}
      />

      {/* Список процессов */}
      <div className="space-y-3">
        {businessProcesses.length === 0 ? (
          <EmptyProcessList
            currentUserRole={currentUser.role}
            onCreateProcess={() => setIsCreateDialogOpen(true)}
          />
        ) : (
          businessProcesses.map((process) => {
            const steps = getProcessSteps(process.id)
            
            return (
              <ProcessCard
                key={process.id}
                process={process}
                tasks={tasks}
                users={users}
                steps={steps}
                isExpanded={expandedProcesses.has(process.id)}
                expandedSteps={expandedSteps}
                onToggleProcess={() => toggleProcessExpansion(process.id)}
                onToggleStep={toggleStepExpansion}
                onSelectTask={setSelectedTask}
              />
            )
          })
        )}
      </div>

      {/* Диалог создания процесса */}
      <ProcessCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateProcess={handleCreateProcess}
      />

      {/* Диалог деталей задачи */}
      {selectedTask && (
        <TaskDetailsDialog
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          users={users}
          currentUser={currentUser}
          businessProcesses={businessProcesses}
        />
      )}
    </div>
  )
}