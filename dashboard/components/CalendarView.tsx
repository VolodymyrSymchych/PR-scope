'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface CalendarEvent {
  title: string;
  team?: string;
  members?: string[];
  color: string;
}

interface CalendarDay {
  date: number;
  events: CalendarEvent[];
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const weekDays = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'];
  const weekDates = [7, 8, 9, 10, 11, 12, 13];

  const events: Record<number, CalendarEvent[]> = {
    8: [
      {
        title: '2021 Strategy for Bundle',
        team: 'Business Team',
        members: ['JD', 'SK', 'MR'],
        color: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      }
    ],
    9: [
      {
        title: 'Product roadmap consideration',
        team: 'Product Team',
        members: ['AR'],
        color: 'bg-red-400 text-white'
      },
      {
        title: 'Product Review for Bundle',
        team: 'Business Team',
        members: ['JD', 'MR'],
        color: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      }
    ],
    12: [
      {
        title: 'Test for 2.3.1',
        team: 'Product',
        color: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      }
    ]
  };

  return (
    <div className="glass-medium rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-bold text-text-primary">
            NOV <span className="text-text-tertiary">2020</span>
          </h3>
          <div className="flex items-center space-x-2">
            <button className="p-1 glass-subtle hover:glass-light rounded transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-110 active:scale-95">
              <ChevronLeft className="w-4 h-4 text-text-tertiary transition-transform duration-200 hover:-translate-x-0.5" />
            </button>
            <button className="p-1 glass-subtle hover:glass-light rounded transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-110 active:scale-95">
              <ChevronRight className="w-4 h-4 text-text-tertiary transition-transform duration-200 hover:translate-x-0.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-text-secondary">Show:</span>
          <select className="text-sm glass-input border-0 text-text-primary focus:outline-none rounded px-2 py-1">
            <option>1 Week</option>
            <option>2 Weeks</option>
            <option>1 Month</option>
          </select>
          <ChevronLeft className="w-4 h-4 text-text-tertiary rotate-90" />
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day, idx) => (
          <div key={day} className="text-center">
            <div className="text-xs text-text-tertiary mb-2">{weekDates[idx]}</div>
            <div className="text-sm font-semibold text-text-primary mb-3">{day}</div>
            <div className="space-y-2 min-h-[200px]">
              {events[weekDates[idx]]?.map((event, eventIdx) => (
                <div
                  key={eventIdx}
                  className={`p-2 rounded-lg text-xs glass-light glass-hover transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${event.color}`}
                >
                  <div className="font-medium mb-1">{event.title}</div>
                  {event.team && (
                    <div className="text-xs opacity-75">{event.team}</div>
                  )}
                  {event.members && (
                    <div className="flex items-center -space-x-1 mt-2">
                      {event.members.map((member, idx) => (
                        <div
                          key={idx}
                          className="w-5 h-5 rounded-full bg-[#8098F9] border-2 border-white/20 flex items-center justify-center text-white text-[10px] font-semibold shadow-[0_0_10px_rgba(128,152,249,0.3)] transition-transform duration-200 hover:scale-125 hover:z-10"
                        >
                          {member}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
