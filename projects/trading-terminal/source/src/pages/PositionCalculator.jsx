import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { parsePerTradeRisk } from '@/lib/positionCalc';
import TemplateByStop from '@/components/position-calc/TemplateByStop';
import TemplateBySize from '@/components/position-calc/TemplateBySize';
import HistoryPanel from '@/components/position-calc/HistoryPanel';
import { loadHistory, addHistory, removeHistory, clearHistory } from '@/lib/posCalcHistory';

const DCA_DEFAULT = [{ price: '', ratio: '50' }, { price: '', ratio: '50' }];
const STOP_DEFAULTS = { account: '', currency: 'USDT', riskMode: 'percent', riskPercent: '1', maxLossAmount: '', direction: 'long', entry: '', stop: '', dcaEnabled: false, dcaBatches: DCA_DEFAULT.map((b) => ({ ...b })) };
const SIZE_DEFAULTS = { account: '', currency: 'USDT', riskMode: 'percent', riskPercent: '1', maxLossAmount: '', direction: 'long', entry: '', sizeMode: 'notional', size: '', notional: '', dcaEnabled: false, dcaBatches: DCA_DEFAULT.map((b) => ({ ...b })) };

export default function PositionCalculator() {
  const [tab, setTab] = useState('stop');
  const [planRisk, setPlanRisk] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [stopInput, setStopInput] = useState(STOP_DEFAULTS);
  const [sizeInput, setSizeInput] = useState(SIZE_DEFAULTS);
  const [history, setHistory] = useState([]);
  const applied = useRef(false);

  useEffect(() => { setHistory(loadHistory()); }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const plans = await base44.entities.TradingPlan.filter({}, '-updated_date', 1);
        const p = plans[0];
        if (p && p.id) {
          const ans = await base44.entities.PlanAnswer.filter({ trading_plan_id: p.id }, '-created_date', 300);
          const map = {};
          ans.forEach((r) => { try { map[r.question_key] = JSON.parse(r.answer_value); } catch (e) { map[r.question_key] = r.answer_value; } });
          if (mounted) setPlanRisk(parsePerTradeRisk(map));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setPlanLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // 自动带入交易计划单笔风险（仅首次加载时）
  useEffect(() => {
    if (applied.current || planLoading) return;
    applied.current = true;
    if (planRisk != null) {
      setStopInput((prev) => ({ ...prev, riskPercent: String(planRisk) }));
      setSizeInput((prev) => ({ ...prev, riskPercent: String(planRisk) }));
    }
  }, [planLoading, planRisk]);

  const defaultRisk = planRisk ?? 1;
  const resetStop = () => setStopInput({ ...STOP_DEFAULTS, riskPercent: String(defaultRisk), dcaBatches: DCA_DEFAULT.map((b) => ({ ...b })) });
  const resetSize = () => setSizeInput({ ...SIZE_DEFAULTS, riskPercent: String(defaultRisk), dcaBatches: DCA_DEFAULT.map((b) => ({ ...b })) });

  const recordCalc = (template, input, result) => {
    if (!result || result.maxLoss == null) return;
    addHistory({
      template,
      currency: input.currency,
      input: { ...input },
      result: {
        maxLoss: result.maxLoss,
        positionSize: result.positionSize,
        notionalValue: result.notionalValue,
        stopPrice: result.stopPrice,
        stop: result.stop,
        entry: result.entry,
        stopDistancePct: result.stopDistancePct,
        actualRiskPct: result.actualRiskPct,
        priceDistance: result.priceDistance,
        direction: result.direction,
      },
    });
    setHistory(loadHistory());
  };

  const reloadHistory = (h) => {
    if (h.template === 'stop') { setStopInput(h.input); setTab('stop'); }
    else { setSizeInput(h.input); setTab('size'); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">仓位计算器</h1>
        <p className="mt-1 text-sm text-muted-foreground">根据账户风险、开仓价、止损价或仓位规模，快速计算合理的仓位和止损位置。</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="stop">按止损计算仓位</TabsTrigger>
          <TabsTrigger value="size">按仓位计算止损</TabsTrigger>
        </TabsList>
        <TabsContent value="stop">
          <TemplateByStop input={stopInput} onChange={setStopInput} onReset={resetStop} planRisk={planRisk} planLoading={planLoading} onRecord={(i, r) => recordCalc('stop', i, r)} />
        </TabsContent>
        <TabsContent value="size">
          <TemplateBySize input={sizeInput} onChange={setSizeInput} onReset={resetSize} planRisk={planRisk} planLoading={planLoading} onRecord={(i, r) => recordCalc('size', i, r)} />
        </TabsContent>
      </Tabs>

      <HistoryPanel
        items={history}
        onReload={reloadHistory}
        onDelete={(id) => { removeHistory(id); setHistory(loadHistory()); }}
        onClear={() => { clearHistory(); setHistory([]); }}
      />

      <p className="text-[11px] text-muted-foreground/60">本工具仅用于交易计划的风险计算练习，不构成任何投资建议。计算在本地完成，点击「复制结果」后会自动保存到本机历史记录。</p>
    </div>
  );
}