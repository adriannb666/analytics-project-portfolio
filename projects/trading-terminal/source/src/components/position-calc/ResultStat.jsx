import React from 'react';
import { cn } from '@/lib/utils';

export default function ResultStat({ label, value, unit, emphasis, tone }) {
  return (
    <div className={cn('rounded border p-3', emphasis ? 'border-primary/30 bg-primary/5' : 'border-border bg-card')}>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn(
        'mt-1 font-mono',
        emphasis ? 'text-2xl text-primary' : 'text-sm text-foreground',
        tone === 'green' && 'text-success',
        tone === 'red' && 'text-destructive'
      )}>
        {value}
        {unit && <span className="ml-1 text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}