'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface GanttTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

export function GanttTooltip({ children, content, className }: GanttTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = (e: React.MouseEvent) => {
    setPosition({
      x: e.clientX,
      y: e.clientY,
    });
    setIsVisible(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setPosition({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  // Global mouse move handler to track cursor position
  useEffect(() => {
    if (!isVisible) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isVisible]);

  const tooltip = isVisible && mounted ? (
    <div
      ref={tooltipRef}
      className="fixed z-[100] pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y + 15}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="glass-medium text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-white/20 backdrop-blur-xl whitespace-nowrap">
        {content}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={className}
      >
        {children}
      </div>

      {mounted && tooltip && createPortal(tooltip, document.body)}
    </>
  );
}
