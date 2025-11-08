import { MessageSquare, Package } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Task {
  icon: React.ElementType;
  title: string;
  date: string;
  time: string;
  color: string;
}

const tasks: Task[] = [
  {
    icon: MessageSquare,
    title: 'UI/UX - Discussion',
    date: '27 Oct 2020',
    time: 'Tuesday',
    color: 'glass-light text-[#8098F9]'
  },
  {
    icon: Package,
    title: 'Animation - 3D Animation',
    date: '27 Oct 2020',
    time: 'Tuesday',
    color: 'glass-light text-purple-400'
  }
];

export function UpcomingTasks() {
  return (
    <div className="glass-medium rounded-2xl p-6">
      <h3 className="text-lg font-bold text-text-primary mb-4">
        Upcoming Task
      </h3>
      <div className="space-y-3">
        {tasks.map((task, idx) => (
          <div key={idx} className="flex items-center space-x-3 p-3 rounded-xl glass-hover transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(128,152,249,0.3)] transition-transform duration-200 hover:scale-110 ${task.color}`}>
              <task.icon className="w-5 h-5 transition-transform duration-200" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-text-primary">
                {task.title}
              </h4>
              <p className="text-xs text-text-tertiary">
                {task.date}, {task.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
