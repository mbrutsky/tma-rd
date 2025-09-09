"use client"

import { CheckSquare, GitBranch, BarChart3 } from 'lucide-react'
import { UserRole } from "@/types/task"

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
  ].filter((tab) => tab.available)

  if (tabs.length === 1) return;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-20">
      <div className="flex justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-0 flex-1 ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:bg-gray-100"
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 ${isActive ? "text-blue-600" : "text-gray-500"}`} />
              <span className={`text-xs font-medium truncate ${isActive ? "text-blue-600" : "text-gray-500"}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}