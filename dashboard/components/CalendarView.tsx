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
    <div className="bg-white dark:bg-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            NOV <span className="text-gray-400">2020</span>
          </h3>
          <div className="flex items-center space-x-2">
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Show:</span>
          <select className="text-sm bg-white dark:bg-gray-800 border-0 text-gray-900 dark:text-gray-100 focus:outline-none rounded px-2 py-1">
            <option>1 Week</option>
            <option>2 Weeks</option>
            <option>1 Month</option>
          </select>
          <ChevronLeft className="w-4 h-4 text-gray-400 rotate-90" />
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day, idx) => (
          <div key={day} className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{weekDates[idx]}</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{day}</div>
            <div className="space-y-2 min-h-[200px]">
              {/* Vertical axis label for first column */}
              {idx === 0 && (
                <div className="absolute left-6 top-32 flex flex-col items-center justify-center h-40">
                  <span className="text-xs text-gray-400 writing-mode-vertical-rl transform rotate-180">
                    Planning
                  </span>
                </div>
              )}
              {idx === 0 && (
                <div className="absolute left-6 top-80 flex flex-col items-center justify-center h-20">
                  <span className="text-xs text-gray-400 writing-mode-vertical-rl transform rotate-180">
                    In Progress
                  </span>
                </div>
              )}
              {idx === 0 && (
                <div className="absolute left-6 top-[26rem] flex flex-col items-center justify-center h-16">
                  <span className="text-xs text-gray-400 writing-mode-vertical-rl transform rotate-180">
                    Done
                  </span>
                </div>
              )}

              {events[weekDates[idx]]?.map((event, eventIdx) => (
                <div
                  key={eventIdx}
                  className={`p-2 rounded-lg text-xs ${event.color}`}
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
                          className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white dark:border-card-dark flex items-center justify-center text-white text-[10px] font-semibold"
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
