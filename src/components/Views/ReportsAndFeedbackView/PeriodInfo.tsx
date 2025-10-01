"use client"

import { format } from "date-fns"
import { ru } from "date-fns/locale"

interface PeriodInfoProps {
  periodStart: Date
  periodEnd: Date
  selectedUserName: string
}

export function PeriodInfo({ periodStart, periodEnd, selectedUserName }: PeriodInfoProps) {
  return (
    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg flex justify-between items-center">
      <div className="flex flex-col">
        <div>{format(periodStart, "d MMM", { locale: ru })} - {format(periodEnd, "d MMM yyyy", { locale: ru })}</div>
        <div className="mt-1">{selectedUserName}</div>
      </div>
    </div>
  )
}