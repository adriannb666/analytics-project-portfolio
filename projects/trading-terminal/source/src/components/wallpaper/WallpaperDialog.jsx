import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { X, RefreshCw, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { extractRules } from '@/lib/wallpaperRules';
import { downloadWallpaper, SIZES } from '@/lib/wallpaperCanvas';
import WallpaperPreview from './WallpaperPreview';

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function Seg({ options, value, onChange }) {
  return (
    <div className="flex border border-border rounded-sm overflow-hidden">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`flex-1 px-2.5 py-1.5 ${value === o.v ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-2 cursor-pointer py-1">
      <span className="text-muted-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export default function WallpaperDialog({ open, onOpenChange, ctx, plan }) {
  const { toast } = useToast();
  const [device, setDevice] = useState('desktop');
  const [template, setTemplate] = useState('highlight');
  const [sizeKey, setSizeKey] = useState('1920x1080');
  const [bottomIdx, setBottomIdx] = useState(0);
  const [showPlanName, setShowPlanName] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showFlags, setShowFlags] = useState(true);
  const [seed, setSeed] = useState(0);

  const sig = useMemo(
    () =>
      JSON.stringify(ctx.answers || {}) +
      '|' + JSON.stringify((ctx.flags || []).map((f) => [f.id, f.status, f.severity])) +
      '|' + (ctx.plan && ctx.plan.plan_name || '') + '|' + (ctx.plan && ctx.plan.version || ''),
    [ctx]
  );
  const rules = useMemo(() => extractRules(ctx), [sig, seed]);
  const lines = rules.bottomLines || [];
  const bottomLine = lines.length ? lines[bottomIdx % lines.length] : rules.bottomLine;
  const options = { showPlanName, showDate, showFlags, bottomLine };

  const onDevice = (d) => {
    setDevice(d);
    setSizeKey(SIZES[d][0].key);
  };
  const regen = () => {
    setSeed((s) => s + 1);
    const n = lines.length;
    if (n > 1) {
      let i = bottomIdx;
      while (i === bottomIdx) i = Math.floor(Math.random() * n);
      setBottomIdx(i);
    }
  };
  const dl = () => {
    if (!rules.sufficient) {
      toast({ title: '核心规则不足', description: '当前计划中的风险和执行规则不足，建议先完善交易计划。', variant: 'destructive' });
      return;
    }
    try {
      downloadWallpaper(rules, { device, template, sizeKey, ...options });
      toast({ title: device === 'desktop' ? '桌面壁纸已生成' : '手机壁纸已生成', description: '已开始下载 PNG 文件。' });
    } catch (e) {
      toast({ title: '壁纸生成失败', description: '请稍后重试。', variant: 'destructive' });
    }
  };

  const updated = plan && plan.updated_date ? new Date(plan.updated_date).toLocaleString('zh-CN', { hour12: false }) : '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-w-6xl w-[95vw] max-h-[92vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 pr-12 border-b border-border shrink-0 text-left">
          <DialogTitle>生成规则壁纸</DialogTitle>
          <DialogDescription>将当前交易计划中的核心风险、执行和纪律规则生成桌面或手机壁纸。</DialogDescription>
          <div className="mt-2 text-[11px] font-mono text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
            <span>计划：<span className="text-foreground">{plan && plan.plan_name || '—'}</span></span>
            <span>版本：<span className="text-foreground">{plan && plan.version || '—'}</span></span>
            <span>更新：<span className="text-foreground">{updated}</span></span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {!plan ? (
            <div className="p-6 text-sm text-muted-foreground border-l-2 border-warning/40 ml-4 mt-4">请先生成完整交易计划，再创建规则壁纸。</div>
          ) : !rules.sufficient ? (
            <div className="p-6 text-sm text-muted-foreground border-l-2 border-warning/40 ml-4 mt-4">当前计划中的风险和执行规则不足，建议先完善交易计划。</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr]">
              <div className="p-4 border-b lg:border-b-0 lg:border-r border-border space-y-4 text-xs">
                <Field label="设备类型"><Seg options={[{ v: 'desktop', l: '桌面' }, { v: 'mobile', l: '手机' }]} value={device} onChange={onDevice} /></Field>
                <Field label="模板样式"><Seg options={[{ v: 'minimal', l: '深色简洁' }, { v: 'highlight', l: '重点高亮' }]} value={template} onChange={setTemplate} /></Field>
                <Field label="分辨率">
                  <select value={sizeKey} onChange={(e) => setSizeKey(e.target.value)} className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs">
                    {SIZES[device].map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </Field>
                <Field label="提醒语">
                  <select value={bottomIdx} onChange={(e) => setBottomIdx(Number(e.target.value))} className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs">
                    {lines.map((b, i) => <option key={i} value={i}>{b}</option>)}
                  </select>
                </Field>
                <div className="space-y-0.5 pt-1 border-t border-border/60">
                  <Toggle label="显示计划名称" checked={showPlanName} onChange={setShowPlanName} />
                  <Toggle label="显示生成日期" checked={showDate} onChange={setShowDate} />
                  <Toggle label="显示未解决冲突数量" checked={showFlags} onChange={setShowFlags} />
                </div>
              </div>
              <div className="p-4 flex justify-center bg-background/30 min-h-[300px]">
                <WallpaperPreview rules={rules} device={device} template={template} sizeKey={sizeKey} options={options} />
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border px-5 py-3 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}><X className="w-3.5 h-3.5 mr-1.5" />关闭</Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={regen} disabled={!rules.sufficient}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />重新生成</Button>
            <Button size="sm" onClick={dl} disabled={!rules.sufficient}><Download className="w-3.5 h-3.5 mr-1.5" />下载 PNG</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}