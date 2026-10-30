import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { RotateCcw, Download, X, Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  DEFAULT_SENTENCES, TITLE_PRESETS, TEXT_COLORS, LAYOUTS, BG_CATEGORIES, MINDSET_SIZES, POSITIONS,
} from '@/lib/mindsetBackgrounds';
import { downloadMindset } from '@/lib/mindsetCanvas';
import MindsetPreview from './MindsetPreview';

let _uid = 0;
const nid = () => 'm' + (++_uid);

const DEFAULT_ITEM_TEXTS = ['不追单', '不报复交易', '不扩大止损', '先执行计划，再评价结果', '计划优先，情绪靠后'];
const defaultItems = () => DEFAULT_ITEM_TEXTS.map((t) => ({ id: nid(), text: t, custom: false }));

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 mb-1.5">{label}</div>
      {hint && <div className="text-[10px] text-muted-foreground/60 mb-1.5 leading-relaxed">{hint}</div>}
      {children}
    </div>
  );
}

function Seg({ options, value, onChange }) {
  return (
    <div className="flex border border-border rounded-sm overflow-hidden">
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)} className={`flex-1 px-2 py-1.5 text-xs ${value === o.v ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent'}`}>{o.l}</button>
      ))}
    </div>
  );
}

function Swatches({ items, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <button
          key={s.key}
          onClick={() => onChange(s.key)}
          title={s.label}
          className={`w-7 h-7 rounded-sm border ${value === s.key ? 'ring-1 ring-primary border-primary' : 'border-border'}`}
          style={{ background: s.hex || s.title }}
        />
      ))}
    </div>
  );
}

function chipCls(active) {
  return `text-xs px-2 py-1.5 rounded-sm border ${active ? 'bg-primary/15 text-primary border-primary/40' : 'text-muted-foreground border-border hover:bg-accent'}`;
}

function Chips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)} className={chipCls(value === o.v)}>{o.l}</button>
      ))}
    </div>
  );
}

function PositionPicker({ value, onChange }) {
  const row1 = POSITIONS.filter((p) => p.h === 'center');
  const row2 = POSITIONS.filter((p) => p.h !== 'center');
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 gap-1.5">
        {row1.map((p) => <button key={p.key} onClick={() => onChange(p.key)} className={chipCls(value === p.key)}>{p.label}</button>)}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {row2.map((p) => <button key={p.key} onClick={() => onChange(p.key)} className={chipCls(value === p.key)}>{p.label}</button>)}
      </div>
    </div>
  );
}

