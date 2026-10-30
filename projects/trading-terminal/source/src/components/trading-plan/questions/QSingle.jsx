import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function QSingle({ value, customValue, options, custom, customOption = '自定义', customType = 'text', customPlaceholder, onChange, onCustomChange }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button key={opt} type="button" onClick={() => onChange(opt)}
              className={cn('px-3 py-2 rounded border text-xs text-left transition-colors',
                active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40')}>
              {opt}
            </button>
          );
        })}
      </div>
      {custom && value === customOption && (
        <Input
          type={customType}
          value={customValue ?? ''}
          onChange={(e) => onCustomChange(customType === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
          placeholder={customPlaceholder || '请输入'}
          className="h-9 w-40 bg-background"
        />
      )}
    </div>
  );
}