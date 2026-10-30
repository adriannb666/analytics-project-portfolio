import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap } from 'lucide-react';
import AutoSyncPanel from '@/components/journal/AutoSyncPanel';

export default function TradeSync() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/journal')}><ArrowLeft className="w-4 h-4 mr-1" />返回列表</Button>
      </div>
      <div>
        <h1 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2"><Zap className="w-4 h-4 text-primary" />自动同步交易</h1>
        <p className="mt-1 text-xs text-muted-foreground">通过公开持仓变化自动记录交易，无需 API Key 或交易权限。</p>
      </div>
      <AutoSyncPanel />
    </div>
  );
}