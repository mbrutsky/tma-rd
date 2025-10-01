'use client';

import React from 'react';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface DurationInputProps {
  days?: number;
  hours?: number;
  minutes?: number;
  onDurationChange: (days: number, hours: number, minutes: number) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function DurationInput({
  days = 0,
  hours = 0,
  minutes = 0,
  onDurationChange,
  label = "Длительность",
  disabled = false,
  className = ""
}: DurationInputProps) {
  const [localDays, setLocalDays] = React.useState(days);
  const [localHours, setLocalHours] = React.useState(hours);
  const [localMinutes, setLocalMinutes] = React.useState(minutes);

  React.useEffect(() => {
    setLocalDays(days);
    setLocalHours(hours);
    setLocalMinutes(minutes);
  }, [days, hours, minutes]);

  const handleChange = (newDays: number, newHours: number, newMinutes: number) => {
    let totalMinutes = newMinutes;
    let totalHours = newHours;
    let totalDays = newDays;

    // Нормализация: переводим минуты в часы, часы в дни
    if (totalMinutes >= 60) {
      totalHours += Math.floor(totalMinutes / 60);
      totalMinutes = totalMinutes % 60;
    }

    if (totalHours >= 24) {
      totalDays += Math.floor(totalHours / 24);
      totalHours = totalHours % 24;
    }

    setLocalDays(totalDays);
    setLocalHours(totalHours);
    setLocalMinutes(totalMinutes);
    
    onDurationChange(totalDays, totalHours, totalMinutes);
  };

  const formatDurationDisplay = () => {
    const parts = [];
    if (localDays > 0) parts.push(`${parseInt(String(localDays))}д`);
    if (localHours > 0) parts.push(`${parseInt(String(localHours))}ч`);
    if (localMinutes > 0) parts.push(`${parseInt(String(localMinutes))}м`);
    return parts.length > 0 ? parts.join(' ') : '—';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid grid-cols-3 gap-2 items-center">
        <div>
          <Label className="text-xs text-gray-500">Дней</Label>
          <Input
            type="number"
            placeholder="0"
            min="0"
            value={parseInt(String(localDays)) || ''}
            onChange={(e) => handleChange(
              Math.max(0, parseInt(e.target.value) || 0), 
              localHours, 
              localMinutes
            )}
            disabled={disabled}
            className="text-center h-10"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-500">Часов</Label>
          <Input
            type="number"
            placeholder="0"
            min="0"
            max="23"
            value={parseInt(String(localHours)) || ''}
            onChange={(e) => handleChange(
              localDays, 
              Math.max(0, parseInt(e.target.value) || 0), 
              localMinutes
            )}
            disabled={disabled}
            className="text-center h-10"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-500">Минут</Label>
          <Input
            type="number"
            placeholder="0"
            min="0"
            max="59"
            value={parseInt(String(localMinutes)) || ''}
            onChange={(e) => handleChange(
              localDays, 
              localHours, 
              Math.max(0, parseInt(e.target.value) || 0)
            )}
            disabled={disabled}
            className="text-center h-10"
          />
        </div>
      </div>
    </div>
  );
}