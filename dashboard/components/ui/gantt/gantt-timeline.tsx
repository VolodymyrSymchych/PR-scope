'use client';

import React, { ReactNode, useRef, useEffect, createContext, useContext, useState } from 'react';
import { useGantt } from './gantt-provider';
import { cn } from '@/lib/utils';
import { differenceInDays, startOfWeek, endOfWeek } from 'date-fns';

interface ScrollSyncContextValue {
  headerScrollRef: React.RefObject<HTMLDivElement> | null;
  contentScrollRef: React.RefObject<HTMLDivElement> | null;
}

const ScrollSyncContext = createContext<ScrollSyncContextValue>({
  headerScrollRef: null,
  contentScrollRef: null,
});

export function useScrollSync() {
  return useContext(ScrollSyncContext);
}

interface GanttTimelineProps {
  children: ReactNode;
  className?: string;
}

export function GanttTimeline({ children, className }: GanttTimelineProps) {
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  return (
    <ScrollSyncContext.Provider value={{ headerScrollRef, contentScrollRef }}>
      <div className={cn('flex-1 flex flex-col bg-transparent min-w-0 min-h-0', className)}>
        {children}
      </div>
    </ScrollSyncContext.Provider>
  );
}

interface GanttFeatureListProps {
  children: ReactNode;
  className?: string;
}

