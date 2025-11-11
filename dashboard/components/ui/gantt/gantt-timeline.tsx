'use client';

import React, { ReactNode, useRef, useEffect, createContext, useContext } from 'react';
import { useGantt } from './gantt-provider';
import { cn } from '@/lib/utils';
import { differenceInDays, differenceInWeeks, differenceInMonths, differenceInQuarters, differenceInYears } from 'date-fns';

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
  const { extendRange, pixelsPerDay, pixelsPerWeek, pixelsPerMonth, pixelsPerQuarter, pixelsPerYear, viewMode, firstDate } = useGantt();
  const lastExtendTimeRef = useRef<{ left: number; right: number }>({ left: 0, right: 0 });
  const rafIdRef = useRef<number | null>(null);
  const rangeRef = useRef(viewMode);

  // Scroll to current date when range changes or on initial load
  useEffect(() => {
    const contentEl = contentScrollRef?.current;
    const headerEl = headerScrollRef?.current;
    
    if (!contentEl || !headerEl || !firstDate) return;
    
    // Update range ref when view mode changes
    const viewModeChanged = rangeRef.current !== viewMode;
    if (viewModeChanged) {
      rangeRef.current = viewMode;
    }
    
    // Calculate scroll position to center current date
    const currentDate = new Date();
    const pixelsPerUnit = (() => {
      switch (viewMode) {
        case 'days':
          return pixelsPerDay;
        case 'weeks':
          return pixelsPerWeek;
        case 'months':
          return pixelsPerMonth;
        case 'quarters':
          return pixelsPerQuarter;
        case 'years':
          return pixelsPerYear;
        default:
          return pixelsPerDay;
      }
    })();
    
    // Calculate position of current date relative to firstDate (first date in header array)
    // This ensures perfect synchronization with header and rows
    const currentDatePosition = (() => {
      switch (viewMode) {
        case 'days':
          return differenceInDays(currentDate, firstDate) * pixelsPerDay;
        case 'weeks':
          return differenceInWeeks(currentDate, firstDate) * pixelsPerWeek;
        case 'months':
          return differenceInMonths(currentDate, firstDate) * pixelsPerMonth;
        case 'quarters':
          return differenceInQuarters(currentDate, firstDate) * pixelsPerQuarter;
        case 'years':
          return differenceInYears(currentDate, firstDate) * pixelsPerYear;
        default:
          return 0;
      }
    })();
    
    // Scroll to center current date - use triple RAF + timeout to ensure DOM is fully updated
    // This ensures header cells and rows are rendered before scrolling
    const scrollToCurrentDate = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const scrollPosition = currentDatePosition - (contentEl.clientWidth / 2) + (pixelsPerUnit / 2);
            const maxScroll = Math.max(0, contentEl.scrollWidth - contentEl.clientWidth);
            const finalScrollPosition = Math.max(0, Math.min(scrollPosition, maxScroll));
            
            contentEl.scrollLeft = finalScrollPosition;
            headerEl.scrollLeft = contentEl.scrollLeft;
          });
        });
      });
    };
    
    // Use timeout for initial load, immediate for view mode changes
    if (viewModeChanged) {
      scrollToCurrentDate();
    } else {
      // Initial load - wait a bit longer for everything to render
      const timeoutId = setTimeout(scrollToCurrentDate, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [viewMode, contentScrollRef, headerScrollRef, firstDate, pixelsPerDay, pixelsPerWeek, pixelsPerMonth, pixelsPerQuarter, pixelsPerYear]);

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
          
          // Check for range extension - throttle this expensive operation
          const now = Date.now();
          const scrollLeft = contentEl.scrollLeft;
          const scrollWidth = contentEl.scrollWidth;
          const clientWidth = contentEl.clientWidth;
          const threshold = clientWidth * 0.2;
          
          // Check left edge - only extend if not throttled
          if (scrollLeft < threshold && extendRange && (now - lastExtendTimeRef.current.left > 1000)) {
            const currentScrollLeft = contentEl.scrollLeft;
            // Calculate extend amount based on view mode - convert pixels to units
            let extendAmount: number;
            switch (viewMode) {
              case 'days':
                extendAmount = Math.ceil((clientWidth * 3) / pixelsPerDay);
                break;
              case 'weeks':
                extendAmount = Math.ceil((clientWidth * 3) / pixelsPerWeek);
                break;
              case 'months':
                extendAmount = Math.max(1, Math.ceil((clientWidth * 3) / pixelsPerMonth));
                break;
              case 'quarters':
                extendAmount = Math.max(1, Math.ceil((clientWidth * 3) / pixelsPerQuarter));
                break;
              case 'years':
                extendAmount = Math.max(1, Math.ceil((clientWidth * 3) / pixelsPerYear));
                break;
              default:
                extendAmount = Math.ceil((clientWidth * 3) / pixelsPerDay);
            }
            
            extendRange('left', extendAmount);
            
            requestAnimationFrame(() => {
              // Calculate actual pixels added based on view mode
              let addedPixels: number;
              switch (viewMode) {
                case 'days':
                  addedPixels = extendAmount * pixelsPerDay;
                  break;
                case 'weeks':
                  addedPixels = extendAmount * pixelsPerWeek;
                  break;
                case 'months':
                  addedPixels = extendAmount * pixelsPerMonth;
                  break;
                case 'quarters':
                  addedPixels = extendAmount * pixelsPerQuarter;
                  break;
                case 'years':
                  addedPixels = extendAmount * pixelsPerYear;
                  break;
                default:
                  addedPixels = extendAmount * pixelsPerDay;
              }
              contentEl.scrollLeft = currentScrollLeft + addedPixels;
              headerEl.scrollLeft = contentEl.scrollLeft;
            });
            
            lastExtendTimeRef.current.left = now;
          }
          
          // Check right edge - only extend if not throttled
          const distanceFromRight = scrollWidth - scrollLeft - clientWidth;
          if (distanceFromRight < threshold && extendRange && (now - lastExtendTimeRef.current.right > 1000)) {
            // Calculate extend amount based on view mode - convert pixels to units
            let extendAmount: number;
            switch (viewMode) {
              case 'days':
                extendAmount = Math.ceil((clientWidth * 3) / pixelsPerDay);
                break;
              case 'weeks':
                extendAmount = Math.ceil((clientWidth * 3) / pixelsPerWeek);
                break;
              case 'months':
                extendAmount = Math.max(1, Math.ceil((clientWidth * 3) / pixelsPerMonth));
                break;
              case 'quarters':
                extendAmount = Math.max(1, Math.ceil((clientWidth * 3) / pixelsPerQuarter));
                break;
              case 'years':
                extendAmount = Math.max(1, Math.ceil((clientWidth * 3) / pixelsPerYear));
                break;
              default:
                extendAmount = Math.ceil((clientWidth * 3) / pixelsPerDay);
            }
            
            extendRange('right', extendAmount);
            lastExtendTimeRef.current.right = now;
          }
          
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
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [headerScrollRef, contentScrollRef, extendRange, viewMode, pixelsPerDay, pixelsPerWeek, pixelsPerMonth, pixelsPerQuarter, pixelsPerYear]);

  return (
    <div
      ref={contentScrollRef}
      className={cn('flex-1 overflow-auto gantt-scrollbar relative min-h-0 min-w-0', className)}
      style={{ overflowX: 'auto', overflowY: 'auto' }}
    >
      {children}
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

