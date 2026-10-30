import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Hand, Zap } from 'lucide-react';

export default function NewTradeDialog({ open, onOpenChange }) {
  const navigate = useNavigate();

  const choose = (mode) => {
    onOpenChange(false);
    if (mode === 'manual') navigate('/journal/new');
    else navigate('/journal/sync');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">新建交易记录</DialogTitle>
          <DialogDescription className="text-xs">选择记录方式</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2 pt-1">
          <button
            onClick={() => choose('manual')}
            className="flex items-start gap-3 border border-border rounded p-3 text-left hover:bg-accent/40 transition-colors mobile-tap"
          >
            <Hand className="w-5 h-5 text-info mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-heading text-foreground">手动记录</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">手动录入平台、标的、入场 / 出场、仓位、止损止盈、交易逻辑与复盘情绪。</div>
            </div>
          </button>
          <button
            onClick={() => choose('automatic')}
            className="flex items-start gap-3 border border-border rounded p-3 text-left hover:bg-accent/40 transition-colors mobile-tap"
          >
            <Zap className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-heading text-foreground">自动同步</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">从已添加的公开监控账户自动同步成交记录，无需重新输入地址。</div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}