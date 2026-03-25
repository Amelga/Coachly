import React from 'react';
import { cn } from '../lib/utils';

export const LogoIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 36 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.75" y="6.75" width="10.5" height="10.5" rx="3" fill="currentColor"/>
    <rect x="24.75" y="6.75" width="10.5" height="10.5" rx="3" fill="currentColor"/>
    <rect x="12.75" y="18.75" width="10.5" height="10.5" rx="3" fill="currentColor"/>
  </svg>
);

export const BrandName = ({ className }: { className?: string }) => (
  <div className={cn("font-display flex items-baseline tracking-tight", className)}>
    <span className="text-t1 font-extrabold">Coachly</span>
    <span className="inline-block w-1.5 h-1.5 bg-ac rounded-[2px] mx-1" />
    <span className="text-t3 italic font-normal">Fitness</span>
  </div>
);
