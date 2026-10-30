import React from 'react';
import { Input } from '@/components/ui/input';

export default function QText({ value, onChange, placeholder }) {
  return (
    <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="bg-background h-9" />
  );
}