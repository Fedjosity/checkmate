import React from 'react';
import { Rank } from '@checkmate/shared-types';
import { cn } from '@/lib/utils/cn';

interface RankBadgeProps {
  rank: Rank;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export function RankBadge({ rank, size = 'md', className, showLabel = true }: RankBadgeProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-10 h-10 text-lg',
    lg: 'w-16 h-16 text-3xl',
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div 
        className={cn(
          'flex items-center justify-center rounded-full font-bold luxury-glow bg-surface border',
          sizeClasses[size]
        )}
        style={{ color: rank.color, borderColor: `${rank.color}40` }}
        title={rank.label}
      >
        {rank.icon}
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="font-bold tracking-wider" style={{ color: rank.color }}>
            {rank.label}
          </span>
          <span className="text-xs text-muted">{rank.rp.toLocaleString()} RP</span>
        </div>
      )}
    </div>
  );
}
