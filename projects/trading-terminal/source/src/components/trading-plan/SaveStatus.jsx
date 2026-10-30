import React from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAP = {
  saving: { icon: Loader2, text: '正在保存', cls: 'text-warning', spin: true },
  saved: { icon: Check, text: '已保存', cls: 'text-success', spin: false },
  error: { icon: AlertCircle, text: '保存失败', cls: 'text-destructive', spin: false },
};

export default function SaveStatus({ status, errorText, className }) {
  const cfg = MAP[status];
  if (!cfg) return null;
  const Icon = cfg.icon;
  const text = status === 'error' && errorText ? errorText : cfg.text;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-mono', cfg.cls, className)} title={text}>
      <Icon className={cn('w-3.5 h-3.5 shrink-0', cfg.spin && 'animate-spin')} />
      <span className="truncate max-w-[260px]">{text}</span>
    </span>
  );
}