'use client';

import { cn } from '@/lib/utils';

type LoaderVariant = 'page' | 'section' | 'inline';
type LoaderSize = 'sm' | 'md' | 'lg';

interface LoaderProps {
  message?: string;
  className?: string;
  variant?: LoaderVariant;
  size?: LoaderSize;
}

const wrapperPadding: Record<LoaderVariant, string> = {
  page: 'py-20',
  section: 'py-12',
  inline: '',
};

const containerSize: Record<LoaderSize, string> = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
};

const spinnerSize: Record<LoaderSize, string> = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

export function Loader({
  message,
  className,
  variant = 'page',
  size = 'md',
}: LoaderProps) {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-center text-center',
        wrapperPadding[variant],
        className
      )}
    >
      <div className="relative flex flex-col items-center gap-4">
        <div
          className={cn(
            'rounded-2xl border border-white/10 glass-medium flex items-center justify-center',
            containerSize[size]
          )}
        >
          <div
            className={cn(
              'animate-spin rounded-full border-2 border-primary border-t-transparent',
              spinnerSize[size]
            )}
          ></div>
        </div>
        {message && (
          <p className="text-sm font-medium text-text-secondary max-w-xs">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
