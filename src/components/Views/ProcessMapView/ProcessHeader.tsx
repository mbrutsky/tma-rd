"use client"

import { UserRole } from '@/src/lib/models/types'
import { Plus } from 'lucide-react'
import { Button } from '../../ui/button'

interface ProcessHeaderProps {
  currentUserRole: UserRole
  onCreateProcess: () => void
}

export function ProcessHeader({ currentUserRole, onCreateProcess }: ProcessHeaderProps) {
  const canCreateProcess = currentUserRole === UserRole.DIRECTOR || currentUserRole === UserRole.DEPARTMENT_HEAD

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold">Бизнес-процессы</h2>
        <p className="text-sm text-gray-500">Управление процессами и задачами</p>
      </div>
      {canCreateProcess && (
        <Button size="sm" className="h-10" onClick={onCreateProcess}>
          <Plus className="h-4 w-4 mr-1" />
          Создать процесс
        </Button>
      )}
    </div>
  )
}
