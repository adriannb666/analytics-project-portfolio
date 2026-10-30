import React from 'react';
import { cn } from '@/lib/utils';

export default function SegmentedToggle({ options, value, onChange, className }) {
  return (
    <div className={cn('inline-flex rounded-md border border-border bg-muted/40 p-0.5', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1.5 rounded text-xs font-heading transition-colors',
            value === opt.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}