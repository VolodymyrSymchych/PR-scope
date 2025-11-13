'use client';

import React, { useMemo } from 'react';
import { useGantt } from './gantt-provider';
import { useScrollSync } from './gantt-timeline';
import { 
  format, 
  isToday, 
  isWeekend, 
  getWeek, 
  getQuarter, 
  startOfWeek, 
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear
} from 'date-fns';
import { cn } from '@/lib/utils';

// Memoized date cell components for better performance
const DayCell = React.memo(({ day, pixelsPerDay }: { day: Date; pixelsPerDay: number }) => {
  const isTodayDate = isToday(day);
  const isWeekendDay = isWeekend(day);

  return (
    <td
      className={cn(
        'relative px-2 group transition-all duration-200 border-r border-white/[0.08]',
        isWeekendDay && 'bg-black/[0.25]',
        isTodayDate && 'bg-primary/[0.25]'
      )}
      style={{ width: pixelsPerDay, minWidth: Math.max(pixelsPerDay, 50), verticalAlign: 'middle', textAlign: 'center' }}
    >
      <div
        className={cn(
          'flex items-center justify-center text-[13px] font-semibold transition-all duration-200 mb-0.5',
          isTodayDate ? 'text-primary scale-110' : isWeekendDay ? 'text-white/40' : 'text-white/70'
        )}
      >
        {format(day, 'd.MM')}
      </div>
      <div
        className={cn(
          'flex items-center justify-center text-[9px] font-medium uppercase tracking-wider transition-all duration-200',
          isTodayDate ? 'text-primary/90 font-bold' : 'text-white/40'
        )}
      >
        {format(day, 'EEE')}
      </div>
      {/* Purple line for today */}
      {isTodayDate && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/80"></div>
      )}
    </td>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return prevProps.day.getTime() === nextProps.day.getTime() && 
         prevProps.pixelsPerDay === nextProps.pixelsPerDay;
});
DayCell.displayName = 'DayCell';

const WeekCell = React.memo(({ week, pixelsPerWeek }: { week: Date; pixelsPerWeek: number }) => {
  const weekNumber = getWeek(week, { weekStartsOn: 1 });
  // For weeks at year boundary, use the year of the week start
  // If week number is 1 and month is December, it's the first week of next year
  const weekStart = startOfWeek(week, { weekStartsOn: 1 });
  let weekYear = weekStart.getFullYear();
  // If week number is 1 and the week start is in December, it's actually the first week of next year
  if (weekNumber === 1 && weekStart.getMonth() === 11) {
    weekYear = weekStart.getFullYear() + 1;
  }
  const currentDate = new Date();
  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const currentWeekNumber = getWeek(currentDate, { weekStartsOn: 1 });
  let currentWeekYear = currentWeekStart.getFullYear();
  if (currentWeekNumber === 1 && currentWeekStart.getMonth() === 11) {
    currentWeekYear = currentWeekStart.getFullYear() + 1;
  }
  const isCurrentWeek = weekNumber === currentWeekNumber && weekYear === currentWeekYear;

  return (
    <td
      className={cn(
        'relative px-3 group transition-all duration-200 border-r border-white/[0.08]',
        isCurrentWeek && 'bg-primary/[0.25]'
      )}
      style={{ width: pixelsPerWeek, minWidth: 120, verticalAlign: 'middle', textAlign: 'center' }}
    >
      <div
        className={cn(
          'flex items-center justify-center text-[14px] font-semibold transition-all duration-200 mb-0.5',
          isCurrentWeek ? 'text-primary scale-110' : 'text-white/70'
        )}
      >
        Week {weekNumber}
      </div>
      <div
        className={cn(
          'flex items-center justify-center text-[10px] font-medium tracking-wider transition-all duration-200',
          isCurrentWeek ? 'text-primary/90 font-bold' : 'text-white/40'
        )}
      >
        {weekYear}
      </div>
      {/* Purple line for current week */}
      {isCurrentWeek && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/80"></div>
      )}
    </td>
  );
});
WeekCell.displayName = 'WeekCell';

