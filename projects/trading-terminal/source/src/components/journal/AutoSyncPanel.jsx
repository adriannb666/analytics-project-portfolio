import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { syncConnection } from '@/lib/dexMonitorApi';
import { PLATFORM_LABEL, fmtAddr, fmtTime } from '@/lib/dexMonitorFormat';

export default function AutoSyncPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [syncingId, setSyncingId] = useState(null);

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['dex-connections'],
    queryFn: () => base44.entities.DexMonitorConnection.list('-created_date', 100),
  });

  const handleSync = async (c) => {
    setSyncingId(c.id);
    try {
      const res = await syncConnection(c.id);
      const created = res.trades_created || 0;
      toast({
        title: created > 0 ? `同步完成 · 检出 ${created} 笔仓位变化` : '同步完成 · 无仓位变化',
        description: '通过公开持仓变化自动记录交易，无需 API Key 或交易权限。',
      });
      queryClient.invalidateQueries({ queryKey: ['trade-journals'] });
      queryClient.invalidateQueries({ queryKey: ['dex-connections'] });
    } catch (e) {
      const msg = (e && e.response && e.response.data && e.response.data.error) || (e && e.message) || '同步失败';
      toast({ title: '同步失败', description: msg, variant: 'destructive' });
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-1.5 text-xs text-muted-foreground leading-relaxed border border-border/60 bg-card/20 rounded p-2.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
        <span>通过公开持仓变化自动记录交易，无需 API Key 或交易权限。同步频率跟随风险监控刷新，不单独调用交易接口。</span>
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground py-6 text-center">加载监控账户中…</div>
      ) : connections.length === 0 ? (
        <div className="border border-dashed border-border rounded p-6 text-center">
          <div className="text-xs text-muted-foreground">尚未添加监控账户</div>
          <div className="text-[11px] text-muted-foreground mt-1">请先在「风险监控」模块添加公开钱包地址的监控账户。</div>
        </div>
      ) : (
        <div className="space-y-2">
          {connections.map((c) => {
            const syncing = syncingId === c.id;
            return (
              <div key={c.id} className="border border-border rounded bg-card/30 p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm border border-border text-muted-foreground">{PLATFORM_LABEL[c.platform]}</span>
                  <span className="text-sm font-heading text-foreground">{c.account_name || '未命名账户'}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${c.status === 'active' ? 'border-success/40 bg-success/10 text-success' : 'border-border text-muted-foreground'}`}>
                    {c.status === 'active' ? '正常' : c.status === 'error' ? '同步错误' : '已停用'}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono mt-1 truncate">
                  {fmtAddr(c.wallet_address)}{c.platform === 'lighter' && c.lighter_account_index != null ? ` · index ${c.lighter_account_index}` : ''}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-[10px] text-muted-foreground">最近同步：{fmtTime(c.last_synced_at)}</div>
                  <button
                    onClick={() => handleSync(c)}
                    disabled={syncing}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded border border-primary/40 text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? '同步中…' : '同步交易记录'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}