import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Plus, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { fmtTime } from '@/lib/dexMonitorFormat';

export default function DexRiskMonitorSection() {
  const [stats, setStats] = useState(null);

  const load = async () => {
    try {
      const [connections, snaps, alerts] = await Promise.all([
        base44.entities.DexMonitorConnection.list('-created_date', 100),
        base44.entities.DexAccountSnapshot.list('-captured_at', 100),
        base44.entities.RiskAlert.filter({ status: 'active' }, '-last_detected_at', 500),
      ]);
      // 每个连接取最新快照
      const latestByConn = {};
      for (const s of snaps) { if (!latestByConn[s.connection_id]) latestByConn[s.connection_id] = s; }
      let normal = 0, high = 0, lastSync = null;
      for (const c of connections) {
        const sn = latestByConn[c.id];
        const st = sn?.risk_status || (c.status === 'active' ? 'normal' : 'normal');
        if (st === 'normal' || st === 'cautious') normal++;
        else high++;
        const t = sn?.captured_at || c.last_synced_at;
        if (t && (!lastSync || new Date(t) > new Date(lastSync))) lastSync = t;
      }
      setStats({ connected: connections.length, normal, high, activeAlerts: alerts.length, lastSync });
    } catch (e) { setStats(null); }
  };

  useEffect(() => { load(); }, []);

  return (
    <section className="border border-border rounded bg-card/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-heading text-foreground">风险监控</h2>
        </div>
        <Link to="/risk-monitor" className="flex items-center gap-1 text-[11px] text-primary hover:underline">查看风险监控</Link>
      </div>

      {!stats || stats.connected === 0 ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">尚未添加监控账户。通过公开地址只读监控 Hyperliquid 与 Lighter。</p>
          <Link to="/risk-monitor" className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border border-primary/40 text-primary hover:bg-primary/10">
            <Plus className="w-3.5 h-3.5" />添加公开地址监控
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat label="已连接 DEX 账户" value={stats.connected} />
            <Stat label="正常 / 谨慎" value={stats.normal} cls="text-success" />
            <Stat label="高风险 / 暂停" value={stats.high} cls="text-orange-400" />
            <Stat label="活跃风险提醒" value={stats.activeAlerts} cls={stats.activeAlerts > 0 ? 'text-destructive' : ''} />
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="font-mono">最近同步 {fmtTime(stats.lastSync)}</span>
            <Link to="/risk-monitor" className="flex items-center gap-1 text-primary hover:underline"><RefreshCw className="w-3 h-3" />前往刷新</Link>
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, cls }) {
  return (
    <div className="border border-border rounded px-2.5 py-1.5 bg-background/40">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-lg font-heading font-mono ${cls || 'text-foreground'}`}>{value}</div>
    </div>
  );
}