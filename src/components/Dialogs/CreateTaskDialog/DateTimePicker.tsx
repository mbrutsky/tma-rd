'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { format, addDays, addWeeks, isToday, isTomorrow, differenceInDays } from "date-fns";
import { ru } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Calendar } from '../../ui/calendar';


interface DateTimePickerProps {
  label: string;
  date?: Date;
  onDateChange: (date: Date) => void;
  required?: boolean;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  placeholder?: string;
  error?: string;
  showQuickButtons?: boolean;
  timeStep?: number; // шаг времени в минутах
}

export default function DateTimePicker({
  label,
  date,
  onDateChange,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  className = "",
  placeholder = "Выберите дату и время",
  error,
  showQuickButtons = true,
  timeStep = 15
}: DateTimePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [timeValue, setTimeValue] = useState(
    date ? format(date, "HH:mm") : "18:00"
  );
  const [inputValue, setInputValue] = useState("");

  // Устанавливаем минимальную дату как сегодня, если не указана другая
  const effectiveMinDate = minDate || new Date();
  effectiveMinDate.setHours(0, 0, 0, 0);

  // Синхронизируем время при изменении даты извне
  useEffect(() => {
    if (date) {
      setTimeValue(format(date, "HH:mm"));
    }
  }, [date]);

  // Обработка выбора даты из календаря
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate && !disabled) {
      const [hours, minutes] = timeValue.split(':').map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours, minutes, 0, 0);
      
      onDateChange(newDate);
      setIsCalendarOpen(false);
      setInputValue("");
    }
  };

  // Обработка изменения времени
  const handleTimeChange = (time: string) => {
    setTimeValue(time);
    if (date && !disabled) {
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      onDateChange(newDate);
    }
  };

  // Обработка ручного ввода даты
  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    // Попытка парсинга различных форматов
    const parsed = parseDateInput(value);
    if (parsed && parsed >= effectiveMinDate && (!maxDate || parsed <= maxDate)) {
      const [hours, minutes] = timeValue.split(':').map(Number);
      parsed.setHours(hours, minutes, 0, 0);
      onDateChange(parsed);
    }
  };

  // Парсинг пользовательского ввода
  const parseDateInput = (input: string): Date | null => {
    const trimmed = input.trim().toLowerCase();
    const today = new Date();
    
    // Относительные даты
    if (trimmed === 'сегодня' || trimmed === 'today') {
      return new Date();
    }
    if (trimmed === 'завтра' || trimmed === 'tomorrow') {
      return addDays(new Date(), 1);
    }
    if (trimmed === 'послезавтра') {
      return addDays(new Date(), 2);
    }
    
    // Числовые относительные даты
    const dayMatch = trimmed.match(/^через\s+(\d+)\s+дн/);
    if (dayMatch) {
      return addDays(new Date(), parseInt(dayMatch[1]));
    }
    
    const weekMatch = trimmed.match(/^через\s+(\d+)\s+недел/);
    if (weekMatch) {
      return addWeeks(new Date(), parseInt(weekMatch[1]));
    }
    
    // Форматы дат
    const dateFormats = [
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // dd.mm.yyyy
      /^(\d{1,2})\.(\d{1,2})\.(\d{2})$/, // dd.mm.yy
      /^(\d{1,2})\.(\d{1,2})$/, // dd.mm (текущий год)
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // yyyy-mm-dd
    ];
    
    for (const format of dateFormats) {
      const match = trimmed.match(format);
      if (match) {
        let day, month, year;
        
        if (format.source.includes('yyyy-mm-dd')) {
          [, year, month, day] = match;
        } else {
          [, day, month, year] = match;
        }
        
        // Обработка двузначного года
        if (year && year.length === 2) {
          const currentYear = today.getFullYear();
          const currentCentury = Math.floor(currentYear / 100) * 100;
          year = (parseInt(year) + currentCentury).toString();
        }
        
        // Если год не указан, используем текущий
        if (!year) {
          year = today.getFullYear().toString();
        }
        
        const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        // Проверяем валидность даты
        if (parsedDate.getDate() === parseInt(day) && 
            parsedDate.getMonth() === parseInt(month) - 1) {
          return parsedDate;
        }
      }
    }
    
    return null;
  };

  // Форматирование даты для отображения
  const formatDateDisplay = () => {
    if (!date) return placeholder;
    
    try {
      return format(date, "d MMMM yyyy, HH:mm", { locale: ru });
    } catch (error) {
      return "Неверная дата";
    }
  };

  // Получение относительного описания даты
  const getRelativeDate = () => {
    if (!date) return null;
    
    if (isToday(date)) return "сегодня";
    if (isTomorrow(date)) return "завтра";
    
    const days = differenceInDays(date, new Date());
    if (days > 0 && days <= 7) {
      return `через ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`;
    }
    
    if (days < 0) {
      const absDays = Math.abs(days);
      return `${absDays} ${absDays === 1 ? 'день' : absDays < 5 ? 'дня' : 'дней'} назад`;
    }
    
    return null;
  };

  const relativeDate = getRelativeDate();
  const hasError = error && error.length > 0;

  // Генерация опций времени с заданным шагом
  const generateTimeOptions = () => {
    const options = [];
    for (let hours = 0; hours < 24; hours++) {
      for (let minutes = 0; minutes < 60; minutes += timeStep) {
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className={className}>
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="flex gap-2 mt-1">
        {/* Поле даты с календарем */}
        <div className="flex-1">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-between text-left font-normal h-12 ${
                  hasError ? 'border-red-500 focus:ring-red-500' : ''
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                type="button"
                disabled={disabled}
              >
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <span className={date ? "text-gray-900" : "text-gray-400"}>
                    {date ? format(date, "d MMM yyyy", { locale: ru }) : "Выберите дату"}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  if (date < effectiveMinDate) return true;
                  if (maxDate && date > maxDate) return true;
                  return false;
                }}
                initialFocus
                captionLayout="dropdown"
                fromYear={new Date().getFullYear()}
                toYear={new Date().getFullYear() + 5}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Поле времени */}
   <div className="relative w-32">
      <Select
        value={timeValue}
        onValueChange={handleTimeChange}
        disabled={disabled}
      >
        <SelectTrigger 
          className={`h-12 ${hasError ? 'border-red-500' : ''}`}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <SelectValue placeholder={placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent className="z-[1000]">
          {timeOptions.map((time) => (
            <SelectItem key={time} value={time}>
              {time}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
      </div>

      {/* Ошибка */}
      {hasError && (
        <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Дополнительная информация */}
      {date && !hasError && (
        <div className="mt-2 space-y-1">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Полная дата:</span> {formatDateDisplay()}
          </div>
          {relativeDate && (
            <div className="text-sm text-blue-600">
              <span className="font-medium">Это</span> {relativeDate}
            </div>
          )}
          {date < new Date() && (
            <div className="text-sm text-orange-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              <span>Дата в прошлом</span>
            </div>
          )}
        </div>
      )}

      {/* Быстрые кнопки */}
      {showQuickButtons && !disabled && (
        <div className="flex flex-wrap gap-1 mt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const today = new Date();
              const [hours, minutes] = timeValue.split(':').map(Number);
              today.setHours(hours, minutes, 0, 0);
              onDateChange(today);
              setInputValue("");
            }}
            className="text-xs h-6 px-2"
          >
            Сегодня
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const tomorrow = addDays(new Date(), 1);
              const [hours, minutes] = timeValue.split(':').map(Number);
              tomorrow.setHours(hours, minutes, 0, 0);
              onDateChange(tomorrow);
              setInputValue("");
            }}
            className="text-xs h-6 px-2"
          >
            Завтра
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const nextWeek = addWeeks(new Date(), 1);
              const [hours, minutes] = timeValue.split(':').map(Number);
              nextWeek.setHours(hours, minutes, 0, 0);
              onDateChange(nextWeek);
              setInputValue("");
            }}
            className="text-xs h-6 px-2"
          >
            Через неделю
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const endOfWorkDay = new Date();
              endOfWorkDay.setHours(18, 0, 0, 0);
              setTimeValue("18:00");
              if (date) {
                const newDate = new Date(date);
                newDate.setHours(18, 0, 0, 0);
                onDateChange(newDate);
              }
            }}
            className="text-xs h-6 px-2"
          >
            18:00
          </Button>
        </div>
      )}
    </div>
  );
}