'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface SidebarContextType {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasLoadedFromStorage = useRef(false);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedState = localStorage.getItem('sidebarExpanded');
    if (savedState !== null) {
      setIsExpanded(savedState === 'true');
    }
    hasLoadedFromStorage.current = true;
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Don't save to localStorage until we've loaded from it (prevents overwriting with defaults)
    if (!hasLoadedFromStorage.current) return;
    
    localStorage.setItem('sidebarExpanded', isExpanded.toString());
  }, [isExpanded]);

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

