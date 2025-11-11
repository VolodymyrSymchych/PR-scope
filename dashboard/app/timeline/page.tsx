'use client';

import { GanttChartView } from '@/components/GanttChartView';

export default function TimelinePage() {

  return (
    <div className="w-full h-full flex flex-col overflow-hidden min-h-0">
      {/* Content Area - Gantt Chart */}
      <div className="flex-1 min-h-0 overflow-hidden p-4 flex flex-col">
        <GanttChartView />
      </div>
    </div>
  );
}
