"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Checkbox } from "../../ui/checkbox"
import { Button } from "../../ui/button"
import { Textarea } from "../../ui/textarea"

interface ProcessCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateProcess: (data: {
    name: string
    description: string
    departments: string[]
  }) => void
}

const DEPARTMENTS = [
  { id: "dept1", name: "Отдел разработки" },
  { id: "dept2", name: "Отдел маркетинга" },
]

export function ProcessCreateDialog({ 
  open, 
  onOpenChange, 
  onCreateProcess 
}: ProcessCreateDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])

  const handleCreate = () => {
    if (!name.trim()) return

    onCreateProcess({
      name: name.trim(),
      description: description.trim(),
      departments: selectedDepartments
    })

    // Reset form
    setName("")
    setDescription("")
    setSelectedDepartments([])
    onOpenChange(false)
  }

  const handleDepartmentChange = (departmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDepartments([...selectedDepartments, departmentId])
    } else {
      setSelectedDepartments(selectedDepartments.filter(id => id !== departmentId))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Создать бизнес-процесс</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="process-name">Название процесса *</Label>
            <Input
              id="process-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название процесса"
              className="h-10"
            />
          </div>
          <div>
            <Label htmlFor="process-description">Описание</Label>
            <Textarea
              id="process-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание процесса"
              rows={3}
            />
          </div>
          <div>
            <Label>Отделы</Label>
            <div className="space-y-2 mt-2">
              {DEPARTMENTS.map((dept) => (
                <div key={dept.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={dept.id}
                    checked={selectedDepartments.includes(dept.id)}
                    onCheckedChange={(checked) => handleDepartmentChange(dept.id, !!checked)}
                  />
                  <Label htmlFor={dept.id} className="text-sm">{dept.name}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleCreate} disabled={!name.trim()} className="flex-1">
              Создать
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}