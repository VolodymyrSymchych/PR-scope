'use client';

import React, { useMemo } from 'react';
import { useGantt } from './gantt-provider';
import { useScrollSync } from './gantt-timeline';
import { format, isToday, isWeekend, getWeek, getQuarter } from 'date-fns';
import { cn } from '@/lib/utils';

// Memoized date cell components for better performance
const DayCell = React.memo(({ day, pixelsPerDay }: { day: Date; pixelsPerDay: number }) => {
  const isTodayDate = isToday(day);
  const isWeekendDay = isWeekend(day);

  return (
    <div
      className={cn(
        'flex flex-col justify-center border-r border-white/[0.12] px-2 group transition-all duration-200',
        isWeekendDay && 'bg-black/[0.25]',
        isTodayDate && 'bg-primary/[0.25]'
      )}
      style={{ width: pixelsPerDay }}
    >
      <div
        className={cn(
          'flex items-center justify-center text-[12px] font-semibold transition-all duration-200 mb-0.5',
          isTodayDate ? 'text-primary scale-110' : isWeekendDay ? 'text-white/40' : 'text-white/60'
        )}
      >
        {format(day, 'd.MM')}
      </div>
      <div
        className={cn(
          'flex items-center justify-center text-[9px] font-medium uppercase tracking-wider transition-all duration-200',
          isTodayDate ? 'text-primary/90 font-bold' : 'text-white/35'
        )}
      >
        {format(day, 'EEE')}
      </div>
      {isTodayDate && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/80"></div>
      )}
    </div>
  );
});
DayCell.displayName = 'DayCell';

const WeekCell = React.memo(({ week, pixelsPerWeek }: { week: Date; pixelsPerWeek: number }) => {
  const weekNumber = getWeek(week);
  const currentWeek = getWeek(new Date());
  const isCurrentWeek = weekNumber === currentWeek && week.getFullYear() === new Date().getFullYear();

  return (
    <div
      className={cn(
        'flex flex-col justify-center border-r border-white/[0.12] px-3 group transition-all duration-200',
        isCurrentWeek && 'bg-primary/[0.25]'
      )}
      style={{ width: pixelsPerWeek, minWidth: 100 }}
    >
      <div
        className={cn(
          'flex items-center justify-center text-[13px] font-semibold transition-all duration-200 mb-0.5',
          isCurrentWeek ? 'text-primary scale-110' : 'text-white/60'
        )}
      >
        Week {weekNumber}
      </div>
      <div
        className={cn(
          'flex items-center justify-center text-[10px] font-medium tracking-wider transition-all duration-200',
          isCurrentWeek ? 'text-primary/90 font-bold' : 'text-white/35'
        )}
      >
        {format(week, 'yyyy')}
      </div>
      {isCurrentWeek && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/80"></div>
      )}
    </div>
  );
});
WeekCell.displayName = 'WeekCell';

const MonthCell = React.memo(({ month, pixelsPerMonth }: { month: Date; pixelsPerMonth: number }) => {
  const isCurrentMonth = month.getMonth() === new Date().getMonth() &&
                         month.getFullYear() === new Date().getFullYear();

  return (
    <div
      className={cn(
        'flex flex-col justify-center border-r border-white/[0.12] px-3 group transition-all duration-200',
        isCurrentMonth && 'bg-primary/[0.25]'
      )}
      style={{ width: pixelsPerMonth }}
    >
      <div
        className={cn(
          'flex items-center justify-center text-[13px] font-semibold transition-all duration-200 mb-0.5',
          isCurrentMonth ? 'text-primary scale-110' : 'text-white/60'
        )}
      >
        {format(month, 'MMM')}
      </div>
      <div
        className={cn(
          'flex items-center justify-center text-[10px] font-medium tracking-wider transition-all duration-200',
          isCurrentMonth ? 'text-primary/90 font-bold' : 'text-white/35'
        )}
      >
        {format(month, 'yyyy')}
      </div>
      {isCurrentMonth && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/80"></div>
      )}
    </div>
  );
});
MonthCell.displayName = 'MonthCell';

