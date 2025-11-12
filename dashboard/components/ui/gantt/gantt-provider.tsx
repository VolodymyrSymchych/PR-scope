'use client';

import React, { createContext, useContext, useState, useMemo, useRef, ReactNode, useCallback, useEffect } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, eachWeekOfInterval, eachYearOfInterval, eachQuarterOfInterval, addDays, addMonths, addWeeks, addQuarters, addYears, startOfWeek, endOfWeek, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from 'date-fns';

export interface GanttFeature {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  status?: {
    id: string;
    name: string;
    color: string;
  };
  lane?: string;
  metadata?: Record<string, any>;
  parentId?: string;
  children?: GanttFeature[];
  assignee?: string;
  workedHours?: number;
}

export interface GanttMarker {
  id: string;
  date: Date;
  label: string;
  className?: string;
}

interface GanttContextValue {
  range: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  zoom: number;
  startDate: Date;
  endDate: Date;
  baseStartDate: Date;
  baseEndDate: Date;
  days: Date[];
  weeks: Date[];
  months: Date[];
  quarters: Date[];
  years: Date[];
  pixelsPerDay: number;
  pixelsPerWeek: number;
  pixelsPerMonth: number;
  pixelsPerQuarter: number;
  pixelsPerYear: number;
  viewMode: 'days' | 'weeks' | 'months' | 'quarters' | 'years';
  onAddItem?: (date: Date) => void;
  onMoveItem?: (id: string, startAt: Date, endAt: Date | null) => void;
  extendRange?: (direction: 'left' | 'right', amount: number) => void;
  firstDate: Date; // First date in the arrays (always baseStartDate)
  isExtendingRange: boolean; // Loading indicator when extending range
  dateRangeStart: Date; // Current visible range start
  dateRangeEnd: Date; // Current visible range end
  collapsedTasks: Set<string>; // Set of collapsed parent task IDs
  toggleCollapsed: (taskId: string) => void;
}

const GanttContext = createContext<GanttContextValue | undefined>(undefined);

export function useGantt() {
  const context = useContext(GanttContext);
  if (!context) {
    throw new Error('useGantt must be used within GanttProvider');
  }
  return context;
}

interface GanttProviderProps {
  children: ReactNode;
  className?: string;
  range?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  zoom?: number;
  onAddItem?: (date: Date) => void;
  onMoveItem?: (id: string, startAt: Date, endAt: Date | null) => void;
  features?: GanttFeature[];
}

