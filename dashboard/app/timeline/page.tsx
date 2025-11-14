'use client';

import dynamic from 'next/dynamic';

// Lazy load Gantt chart - heavy component with complex calculations
const GanttChartView = dynamic(() => import('@/components/GanttChartView').then(m => ({ default: m.GanttChartView })), {
  ssr: false,
  loading: () => (
    <div className="glass-medium rounded-2xl p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-white/10 rounded w-full" />
        <div className="h-96 bg-white/10 rounded w-full" />
      </div>
    </div>
  )
});

export default function TimelinePage() {

  return (
    <div className="w-full h-full overflow-hidden">
      {/* Content Area - Gantt Chart */}
      <div className="w-full h-full p-4 overflow-hidden">
        <GanttChartView />
      </div>
    </div>
  );
}
