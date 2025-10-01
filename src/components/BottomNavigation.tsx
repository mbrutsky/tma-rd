// components/BottomNavigation.tsx
"use client"

import { UserRole } from '@/src/lib/models/types'
import { CheckSquare, BarChart3, Settings } from 'lucide-react'

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  currentUser: { role: UserRole }
}

export default function BottomNavigation({ activeTab, onTabChange, currentUser }: BottomNavigationProps) {
  const tabs = [
    {
      id: "tasks",
      label: "Задачи",
      icon: CheckSquare,
      available: true,
    },
    // {
    //   id: "processes",
    //   label: "Процессы",
    //   icon: GitBranch,
    //   available: currentUser.role !== UserRole.EMPLOYEE,
    // },
    {
      id: "reports",
      label: "Рейтинг",
      icon: BarChart3,
      available: currentUser.role !== UserRole.EMPLOYEE,
    },
    {
      id: "settings",
      label: "Настройки",
      icon: Settings,
      available: (currentUser.role === UserRole.DIRECTOR || currentUser.role === UserRole.ADMIN), // Только для директора или администратора
    },
  ].filter((tab) => tab.available)

  if (tabs.length === 1) return;

  return (
    <div className="fixed left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3 z-20 shadow-lg w-fit m-[0_auto] bottom-4 rounded-2xl">
      <div className="flex justify-center gap-4 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group relative flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-300 min-w-0 flex-1 transform ${
                isActive
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105"
                  : "bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:scale-95 hover:shadow-md"
              }`}
            >
              <div className={`p-2 rounded-xl mb-1 transition-all duration-300 ${
                isActive 
                  ? "bg-white/20" 
                  : "bg-transparent group-hover:bg-white/50"
              }`}>
                <Icon className={`h-5 w-5 transition-all duration-300 ${
                  isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                }`} />
              </div>
              <span className={`text-xs font-medium truncate transition-all duration-300 ${
                isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
              }`}>
                {tab.label}
              </span>
              
              {/* Активный индикатор */}
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full opacity-80" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}