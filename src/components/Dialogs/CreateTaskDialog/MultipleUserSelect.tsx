import { useState } from "react"
import { X, ChevronDown } from "lucide-react"
import type { MultipleUserSelectProps } from "./types"
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import { Badge } from "../../ui/badge"
export default function MultipleUserSelect({ 
  users, 
  selectedIds, 
  onAdd, 
  onRemove, 
  placeholder, 
  getPositionText,
  maxSelections // Добавьте сюда
}: MultipleUserSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Проверка на максимальное количество
  const isMaxReached = maxSelections !== undefined && selectedIds.length >= maxSelections;
  
  // Фильтруем только доступных пользователей (не выбранных)
  const availableUsers = users.filter(user => !selectedIds.includes(user.id))
  // Получаем выбранных пользователей
  const selectedUsers = users.filter(user => selectedIds.includes(user.id))
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-1 border rounded-lg px-2 py-1 min-h-[48px] cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedUsers.map((user) => (
              <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {user.name}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-500" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(user.id)
                  }} 
                />
              </Badge>
            ))}
            {selectedIds.length === 0 && (
              <span className="text-gray-400 text-sm">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {isMaxReached && (
            <div className="text-sm text-amber-600 text-center py-2 border-b">
              Достигнут лимит: {maxSelections} чел.
            </div>
          )}
          {availableUsers.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-2">Нет доступных пользователей</div>
          ) : (
            availableUsers.map((user) => (
              <div
                key={user.id}
                className={`flex items-center gap-2 p-2 rounded ${isMaxReached ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}`}
                onClick={() => {
                  if (!isMaxReached) {
                    onAdd(user.id)
                    setIsOpen(false)
                  }
                }}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="font-medium text-sm">{user.name}</span>
                  <span className="text-xs text-gray-500">{getPositionText(user)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}