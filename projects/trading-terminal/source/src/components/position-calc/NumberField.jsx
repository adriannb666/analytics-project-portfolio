import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function NumberField({ label, value, onChange, placeholder, error, suffix, min = 0, step = 'any' }) {
  return (
    <div className="space-y-1">
      {label && <Label className="text-xs text-muted-foreground">{label}</Label>}
      <div className="relative">
        <Input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={suffix ? 'pr-12 bg-background' : 'bg-background'}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">{suffix}</span>
        )}
      </div>
      {error && <p className="text-[11px] text-destructive leading-snug">{error}</p>}
    </div>
  );
}