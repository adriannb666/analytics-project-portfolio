import React, { useEffect, useRef, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ShieldAlert, ShieldCheck, RefreshCw, Plus, AlertTriangle } from 'lucide-react';
import AccountList from '@/components/risk-monitor/AccountList';
import AddAccountDialog from '@/components/risk-monitor/AddAccountDialog';
import ConnectionEditDialog from '@/components/risk-monitor/ConnectionEditDialog';
import AccountOverview from '@/components/risk-monitor/AccountOverview';
import PositionsTable from '@/components/risk-monitor/PositionsTable';
import RiskAlertsList from '@/components/risk-monitor/RiskAlertsList';
import { syncConnection } from '@/lib/dexMonitorApi';
import { useToast } from '@/components/ui/use-toast';

export default function RiskMonitor() {
  const { toast } = useToast();
  const [connections, setConnections] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [syncData, setSyncData] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(60);
  const [addOpen, setAddOpen] = useState(false);
  const [editConn, setEditConn] = useState(null);
  const [deleteConn, setDeleteConn] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const timerRef = useRef(null);

  const loadConnections = useCallback(async () => {
    const list = await base44.entities.DexMonitorConnection.list('-created_date', 50);
    setConnections(list);
    return list;
  }, []);

  const loadPlans = useCallback(async () => {
    const list = await base44.entities.TradingPlan.filter({}, '-updated_date', 50);
    setPlans(list);
  }, []);

  useEffect(() => {
    (async () => {
      const [conns] = await Promise.all([loadConnections(), loadPlans()]);
      if (conns && conns[0] && !selectedId) setSelectedId(conns[0].id);
    })();
  }, []);

  // auto refresh with countdown + background throttle + exponential backoff
  useEffect(() => {
    if (!selectedId) { setSyncData(null); return; }
    let active = true;
    let failCount = 0;
    let nextDelay = 60;

    const doSync = async (manual = false) => {
      const hidden = !manual && document.visibilityState === 'hidden';
      if (hidden) { nextDelay = 300; schedule(); return; }
      if (!manual) setSyncing(true);
      try {
        const data = await syncConnection(selectedId);
        if (!active) return;
        setSyncData(data); setError(null);
        failCount = 0; nextDelay = 60;
        // refresh connection list meta (last_synced_at)
        setConnections((prev) => prev.map((c) => c.id === selectedId ? { ...c, last_synced_at: new Date().toISOString(), status: 'active' } : c));
      } catch (e) {
        if (!active) return;
        const msg = e?.response?.data?.error || e?.message || '同步失败';
        setError(msg);
        failCount = Math.min(failCount + 1, 5);
        nextDelay = Math.min(60 * Math.pow(2, failCount), 300);
      } finally { if (active) setSyncing(false); }
      if (!manual) schedule();
    };
    const schedule = () => {
      setCountdown(nextDelay);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => doSync(), nextDelay * 1000);
    };

    setSyncData(null);
    doSync();
    const cd = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    const onVis = () => { if (document.visibilityState === 'visible') { if (timerRef.current) clearTimeout(timerRef.current); doSync(); } };
    document.addEventListener('visibilitychange', onVis);
    return () => { active = false; clearTimeout(timerRef.current); clearInterval(cd); document.removeEventListener('visibilitychange', onVis); };
  }, [selectedId]);

  const manualRefresh = async () => {
    if (!selectedId) return;
    setSyncing(true);
    try {
      const data = await syncConnection(selectedId);
      setSyncData(data); setError(null);
      toast({ title: '已刷新' });
      setConnections((prev) => prev.map((c) => c.id === selectedId ? { ...c, last_synced_at: new Date().toISOString(), status: 'active' } : c));
      setCountdown(60); // 既有定时器会继续按 60s 周期运行
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || '同步失败');
      toast({ title: '刷新失败', variant: 'destructive' });
    } finally { setSyncing(false); }
  };

  const handleAdd = async () => { await loadConnections(); const list = connections; if (list[0] && !selectedId) setSelectedId(list[0].id); };
  const handleEditSaved = async () => { await loadConnections(); };
  const handleDelete = async () => {
    if (!deleteConn) return;
    setDeleting(true);
    try {
      await base44.entities.DexMonitorConnection.delete(deleteConn.id);
      toast({ title: '已删除监控连接' });
      setDeleteConn(null);
      const list = await loadConnections();
      if (selectedId === deleteConn.id) setSelectedId(list[0]?.id || null);
    } catch (e) {
      toast({ title: '删除失败', description: (e && e.message) || '请重试', variant: 'destructive' });
    } finally { setDeleting(false); }
  };

  const selectedConn = connections.find((c) => c.id === selectedId);

  return (
    <div className="px-4 md:px-6 py-5 max-w-[1400px] mx-auto space-y-4">
      {/* header */}
      <div>
        <h1 className="text-xl font-heading font-semibold text-foreground flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-primary" />风险监控</h1>
        <p className="mt-1 text-sm text-muted-foreground">通过公开地址监控 Hyperliquid 和 Lighter 账户，并根据你的交易计划识别仓位、杠杆和回撤风险。</p>
        <div className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground border border-border bg-card/20 rounded px-2.5 py-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
          <span>本模块仅使用公开地址读取只读数据。知行交易终端不会要求或保存私钥、助记词或交易所 API Secret。不执行下单、撤单、改单、平仓或任何资金操作。</span>
        </div>
      </div>

      {/* account list */}
      <AccountList connections={connections} selectedId={selectedId} onSelect={setSelectedId}
        onRefresh={(id) => id === selectedId ? manualRefresh() : setSelectedId(id)}
        onAdd={() => setAddOpen(true)} onEdit={setEditConn} onDelete={setDeleteConn} syncingId={selectedId} />

      {/* selected account workspace */}
      {selectedConn ? (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">账户</span>
              <span className="font-heading text-foreground">{selectedConn.account_name}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{selectedConn.wallet_address}</span>
              {selectedConn.platform === 'lighter' && <span className="text-[10px] text-muted-foreground">· index {selectedConn.lighter_account_index}</span>}
            </div>
            <div className="flex items-center gap-2">
              {error && <span className="text-[11px] text-destructive flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{error}</span>}
              <span className="text-[10px] text-muted-foreground font-mono">下次刷新 {countdown}s</span>
              <Button size="sm" variant="outline" onClick={manualRefresh} disabled={syncing}>
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />{syncing ? '同步中' : '手动刷新'}
              </Button>
            </div>
          </div>

          {syncData ? (
            <>
              <AccountOverview data={syncData} connection={selectedConn} />
              <div>
                <div className="text-xs font-heading text-foreground uppercase tracking-wider mb-2">持仓表</div>
                <PositionsTable positions={syncData.positions} stopReadable={syncData.stop_readable} />
              </div>
              <div>
                <div className="text-xs font-heading text-foreground uppercase tracking-wider mb-2">风险提醒 · {syncData.alerts?.length || 0}</div>
                <RiskAlertsList alerts={syncData.alerts} />
              </div>
            </>
          ) : (
            <div className="border border-border rounded p-8 text-center text-sm text-muted-foreground">{syncing ? '正在同步账户数据…' : '选择账户后点击刷新'}</div>
          )}
        </>
      ) : (
        <div className="border border-dashed border-border rounded p-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">尚未选择监控账户。</p>
          <Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-1.5" />添加公开地址监控</Button>
        </div>
      )}

      <AddAccountDialog open={addOpen} onOpenChange={setAddOpen} plans={plans} onSaved={handleAdd} />
      <ConnectionEditDialog open={!!editConn} onOpenChange={(o) => !o && setEditConn(null)} connection={editConn} plans={plans} onSaved={handleEditSaved} />

      <AlertDialog open={!!deleteConn} onOpenChange={(o) => !o && setDeleteConn(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除监控连接</AlertDialogTitle>
            <AlertDialogDescription>仅删除本终端的监控配置，不会影响链上账户或资金。该操作不可撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{deleting ? '删除中…' : '确认删除'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}