'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg glass-subtle hover:glass-light transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-110 active:scale-95"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)] transition-transform duration-300 hover:rotate-180" />
      ) : (
        <Moon className="w-5 h-5 text-text-secondary transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}