export function GanttFeatureList({ children, className }: GanttFeatureListProps) {
  const { headerScrollRef, contentScrollRef } = useScrollSync();
  const { extendRange, pixelsPerDay, pixelsPerWeek, pixelsPerMonth, pixelsPerQuarter, pixelsPerYear, viewMode, firstDate, baseStartDate, baseEndDate, days, weeks, months, quarters, years } = useGantt();
  const rangeRef = useRef(viewMode);
  const [showLeftButton, setShowLeftButton] = React.useState(false);
  const [showRightButton, setShowRightButton] = React.useState(false);

  // Update range ref when view mode changes (no auto-scroll to current date)
  useEffect(() => {
    rangeRef.current = viewMode;
  }, [viewMode]);

  // Scroll to current date when window is resized
  useEffect(() => {
    const scrollToCurrentDate = () => {
      const contentEl = contentScrollRef?.current;
      const headerEl = headerScrollRef?.current;
      if (!contentEl || !headerEl) return;

      const currentDate = new Date();

      const findDateIndex = (targetDate: Date, dateArray: Date[], mode: string): number => {
        if (dateArray.length === 0) return -1;
        
        switch (mode) {
          case 'days':
            return dateArray.findIndex(d => {
              return d.getFullYear() === targetDate.getFullYear() &&
                     d.getMonth() === targetDate.getMonth() &&
                     d.getDate() === targetDate.getDate();
            });
          case 'weeks': {
            // Find week that contains the target date
            // Use Monday as week start (consistent with provider)
            const targetWeekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
            return dateArray.findIndex(d => {
              const weekStart = startOfWeek(d, { weekStartsOn: 1 });
              return weekStart.getTime() === targetWeekStart.getTime();
            });
          }
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

      let currentDateIndex = -1;
      let dateArray: Date[] = [];

      // Find current date index in appropriate array
      switch (viewMode) {
        case 'days':
          if (days.length === 0) return;
          currentDateIndex = findDateIndex(currentDate, days, 'days');
          dateArray = days;
          break;
        case 'weeks':
          if (weeks.length === 0) return;
          currentDateIndex = findDateIndex(currentDate, weeks, 'weeks');
          dateArray = weeks;
          break;
        case 'months':
          if (months.length === 0) return;
          currentDateIndex = findDateIndex(currentDate, months, 'months');
          dateArray = months;
          break;
        case 'quarters':
          if (quarters.length === 0) return;
          currentDateIndex = findDateIndex(currentDate, quarters, 'quarters');
          dateArray = quarters;
          break;
        case 'years':
          if (years.length === 0) return;
          currentDateIndex = findDateIndex(currentDate, years, 'years');
          dateArray = years;
          break;
        default:
          return;
      }

      if (currentDateIndex >= 0 && dateArray.length > 0 && firstDate) {
        // Calculate position relative to firstDate (start of visible range)
        // Tasks are positioned using array indices, so index 0 = firstDate
        // Therefore currentDateIndex is the position in the array
        let pixelsPerUnit = 0;
        switch (viewMode) {
          case 'days':
            pixelsPerUnit = pixelsPerDay;
            break;
          case 'weeks':
            pixelsPerUnit = pixelsPerWeek;
            break;
          case 'months':
            pixelsPerUnit = pixelsPerMonth;
            break;
          case 'quarters':
            pixelsPerUnit = pixelsPerQuarter;
            break;
          case 'years':
            pixelsPerUnit = pixelsPerYear;
            break;
        }

        // Position = index in array * pixels per unit
        // This matches how tasks are positioned in gantt-feature-row.tsx
        const positionFromFirstDate = currentDateIndex * pixelsPerUnit;

        const clientWidth = contentEl.clientWidth;

        // Center the current date in the viewport
        const scrollPosition = positionFromFirstDate - clientWidth / 2;
        const maxScroll = Math.max(0, contentEl.scrollWidth - clientWidth);
        const finalScrollPosition = Math.max(0, Math.min(scrollPosition, maxScroll));

        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (contentEl && headerEl && contentEl.scrollWidth > 0) {
              contentEl.scrollTo({ left: finalScrollPosition, behavior: 'smooth' });
              headerEl.scrollTo({ left: finalScrollPosition, behavior: 'smooth' });
            }
          });
        });
      } else if (currentDateIndex < 0 && dateArray.length > 0) {
        // If current date not found, try again after a short delay
        setTimeout(() => {
          scrollToCurrentDate();
        }, 200);
      }
    };

    // Scroll to current date on view mode change or initial load
    const timeoutId = setTimeout(() => {
      scrollToCurrentDate();
    }, 800); // Increased delay to ensure dates are fully loaded and rendered

    let resizeTimeoutId: NodeJS.Timeout | null = null;
    const handleResize = () => {
      // Debounce resize to avoid too many scroll calculations
      if (resizeTimeoutId) clearTimeout(resizeTimeoutId);
      resizeTimeoutId = setTimeout(() => {
        scrollToCurrentDate();
      }, 300);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutId) clearTimeout(resizeTimeoutId);
    };
  }, [viewMode, firstDate, days, weeks, months, quarters, years, pixelsPerDay, pixelsPerWeek, pixelsPerMonth, pixelsPerQuarter, pixelsPerYear, contentScrollRef, headerScrollRef]);

  // Handle manual extension via button click
  const handleExtendLeft = () => {
    if (!extendRange) return;
    
    const contentEl = contentScrollRef?.current;
    const headerEl = headerScrollRef?.current;
    if (!contentEl || !headerEl) return;
    
    // Store current scroll position before extension
    const currentScrollLeft = contentEl.scrollLeft;
    
    // Calculate extend amount based on view mode
    let extendAmount: number;
    let addedPixels: number;
    switch (viewMode) {
      case 'days':
        extendAmount = 30; // 1 month
        addedPixels = extendAmount * pixelsPerDay;
        break;
      case 'weeks':
        extendAmount = 52; // 1 year
        addedPixels = extendAmount * pixelsPerWeek;
        break;
      case 'months':
        extendAmount = 24; // 2 years
        addedPixels = extendAmount * pixelsPerMonth;
        break;
      case 'quarters':
        extendAmount = 12; // 3 years
        addedPixels = extendAmount * pixelsPerQuarter;
        break;
      case 'years':
        extendAmount = 5; // 5 years
        addedPixels = extendAmount * pixelsPerYear;
        break;
      default:
        extendAmount = 30;
        addedPixels = extendAmount * pixelsPerDay;
    }
    
    extendRange('left', extendAmount);
    
    // Restore scroll position after extension (maintain visual position)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (contentEl && headerEl) {
          // Adjust scroll position to maintain visual position
          contentEl.scrollLeft = currentScrollLeft + addedPixels;
          headerEl.scrollLeft = contentEl.scrollLeft;
        }
      });
    });
  };

  const handleExtendRight = () => {
    if (!extendRange) return;
    
    // Calculate extend amount based on view mode
    let extendAmount: number;
    switch (viewMode) {
      case 'days':
        extendAmount = 30; // 1 month
        break;
      case 'weeks':
        extendAmount = 52; // 1 year
        break;
      case 'months':
        extendAmount = 24; // 2 years
        break;
      case 'quarters':
        extendAmount = 12; // 3 years
        break;
      case 'years':
        extendAmount = 5; // 5 years
        break;
      default:
        extendAmount = 30;
    }
    
    extendRange('right', extendAmount);
  };

  useEffect(() => {
    const contentEl = contentScrollRef?.current;
    const headerEl = headerScrollRef?.current;

    if (!contentEl || !headerEl) return;

    let ticking = false;
    let headerTicking = false;
    let isSyncing = false; // Prevent infinite loop

    // Handle header scroll - sync to content
    const handleHeaderScroll = () => {
      if (isSyncing) return; // Prevent infinite loop
      
      if (!headerTicking) {
        requestAnimationFrame(() => {
          // Sync content scroll to header scroll
          isSyncing = true;
          contentEl.scrollLeft = headerEl.scrollLeft;
          isSyncing = false;
          headerTicking = false;
        });
        headerTicking = true;
      }
    };

    const handleContentScroll = () => {
      if (isSyncing) return; // Prevent infinite loop
      
      if (!ticking) {
        requestAnimationFrame(() => {
          // Sync header scroll - this is fast and should happen every frame
          isSyncing = true;
          headerEl.scrollLeft = contentEl.scrollLeft;
          isSyncing = false;
          
          // Update extension button visibility based on scroll position
          const scrollLeft = contentEl.scrollLeft;
          const scrollWidth = contentEl.scrollWidth;
          const clientWidth = contentEl.clientWidth;
          const threshold = clientWidth * 0.2; // Show button when within 20% of edge
          
          setShowLeftButton(scrollLeft < threshold);
          setShowRightButton(scrollWidth - scrollLeft - clientWidth < threshold);
          
          ticking = false;
        });
        
        ticking = true;
      }
    };

    // Use passive listener for better performance
    contentEl.addEventListener('scroll', handleContentScroll, { passive: true });
    headerEl.addEventListener('scroll', handleHeaderScroll, { passive: true });

    return () => {
      contentEl.removeEventListener('scroll', handleContentScroll);
      headerEl.removeEventListener('scroll', handleHeaderScroll);
    };
  }, [headerScrollRef, contentScrollRef, extendRange, viewMode, pixelsPerDay, pixelsPerWeek, pixelsPerMonth, pixelsPerQuarter, pixelsPerYear, setShowLeftButton, setShowRightButton]);


  return (
    <div
      ref={contentScrollRef}
      className={cn('flex-1 overflow-auto gantt-scrollbar relative min-h-0 min-w-0', className)}
      style={{ 
        overflowX: 'auto', 
        overflowY: 'auto',
        maxHeight: '100%',
        height: '100%',
        maxWidth: '100%',
        width: '100%',
      }}
    >
      {children}
      {/* Loading indicator when extending range */}
      <RangeExtensionIndicator />
      {/* Extension buttons at edges - positioned relative to container */}
      {showLeftButton && (
        <button
          onClick={handleExtendLeft}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 z-40 bg-black/80 hover:bg-black/90 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 backdrop-blur-sm border border-white/20 transition-all shadow-lg"
          title="Load more dates to the left"
        >
          <span className="text-lg font-bold">+</span>
        </button>
      )}
      {showRightButton && (
        <button
          onClick={handleExtendRight}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 z-40 bg-black/80 hover:bg-black/90 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 backdrop-blur-sm border border-white/20 transition-all shadow-lg"
          title="Load more dates to the right"
        >
          <span className="text-lg font-bold">+</span>
        </button>
      )}
    </div>
  );
}

// Component to show loading indicator when extending date range
function RangeExtensionIndicator() {
  const { isExtendingRange } = useGantt();
  
  if (!isExtendingRange) return null;
  
  return (
    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
      <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 backdrop-blur-sm border border-white/20">
        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
        <span>Loading dates...</span>
      </div>
    </div>
  );
}

interface GanttFeatureListGroupProps {
  children: ReactNode;
  className?: string;
}

export function GanttFeatureListGroup({ children, className }: GanttFeatureListGroupProps) {
  return <div className={cn('space-y-0', className)}>{children}</div>;
}

