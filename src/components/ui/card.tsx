'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  hover?: boolean;
  gold?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
}

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ hover = false, gold = false, padding = 'md', className, children, onClick }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : undefined}
      transition={hover ? { duration: 0.2 } : undefined}
      className={cn(
        'rounded-2xl backdrop-blur-xl',
        gold
          ? 'bg-gold/10 border border-gold/20'
          : 'bg-white/5 border border-white/10',
        hover && 'cursor-pointer',
        paddingClasses[padding],
        className
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
