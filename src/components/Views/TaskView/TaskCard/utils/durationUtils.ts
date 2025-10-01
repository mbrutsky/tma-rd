export const formatDuration = (hours?: number) => {
  if (!hours) return "Не указано"
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h === 0) return `${m} мин`
  if (m === 0) return `${h} ч`
  return `${h} ч ${m} мин`
}

export interface Duration {
  days: number;
  hours: number;
  minutes: number;
}

export const formatDurationFull = (days?: number, hours?: number, minutes?: number): string => {
  const parts: string[] = [];
  
  if (days && days > 0) {
    parts.push(`${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`);
  }
  
  if (hours && hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`);
  }
  
  if (minutes && minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'минута' : minutes < 5 ? 'минуты' : 'минут'}`);
  }
  
  if (parts.length === 0) {
    return "Не указано";
  }
  
  return parts.join(' ');
};

export const formatDurationCompact = (days?: number, hours?: number, minutes?: number): string => {
  const parts: string[] = [];
  
  if (days && days > 0) {
    parts.push(`${days}д`);
  }
  
  if (hours && hours > 0) {
    parts.push(`${hours}ч`);
  }
  
  if (minutes && minutes > 0) {
    parts.push(`${minutes}м`);
  }
  
  if (parts.length === 0) {
    return "—";
  }
  
  return parts.join(' ');
};

// Преобразование дней/часов/минут в общее количество часов для обратной совместимости
export const durationToHours = (days?: number, hours?: number, minutes?: number): number => {
  const totalHours = (days || 0) * 24 + (hours || 0) + ((minutes || 0) / 60);
  return Math.round(totalHours * 100) / 100; // Округляем до 2 знаков после запятой
};

// Преобразование часов в дни/часы/минуты
export const hoursToDuration = (totalHours?: number): Duration => {
  if (!totalHours || totalHours <= 0) {
    return { days: 0, hours: 0, minutes: 0 };
  }
  
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  const hours = Math.floor(remainingHours);
  const minutes = Math.round((remainingHours - hours) * 60);
  
  return { days, hours, minutes };
};

// Валидация длительности
export const isValidDuration = (days: number, hours: number, minutes: number): boolean => {
  return days >= 0 && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
};

// Нормализация длительности (например, 90 минут = 1 час 30 минут)
export const normalizeDuration = (days: number, hours: number, minutes: number): Duration => {
  let totalMinutes = minutes + hours * 60 + days * 24 * 60;
  
  const resultDays = Math.floor(totalMinutes / (24 * 60));
  totalMinutes %= (24 * 60);
  
  const resultHours = Math.floor(totalMinutes / 60);
  const resultMinutes = totalMinutes % 60;
  
  return {
    days: resultDays,
    hours: resultHours,
    minutes: resultMinutes
  };
};