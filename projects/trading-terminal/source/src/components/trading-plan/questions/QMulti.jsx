import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function QMulti({ value = [], otherValue, options, other, otherOption = '其他', otherPlaceholder, onChange, onOtherChange }) {
  const arr = Array.isArray(value) ? value : [];
  const toggle = (opt) => onChange(arr.includes(opt) ? arr.filter((o) => o !== opt) : [...arr, opt]);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = arr.includes(opt);
          return (
            <button key={opt} type="button" onClick={() => toggle(opt)}
              className={cn('px-3 py-2 rounded border text-xs text-left transition-colors',
                active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40')}>
              {opt}
            </button>
          );
        })}
      </div>
      {other && arr.includes(otherOption) && (
        <Input value={otherValue || ''} onChange={(e) => onOtherChange(e.target.value)} placeholder={otherPlaceholder || '请说明'} className="h-9 bg-background" />
      )}
    </div>
  );
}