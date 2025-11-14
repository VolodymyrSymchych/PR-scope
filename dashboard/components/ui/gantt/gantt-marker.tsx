'use client';

import React from 'react';
import { useGantt } from './gantt-provider';
import { 
  differenceInDays, 
  differenceInWeeks, 
  differenceInMonths, 
  differenceInQuarters, 
  differenceInYears, 
  isToday, 
  startOfWeek, 
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  eachWeekOfInterval,
  eachMonthOfInterval
} from 'date-fns';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface GanttMarkerProps {
  id: string;
  date: Date;
  label: string;
  className?: string;
  onRemove?: (id: string) => void;
}

export function GanttMarker({ id, date, label, className, onRemove }: GanttMarkerProps) {
  const { startDate, pixelsPerDay } = useGantt();
  const left = differenceInDays(date, startDate) * pixelsPerDay;
  const isTodayDate = isToday(date);

  return (
    <div
      className={cn(
        'absolute top-0 bottom-0 w-0.5 z-10 opacity-50',
        isTodayDate ? 'bg-primary' : 'bg-secondary',
        className
      )}
      style={{ left: `${left}px` }}
    >
      <div
      className={cn(
        'absolute top-0 left-1/2 -translate-x-1/2 bg-surface-elevated rounded px-2 py-1 text-xs whitespace-nowrap border border-white/[0.12]',
        className
      )}
      >
        {label}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(id);
            }}
            className="ml-2"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export function GanttToday() {
  const { 
    firstDate, 
    pixelsPerDay, 
    pixelsPerWeek, 
    pixelsPerMonth, 
    pixelsPerQuarter, 
    pixelsPerYear, 
    viewMode,
    days,
    weeks,
    months,
    quarters,
    years
  } = useGantt();
  
  const today = new Date();
  
  // Filter dates the same way as FeatureBar does - starting from firstDate
  const filteredDates = React.useMemo(() => {
    const findStartIndex = (dateArray: Date[]): number => {
      if (!firstDate || dateArray.length === 0) return 0;
      
      switch (viewMode) {
        case 'days':
          return dateArray.findIndex(d => {
            return d.getFullYear() === firstDate.getFullYear() &&
                   d.getMonth() === firstDate.getMonth() &&
                   d.getDate() === firstDate.getDate();
          });
        case 'weeks': {
          return dateArray.findIndex(d => {
            const weekStart = startOfWeek(d, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(d, { weekStartsOn: 1 });
            return firstDate >= weekStart && firstDate <= weekEnd;
          });
        }
        case 'months': {
          const firstYear = firstDate.getFullYear();
          const firstMonth = firstDate.getMonth();
          return dateArray.findIndex(d => d.getFullYear() === firstYear && d.getMonth() === firstMonth);
        }
        case 'quarters': {
          const firstYear = firstDate.getFullYear();
          const firstQuarterMonth = Math.floor(firstDate.getMonth() / 3) * 3;
          return dateArray.findIndex(d => {
            const dYear = d.getFullYear();
            const dMonth = d.getMonth();
            return dYear === firstYear && Math.floor(dMonth / 3) * 3 === firstQuarterMonth;
          });
        }
        case 'years': {
          const firstYear = firstDate.getFullYear();
          return dateArray.findIndex(d => d.getFullYear() === firstYear);
        }
        default:
          return 0;
      }
    };

    const startIndex = (() => {
      switch (viewMode) {
        case 'days':
          return findStartIndex(days);
        case 'weeks':
          return findStartIndex(weeks);
        case 'months':
          return findStartIndex(months);
        case 'quarters':
          return findStartIndex(quarters);
        case 'years':
          return findStartIndex(years);
        default:
          return 0;
      }
    })();

    return {
      filteredDays: startIndex >= 0 ? days.slice(startIndex) : days,
      filteredWeeks: startIndex >= 0 ? weeks.slice(startIndex) : weeks,
      filteredMonths: startIndex >= 0 ? months.slice(startIndex) : months,
      filteredQuarters: startIndex >= 0 ? quarters.slice(startIndex) : quarters,
      filteredYears: startIndex >= 0 ? years.slice(startIndex) : years,
    };
  }, [days, weeks, months, quarters, years, firstDate, viewMode]);
  
  // Helper function to find index in date array (same as in FeatureBar)
  const findDateIndex = (targetDate: Date, dateArray: Date[], mode: string): number => {
    switch (mode) {
      case 'months': {
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        return dateArray.findIndex(d => d.getFullYear() === year && d.getMonth() === month);
      }
      case 'quarters': {
        const year = targetDate.getFullYear();
        const quarterMonth = Math.floor(targetDate.getMonth() / 3) * 3;
        return dateArray.findIndex(d => {
          const dYear = d.getFullYear();
          const dMonth = d.getMonth();
          return dYear === year && Math.floor(dMonth / 3) * 3 === quarterMonth;
        });
      }
      case 'years': {
        const year = targetDate.getFullYear();
        return dateArray.findIndex(d => d.getFullYear() === year);
      }
      default:
        return -1;
    }
  };
  
  // Calculate left position based on view mode - use filteredDates for synchronization
  const left = React.useMemo(() => {
    switch (viewMode) {
      case 'days': {
        // Find today's index in filteredDays array (same as FeatureBar)
        const index = filteredDates.filteredDays.findIndex(d => {
          return d.getFullYear() === today.getFullYear() &&
                 d.getMonth() === today.getMonth() &&
                 d.getDate() === today.getDate();
        });
        
        if (index >= 0) {
          // Calculate position: day index * pixelsPerDay + hour offset
          // Hour offset: (current hour / 24) * pixelsPerDay
          const currentHour = today.getHours();
          const currentMinute = today.getMinutes();
          const hourOffset = ((currentHour + currentMinute / 60) / 24) * pixelsPerDay;
          return index * pixelsPerDay + hourOffset;
        }
        
        // Fallback: calculate difference from firstDate
        const dayDiff = differenceInDays(today, firstDate);
        const currentHour = today.getHours();
        const currentMinute = today.getMinutes();
        const hourOffset = ((currentHour + currentMinute / 60) / 24) * pixelsPerDay;
        return dayDiff * pixelsPerDay + hourOffset;
      }
      case 'weeks': {
        // Find today's week in filteredWeeks array (same as FeatureBar)
        const index = filteredDates.filteredWeeks.findIndex(d => {
          const weekStart = startOfWeek(d, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(d, { weekStartsOn: 1 });
          return today >= weekStart && today <= weekEnd;
        });
        
        if (index >= 0) {
          // Calculate position: week index * pixelsPerWeek + day offset within week
          const weekStart = startOfWeek(today, { weekStartsOn: 1 });
          const dayOffset = differenceInDays(today, weekStart); // 0-6
          const dayOffsetPx = (dayOffset / 7) * pixelsPerWeek;
          return index * pixelsPerWeek + dayOffsetPx;
        }
        
        // Fallback
        const weekDiff = differenceInWeeks(today, firstDate);
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const dayOffset = differenceInDays(today, weekStart);
        const dayOffsetPx = (dayOffset / 7) * pixelsPerWeek;
        return weekDiff * pixelsPerWeek + dayOffsetPx;
      }
      case 'months': {
        const index = findDateIndex(today, filteredDates.filteredMonths, 'months');
        
        if (index >= 0) {
          // Calculate position: month index * pixelsPerMonth + day offset within month
          const monthStart = startOfMonth(today);
          const monthEnd = endOfMonth(today);
          const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
          const dayOffset = differenceInDays(today, monthStart); // 0 to daysInMonth-1
          const dayOffsetPx = (dayOffset / daysInMonth) * pixelsPerMonth;
          return index * pixelsPerMonth + dayOffsetPx;
        }
        
        // Fallback
        const monthDiff = differenceInMonths(today, firstDate);
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
        const dayOffset = differenceInDays(today, monthStart);
        const dayOffsetPx = (dayOffset / daysInMonth) * pixelsPerMonth;
        return monthDiff * pixelsPerMonth + dayOffsetPx;
      }
      case 'quarters': {
        const index = findDateIndex(today, filteredDates.filteredQuarters, 'quarters');
        
        if (index >= 0) {
          // Calculate position: quarter index * pixelsPerQuarter + week offset within quarter
          const quarterStart = startOfQuarter(today);
          const quarterEnd = endOfQuarter(today);
          const quarterWeeks = eachWeekOfInterval({ start: quarterStart, end: quarterEnd }, { weekStartsOn: 1 });
          const todayWeekStart = startOfWeek(today, { weekStartsOn: 1 });
          const weekIndex = quarterWeeks.findIndex(w => {
            const wStart = startOfWeek(w, { weekStartsOn: 1 });
            return wStart.getTime() === todayWeekStart.getTime();
          });
          const weekOffsetPx = weekIndex >= 0 ? (weekIndex / quarterWeeks.length) * pixelsPerQuarter : 0;
          return index * pixelsPerQuarter + weekOffsetPx;
        }
        
        // Fallback
        const quarterDiff = differenceInQuarters(today, firstDate);
        const quarterStart = startOfQuarter(today);
        const quarterEnd = endOfQuarter(today);
        const quarterWeeks = eachWeekOfInterval({ start: quarterStart, end: quarterEnd }, { weekStartsOn: 1 });
        const todayWeekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekIndex = quarterWeeks.findIndex(w => {
          const wStart = startOfWeek(w, { weekStartsOn: 1 });
          return wStart.getTime() === todayWeekStart.getTime();
        });
        const weekOffsetPx = weekIndex >= 0 ? (weekIndex / quarterWeeks.length) * pixelsPerQuarter : 0;
        return quarterDiff * pixelsPerQuarter + weekOffsetPx;
      }
      case 'years': {
        const index = findDateIndex(today, filteredDates.filteredYears, 'years');
        
        if (index >= 0) {
          // Calculate position: year index * pixelsPerYear + month offset within year
          const yearStart = startOfYear(today);
          const yearMonths = eachMonthOfInterval({ start: yearStart, end: endOfYear(today) });
          const monthIndex = yearMonths.findIndex(m => 
            m.getFullYear() === today.getFullYear() && m.getMonth() === today.getMonth()
          );
          const monthOffsetPx = monthIndex >= 0 ? (monthIndex / 12) * pixelsPerYear : 0;
          return index * pixelsPerYear + monthOffsetPx;
        }
        
        // Fallback
        const yearDiff = differenceInYears(today, firstDate);
        const yearStart = startOfYear(today);
        const yearMonths = eachMonthOfInterval({ start: yearStart, end: endOfYear(today) });
        const monthIndex = yearMonths.findIndex(m => 
          m.getFullYear() === today.getFullYear() && m.getMonth() === today.getMonth()
        );
        const monthOffsetPx = monthIndex >= 0 ? (monthIndex / 12) * pixelsPerYear : 0;
        return yearDiff * pixelsPerYear + monthOffsetPx;
      }
      default:
        return differenceInDays(today, firstDate) * pixelsPerDay;
    }
  }, [today, firstDate, viewMode, pixelsPerDay, pixelsPerWeek, pixelsPerMonth, pixelsPerQuarter, pixelsPerYear, filteredDates]);

  // Add px-4 (16px) padding to match the container padding in GanttFeatureRow
  const paddingOffset = 16; // px-4 = 1rem = 16px

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 z-30 bg-primary opacity-80"
      style={{ 
        left: `${left + paddingOffset}px`,
        height: '100%'
      }}
    />
  );
}

