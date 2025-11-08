'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface LogoProps {
  variant?: 'default' | 'compact' | 'icon';
  showText?: boolean;
  className?: string;
}

export function Logo({ variant = 'default', showText = true, className = '' }: LogoProps) {
  const logoSize = variant === 'compact' ? 40 : variant === 'icon' ? 64 : variant === 'default' ? 96 : 48;
  const textSize = variant === 'compact' ? 'text-lg' : 'text-xl';
  
  return (
    <Link href="/" className={`flex items-center gap-3 group ${className}`}>
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <Image
          src="/logo.png"
          alt="Project Scope Analyzer Logo"
          width={logoSize}
          height={logoSize}
          className="object-contain drop-shadow-lg group-hover:drop-shadow-xl transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
          priority
        />
      </motion.div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold bg-gradient-to-r from-[#8098F9] via-[#A78BFA] to-[#F472B6] bg-clip-text text-transparent ${textSize}`}>
            Project Scope Analyzer
          </span>
          {variant === 'default' && (
            <span className="text-xs text-text-tertiary -mt-1">AI-Powered Project Analysis</span>
          )}
        </div>
      )}
    </Link>
  );
}

