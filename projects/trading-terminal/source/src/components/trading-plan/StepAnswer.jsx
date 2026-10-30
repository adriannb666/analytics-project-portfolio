import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { STEP_QUESTIONS, STEP_TITLES, STEP_DESC, validateStep } from '@/components/trading-plan/stepsConfig';
import { renderQuestions } from '@/components/trading-plan/Question';
import QSingle from '@/components/trading-plan/questions/QSingle';
import WatchlistEditor from '@/components/trading-plan/WatchlistEditor';
import PsychCards from '@/components/trading-plan/PsychCards';

const PREV = { '2': '1', '3': '2', '4': '3', '5': '4', '6': '5', '7': '6', '8': '7' };

export default function StepAnswer({ stepKey, t }) {
  const { answers, updateAnswer, buildCtx } = t;
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const clearError = (key) => setErrors((prev) => {
    if (!prev[key]) return prev;
    const n = { ...prev }; delete n[key]; return n;
  });
  const wrappedUpdate = (key, value) => { updateAnswer(key, value); clearError(key); };

  const handleSave = async () => {
    const v = validateStep(stepKey, buildCtx());
    if (!v.ok) {
      const e = {}; v.missing.forEach((k) => { e[k] = '请完成此项'; });
      setErrors(e);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try { await t.completeAnswerStep(stepKey); } finally { setSubmitting(false); }
  };

  const customRenderers = {
    riskIntro: (q) => (
      <div className="border border-warning/40 bg-warning/5 rounded p-3 text-xs text-warning leading-relaxed">{q.label}</div>
    ),
    primaryMarket: (q) => (
      <div className="border border-border bg-card rounded p-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xs text-muted-foreground">Q{q.n}</span>
          <h3 className="text-sm font-heading font-semibold text-foreground">{q.label}<span className="text-destructive ml-0.5">*</span></h3>
        </div>
        {q.hint && <p className="mt-1 text-xs text-muted-foreground">{q.hint}</p>}
        <div className="mt-3">
          <QSingle value={answers['s3_primary_market']} options={Array.isArray(answers['s3_markets']) ? answers['s3_markets'] : []} onChange={(v) => wrappedUpdate('s3_primary_market', v)} />
        </div>
        {errors['s3_primary_market'] && <p className="mt-2 text-xs text-destructive">{errors['s3_primary_market']}</p>}
      </div>
    ),
    watchlist: (q) => (
      <div className="border border-border bg-card rounded p-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xs text-muted-foreground">Q{q.n}</span>
          <h3 className="text-sm font-heading font-semibold text-foreground">{q.label}</h3>
        </div>
        {q.hint && <p className="mt-1 text-xs text-muted-foreground">{q.hint}</p>}
        <div className="mt-3"><WatchlistEditor t={t} /></div>
      </div>
    ),
    psychCards: (q) => (
      <div className="border border-border bg-card rounded p-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xs text-muted-foreground">Q{q.n}</span>
          <h3 className="text-sm font-heading font-semibold text-foreground">{q.label}<span className="text-destructive ml-0.5">*</span></h3>
        </div>
        {q.hint && <p className="mt-1 text-xs text-muted-foreground">{q.hint}</p>}
        <div className="mt-3"><PsychCards t={t} /></div>
        {errors['s7_psych_cards'] && <p className="mt-2 text-xs text-destructive">{errors['s7_psych_cards']}</p>}
      </div>
    ),
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-heading font-semibold text-foreground">{STEP_TITLES[stepKey]}</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-3xl">{STEP_DESC[stepKey]}</p>
      </div>
      <div className="space-y-4">
        {renderQuestions(STEP_QUESTIONS[stepKey], { answers, updateAnswer: wrappedUpdate, errors, customRenderers })}
      </div>
      <div className="flex items-center justify-between gap-3 sticky bottom-0 bg-background/90 backdrop-blur border border-border rounded p-3">
        <Button variant="outline" onClick={() => t.goToStep(PREV[stepKey] || '1')} className="font-heading"><ArrowLeft className="w-4 h-4 mr-1.5" />上一步</Button>
        <Button onClick={handleSave} disabled={submitting} className="font-heading">
          {submitting ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />保存中…</> : <>保存并继续 <ArrowRight className="w-4 h-4 ml-1.5" /></>}
        </Button>
      </div>
    </div>
  );
}