const QuarterCell = React.memo(({ quarter, pixelsPerQuarter }: { quarter: Date; pixelsPerQuarter: number }) => {
  const quarterNumber = getQuarter(quarter);
  const currentQuarter = getQuarter(new Date());
  const isCurrentQuarter = quarterNumber === currentQuarter && quarter.getFullYear() === new Date().getFullYear();

  return (
    <div
      className={cn(
        'flex flex-col justify-center border-r border-white/[0.12] px-4 group transition-all duration-200',
        isCurrentQuarter && 'bg-primary/[0.25]'
      )}
      style={{ width: pixelsPerQuarter }}
    >
      <div
        className={cn(
          'flex items-center justify-center text-[14px] font-semibold transition-all duration-200 mb-0.5',
          isCurrentQuarter ? 'text-primary scale-110' : 'text-white/60'
        )}
      >
        Q{quarterNumber}
      </div>
      <div
        className={cn(
          'flex items-center justify-center text-[10px] font-medium tracking-wider transition-all duration-200',
          isCurrentQuarter ? 'text-primary/90 font-bold' : 'text-white/35'
        )}
      >
        {format(quarter, 'yyyy')}
      </div>
      {isCurrentQuarter && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/80"></div>
      )}
    </div>
  );
});
QuarterCell.displayName = 'QuarterCell';

const YearCell = React.memo(({ year, pixelsPerYear }: { year: Date; pixelsPerYear: number }) => {
  const isCurrentYear = year.getFullYear() === new Date().getFullYear();

  return (
    <div
      className={cn(
        'flex flex-col justify-center border-r border-white/[0.12] px-5 group transition-all duration-200',
        isCurrentYear && 'bg-primary/[0.25]'
      )}
      style={{ width: pixelsPerYear }}
    >
      <div
        className={cn(
          'flex items-center justify-center text-[16px] font-bold transition-all duration-200',
          isCurrentYear ? 'text-primary scale-110' : 'text-white/60'
        )}
      >
        {format(year, 'yyyy')}
      </div>
      {isCurrentYear && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/80"></div>
      )}
    </div>
  );
});
YearCell.displayName = 'YearCell';

export function GanttHeader() {
  const { days, weeks, months, quarters, years, pixelsPerDay, pixelsPerWeek, pixelsPerMonth, pixelsPerQuarter, pixelsPerYear, viewMode } = useGantt();
  const { headerScrollRef } = useScrollSync();

  // Calculate total width to match feature rows exactly
  const totalWidth = useMemo(() => {
    switch (viewMode) {
      case 'days':
        return days.length * pixelsPerDay;
      case 'weeks':
        return weeks.length * pixelsPerWeek;
      case 'months':
        return months.length * pixelsPerMonth;
      case 'quarters':
        return quarters.length * pixelsPerQuarter;
      case 'years':
        return years.length * pixelsPerYear;
      default:
        return days.length * pixelsPerDay;
    }
  }, [viewMode, days, weeks, months, quarters, years, pixelsPerDay, pixelsPerWeek, pixelsPerMonth, pixelsPerQuarter, pixelsPerYear]);

  return (
    <div
      ref={headerScrollRef}
      className="sticky top-0 z-20 backdrop-blur-xl bg-black/[0.35] border-b border-white/[0.15] overflow-x-auto overflow-y-hidden scrollbar-hide"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <div className="flex h-16" style={{ width: `${totalWidth}px`, minWidth: `${totalWidth}px` }}>
        {viewMode === 'days' && days.map((day) => (
          <DayCell key={day.toISOString()} day={day} pixelsPerDay={pixelsPerDay} />
        ))}

        {viewMode === 'weeks' && weeks.map((week) => (
          <WeekCell key={week.toISOString()} week={week} pixelsPerWeek={pixelsPerWeek} />
        ))}

        {viewMode === 'months' && months.map((month) => (
          <MonthCell key={month.toISOString()} month={month} pixelsPerMonth={pixelsPerMonth} />
        ))}

        {viewMode === 'quarters' && quarters.map((quarter) => (
          <QuarterCell key={quarter.toISOString()} quarter={quarter} pixelsPerQuarter={pixelsPerQuarter} />
        ))}

        {viewMode === 'years' && years.map((year) => (
          <YearCell key={year.toISOString()} year={year} pixelsPerYear={pixelsPerYear} />
        ))}
      </div>
    </div>
  );
}

