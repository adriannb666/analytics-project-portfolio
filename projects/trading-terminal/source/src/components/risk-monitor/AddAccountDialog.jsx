import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { validateConnection } from '@/lib/dexMonitorApi';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { PLATFORM_LABEL, fmtAddr } from '@/lib/dexMonitorFormat';

const isAddr = (s) => /^0x[a-fA-F0-9]{40}$/.test((s || '').trim());

export default function AddAccountDialog({ open, onOpenChange, plans, onSaved }) {
  const { toast } = useToast();
  const [platform, setPlatform] = useState('hyperliquid');
  const [wallet, setWallet] = useState('');
  const [accountName, setAccountName] = useState('');
  const [planId, setPlanId] = useState('');
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState(null);
  const [discoveredAccounts, setDiscoveredAccounts] = useState(null);
  const [saving, setSaving] = useState(false);
  // Lighter 连接方式：manual（默认，手动输入 Account Index）/ discover（按 Ethereum 地址自动发现）
  const [lighterMode, setLighterMode] = useState('manual');
  const [lighterIndex, setLighterIndex] = useState('');

  const reset = () => {
    setWallet(''); setAccountName(''); setPlanId(''); setResult(null);
    setDiscoveredAccounts(null); setPlatform('hyperliquid');
    setLighterMode('manual'); setLighterIndex('');
  };

  // ---------- Hyperliquid：沿用钱包地址验证 ----------
  const validateHyperliquid = async () => {
    if (!isAddr(wallet)) { toast({ title: '请输入合法的 Ethereum 0x 地址', variant: 'destructive' }); return; }
    setValidating(true); setResult(null);
    try {
      const res = await validateConnection({ platform: 'hyperliquid', wallet_address: wallet.trim() });
      setResult({ valid: true, ...res });
    } catch (e) {
      const data = e?.response?.data || {};
      setResult({ valid: false, message: data.error || '验证失败，请稍后重试' });
    } finally { setValidating(false); }
  };

  // ---------- Lighter 方式二：手动输入 Account Index（默认/推荐）----------
  const validateManual = async () => {
    const idx = lighterIndex.replace(/[^0-9]/g, '');
    if (idx === '') { toast({ title: '请输入 Lighter Account Index（整数）', variant: 'destructive' }); return; }
    setValidating(true); setResult(null); setDiscoveredAccounts(null);
    try {
      const res = await validateConnection({
        platform: 'lighter',
        lighter_account_index: Number(idx),
        wallet_address: isAddr(wallet) ? wallet.trim() : '',
      });
      setResult({ valid: true, ...res });
    } catch (e) {
      const status = e?.response?.status;
      const data = e?.response?.data || {};
      if (status === 429 || data.allow_manual_index) {
        setResult({ valid: false, message: 'Lighter 自动发现暂时不可用，请使用 Account Index 连接。' });
        return;
      }
      setResult({ valid: false, message: data.error || '验证失败，请确认 Account Index 正确后重试' });
    } finally { setValidating(false); }
  };

  // ---------- Lighter 方式一：自动发现账户 ----------
  const validateDiscover = async () => {
    if (!isAddr(wallet)) { toast({ title: '请输入合法的 Ethereum 0x 地址', variant: 'destructive' }); return; }
    setValidating(true); setResult(null); setDiscoveredAccounts(null);
    try {
      const res = await validateConnection({ platform: 'lighter', wallet_address: wallet.trim() });
      if (res.needs_selection === false || res.needs_selection === true) {
        setDiscoveredAccounts(res.accounts || []);
        if (res.accounts && res.accounts.length === 1) {
          // 唯一账户自动选中并查询详情
          await pickDiscovered(res.accounts[0].index);
        }
        return;
      }
      if (res.valid === false) {
        // 无账户或失败：引导手动输入，不阻塞
        setResult({ valid: false, message: res.message || '无法自动发现 Lighter 账户，请手动输入 Account Index。' });
        setLighterMode('manual');
        return;
      }
      setResult({ valid: true, ...res });
    } catch (e) {
      const status = e?.response?.status;
      const data = e?.response?.data || {};
      if (status === 429 || data.allow_manual_index) {
        // 429：不向用户暴露 endpoint / status，引导手动输入
        setResult({ valid: false, message: 'Lighter 自动发现暂时不可用，请使用 Account Index 连接。' });
        setLighterMode('manual');
        return;
      }
      setResult({ valid: false, message: data.error || '验证失败，请稍后重试' });
    } finally { setValidating(false); }
  };

  const pickDiscovered = async (idx) => {
    setValidating(true); setResult(null);
    try {
      const res = await validateConnection({ platform: 'lighter', wallet_address: wallet.trim(), lighter_account_index: idx });
      setResult({ valid: true, ...res });
    } catch (e) {
      const data = e?.response?.data || {};
      setResult({ valid: false, message: data.error || '验证失败，请稍后重试' });
    } finally { setValidating(false); }
  };

  const doValidate = () => {
    if (platform === 'hyperliquid') return validateHyperliquid();
    return lighterMode === 'manual' ? validateManual() : validateDiscover();
  };

  const canConfirm = () => {
    if (!result?.valid) return false;
    if (platform === 'lighter') return result.lighter_account_index != null && result.lighter_account_index !== '';
    return true;
  };

  const confirm = async () => {
    if (!canConfirm()) return;
    setSaving(true);
    try {
      const rec = {
        platform,
        account_name: accountName.trim() || (platform === 'hyperliquid' ? 'Hyperliquid 账户' : 'Lighter 账户'),
        trading_plan_id: planId || null,
        status: 'active',
      };
      if (platform === 'hyperliquid') {
        rec.wallet_address = wallet.trim();
      } else {
        // Lighter：account_index 必填，l1_address 可选
        rec.lighter_account_index = Number(result.lighter_account_index);
        rec.wallet_address = isAddr(wallet) ? wallet.trim() : '';
      }
      await base44.entities.DexMonitorConnection.create(rec);
      toast({ title: '已添加监控账户' });
      reset();
      onSaved && onSaved();
      onOpenChange(false);
    } catch (e) {
      toast({ title: '添加失败', description: (e && e.message) || '请重试', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const switchPlatform = (p) => {
    setPlatform(p); setResult(null); setDiscoveredAccounts(null);
    if (p !== 'hyperliquid') setLighterMode('manual');
  };

  const isLighter = platform === 'lighter';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" />添加监控账户</DialogTitle>
          <DialogDescription>仅读取公开地址数据。本终端不会要求或保存私钥、助记词或 API Secret。</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">平台</Label>
            <div className="flex gap-2 mt-1">
              {['hyperliquid', 'lighter'].map((p) => (
                <button key={p} type="button" onClick={() => switchPlatform(p)}
                  className={`flex-1 h-9 rounded border text-xs transition-colors mobile-tap ${platform === p ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
                  {PLATFORM_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          {isLighter && (
            <div>
              <Label className="text-xs">连接方式</Label>
              <div className="flex gap-2 mt-1">
                <button type="button" onClick={() => { setLighterMode('manual'); setResult(null); setDiscoveredAccounts(null); }}
                  className={`flex-1 h-9 rounded border text-xs mobile-tap ${lighterMode === 'manual' ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
                  Account Index（推荐）
                </button>
                <button type="button" onClick={() => { setLighterMode('discover'); setResult(null); setDiscoveredAccounts(null); }}
                  className={`flex-1 h-9 rounded border text-xs mobile-tap ${lighterMode === 'discover' ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
                  自动发现账户
                </button>
              </div>
            </div>
          )}

          {isLighter && lighterMode === 'manual' && (
            <div>
              <Label className="text-xs">Lighter Account Index <span className="text-destructive">*</span></Label>
              <Input value={lighterIndex} onChange={(e) => { setLighterIndex(e.target.value.replace(/[^0-9]/g, '')); setResult(null); }}
                placeholder="例如 0、1、2（整数）" className="mt-1 font-mono text-xs" inputMode="numeric" />
              <div className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                Account Index 可在 Lighter 客户端账户设置中查看。直接按 Index 查询账户详情，不依赖地址发现接口。
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs">
              {isLighter
                ? (lighterMode === 'discover' ? 'Ethereum L1 地址 *' : 'Ethereum L1 地址（可选）')
                : '公开钱包地址 *'}
            </Label>
            <Input value={wallet} onChange={(e) => { setWallet(e.target.value); setResult(null); setDiscoveredAccounts(null); }}
              placeholder="0x…" className="mt-1 font-mono text-xs" />
            {isLighter && lighterMode === 'manual' && (
              <div className="text-[10px] text-muted-foreground mt-1">填写 L1 地址仅用于记录，验证与同步均以 Account Index 为准。</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">账户名称（可选）</Label>
              <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="主交易账户" className="mt-1 text-xs" />
            </div>
            <div>
              <Label className="text-xs">关联交易计划</Label>
              <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="mt-1 w-full h-9 text-xs bg-background border border-border rounded px-2">
                <option value="">不关联</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.plan_name}</option>)}
              </select>
            </div>
          </div>

          {discoveredAccounts && discoveredAccounts.length > 1 && (
            <div className="border border-border rounded p-2 space-y-1 max-h-40 overflow-y-auto">
              <div className="text-[11px] text-muted-foreground">检测到多个 Lighter 账户，请选择监控的 account index：</div>
              {discoveredAccounts.map((a) => (
                <button key={a.index} type="button" onClick={() => pickDiscovered(a.index)}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-left text-xs border border-border hover:bg-accent">
                  <span className="font-mono">index {a.index} · {a.account_type === 1 ? '主账户' : '子账户'}</span>
                  <span className="text-muted-foreground">保证金 {Number.isFinite(a.collateral) ? a.collateral.toFixed(2) : '—'}</span>
                </button>
              ))}
            </div>
          )}

          {result && result.valid === false && (
            <div className="text-xs text-destructive border border-destructive/40 bg-destructive/10 rounded p-2">
              <div className="flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{result.message}</span></div>
            </div>
          )}
          {result && result.valid && (
            <div className="border border-success/40 bg-success/10 rounded p-2 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-success font-heading"><CheckCircle2 className="w-4 h-4" />验证成功</div>
              <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                {result.wallet_address && <><span>{isLighter ? 'L1 地址' : '地址'}</span><span className="font-mono text-foreground">{fmtAddr(result.wallet_address)}</span></>}
                {isLighter && <><span>Account Index</span><span className="font-mono text-foreground">{result.lighter_account_index}</span></>}
                <span>账户权益</span><span className="text-foreground font-mono">{Number.isFinite(result.account_equity) ? result.account_equity : '—'}</span>
                <span>持仓数量</span><span className="text-foreground font-mono">{result.positions_count}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!canConfirm() ? (
            <Button onClick={doValidate} disabled={validating}>
              {validating ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />验证中</> : isLighter && lighterMode === 'manual' ? '按 Index 验证' : '验证地址'}
            </Button>
          ) : (
            <Button onClick={confirm} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />保存中</> : '确认添加'}
            </Button>
          )}
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>取消</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}