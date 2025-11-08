'use client';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

interface Stage {
  name: string;
  status: 'completed' | 'in_progress' | 'pending';
  progress: number;
}

interface RealTimeProgressProps {
  projectId: number;
  onComplete?: () => void;
}

export function RealTimeProgress({ projectId, onComplete }: RealTimeProgressProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const data = await api.getProgress(projectId);
        setStages(data.stages);

        // Check if all stages are completed
        const allCompleted = data.stages.every((s: Stage) => s.status === 'completed');
        if (allCompleted && onComplete) {
          onComplete();
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();

    // Poll every 2 seconds for updates
    const interval = setInterval(fetchProgress, 2000);

    return () => clearInterval(interval);
  }, [projectId, onComplete]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const overallProgress = stages.reduce((acc, stage) => acc + stage.progress, 0) / stages.length;

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <div className="bg-white dark:bg-card-dark rounded-xl p-4 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Overall Progress
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {Math.round(overallProgress)}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Individual Stages */}
      <div className="space-y-3">
        {stages.map((stage, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-card-dark rounded-xl p-4 border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {stage.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : stage.status === 'in_progress' ? (
                  <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {stage.name}
                  </span>
                  <div className="mt-1 h-1.5 w-32 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        stage.status === 'completed'
                          ? 'bg-green-500'
                          : stage.status === 'in_progress'
                          ? 'bg-primary-500'
                          : 'bg-gray-300'
                      )}
                      style={{ width: `${stage.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <span
                className={cn(
                  'text-xs px-2 py-1 rounded-full font-medium',
                  stage.status === 'completed'
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : stage.status === 'in_progress'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                )}
              >
                {stage.status === 'completed'
                  ? 'Complete'
                  : stage.status === 'in_progress'
                  ? 'In Progress'
                  : 'Pending'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
