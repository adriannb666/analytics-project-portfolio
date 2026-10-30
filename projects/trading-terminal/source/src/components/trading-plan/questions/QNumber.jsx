import React from 'react';
import { Input } from '@/components/ui/input';

export default function QNumber({ value, onChange, min, max, placeholder }) {
  return (
    <Input
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      min={min}
      max={max}
      placeholder={placeholder}
      className="bg-background h-9 w-40"
    />
  );
}