const MonthCell = React.memo(({ month, pixelsPerMonth }: { month: Date; pixelsPerMonth: number }) => {
  const isCurrentMonth = month.getMonth() === new Date().getMonth() &&
                         month.getFullYear() === new Date().getFullYear();

  return (
    <td
      className={cn(
        'relative px-3 group transition-all duration-200 border-r border-white/[0.08]',
        isCurrentMonth && 'bg-primary/[0.25]'
      )}
      style={{ width: pixelsPerMonth, minWidth: pixelsPerMonth, verticalAlign: 'middle', textAlign: 'center' }}
    >
      <div
        className={cn(
          'flex items-center justify-center text-[14px] font-semibold transition-all duration-200 mb-0.5',
          isCurrentMonth ? 'text-primary scale-110' : 'text-white/70'
        )}
      >
        {format(month, 'MMM')}
      </div>
      <div
        className={cn(
          'flex items-center justify-center text-[10px] font-medium tracking-wider transition-all duration-200',
          isCurrentMonth ? 'text-primary/90 font-bold' : 'text-white/40'
        )}
      >
        {format(month, 'yyyy')}
      </div>
      {/* Purple line for current month */}
      {isCurrentMonth && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/80"></div>
      )}
    </td>
  );
});
MonthCell.displayName = 'MonthCell';

const QuarterCell = React.memo(({ quarter, pixelsPerQuarter }: { quarter: Date; pixelsPerQuarter: number }) => {
  const quarterNumber = getQuarter(quarter);
  const currentQuarter = getQuarter(new Date());
  const isCurrentQuarter = quarterNumber === currentQuarter && quarter.getFullYear() === new Date().getFullYear();

  return (
    <td
      className={cn(
        'relative px-4 group transition-all duration-200 border-r border-white/[0.08]',
        isCurrentQuarter && 'bg-primary/[0.25]'
      )}
      style={{ width: pixelsPerQuarter, minWidth: pixelsPerQuarter, verticalAlign: 'middle', textAlign: 'center' }}
    >
      <div
        className={cn(
          'flex items-center justify-center text-[15px] font-semibold transition-all duration-200 mb-0.5',
          isCurrentQuarter ? 'text-primary scale-110' : 'text-white/70'
        )}
      >
        Q{quarterNumber}
      </div>
      <div
        className={cn(
          'flex items-center justify-center text-[10px] font-medium tracking-wider transition-all duration-200',
          isCurrentQuarter ? 'text-primary/90 font-bold' : 'text-white/40'
        )}
      >
        {format(quarter, 'yyyy')}
      </div>
      {/* Purple line for current quarter */}
      {isCurrentQuarter && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/80"></div>
      )}
    </td>
  );
});
QuarterCell.displayName = 'QuarterCell';

const YearCell = React.memo(({ year, pixelsPerYear }: { year: Date; pixelsPerYear: number }) => {
  const isCurrentYear = year.getFullYear() === new Date().getFullYear();

  return (
    <td
      className={cn(
        'relative px-5 group transition-all duration-200 border-r border-white/[0.08]',
        isCurrentYear && 'bg-primary/[0.25]'
      )}
      style={{ width: pixelsPerYear, minWidth: pixelsPerYear, verticalAlign: 'middle', textAlign: 'center' }}
    >
      <div
        className={cn(
          'flex items-center justify-center text-[16px] font-bold transition-all duration-200',
          isCurrentYear ? 'text-primary scale-110' : 'text-white/70'
        )}
      >
        {format(year, 'yyyy')}
      </div>
      {/* Purple line for current year */}
      {isCurrentYear && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/80"></div>
      )}
    </td>
  );
});
YearCell.displayName = 'YearCell';

