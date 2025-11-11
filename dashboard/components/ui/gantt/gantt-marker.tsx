'use client';

import React from 'react';
import { useGantt } from './gantt-provider';
import { differenceInDays, differenceInWeeks, differenceInMonths, differenceInQuarters, differenceInYears, isToday, startOfWeek, endOfWeek } from 'date-fns';
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
  
  // Calculate left position based on view mode - use firstDate for synchronization
  const left = React.useMemo(() => {
    switch (viewMode) {
      case 'days': {
        const index = days.findIndex(d => d.getTime() === today.getTime());
        return index >= 0 ? index * pixelsPerDay : differenceInDays(today, firstDate) * pixelsPerDay;
      }
      case 'weeks': {
        const index = weeks.findIndex(d => {
          // Check if today is within this week
          const weekStart = startOfWeek(d, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(d, { weekStartsOn: 1 });
          return today >= weekStart && today <= weekEnd;
        });
        return index >= 0 ? index * pixelsPerWeek : differenceInWeeks(today, firstDate) * pixelsPerWeek;
      }
      case 'months': {
        const index = findDateIndex(today, months, 'months');
        return index >= 0 ? index * pixelsPerMonth : differenceInMonths(today, firstDate) * pixelsPerMonth;
      }
      case 'quarters': {
        const index = findDateIndex(today, quarters, 'quarters');
        return index >= 0 ? index * pixelsPerQuarter : differenceInQuarters(today, firstDate) * pixelsPerQuarter;
      }
      case 'years': {
        const index = findDateIndex(today, years, 'years');
        return index >= 0 ? index * pixelsPerYear : differenceInYears(today, firstDate) * pixelsPerYear;
      }
      default:
        return differenceInDays(today, firstDate) * pixelsPerDay;
    }
  }, [today, firstDate, viewMode, pixelsPerDay, pixelsPerWeek, pixelsPerMonth, pixelsPerQuarter, pixelsPerYear, days, weeks, months, quarters, years]);

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 z-30 bg-primary opacity-80"
      style={{ left: `${left}px` }}
    />
  );
}