export function GanttProvider({
  children,
  className = '',
  range = 'monthly',
  zoom = 100,
  onAddItem,
  onMoveItem,
  features = [],
}: GanttProviderProps) {
  // Base dates for fixed range (2000-2040)
  const baseStartYear = 2000;
  const baseEndYear = 2040;
  const baseStartDate = useMemo(() => new Date(baseStartYear, 0, 1), []);
  const baseEndDate = useMemo(() => new Date(baseEndYear, 11, 31), []);
  
  // Current date for initial range calculation
  const currentDate = useMemo(() => new Date(), []);

  // Calculate initial range based on view mode to avoid generating unnecessary dates
  const getInitialRange = useCallback((viewRange: typeof range) => {
    switch (viewRange) {
      case 'daily':
        return {
          start: addDays(currentDate, -30), // ±1 month
          end: addDays(currentDate, 30)
        };
      case 'weekly':
        return {
          start: startOfWeek(addWeeks(currentDate, -52), { weekStartsOn: 1 }), // ±1 year
          end: endOfWeek(addWeeks(currentDate, 52), { weekStartsOn: 1 })
        };
      case 'monthly':
        return {
          start: startOfMonth(addMonths(currentDate, -24)), // ±2 years
          end: endOfMonth(addMonths(currentDate, 24))
        };
      case 'quarterly':
        return {
          start: startOfQuarter(addQuarters(currentDate, -12)), // ±3 years
          end: endOfQuarter(addQuarters(currentDate, 12))
        };
      case 'yearly':
        return {
          start: startOfYear(addYears(currentDate, -5)), // ±5 years
          end: endOfYear(addYears(currentDate, 5))
        };
      default:
        // Fallback: ±2 years
        return {
          start: startOfYear(addYears(currentDate, -2)),
          end: endOfYear(addYears(currentDate, 2))
        };
    }
  }, [currentDate]);

  // State for current date range (initialized based on view mode)
  const [dateRangeStart, setDateRangeStart] = useState(() => {
    const { start } = getInitialRange(range);
    return start < baseStartDate ? baseStartDate : start;
  });

  const [dateRangeEnd, setDateRangeEnd] = useState(() => {
    const { end } = getInitialRange(range);
    return end > baseEndDate ? baseEndDate : end;
  });
  
  // Cache for calculated dates - key: `${viewMode}-${startTime}-${endTime}`
  // Use larger cache size for better performance
  const datesCacheRef = useRef<Map<string, Date[]>>(new Map());
  
  // Pre-calculate common ranges on mount for instant switching
  useEffect(() => {
    const currentDate = new Date();
    const commonRanges = [
      // Days: ±1 month
      { mode: 'days', start: addDays(currentDate, -30), end: addDays(currentDate, 30) },
      // Weeks: ±1 year
      { mode: 'weeks', start: startOfWeek(addWeeks(currentDate, -52), { weekStartsOn: 1 }), end: endOfWeek(addWeeks(currentDate, 52), { weekStartsOn: 1 }) },
      // Months: ±2 years
      { mode: 'months', start: startOfMonth(addMonths(currentDate, -24)), end: endOfMonth(addMonths(currentDate, 24)) },
      // Quarters: ±3 years
      { mode: 'quarters', start: startOfQuarter(addQuarters(currentDate, -12)), end: endOfQuarter(addQuarters(currentDate, 12)) },
      // Years: ±5 years
      { mode: 'years', start: startOfYear(addYears(currentDate, -5)), end: endOfYear(addYears(currentDate, 5)) },
    ];
    
    // Pre-calculate in background using requestIdleCallback
    const precalculateDates = () => {
      commonRanges.forEach(({ mode, start, end }) => {
        const cacheKey = `${mode}-${start.getTime()}-${end.getTime()}`;
        if (!datesCacheRef.current.has(cacheKey)) {
          let dates: Date[];
          switch (mode) {
            case 'days':
              dates = eachDayOfInterval({ start, end });
              break;
            case 'weeks':
              dates = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
              break;
            case 'months':
              dates = eachMonthOfInterval({ start, end });
              break;
            case 'quarters':
              dates = eachQuarterOfInterval({ start, end });
              break;
            case 'years':
              dates = eachYearOfInterval({ start, end });
              break;
            default:
              dates = [];
          }
          datesCacheRef.current.set(cacheKey, dates);
        }
      });
    };
    
    // Use requestIdleCallback if available, otherwise setTimeout
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(precalculateDates, { timeout: 2000 });
    } else {
      setTimeout(precalculateDates, 100);
    }
  }, []);
  
  // Reset range when view mode changes - ensure current date is included
  useEffect(() => {
    const { start: newStart, end: newEnd } = getInitialRange(range);

    const clampedStart = newStart < baseStartDate ? baseStartDate : newStart;
    const clampedEnd = newEnd > baseEndDate ? baseEndDate : newEnd;

    setDateRangeStart(clampedStart);
    setDateRangeEnd(clampedEnd);
  }, [range, getInitialRange, baseStartDate, baseEndDate]);
  
  // Determine view mode based on range
  const viewMode = useMemo(() => {
    switch (range) {
      case 'weekly':
        return 'weeks' as const;
      case 'monthly':
        return 'months' as const;
      case 'quarterly':
        return 'quarters' as const;
      case 'yearly':
        return 'years' as const;
      default:
        return 'days' as const;
    }
  }, [range]);
  
  // Calculate dates ONLY for the current view mode and current range
  // Use cache to avoid recalculating same ranges
  const allDates = useMemo(() => {
    const start = dateRangeStart;
    const end = dateRangeEnd;
    
    // Create cache key
    const cacheKey = `${viewMode}-${start.getTime()}-${end.getTime()}`;
    
    // Check cache first
    const cached = datesCacheRef.current.get(cacheKey);
    if (cached) {
      // Return cached data
      switch (viewMode) {
        case 'days':
          return { days: cached, weeks: [], months: [], quarters: [], years: [] };
        case 'weeks':
          return { days: [], weeks: cached, months: [], quarters: [], years: [] };
        case 'months':
          return { days: [], weeks: [], months: cached, quarters: [], years: [] };
        case 'quarters':
          return { days: [], weeks: [], months: [], quarters: cached, years: [] };
        case 'years':
          return { days: [], weeks: [], months: [], quarters: [], years: cached };
        default:
          return { days: [], weeks: [], months: [], quarters: [], years: [] };
      }
    }
    
    // Calculate dates for the current view mode
    let calculatedDates: Date[];
    switch (viewMode) {
      case 'days':
        calculatedDates = eachDayOfInterval({ start, end });
        break;
      case 'weeks':
        calculatedDates = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
        break;
      case 'months':
        calculatedDates = eachMonthOfInterval({ start, end });
        break;
      case 'quarters':
        calculatedDates = eachQuarterOfInterval({ start, end });
        break;
      case 'years':
        calculatedDates = eachYearOfInterval({ start, end });
        break;
      default:
        calculatedDates = [];
    }
    
    // Store in cache (limit cache size to prevent memory issues - increased to 100)
    if (datesCacheRef.current.size > 100) {
      // Remove oldest entries (first 20)
      const keysToDelete = Array.from(datesCacheRef.current.keys()).slice(0, 20);
      keysToDelete.forEach(key => datesCacheRef.current.delete(key));
    }
    datesCacheRef.current.set(cacheKey, calculatedDates);
    
    // Return calculated data
    switch (viewMode) {
      case 'days':
        return { days: calculatedDates, weeks: [], months: [], quarters: [], years: [] };
      case 'weeks':
        return { days: [], weeks: calculatedDates, months: [], quarters: [], years: [] };
      case 'months':
        return { days: [], weeks: [], months: calculatedDates, quarters: [], years: [] };
      case 'quarters':
        return { days: [], weeks: [], months: [], quarters: calculatedDates, years: [] };
      case 'years':
        return { days: [], weeks: [], months: [], quarters: [], years: calculatedDates };
      default:
        return { days: [], weeks: [], months: [], quarters: [], years: [] };
    }
  }, [dateRangeStart, dateRangeEnd, viewMode]);
  
  // State for loading indicator when extending range
  const [isExtendingRange, setIsExtendingRange] = useState(false);
  
  // Extend range function - called when scrolling near edges
  // Optimized: batch state updates for better performance
  const extendRange = useCallback((direction: 'left' | 'right', amount: number) => {
    setIsExtendingRange(true);
    
    // Batch state updates for better performance
    requestAnimationFrame(() => {
      setDateRangeStart(prev => {
        if (direction === 'left') {
          const newStart = (() => {
            switch (viewMode) {
              case 'days':
                return addDays(prev, -amount);
              case 'weeks':
                return startOfWeek(addWeeks(prev, -amount), { weekStartsOn: 1 });
              case 'months':
                return startOfMonth(addMonths(prev, -amount));
              case 'quarters':
                return startOfQuarter(addQuarters(prev, -amount));
              case 'years':
                return startOfYear(addYears(prev, -amount));
              default:
                return addDays(prev, -amount);
            }
          })();
          return newStart < baseStartDate ? baseStartDate : newStart;
        }
        return prev;
      });
      
      setDateRangeEnd(prev => {
        if (direction === 'right') {
          const newEnd = (() => {
            switch (viewMode) {
              case 'days':
                return addDays(prev, amount);
              case 'weeks':
                return endOfWeek(addWeeks(prev, amount), { weekStartsOn: 1 });
              case 'months':
                return endOfMonth(addMonths(prev, amount));
              case 'quarters':
                return endOfQuarter(addQuarters(prev, amount));
              case 'years':
                return endOfYear(addYears(prev, amount));
              default:
                return addDays(prev, amount);
            }
          })();
          return newEnd > baseEndDate ? baseEndDate : newEnd;
        }
        return prev;
      });
      
      // Reset loading indicator faster for better UX
      setTimeout(() => setIsExtendingRange(false), 150);
    });
  }, [viewMode, baseStartDate, baseEndDate]);
  
  // Get the appropriate date array based on view mode
  const { days, weeks, months, quarters, years } = allDates;
  
  // First date is the actual first date in the arrays (dateRangeStart)
  // But for position calculations, we still use baseStartDate as reference
  const firstDate = (() => {
    switch (viewMode) {
      case 'days':
        return days.length > 0 ? days[0] : baseStartDate;
      case 'weeks':
        return weeks.length > 0 ? weeks[0] : baseStartDate;
      case 'months':
        return months.length > 0 ? months[0] : baseStartDate;
      case 'quarters':
        return quarters.length > 0 ? quarters[0] : baseStartDate;
      case 'years':
        return years.length > 0 ? years[0] : baseStartDate;
      default:
        return baseStartDate;
    }
  })();

  // Use baseStartDate as startDate for position calculations
  const startDate = baseStartDate;
  const endDate = baseEndDate;

  const pixelsPerDay = (zoom / 100) * 40;
  const pixelsPerWeek = (zoom / 100) * 100;
  const pixelsPerMonth = (zoom / 100) * 120;
  const pixelsPerQuarter = (zoom / 100) * 180;
  const pixelsPerYear = (zoom / 100) * 180; // Reduced from 240 to 180 for better fit on screen

  // Collapse/expand state for parent tasks
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set());

  const toggleCollapsed = useCallback((taskId: string) => {
    setCollapsedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  return (
    <GanttContext.Provider
      value={{
        range,
        zoom,
        startDate,
        endDate,
        baseStartDate,
        baseEndDate,
        days,
        weeks,
        months,
        quarters,
        years,
        pixelsPerDay,
        pixelsPerWeek,
        pixelsPerMonth,
        pixelsPerQuarter,
        pixelsPerYear,
        viewMode,
        onAddItem,
        onMoveItem,
        extendRange,
        firstDate,
        isExtendingRange,
        dateRangeStart,
        dateRangeEnd,
        collapsedTasks,
        toggleCollapsed,
      }}
    >
      <div className={`flex h-full w-full min-h-0 min-w-0 ${className}`}>{children}</div>
    </GanttContext.Provider>
  );
}