export function GanttHeader() {
  const { days, weeks, months, quarters, years, pixelsPerDay, pixelsPerWeek, pixelsPerMonth, pixelsPerQuarter, pixelsPerYear, viewMode, firstDate } = useGantt();
  const { headerScrollRef } = useScrollSync();

  // Dates are calculated for current range (starts with ±2 years, expands on scroll)
  // Use all dates directly from the arrays
  const filteredDates = useMemo(() => {
    return {
      filteredDays: days,
      filteredWeeks: weeks,
      filteredMonths: months,
      filteredQuarters: quarters,
      filteredYears: years,
    };
  }, [days, weeks, months, quarters, years]);

  // Calculate total width to match feature rows exactly
  const totalWidth = useMemo(() => {
    switch (viewMode) {
      case 'days':
        return filteredDates.filteredDays.length * pixelsPerDay;
      case 'weeks':
        return filteredDates.filteredWeeks.length * pixelsPerWeek;
      case 'months':
        return filteredDates.filteredMonths.length * pixelsPerMonth;
      case 'quarters':
        return filteredDates.filteredQuarters.length * pixelsPerQuarter;
      case 'years':
        return filteredDates.filteredYears.length * pixelsPerYear;
      default:
        return filteredDates.filteredDays.length * pixelsPerDay;
    }
  }, [viewMode, filteredDates, pixelsPerDay, pixelsPerWeek, pixelsPerMonth, pixelsPerQuarter, pixelsPerYear]);

  return (
    <div
      ref={headerScrollRef}
      className="sticky top-0 z-20 backdrop-blur-xl bg-black/[0.30] border-b border-white/[0.15] overflow-x-auto overflow-y-hidden scrollbar-hide"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        width: '100%',
        maxWidth: '100%',
        height: '63px',
      }}
    >
      <div className="px-4 h-full flex items-center">
        <table
          className="border-collapse h-full"
          style={{
            width: `${totalWidth}px`,
            minWidth: `${totalWidth}px`,
            tableLayout: 'fixed',
          }}
        >
          <colgroup>
            {viewMode === 'days' && filteredDates.filteredDays.map((day) => (
              <col key={day.toISOString()} style={{ width: `${pixelsPerDay}px` }} />
            ))}
            {viewMode === 'weeks' && filteredDates.filteredWeeks.map((week) => (
              <col key={week.toISOString()} style={{ width: `${pixelsPerWeek}px` }} />
            ))}
            {viewMode === 'months' && filteredDates.filteredMonths.map((month) => (
              <col key={month.toISOString()} style={{ width: `${pixelsPerMonth}px` }} />
            ))}
            {viewMode === 'quarters' && filteredDates.filteredQuarters.map((quarter) => (
              <col key={quarter.toISOString()} style={{ width: `${pixelsPerQuarter}px` }} />
            ))}
            {viewMode === 'years' && filteredDates.filteredYears.map((year) => (
              <col key={year.toISOString()} style={{ width: `${pixelsPerYear}px` }} />
            ))}
          </colgroup>
          <tbody>
            <tr style={{ height: '100%' }}>
            {viewMode === 'days' && filteredDates.filteredDays.map((day) => (
              <DayCell key={day.toISOString()} day={day} pixelsPerDay={pixelsPerDay} />
            ))}

            {viewMode === 'weeks' && filteredDates.filteredWeeks.map((week) => (
              <WeekCell key={week.toISOString()} week={week} pixelsPerWeek={pixelsPerWeek} />
            ))}

            {viewMode === 'months' && filteredDates.filteredMonths.map((month) => (
              <MonthCell key={month.toISOString()} month={month} pixelsPerMonth={pixelsPerMonth} />
            ))}

            {viewMode === 'quarters' && filteredDates.filteredQuarters.map((quarter) => (
              <QuarterCell key={quarter.toISOString()} quarter={quarter} pixelsPerQuarter={pixelsPerQuarter} />
            ))}

            {viewMode === 'years' && filteredDates.filteredYears.map((year) => (
              <YearCell key={year.toISOString()} year={year} pixelsPerYear={pixelsPerYear} />
            ))}
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  );
}

