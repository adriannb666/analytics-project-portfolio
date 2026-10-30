// 自动交易同步：登录后按固定间隔同步所有已接入的监控账户，
// 通过公开持仓变化将交易绩效自动写入交易日志。
// 运行在用户会话内（保留 RLS 与交易日志归属），无需后端服务角色或工作流。
import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { syncConnection } from '@/lib/dexMonitorApi';

const SYNC_INTERVAL = 5 * 60 * 1000; // 每 5 分钟轮询一次
const MIN_GAP = 4 * 60 * 1000;      // 单连接 4 分钟内不重复同步（与后端快照去重窗口对齐）
const STAGGER = 900;                // 连接间错峰，降低 Lighter 429 风险

export function useAutoTradeSync() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { data: connections = [] } = useQuery({
    queryKey: ['dex-connections'],
    queryFn: () => base44.entities.DexMonitorConnection.list('-created_date', 100),
    enabled: !!isAuthenticated,
    staleTime: SYNC_INTERVAL,
  });
  const lastSync = useRef({});
  const running = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const run = async () => {
      if (running.current) return;
      const active = (connections || []).filter((c) => c.status === 'active' || c.status === 'error');
      if (!active.length) return;
      running.current = true;
      try {
        let changed = false;
        for (const c of active) {
          const now = Date.now();
          if (now - (lastSync.current[c.id] || 0) < MIN_GAP) continue;
          lastSync.current[c.id] = now;
          try {
            await syncConnection(c.id);
            changed = true;
          } catch (e) {
            // 静默：429 / 网络错误不干扰用户，下次轮询自动重试
          }
          await new Promise((r) => setTimeout(r, STAGGER));
        }
        if (changed) {
          queryClient.invalidateQueries({ queryKey: ['trade-journals'] });
          queryClient.invalidateQueries({ queryKey: ['dex-connections'] });
        }
      } finally {
        running.current = false;
      }
    };
    const initial = setTimeout(run, 3000); // 首次进入延迟 3s，避免与页面加载争抢
    const timer = setInterval(run, SYNC_INTERVAL);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, [isAuthenticated, connections, queryClient]);
}