export default function MindsetWallpaperEditor({ embedded, onClose }) {
  const { toast } = useToast();
  const [title, setTitle] = useState('交易纪律');
  const [showTitle, setShowTitle] = useState(true);
  const [items, setItems] = useState(defaultItems);
  const [customText, setCustomText] = useState('');
  const [device, setDevice] = useState('desktop');
  const [sizeKey, setSizeKey] = useState('1920x1080');
  const [position, setPosition] = useState('topleft');
  const [bgCategory, setBgCategory] = useState(BG_CATEGORIES[2].key);
  const [layout, setLayout] = useState('normal');
  const [textColor, setTextColor] = useState('whitegold');

  const bgUrl = (BG_CATEGORIES.find((c) => c.key === bgCategory) || {}).url;
  const state = useMemo(() => ({
    title, showTitle, lines: items.map((i) => i.text),
    bgType: 'image', bgColor: '#0a0a0b', gradient: false, bgUrl, textColor, layout, position, device, sizeKey,
  }), [title, showTitle, items, bgUrl, textColor, layout, position, device, sizeKey]);

  const isInItems = (text) => items.some((i) => !i.custom && i.text === text);
  const toggleDefault = (text) => {
    if (isInItems(text)) setItems((p) => p.filter((i) => !(i.text === text && !i.custom)));
    else setItems((p) => [...p, { id: nid(), text, custom: false }]);
  };
  const addCustom = () => {
    const t = customText.trim();
    if (!t) return;
    const tooLong = Array.from(t).length > 30;
    setItems((p) => [{ id: nid(), text: t, custom: true }, ...p]);
    setCustomText('');
    if (tooLong) toast({ title: '句子较长', description: '建议使用更短的句子，以便在壁纸中清晰展示。' });
  };
  const removeItem = (id) => setItems((p) => p.filter((i) => i.id !== id));
  const moveItem = (id, dir) => setItems((p) => {
    const idx = p.findIndex((i) => i.id === id);
    if (idx < 0) return p;
    const ni = idx + dir;
    if (ni < 0 || ni >= p.length) return p;
    const c = [...p];
    const [it] = c.splice(idx, 1);
    c.splice(ni, 0, it);
    return c;
  });
  const updateItemText = (id, text) => setItems((p) => p.map((i) => (i.id === id ? { ...i, text } : i)));

  const onDevice = (d) => {
    setDevice(d);
    setSizeKey(MINDSET_SIZES[d][0].key);
    setPosition(d === 'mobile' ? 'center' : 'topleft');
  };

  const reset = () => {
    setTitle('交易纪律');
    setShowTitle(true);
    setItems(defaultItems());
    setBgCategory(BG_CATEGORIES[2].key);
    setLayout('normal');
    setPosition(device === 'mobile' ? 'center' : 'topleft');
    setTextColor('whitegold');
  };

  const dl = async () => {
    if (items.length === 0) { toast({ title: '请至少选择一条内容', variant: 'destructive' }); return; }
    if (items.length > 9) toast({ title: '句子较多', description: '建议减少句子数量，以获得更清晰的壁纸效果。' });
    try {
      await downloadMindset(state);
      toast({ title: device === 'desktop' ? '桌面心态壁纸已生成' : '手机心态壁纸已生成', description: '已开始下载 PNG 文件。' });
    } catch (e) {
      toast({ title: '壁纸生成失败', description: '请稍后重试。', variant: 'destructive' });
    }
  };

  const bodyClass = embedded ? 'flex flex-1 min-h-0' : 'flex flex-col lg:flex-row gap-4';
  const leftClass = embedded
    ? 'w-[340px] shrink-0 min-h-0 overflow-y-auto border-r border-border p-4 space-y-5 text-xs'
    : 'lg:w-[340px] lg:shrink-0 p-4 space-y-5 text-xs border border-border rounded';
  const rightClass = embedded
    ? 'flex-1 min-w-0 flex items-center justify-center p-4 overflow-hidden bg-background/30'
    : 'lg:flex-1 lg:self-start lg:sticky lg:top-4 flex justify-center p-4 border border-border rounded bg-card';

  return (
    <div className={embedded ? 'flex flex-col flex-1 min-h-0' : ''}>
      <div className={bodyClass}>
        <div className={leftClass}>
          <Field label="标题">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="如 保持清醒" className="h-8 text-xs" />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {TITLE_PRESETS.map((t) => (
                <button key={t} onClick={() => setTitle(t)} className="px-1.5 py-0.5 rounded-sm border border-border text-muted-foreground hover:text-foreground hover:bg-accent">{t}</button>
              ))}
            </div>
            <label className="flex items-center justify-between gap-2 mt-2 cursor-pointer">
              <span className="text-muted-foreground">显示标题</span>
              <Switch checked={showTitle} onCheckedChange={setShowTitle} />
            </label>
          </Field>

          <Field label="设备 / 尺寸" hint="先决定做桌面还是手机壁纸。">
            <Seg options={[{ v: 'desktop', l: '桌面' }, { v: 'mobile', l: '手机' }]} value={device} onChange={onDevice} />
            <select value={sizeKey} onChange={(e) => setSizeKey(e.target.value)} className="w-full mt-1.5 bg-background border border-border rounded px-2 py-1 text-xs">
              {MINDSET_SIZES[device].map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </Field>

          <Field label="文字位置" hint="靠左时左对齐，靠右时右对齐；整组内容作为一个块整体定位。">
            <PositionPicker value={position} onChange={setPosition} />
          </Field>

          <Field label="默认文案（勾选显示）">
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_SENTENCES.map((s) => (
                <button key={s} onClick={() => toggleDefault(s)} className={chipCls(isInItems(s))}>{s}</button>
              ))}
            </div>
          </Field>

          <Field label="已选内容与顺序">
            {items.length > 9 && <div className="text-warning mb-1.5">句子较多，建议精简。</div>}
            <div className="space-y-1.5">
              {items.map((it, i) => (
                <div key={it.id} className="flex items-center gap-1">
                  {it.custom ? (
                    <Input value={it.text} onChange={(e) => updateItemText(it.id, e.target.value)} className="h-7 text-xs flex-1" />
                  ) : (
                    <span className="flex-1 truncate text-foreground">{it.text}</span>
                  )}
                  <button onClick={() => moveItem(it.id, -1)} disabled={i === 0} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => moveItem(it.id, 1)} disabled={i === items.length - 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeItem(it.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </Field>

          <Field label="自定义文案" hint="每句建议 ≤ 30 字；自定义文案优先显示。">
            <div className="flex gap-1.5">
              <Input value={customText} onChange={(e) => setCustomText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addCustom(); }} placeholder="新增一句…" className="h-8 text-xs flex-1" />
              <Button size="sm" variant="outline" onClick={addCustom}><Plus className="w-3.5 h-3.5" /></Button>
            </div>
          </Field>

          <Field label="背景图片" hint="选择一张高级背景；文字会自动加遮罩保持清晰。">
            <Chips options={BG_CATEGORIES.map((c) => ({ v: c.key, l: c.label }))} value={bgCategory} onChange={setBgCategory} />
          </Field>

          <Field label="排版方式（密度）" hint="极简稀疏只显示少量重点句，留白更多。">
            <Chips options={LAYOUTS.map((l) => ({ v: l.key, l: l.label }))} value={layout} onChange={setLayout} />
          </Field>

          <Field label="文字颜色">
            <Swatches items={TEXT_COLORS} value={textColor} onChange={setTextColor} />
          </Field>
        </div>

        <div className={rightClass}>
          <MindsetPreview state={state} />
        </div>
      </div>

      <div className="shrink-0 border-t border-border px-4 py-3 flex items-center justify-between gap-2 bg-card">
        <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="w-3.5 h-3.5 mr-1.5" />重置为默认</Button>
        <div className="flex gap-2">
          {embedded && onClose && <Button variant="ghost" size="sm" onClick={onClose}><X className="w-3.5 h-3.5 mr-1.5" />关闭</Button>}
          <Button size="sm" onClick={dl}><Download className="w-3.5 h-3.5 mr-1.5" />下载 PNG</Button>
        </div>
      </div>
    </div>
  );
}