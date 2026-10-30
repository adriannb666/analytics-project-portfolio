import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Printer, Download, FileJson, Copy, Upload, RefreshCw, Check, Image as ImageIcon } from 'lucide-react';
import { generateFullPlan, generateDeskCard, generateChecklist, buildExportPayload } from '@/components/trading-plan/planGenerator';
import MindsetWallpaperDialog from '@/components/wallpaper/MindsetWallpaperDialog';
import { useToast } from '@/components/ui/use-toast';

export default function StepE({ t }) {
  const { toast } = useToast();
  const [content, setContent] = useState({ full: '', desk: '', checklist: '' });
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('full');
  const [importPreview, setImportPreview] = useState(null);
  const [importError, setImportError] = useState('');
  const [wallpaperOpen, setWallpaperOpen] = useState(false);

  const generate = () => {
    const ctx = t.buildCtx();
    setContent({
      full: generateFullPlan(ctx),
      desk: generateDeskCard(ctx),
      checklist: generateChecklist(ctx),
    });
    setSaved(false);
  };

  useEffect(() => { generate(); }, []);

  const handleSave = async () => {
    const r = await t.saveGenerated(content);
    if (r && r.ok) { setSaved(true); toast({ title: '已保存生成结果' }); }
  };

  const printTab = (tab) => {
    setActiveTab(tab);
    setTimeout(() => window.print(), 200);
  };

  const downloadFile = (name, text, type = 'text/plain') => {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const payload = buildExportPayload(t.buildCtx());
    downloadFile(`${(t.plan && t.plan.plan_name) || 'trading-plan'}.json`, JSON.stringify(payload, null, 2), 'application/json');
  };

  const handleExportMD = (which) => {
    const text = which === 'full' ? content.full : which === 'desk' ? content.desk : content.checklist;
    const name = which === 'full' ? '完整交易计划.md' : which === 'desk' ? '核心规则卡.md' : '交易前检查清单.md';
    downloadFile(name, text, 'text/markdown');
  };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(content.full); toast({ title: '已复制完整计划文本' }); }
    catch (e) { toast({ title: '复制失败', description: '请手动选择文本复制', variant: 'destructive' }); }
  };

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || (!data.trading_plan && !data.answers)) { setImportError('文件格式不正确：缺少 trading_plan 或 answers 字段。'); return; }
        setImportError('');
        setImportPreview({
          plan_name: (data.trading_plan && data.trading_plan.plan_name) || '—',
          version: (data.trading_plan && data.trading_plan.version) || '—',
          answers: Object.keys(data.answers || {}).length,
          watchlist: (data.watchlist || []).length,
          psych: (data.psychology_rules || []).length,
          flags: (data.coherence_flags || []).length,
          raw: data,
        });
      } catch (err) { setImportError('JSON 解析失败：' + err.message); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmImport = async () => {
    try {
      await t.importPlan(importPreview.raw);
      toast({ title: '导入成功', description: '计划数据已恢复，正在重新计算完整度与冲突。' });
      setImportPreview(null);
      generate();
    } catch (err) { toast({ title: '导入失败', description: (err && err.message) || '未知错误', variant: 'destructive' }); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-heading font-semibold text-foreground">生成交易计划</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-3xl">系统根据你的答案生成正式交易制度。生成结果明确、可执行，并保留未解决的风险事项。</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={generate}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />重新生成</Button>
          <Button size="sm" onClick={handleSave}><Check className="w-3.5 h-3.5 mr-1.5" />{saved ? '已保存' : '保存到账户'}</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => printTab('full')}><Printer className="w-3.5 h-3.5 mr-1.5" />打印完整计划</Button>
        <Button variant="outline" size="sm" onClick={() => printTab('desk')}><Printer className="w-3.5 h-3.5 mr-1.5" />打印规则卡</Button>
        <Button variant="outline" size="sm" onClick={() => printTab('checklist')}><Printer className="w-3.5 h-3.5 mr-1.5" />打印检查清单</Button>
        <Button variant="outline" size="sm" onClick={() => setWallpaperOpen(true)} className="border-primary/40 text-primary hover:bg-primary/10"><ImageIcon className="w-3.5 h-3.5 mr-1.5" />生成心态壁纸</Button>
        <Button variant="outline" size="sm" onClick={() => handleExportMD('full')}><Download className="w-3.5 h-3.5 mr-1.5" />下载 Markdown</Button>
        <Button variant="outline" size="sm" onClick={handleExportJSON}><FileJson className="w-3.5 h-3.5 mr-1.5" />导出 JSON</Button>
        <Button variant="outline" size="sm" onClick={handleCopy}><Copy className="w-3.5 h-3.5 mr-1.5" />复制完整计划</Button>
        <label className="inline-flex items-center text-xs px-3 h-8 rounded-md border border-border text-muted-foreground hover:text-foreground cursor-pointer">
          <Upload className="w-3.5 h-3.5 mr-1.5" />导入 JSON
          <input type="file" accept="application/json" className="hidden" onChange={handleFile} />
        </label>
      </div>

      {importError && <div className="p-2.5 rounded bg-destructive/10 text-destructive text-xs">{importError}</div>}

      {importPreview && (
        <div className="border border-primary/40 bg-primary/5 rounded p-4 space-y-2">
          <div className="text-sm font-heading font-semibold text-foreground">导入预览</div>
          <div className="text-xs text-muted-foreground">计划名称：{importPreview.plan_name} · 版本：{importPreview.version} · 答案：{importPreview.answers} 项 · 观察名单：{importPreview.watchlist} · 心理规则：{importPreview.psych} · 冲突：{importPreview.flags}</div>
          <div className="text-xs text-warning">确认导入将覆盖当前账户的计划数据，不会影响其他用户。</div>
          <div className="flex gap-2">
            <Button size="sm" onClick={confirmImport}>确认导入</Button>
            <Button size="sm" variant="ghost" onClick={() => setImportPreview(null)}>取消</Button>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="full">完整交易计划</TabsTrigger>
          <TabsTrigger value="desk">一页核心规则卡</TabsTrigger>
          <TabsTrigger value="checklist">交易前检查清单</TabsTrigger>
        </TabsList>
        <TabsContent value="full" className="print-area"><div className="md-body border border-border bg-card rounded p-4 mt-3"><ReactMarkdown>{content.full}</ReactMarkdown></div></TabsContent>
        <TabsContent value="desk" className="print-area"><div className="md-body border border-border bg-card rounded p-4 mt-3"><ReactMarkdown>{content.desk}</ReactMarkdown></div></TabsContent>
        <TabsContent value="checklist" className="print-area"><div className="md-body border border-border bg-card rounded p-4 mt-3"><ReactMarkdown>{content.checklist}</ReactMarkdown></div></TabsContent>
      </Tabs>

      <MindsetWallpaperDialog open={wallpaperOpen} onOpenChange={setWallpaperOpen} />
    </div>
  );
}