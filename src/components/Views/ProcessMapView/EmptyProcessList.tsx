"use client"


import { UserRole } from '@/src/lib/models/types'
import { Plus } from 'lucide-react'
import { Card, CardContent } from '../../ui/card'
import { Button } from '../../ui/button'


interface EmptyProcessListProps {
  currentUserRole: UserRole
  onCreateProcess: () => void
}

export function EmptyProcessList({ currentUserRole, onCreateProcess }: EmptyProcessListProps) {
  const canCreateProcess = currentUserRole === UserRole.DIRECTOR || currentUserRole === UserRole.DEPARTMENT_HEAD

  return (
    <Card>
      <CardContent className="py-12 text-center text-gray-500">
        <div className="text-lg mb-2">Бизнес-процессы не настроены</div>
        <div className="text-sm mb-4">Создайте первый процесс для управления задачами</div>
        {canCreateProcess && (
          <Button onClick={onCreateProcess}>
            <Plus className="h-4 w-4 mr-2" />
            Создать процесс
          </Button>
        )}
      </CardContent>
    </Card>
  )
}