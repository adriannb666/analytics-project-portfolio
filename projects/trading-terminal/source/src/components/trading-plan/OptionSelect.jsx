import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SingleChoice({ value, options, onChange }) {
  return (
    <div className="grid gap-2">
      {options.map(opt => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded border text-sm text-left transition-colors',
              selected ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
          >
            <span className={cn('w-4 h-4 rounded-full border flex items-center justify-center shrink-0', selected ? 'border-primary' : 'border-muted-foreground/40')}>
              {selected && <span className="w-2 h-2 rounded-full bg-primary" />}
            </span>
            <span className="font-heading">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

export function MultiChoice({ value = [], options, onChange, other, otherValue, onOtherChange }) {
  const toggle = (opt) => {
    if (value.includes(opt)) onChange(value.filter(v => v !== opt));
    else onChange([...value, opt]);
  };
  return (
    <div className="grid gap-2">
      {options.map(opt => {
        const selected = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded border text-sm text-left transition-colors',
              selected ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
          >
            <span className={cn('w-4 h-4 rounded-sm border flex items-center justify-center shrink-0', selected ? 'border-primary bg-primary' : 'border-muted-foreground/40')}>
              {selected && <Check className="w-3 h-3 text-primary-foreground" />}
            </span>
            <span className="font-heading">{opt}</span>
          </button>
        );
      })}
      {other && value.includes('其他') && (
        <input
          type="text"
          value={otherValue || ''}
          onChange={e => onOtherChange(e.target.value)}
          placeholder="请说明其他账户或产品"
          className="w-full px-3 py-2 rounded border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        />
      )}
    </div>
  );
}