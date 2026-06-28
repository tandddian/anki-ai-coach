import React, { useState, useMemo } from 'react';
import { useStore } from '../../store';
import { formatMonthYear, buildCalendarGrid, isToday, isSameDay, getDateString } from '../../utils/dateUtils';
import { getDueMaterials } from '../../database/queries';

export function Calendar() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const selectedDate = useStore(state => state.selectedDate);
  const setSelectedDate = useStore(state => state.setSelectedDate);

  // Build calendar grid
  const days = useMemo(() => buildCalendarGrid(currentYear, currentMonth), [currentYear, currentMonth]);

  // Get dates that have due materials for the current month view
  const dueDates = useMemo(() => {
    const dueDateSet = new Set<string>();

    // Check each day in the grid for due materials
    for (const day of days) {
      if (day) {
        const dateStr = getDateString(day);
        try {
          const dueMats = getDueMaterials(dateStr);
          if (dueMats.length > 0) {
            dueDateSet.add(dateStr);
          }
        } catch {
          // Skip if DB not ready
        }
      }
    }
    return dueDateSet;
  }, [days]);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(today);
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="w-full">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={goToPrevMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Previous month"
        >
          <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={goToToday}
          className="text-xs font-medium text-gray-700 hover:text-blue-600 transition-colors px-2"
        >
          {formatMonthYear(currentYear, currentMonth)}
        </button>
        <button
          onClick={goToNextMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Next month"
        >
          <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map((name, idx) => (
          <div key={idx} className="text-center">
            <span className="text-[10px] font-medium text-gray-400">{name}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, idx) => {
          if (!day) return <div key={idx} className="aspect-square" />;

          const isOtherMonth = day.getMonth() !== currentMonth;
          const isTodayDate = isToday(day);
          const isSelectedDate = isSameDay(day, selectedDate);
          const dateStr = getDateString(day);
          const hasDue = dueDates.has(dateStr);

          return (
            <button
              key={idx}
              onClick={() => handleDayClick(day)}
              className={`
                aspect-square flex flex-col items-center justify-center rounded text-xs
                transition-colors relative
                ${isOtherMonth ? 'text-gray-300' : 'text-gray-700'}
                ${isSelectedDate
                  ? 'bg-blue-600 text-white font-semibold'
                  : isTodayDate
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'hover:bg-gray-100'
                }
              `}
            >
              <span>{day.getDate()}</span>
              {hasDue && !isSelectedDate && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-orange-500" />
              )}
              {hasDue && isSelectedDate && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
