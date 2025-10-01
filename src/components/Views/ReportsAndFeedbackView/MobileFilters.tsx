"use client"

import { Button } from "@/src/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/src/components/ui/sheet"
import { Calendar, Users, Filter } from 'lucide-react'
import { DatabaseUser } from "@/src/lib/models/types"

interface MobileFiltersProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  period: "week" | "month" | "quarter" | "year"
  setPeriod: (period: "week" | "month" | "quarter" | "year") => void
  selectedUserFilter: string
  setSelectedUserFilter: (userId: string) => void
  users: DatabaseUser[]
}

export function MobileFilters({
  isOpen,
  onOpenChange,
  period,
  setPeriod,
  selectedUserFilter,
  setSelectedUserFilter,
  users
}: MobileFiltersProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <Filter className="h-4 w-4 mr-1" />
          Фильтры
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Фильтры</SheetTitle>
          <SheetDescription>
            Настройте параметры отображения данных
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Период</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[1000]">
                <SelectItem value="week">Неделя</SelectItem>
                <SelectItem value="month">Месяц</SelectItem>
                <SelectItem value="quarter">Квартал</SelectItem>
                <SelectItem value="year">Год</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Сотрудник</label>
            <Select value={selectedUserFilter} onValueChange={setSelectedUserFilter}>
              <SelectTrigger>
                <Users className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[1000]">
                <SelectItem value="all">Все сотрудники</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {user.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}