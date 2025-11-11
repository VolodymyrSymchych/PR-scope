'use client';

import React, { ReactNode, useMemo, useState } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useGantt, GanttFeature } from './gantt-provider';
import { differenceInDays, differenceInWeeks, differenceInMonths, differenceInQuarters, differenceInYears, addDays, format, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';
import { GanttTooltip } from './gantt-tooltip';

interface GanttFeatureRowProps {
  features: GanttFeature[];
  onMove?: (id: string, startAt: Date, endAt: Date | null) => void;
  onResize?: (id: string, startAt: Date, endAt: Date) => void;
  children?: (feature: GanttFeature) => ReactNode;
  className?: string;
}

export function GanttFeatureRow({ features, onMove, onResize, children, className }: GanttFeatureRowProps) {
  const { startDate, endDate, baseStartDate, firstDate, pixelsPerDay, pixelsPerWeek, pixelsPerMonth, pixelsPerQuarter, pixelsPerYear, viewMode, onMoveItem, days, weeks, months, quarters, years, collapsedTasks } = useGantt();

  // Calculate pixels per day based on view mode
  const pixelsPerUnit = useMemo(() => {
    switch (viewMode) {
      case 'weeks':
        return pixelsPerWeek / 7;
      case 'months':
        return pixelsPerMonth / 30;
      case 'quarters':
        return pixelsPerQuarter / 90;
      case 'years':
        return pixelsPerYear / 365;
      default:
        return pixelsPerDay;
    }
  }, [viewMode, pixelsPerDay, pixelsPerWeek, pixelsPerMonth, pixelsPerQuarter, pixelsPerYear]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedFeature, setDraggedFeature] = useState<GanttFeature | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Calculate sub-row positions for overlapping features with hierarchy support
  const featuresWithPositions = useMemo(() => {
    // Filter out subtasks of collapsed parents
    const visibleFeatures = features.filter(f => {
      if (f.parentId && collapsedTasks.has(f.parentId)) {
        return false; // Hide subtasks of collapsed parents
      }
      return true;
    });

    // Separate parent tasks and subtasks
    const parentTasks = visibleFeatures.filter(f => !f.parentId);
    const subtasksByParent = new Map<string, GanttFeature[]>();

    // Group subtasks by parent
    visibleFeatures.forEach(f => {
      if (f.parentId) {
        if (!subtasksByParent.has(f.parentId)) {
          subtasksByParent.set(f.parentId, []);
        }
        subtasksByParent.get(f.parentId)!.push(f);
      }
    });

    // Sort subtasks by start date within each parent
    subtasksByParent.forEach((subtasks) => {
      subtasks.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    });

    // Sort parent tasks by start date
    const sortedParents = [...parentTasks].sort((a, b) =>
      a.startAt.getTime() - b.startAt.getTime()
    );

    const featureWithPositions: Array<GanttFeature & { subRow: number; isSubtask?: boolean }> = [];
    const subRowEndTimes: Date[] = []; // Track when each sub-row becomes free

    for (const parent of sortedParents) {
      const subtasks = subtasksByParent.get(parent.id) || [];
      const groupSize = 1 + subtasks.length; // Parent + subtasks

      // Find the first sub-row where the entire group (parent + subtasks) fits
      let subRow = 0;
      let foundSlot = false;

      while (!foundSlot) {
        // Check if all rows in the group are free
        let allFree = true;
        for (let i = 0; i < groupSize; i++) {
          const checkRow = subRow + i;
          if (checkRow < subRowEndTimes.length && subRowEndTimes[checkRow] > parent.startAt) {
            allFree = false;
            break;
          }
        }

        if (allFree) {
          foundSlot = true;
        } else {
          subRow++;
        }
      }

      // Place parent in the found row
      featureWithPositions.push({ ...parent, subRow, isSubtask: false });

      // Update end time for parent row
      if (subRow >= subRowEndTimes.length) {
        subRowEndTimes.push(parent.endAt);
      } else {
        subRowEndTimes[subRow] = parent.endAt;
      }

      // Place subtasks in consecutive rows below parent
      subtasks.forEach((subtask, index) => {
        const subtaskRow = subRow + 1 + index;
        featureWithPositions.push({ ...subtask, subRow: subtaskRow, isSubtask: true });

        // Update end time for subtask row
        if (subtaskRow >= subRowEndTimes.length) {
          subRowEndTimes.push(subtask.endAt);
        } else {
          // Keep track of the latest end time that occupies this row
          subRowEndTimes[subtaskRow] = subtask.endAt > subRowEndTimes[subtaskRow]
            ? subtask.endAt
            : subRowEndTimes[subtaskRow];
        }
      });
    }

    return featureWithPositions;
  }, [features, collapsedTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string;
    
    // Check if it's a resize handle
    if (activeId.startsWith('resize-start-')) {
      const featureId = activeId.replace('resize-start-', '');
      const feature = features.find(f => f.id === featureId);
      if (feature) {
        setActiveId(featureId);
        setDraggedFeature(feature);
      }
    } else if (activeId.startsWith('resize-end-')) {
      const featureId = activeId.replace('resize-end-', '');
      const feature = features.find(f => f.id === featureId);
      if (feature) {
        setActiveId(featureId);
        setDraggedFeature(feature);
      }
    } else {
      // Regular drag
      const feature = features.find(f => f.id === activeId);
      if (feature) {
        setActiveId(activeId);
        setDraggedFeature(feature);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !draggedFeature) {
      setActiveId(null);
      setDraggedFeature(null);
      return;
    }

    const activeId = active.id as string;
    const dropDateStr = over.id as string;
    
    if (dropDateStr.startsWith('date-')) {
      const dropDate = new Date(dropDateStr.replace('date-', ''));
      
      // Handle resize
      if (activeId.startsWith('resize-start-')) {
        const featureId = activeId.replace('resize-start-', '');
        // Ensure new start date is before end date
        const newStart = dropDate < draggedFeature.endAt ? dropDate : addDays(draggedFeature.endAt, -1);
        
        if (onResize) {
          onResize(featureId, newStart, draggedFeature.endAt);
        }
      } else if (activeId.startsWith('resize-end-')) {
        const featureId = activeId.replace('resize-end-', '');
        // Ensure new end date is after start date
        const newEnd = dropDate > draggedFeature.startAt ? dropDate : addDays(draggedFeature.startAt, 1);
        
        if (onResize) {
          onResize(featureId, draggedFeature.startAt, newEnd);
        }
      } else {
        // Handle move
        const daysDiff = differenceInDays(dropDate, draggedFeature.startAt);

        if (daysDiff !== 0) {
          const newStart = addDays(draggedFeature.startAt, daysDiff);
          const newEnd = addDays(draggedFeature.endAt, daysDiff);

          // Check if this is a parent task (has subtasks)
          const isParentTask = !draggedFeature.parentId && features.some(f => f.parentId === draggedFeature.id);

          if (onMove) {
            // Pass true for shiftSubtasks if moving a parent task
            (onMove as any)(activeId, newStart, newEnd, isParentTask);
          }

          if (onMoveItem) {
            (onMoveItem as any)(activeId, newStart, newEnd, isParentTask);
          }
        }
      }
    }

    setActiveId(null);
    setDraggedFeature(null);
  };

  // Calculate dimensions - structure as table with date columns
  const maxSubRows = Math.max(1, featuresWithPositions.length > 0 
    ? Math.max(...featuresWithPositions.map(f => f.subRow)) + 1 
    : 1);
  const subRowHeight = 60; // Base row height
  const totalHeight = maxSubRows * subRowHeight;
  
  // Calculate total width - match header width exactly
  // Header uses filtered dates starting from firstDate, so we need to filter the same way
  const filteredDates = useMemo(() => {
    const findStartIndex = (dateArray: Date[]): number => {
      if (!firstDate || dateArray.length === 0) return 0;
      
      switch (viewMode) {
        case 'days':
          return dateArray.findIndex(d => d.getTime() === firstDate.getTime());
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
  
  // Calculate offset to position background correctly
  // Tasks are positioned relative to firstDate (header start)
  // Container needs to be offset to align with header
  const dateOffset = useMemo(() => {
    // No offset needed since tasks use firstDate as reference point
    return 0;
  }, []);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={cn('flex relative transition-colors duration-200', className)} style={{ height: totalHeight, minHeight: 56 }}>
        {/* Full-width background and border - table structure with date columns */}
        <div 
          className="absolute inset-0 bg-black/[0.25] border-b border-white/[0.12]"
          style={{ width: `${totalWidth}px` }}
        />
        {/* Table structure: dates as columns (not visually displayed, but used for structure) */}
        <div className="relative" style={{ width: `${totalWidth}px`, minWidth: `${totalWidth}px` }}>
          {featuresWithPositions.map((feature) => (
            <div
              key={feature.id}
              className="absolute w-full"
              style={{
                top: `${feature.subRow * subRowHeight}px`,
                height: `${subRowHeight}px`,
              }}
            >
              <FeatureBar
                feature={feature}
                startDate={firstDate}
                pixelsPerDay={pixelsPerUnit}
                isDragging={activeId === feature.id}
                onResize={onResize}
                children={children}
              />
            </div>
          ))}
          <DateDropZones startDate={firstDate} pixelsPerDay={pixelsPerUnit} viewMode={viewMode} />
        </div>
      </div>
    </DndContext>
  );
}

interface FeatureBarProps {
  feature: GanttFeature;
  startDate: Date;
  pixelsPerDay: number;
  isDragging: boolean;
  onResize?: (id: string, startAt: Date, endAt: Date) => void;
  children?: (feature: GanttFeature) => ReactNode;
}

const FeatureBar = React.memo(function FeatureBar({ feature, startDate, pixelsPerDay, isDragging, onResize, children }: FeatureBarProps) {
  const { viewMode, pixelsPerWeek, pixelsPerMonth, pixelsPerQuarter, pixelsPerYear, days, weeks, months, quarters, years, firstDate, dateRangeStart, dateRangeEnd } = useGantt();
  
  // Filter dates the same way as header does
  const filteredDates = useMemo(() => {
    const findStartIndex = (dateArray: Date[]): number => {
      if (!firstDate || dateArray.length === 0) return 0;
      
      switch (viewMode) {
        case 'days':
          return dateArray.findIndex(d => d.getTime() === firstDate.getTime());
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
  
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: feature.id,
    data: { feature },
  });

  const { attributes: startResizeAttrs, listeners: startResizeListeners, setNodeRef: setStartResizeRef } = useDraggable({
    id: `resize-start-${feature.id}`,
    data: { feature, type: 'start' },
  });

  const { attributes: endResizeAttrs, listeners: endResizeListeners, setNodeRef: setEndResizeRef } = useDraggable({
    id: `resize-end-${feature.id}`,
    data: { feature, type: 'end' },
  });
  
  // Helper function to find index in date array
  const findDateIndex = (date: Date, dateArray: Date[], viewMode: string): number => {
    switch (viewMode) {
      case 'months': {
        // Find the month that contains this date
        const year = date.getFullYear();
        const month = date.getMonth();
        return dateArray.findIndex(d => d.getFullYear() === year && d.getMonth() === month);
      }
      case 'quarters': {
        // Find the quarter that contains this date
        // eachQuarterOfInterval returns dates at the start of each quarter
        const year = date.getFullYear();
        const quarterMonth = Math.floor(date.getMonth() / 3) * 3;
        return dateArray.findIndex(d => {
          const dYear = d.getFullYear();
          const dMonth = d.getMonth();
          // Check if this date is in the same quarter (same year and same quarter start month)
          return dYear === year && Math.floor(dMonth / 3) * 3 === quarterMonth;
        });
      }
      case 'years': {
        // Find the year that contains this date
        const year = date.getFullYear();
        return dateArray.findIndex(d => d.getFullYear() === year);
      }
      default:
        return -1;
    }
  };
  
  // Memoize position calculations - use array indices for months/quarters/years
  const { left, width, clippedLeft, clippedRight } = useMemo(() => {
    let leftPx: number;
    let widthPx: number;
    
    switch (viewMode) {
      case 'days':
        leftPx = differenceInDays(feature.startAt, startDate) * pixelsPerDay;
        widthPx = differenceInDays(feature.endAt, feature.startAt) * pixelsPerDay;
        break;
      case 'weeks': {
        // Use filtered weeks array (same as header) for consistency
        // Find indices in filtered weeks array
        const startIndex = filteredDates.filteredWeeks.findIndex(w => {
          const weekStart = startOfWeek(w, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(w, { weekStartsOn: 1 });
          return feature.startAt >= weekStart && feature.startAt <= weekEnd;
        });
        
        const endIndex = filteredDates.filteredWeeks.findIndex(w => {
          const weekStart = startOfWeek(w, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(w, { weekStartsOn: 1 });
          return feature.endAt >= weekStart && feature.endAt <= weekEnd;
        });
        
        // Calculate position relative to firstDate (which is at index 0 in filtered array)
        if (startIndex >= 0) {
          // Use array index directly - firstDate is at index 0 in filtered array
          leftPx = startIndex * pixelsPerWeek;
        } else {
          // If not found, calculate difference from firstDate
          const taskWeekStart = startOfWeek(feature.startAt, { weekStartsOn: 1 });
          const firstWeekStart = startOfWeek(firstDate, { weekStartsOn: 1 });
          leftPx = differenceInWeeks(taskWeekStart, firstWeekStart) * pixelsPerWeek;
        }
        
        if (startIndex >= 0 && endIndex >= 0 && endIndex >= startIndex) {
          // Calculate width based on number of weeks spanned
          widthPx = (endIndex - startIndex + 1) * pixelsPerWeek;
        } else if (startIndex >= 0) {
          // Start found but end not found - use minimum width
          widthPx = pixelsPerWeek;
        } else if (endIndex >= 0) {
          // End found but start not found
          widthPx = pixelsPerWeek;
        } else {
          // Neither found - calculate from week difference
          const startWeekStart = startOfWeek(feature.startAt, { weekStartsOn: 1 });
          const endWeekStart = startOfWeek(feature.endAt, { weekStartsOn: 1 });
          const weeksSpan = differenceInWeeks(endWeekStart, startWeekStart) + 1;
          widthPx = Math.max(pixelsPerWeek, weeksSpan * pixelsPerWeek);
        }
        break;
      }
      case 'months': {
        // Find index of start month and end month in the months array
        const startIndex = findDateIndex(feature.startAt, months, 'months');
        const endIndex = findDateIndex(feature.endAt, months, 'months');
        
        // Always use firstDate (first date in array) as reference point for synchronization
        // This ensures header and rows are perfectly aligned
        if (startIndex >= 0) {
          // Use array index directly - firstDate is at index 0
          leftPx = startIndex * pixelsPerMonth;
        } else {
          // Fallback: find the month that contains startDate (which is firstDate)
          const monthStart = new Date(feature.startAt.getFullYear(), feature.startAt.getMonth(), 1);
          const firstMonthStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
          leftPx = differenceInMonths(monthStart, firstMonthStart) * pixelsPerMonth;
        }
        
        if (startIndex >= 0 && endIndex >= 0 && endIndex >= startIndex) {
          // Calculate width based on number of months spanned
          widthPx = (endIndex - startIndex + 1) * pixelsPerMonth;
        } else if (startIndex >= 0) {
          // Start found but end not found - use minimum width
          widthPx = pixelsPerMonth;
        } else {
          // Fallback to differenceInMonths if index not found
          const monthStart = new Date(feature.startAt.getFullYear(), feature.startAt.getMonth(), 1);
          const monthEnd = new Date(feature.endAt.getFullYear(), feature.endAt.getMonth(), 1);
          widthPx = Math.max(pixelsPerMonth, (differenceInMonths(monthEnd, monthStart) + 1) * pixelsPerMonth);
        }
        break;
      }
      case 'quarters': {
        // Calculate quarter start dates for the feature
        const quarterStart = new Date(feature.startAt.getFullYear(), Math.floor(feature.startAt.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(feature.endAt.getFullYear(), Math.floor(feature.endAt.getMonth() / 3) * 3, 1);
        
        // Find the index of firstDate in quarters array to use as offset
        const firstQuarterStart = new Date(firstDate.getFullYear(), Math.floor(firstDate.getMonth() / 3) * 3, 1);
        const firstQuarterIndex = quarters.findIndex(q => {
          const qYear = q.getFullYear();
          const qMonth = q.getMonth();
          const qQuarterStart = new Date(qYear, Math.floor(qMonth / 3) * 3, 1);
          return qQuarterStart.getTime() === firstQuarterStart.getTime();
        });
        
        // Find indices in quarters array by comparing quarter start dates
        // eachQuarterOfInterval returns dates at the start of each quarter (1st day of quarter)
        const startIndex = quarters.findIndex(q => {
          const qYear = q.getFullYear();
          const qMonth = q.getMonth();
          const qQuarterStart = new Date(qYear, Math.floor(qMonth / 3) * 3, 1);
          return qQuarterStart.getTime() === quarterStart.getTime();
        });
        
        const endIndex = quarters.findIndex(q => {
          const qYear = q.getFullYear();
          const qMonth = q.getMonth();
          const qQuarterStart = new Date(qYear, Math.floor(qMonth / 3) * 3, 1);
          return qQuarterStart.getTime() === quarterEnd.getTime();
        });
        
        // Calculate position relative to firstDate
        // If firstDate is at index N in quarters array, and our task starts at index M,
        // then position is (M - N) * pixelsPerQuarter
        if (startIndex >= 0 && firstQuarterIndex >= 0) {
          // Use relative index from firstDate
          leftPx = (startIndex - firstQuarterIndex) * pixelsPerQuarter;
        } else if (startIndex >= 0) {
          // Start found but firstDate not found - use absolute index
          leftPx = startIndex * pixelsPerQuarter;
        } else {
          // If not found, calculate difference from firstDate
          if (firstQuarterIndex >= 0) {
            // Calculate difference in quarters from firstDate
            const quartersDiff = differenceInQuarters(quarterStart, firstQuarterStart);
            leftPx = quartersDiff * pixelsPerQuarter;
          } else {
            // Last resort: use difference from firstDate
            leftPx = differenceInQuarters(quarterStart, firstDate) * pixelsPerQuarter;
          }
        }
        
        if (startIndex >= 0 && endIndex >= 0 && endIndex >= startIndex) {
          // Calculate width based on number of quarters spanned
          widthPx = (endIndex - startIndex + 1) * pixelsPerQuarter;
        } else if (startIndex >= 0) {
          // Start found but end not found - use minimum width
          widthPx = pixelsPerQuarter;
        } else if (endIndex >= 0) {
          // End found but start not found
          widthPx = pixelsPerQuarter;
        } else {
          // Neither found - calculate from quarter difference
          const quartersSpan = differenceInQuarters(quarterEnd, quarterStart) + 1;
          widthPx = Math.max(pixelsPerQuarter, quartersSpan * pixelsPerQuarter);
        }
        break;
      }
      case 'years': {
        // Find index of start year and end year in the years array
        const startIndex = findDateIndex(feature.startAt, years, 'years');
        const endIndex = findDateIndex(feature.endAt, years, 'years');
        
        // Always use firstDate (first date in array) as reference point for synchronization
        if (startIndex >= 0) {
          // Use array index directly - firstDate is at index 0
          leftPx = startIndex * pixelsPerYear;
        } else {
          // Fallback: find the year that contains startDate (which is firstDate)
          const yearStart = new Date(feature.startAt.getFullYear(), 0, 1);
          const firstYearStart = new Date(startDate.getFullYear(), 0, 1);
          leftPx = differenceInYears(yearStart, firstYearStart) * pixelsPerYear;
        }
        
        if (startIndex >= 0 && endIndex >= 0 && endIndex >= startIndex) {
          // Calculate width based on number of years spanned
          widthPx = (endIndex - startIndex + 1) * pixelsPerYear;
        } else if (startIndex >= 0) {
          // Start found but end not found - use minimum width
          widthPx = pixelsPerYear;
        } else {
          // Fallback to differenceInYears if index not found
          const yearStart = new Date(feature.startAt.getFullYear(), 0, 1);
          const yearEnd = new Date(feature.endAt.getFullYear(), 0, 1);
          widthPx = Math.max(pixelsPerYear, (differenceInYears(yearEnd, yearStart) + 1) * pixelsPerYear);
        }
        break;
      }
      default:
        leftPx = differenceInDays(feature.startAt, startDate) * pixelsPerDay;
        widthPx = differenceInDays(feature.endAt, feature.startAt) * pixelsPerDay;
    }
    
    // Calculate visible range width
    const visibleWidth = (() => {
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
    })();

    // Clip task bar to visible range
    let clippedLeft = leftPx;
    let clippedWidth = widthPx;
    let clippedLeftSide = false;
    let clippedRightSide = false;

    // Check if task extends beyond visible range
    if (leftPx < 0) {
      clippedLeftSide = true;
      clippedWidth = widthPx + leftPx; // Reduce width by amount extending left
      clippedLeft = 0;
    }

    if (leftPx + widthPx > visibleWidth) {
      clippedRightSide = true;
      clippedWidth = Math.max(0, visibleWidth - clippedLeft);
    }

    // Ensure width is not negative
    clippedWidth = Math.max(0, clippedWidth);

    return { 
      left: clippedLeft, 
      width: clippedWidth,
      clippedLeft: clippedLeftSide,
      clippedRight: clippedRightSide,
      originalLeft: leftPx,
      originalWidth: widthPx
    };
  }, [feature.startAt, feature.endAt, startDate, firstDate, viewMode, pixelsPerDay, pixelsPerWeek, pixelsPerMonth, pixelsPerQuarter, pixelsPerYear, days, weeks, months, quarters, years, filteredDates]);

  const style = {
    left: `${left}px`,
    width: `${width}px`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 10,
    transform: transform ? `translate3d(${transform.x}px, 0, 0)` : undefined,
    overflow: 'hidden', // Clip content that extends beyond bounds
  };

  const statusColor = feature.status?.color || 'hsl(var(--text-tertiary) / 0.7)';

  // Create brighter, more visible colors using task status colors
  const getLightColor = (color: string) => {
    if (color.includes('hsl')) {
      const match = color.match(/hsl\(([^)]+)\)/);
      if (match) {
        const hslValues = match[1];
        // Handle CSS variables like var(--secondary) or direct HSL values
        if (hslValues.includes('var(')) {
          // Extract CSS variable name (e.g., --secondary from var(--secondary))
          const varMatch = hslValues.match(/var\(([^)]+)\)/);
          if (varMatch) {
            const varName = varMatch[1].trim();
            // Use high opacity for bright, visible status color
            return `hsl(var(${varName}) / 0.80)`;
          }
        } else {
          // Direct HSL values - extract base color
          const baseColor = hslValues.split('/')[0].trim();
          // Use higher opacity (0.75-0.85) for brighter task bars
          return `hsl(${baseColor} / 0.80)`;
        }
      }
    }
    // Fallback to primary color with high opacity
    return 'hsl(var(--primary) / 0.75)';
  };

  const getBorderColor = (color: string) => {
    if (color.includes('hsl')) {
      const match = color.match(/hsl\(([^)]+)\)/);
      if (match) {
        const hslValues = match[1];
        // Handle CSS variables like var(--secondary) or direct HSL values
        if (hslValues.includes('var(')) {
          // Extract CSS variable name
          const varMatch = hslValues.match(/var\(([^)]+)\)/);
          if (varMatch) {
            const varName = varMatch[1].trim();
            return `hsl(var(${varName}) / 0.95)`;
          }
        } else {
          // Direct HSL values - extract base color
          const baseColor = hslValues.split('/')[0].trim();
          return `hsl(${baseColor} / 0.95)`;
        }
      }
    }
    return 'hsl(var(--primary) / 0.90)';
  };

  // Tooltip content
  const tooltipContent = (
    <div className="flex flex-col gap-1">
      <div className="font-semibold">{feature.name}</div>
      {feature.assignee && (
        <div className="text-white/80">
          <span className="text-white/60">Assignee:</span> {feature.assignee}
        </div>
      )}
      {feature.workedHours !== undefined && (
        <div className="text-white/80">
          <span className="text-white/60">Worked:</span> {feature.workedHours}h
        </div>
      )}
      <div className="text-white/60 text-[10px] mt-0.5">
        {format(feature.startAt, 'MMM d, yyyy')} - {format(feature.endAt, 'MMM d, yyyy')}
      </div>
    </div>
  );

  return (
    <GanttTooltip content={tooltipContent}>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'absolute top-2 left-0 h-11 rounded-lg transition-opacity duration-200 cursor-grab active:cursor-grabbing group',
          isDragging && 'z-50 opacity-40'
        )}
        data-draggable="true"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        {...listeners}
        {...attributes}
      >
      <div
        className={cn(
          "h-full rounded-lg flex items-center px-3 backdrop-blur-md transition-colors duration-200 relative",
          clippedLeft && "rounded-l-none",
          clippedRight && "rounded-r-none"
        )}
        style={{
          background: getLightColor(statusColor),
          border: `1.5px solid ${getBorderColor(statusColor)}`,
        }}
      >
        {/* Left clip indicator */}
        {clippedLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/40 to-transparent flex items-center justify-center">
            <div className="w-0.5 h-3 bg-white/60 rounded-full"></div>
          </div>
        )}
        {/* Right clip indicator */}
        {clippedRight && (
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-black/40 to-transparent flex items-center justify-center">
            <div className="w-0.5 h-3 bg-white/60 rounded-full"></div>
          </div>
        )}
        {/* Left resize handle - for changing start date (draggable) */}
        {onResize && (
          <div
            ref={setStartResizeRef}
            {...startResizeListeners}
            {...startResizeAttrs}
            className="absolute -left-1 top-0 bottom-0 w-3 cursor-ew-resize z-20 flex items-center justify-center group/handle hover:w-4 transition-all duration-200"
            title="Drag to change start date"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full w-full bg-white/10 group-hover/handle:bg-white/20 border-l-2 border-white/30 group-hover/handle:border-white/50 rounded-l-lg transition-all duration-200 flex items-center justify-center">
              <div className="flex flex-col gap-0.5 opacity-60 group-hover/handle:opacity-100 transition-opacity">
                <div className="w-0.5 h-1 bg-white rounded-full"></div>
                <div className="w-0.5 h-1 bg-white rounded-full"></div>
                <div className="w-0.5 h-1 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        )}

        {/* Right resize handle - for changing end date (draggable) */}
        {onResize && (
          <div
            ref={setEndResizeRef}
            {...endResizeListeners}
            {...endResizeAttrs}
            className="absolute -right-1 top-0 bottom-0 w-3 cursor-ew-resize z-20 flex items-center justify-center group/handle hover:w-4 transition-all duration-200"
            title="Drag to change end date"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full w-full bg-white/10 group-hover/handle:bg-white/20 border-r-2 border-white/30 group-hover/handle:border-white/50 rounded-r-lg transition-all duration-200 flex items-center justify-center">
              <div className="flex flex-col gap-0.5 opacity-60 group-hover/handle:opacity-100 transition-opacity">
                <div className="w-0.5 h-1 bg-white rounded-full"></div>
                <div className="w-0.5 h-1 bg-white rounded-full"></div>
                <div className="w-0.5 h-1 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        )}

        {children ? (
          children(feature)
        ) : (
          <div className="flex-1 min-w-0 relative z-10">
            <GripVertical className="w-3 h-3 text-white/60 mr-2 flex-shrink-0 transition-colors duration-200 inline-block" />
            <div className="inline-block flex-1 min-w-0">
              <div className="text-xs font-semibold text-white/90 truncate">{feature.name}</div>
              <div className="text-[10px] text-white/50 font-medium">
                {format(feature.startAt, 'MMM d')} - {format(feature.endAt, 'MMM d')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </GanttTooltip>
  );
});

function DateDropZones({ startDate, pixelsPerDay, viewMode }: { startDate: Date; pixelsPerDay: number; viewMode: string }) {
  const { days, weeks, months, quarters, years, pixelsPerWeek, pixelsPerMonth, pixelsPerQuarter, pixelsPerYear } = useGantt();

  // Select appropriate time units and pixel width based on view mode
  const { timeUnits, pixelWidth } = useMemo(() => {
    switch (viewMode) {
      case 'weeks':
        return { timeUnits: weeks, pixelWidth: pixelsPerWeek };
      case 'months':
        return { timeUnits: months, pixelWidth: pixelsPerMonth };
      case 'quarters':
        return { timeUnits: quarters, pixelWidth: pixelsPerQuarter };
      case 'years':
        return { timeUnits: years, pixelWidth: pixelsPerYear };
      default:
        return { timeUnits: days, pixelWidth: pixelsPerDay };
    }
  }, [viewMode, days, weeks, months, quarters, years, pixelsPerDay, pixelsPerWeek, pixelsPerMonth, pixelsPerQuarter, pixelsPerYear]);

  return (
    <>
      {timeUnits.map((date) => (
        <DateDropZone key={`date-${date.toISOString()}`} date={date} startDate={startDate} viewMode={viewMode} pixelWidth={pixelWidth} pixelsPerDay={pixelsPerDay} pixelsPerWeek={pixelsPerWeek} pixelsPerMonth={pixelsPerMonth} pixelsPerQuarter={pixelsPerQuarter} pixelsPerYear={pixelsPerYear} />
      ))}
    </>
  );
}

function DateDropZone({ date, startDate, viewMode, pixelWidth, pixelsPerDay, pixelsPerWeek, pixelsPerMonth, pixelsPerQuarter, pixelsPerYear }: { date: Date; startDate: Date; viewMode: string; pixelWidth: number; pixelsPerDay: number; pixelsPerWeek: number; pixelsPerMonth: number; pixelsPerQuarter: number; pixelsPerYear: number }) {
  const { days, weeks, months, quarters, years } = useGantt();
  const { setNodeRef, isOver } = useDroppable({
    id: `date-${date.toISOString()}`,
  });

  // Helper function to find index in date array (same as in FeatureBar)
  const findDateIndex = (targetDate: Date, dateArray: Date[], mode: string): number => {
    switch (mode) {
      case 'months': {
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        return dateArray.findIndex(d => d.getFullYear() === year && d.getMonth() === month);
      }
      case 'quarters': {
        // eachQuarterOfInterval returns dates at the start of each quarter
        // We need to find the quarter that contains the target date
        const year = targetDate.getFullYear();
        const quarterMonth = Math.floor(targetDate.getMonth() / 3) * 3;
        return dateArray.findIndex(d => {
          const dYear = d.getFullYear();
          const dMonth = d.getMonth();
          // Check if this date is in the same quarter (same year and same quarter start month)
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

  // Calculate left position based on view mode
  // Use array indices for months/quarters/years for perfect synchronization with header
  const left = useMemo(() => {
    switch (viewMode) {
      case 'days': {
        const index = days.findIndex(d => d.getTime() === date.getTime());
        return index >= 0 ? index * pixelsPerDay : differenceInDays(date, startDate) * pixelsPerDay;
      }
      case 'weeks': {
        const index = weeks.findIndex(d => d.getTime() === date.getTime());
        return index >= 0 ? index * pixelsPerWeek : differenceInWeeks(date, startDate) * pixelsPerWeek;
      }
      case 'months': {
        const index = findDateIndex(date, months, 'months');
        return index >= 0 ? index * pixelsPerMonth : differenceInMonths(date, startDate) * pixelsPerMonth;
      }
      case 'quarters': {
        const index = findDateIndex(date, quarters, 'quarters');
        if (index >= 0) {
          return index * pixelsPerQuarter;
        } else {
          // Fallback: find quarter manually
          const quarterStart = new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1);
          const firstQuarterStart = new Date(startDate.getFullYear(), Math.floor(startDate.getMonth() / 3) * 3, 1);
          const manualIndex = quarters.findIndex(q => {
            const qQuarterStart = new Date(q.getFullYear(), Math.floor(q.getMonth() / 3) * 3, 1);
            return qQuarterStart.getTime() === quarterStart.getTime();
          });
          return manualIndex >= 0 ? manualIndex * pixelsPerQuarter : differenceInQuarters(quarterStart, firstQuarterStart) * pixelsPerQuarter;
        }
      }
      case 'years': {
        const index = findDateIndex(date, years, 'years');
        return index >= 0 ? index * pixelsPerYear : differenceInYears(date, startDate) * pixelsPerYear;
      }
      default:
        return differenceInDays(date, startDate) * pixelsPerDay;
    }
  }, [date, startDate, viewMode, pixelsPerDay, pixelsPerWeek, pixelsPerMonth, pixelsPerQuarter, pixelsPerYear, days, weeks, months, quarters, years]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute top-0 bottom-0 transition-all duration-150',
        isOver && 'bg-primary/[0.15] border-x border-primary/40'
      )}
      style={{
        left: `${left}px`,
        width: `${pixelWidth}px`,
      }}
    />
  );
}

function FeatureBarOverlay({ feature, startDate, pixelsPerDay }: { feature: GanttFeature; startDate: Date; pixelsPerDay: number }) {
  const width = differenceInDays(feature.endAt, feature.startAt) * pixelsPerDay;
  const statusColor = feature.status?.color || 'hsl(var(--text-tertiary) / 0.7)';

  const getLightColor = (color: string) => {
    if (color.includes('hsl')) {
      const match = color.match(/hsl\(([^)]+)\)/);
      if (match) {
        const hslValues = match[1];
        if (hslValues.includes('var(')) {
          const varMatch = hslValues.match(/var\(([^)]+)\)/);
          if (varMatch) {
            const varName = varMatch[1].trim();
            return `hsl(var(${varName}) / 0.85)`;
          }
        } else {
          const baseColor = hslValues.split('/')[0].trim();
          return `hsl(${baseColor} / 0.85)`;
        }
      }
    }
    return 'hsl(var(--primary) / 0.80)';
  };

  const getBorderColor = (color: string) => {
    if (color.includes('hsl')) {
      const match = color.match(/hsl\(([^)]+)\)/);
      if (match) {
        const hslValues = match[1];
        if (hslValues.includes('var(')) {
          const varMatch = hslValues.match(/var\(([^)]+)\)/);
          if (varMatch) {
            const varName = varMatch[1].trim();
            return `hsl(var(${varName}) / 1.0)`;
          }
        } else {
          const baseColor = hslValues.split('/')[0].trim();
          return `hsl(${baseColor} / 1.0)`;
        }
      }
    }
    return 'hsl(var(--primary) / 1.0)';
  };

  return (
    <div
      className="h-11 rounded-lg flex items-center px-3 opacity-95 backdrop-blur-xl"
      style={{
        width: `${width}px`,
        background: getLightColor(statusColor),
        border: `2px solid ${getBorderColor(statusColor)}`,
      }}
    >
      <GripVertical className="w-3 h-3 text-white/70 mr-2 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-white/95 truncate">{feature.name}</div>
        <div className="text-[10px] text-white/60 font-medium">
          {format(feature.startAt, 'MMM d')} - {format(feature.endAt, 'MMM d')}
        </div>
      </div>
    </div>
  );
}


