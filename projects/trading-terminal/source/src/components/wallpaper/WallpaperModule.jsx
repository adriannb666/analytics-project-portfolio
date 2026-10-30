import React, { useMemo, useState } from 'react';
import { Download, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import TerminalSectionHeader from '@/components/terminal/TerminalSectionHeader';
import { extractRules } from '@/lib/wallpaperRules';
import { downloadWallpaper, SIZES } from '@/lib/wallpaperCanvas';
import WallpaperPreview from './WallpaperPreview';

function Segment({ label, options, value, onChange }) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <span>{label}</span>
      <div className="flex border border-border rounded-sm overflow-hidden">
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={`px-2.5 py-1 ${value === o.v ? 'bg-primary/15 text-primary' : 'hover:bg-accent'}`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WallpaperModule({ ctx, onBack }) {
  const { toast } = useToast();
  const [device, setDevice] = useState('desktop');
  const [template, setTemplate] = useState('highlight');
  const [sizeKey, setSizeKey] = useState('1920x1080');
  const [seed, setSeed] = useState(0);

  const sig = useMemo(
    () =>
      JSON.stringify(ctx.answers || {}) +
      '|' + JSON.stringify((ctx.flags || []).map((f) => [f.id, f.status, f.severity])) +
      '|' + (ctx.plan && ctx.plan.plan_name || '') + '|' + (ctx.plan && ctx.plan.version || ''),
    [ctx]
  );
  const rules = useMemo(() => extractRules(ctx), [sig, seed]);

  const onDevice = (d) => {
    setDevice(d);
    setSizeKey(SIZES[d][0].key);
  };
  const regen = () => setSeed((s) => s + 1);
  const dl = (d) => {
    if (!rules.sufficient) {
      toast({ title: '交易计划信息不足', description: '请先完善核心风险规则后再生成壁纸。', variant: 'destructive' });
      return;
    }
    downloadWallpaper(rules, { device: d, template, sizeKey: SIZES[d][0].key });
    toast({ title: d === 'desktop' ? '桌面壁纸已生成' : '手机壁纸已生成', description: '已开始下载 PNG 文件。' });
  };

  return (
    <div className="border border-border rounded-sm bg-card/40 p-4 space-y-4">
      <TerminalSectionHeader
        title="规则壁纸"
        english="RULE WALLPAPER"
        statusLabel={rules.sufficient ? '就绪' : '数据不足'}
        statusTone={rules.sufficient ? 'live' : 'pending'}
      />

      {!rules.sufficient ? (
        <div className="text-sm text-muted-foreground border-l-2 border-warning/40 pl-3 leading-relaxed">
          当前交易计划信息不足，无法生成完整规则壁纸。请先完善核心规则（至少完成「风险与资金管理」步骤）。
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <Segment label="设备" options={[{ v: 'desktop', l: '桌面' }, { v: 'mobile', l: '手机' }]} value={device} onChange={onDevice} />
            <Segment label="样式" options={[{ v: 'minimal', l: '简洁' }, { v: 'highlight', l: '高亮' }]} value={template} onChange={setTemplate} />
            <label className="flex items-center gap-1.5 text-muted-foreground">
              尺寸
              <select
                value={sizeKey}
                onChange={(e) => setSizeKey(e.target.value)}
                className="bg-background border border-border rounded px-2 py-1 text-xs"
              >
                {SIZES[device].map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex justify-center bg-background/40 rounded-sm py-3 px-2">
            <WallpaperPreview rules={rules} device={device} template={template} sizeKey={sizeKey} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={regen}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />重新生成</Button>
            <Button size="sm" onClick={() => dl('desktop')}><Download className="w-3.5 h-3.5 mr-1.5" />下载桌面壁纸</Button>
            <Button size="sm" onClick={() => dl('mobile')}><Download className="w-3.5 h-3.5 mr-1.5" />下载手机壁纸</Button>
            {onBack && <Button size="sm" variant="ghost" onClick={onBack}><ArrowLeft className="w-3.5 h-3.5 mr-1.5" />返回完整计划</Button>}
          </div>

          {rules.highOpen > 0 && (
            <div className="text-xs text-destructive border-l-2 border-destructive/50 pl-3">
              当前有 {rules.highOpen} 项未解决高风险冲突，壁纸底部已标注提醒。
            </div>
          )}

          <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
            壁纸内容自动提取自当前交易计划，已做压缩处理。修改计划后重新打开此模块将读取最新规则。仅用于交易纪律提醒，不构成投资建议。
          </p>
        </>
      )}
    </div>
  );
}