import React from 'react';
import { Textarea } from '@/components/ui/textarea';

export default function QTextArea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <Textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="bg-background min-h-[96px] text-sm leading-relaxed"
    />
  );
}