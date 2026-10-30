import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTradingPlan } from '@/components/trading-plan/useTradingPlan';
import PlanStatusHeader from '@/components/trading-plan/PlanStatusHeader';
import StepNav from '@/components/trading-plan/StepNav';
import SaveStatus from '@/components/trading-plan/SaveStatus';
import Step0 from '@/components/trading-plan/Step0';
import Step1 from '@/components/trading-plan/Step1';
import StepAnswer from '@/components/trading-plan/StepAnswer';
import StepC from '@/components/trading-plan/StepC';
import StepE from '@/components/trading-plan/StepE';

export default function TradingPlan() {
  const t = useTradingPlan();
  const { plan, loading, loadError, saveStatus, saveError } = t;

  useEffect(() => {
    if (loading || loadError || !plan) return;
    const params = new URLSearchParams(window.location.search);
    const step = params.get('step');
    if (step && t.isAccessible(step)) {
      t.goToStep(step);
      window.history.replaceState({}, '', '/plan');
    }
  }, [loading, plan]);

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">加载交易计划…</div>;
  }
  if (loadError) {
    return <div className="p-6 text-sm text-destructive">{loadError}</div>;
  }
  if (!plan) {
    return <div className="p-6 text-sm text-muted-foreground">尚未创建交易计划，请先完成开始步骤。</div>;
  }

  const activeStep = plan.current_step || '0';

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">制定你的交易计划</h1>
          <p className="mt-1 text-sm text-muted-foreground">通过引导式决策，把个人交易习惯、风险偏好和执行方式转化为明确的交易制度。</p>
        </div>
        <SaveStatus status={saveStatus} errorText={saveError} className="mt-1" />
      </div>

      <PlanStatusHeader plan={plan} completeness={t.completeness} flagsCount={t.openFlagsCount} />
      <StepNav activeStep={activeStep} isAccessible={t.isAccessible} stepComplete={t.stepComplete} onNavigate={t.goToStep} />

      <motion.div
        key={activeStep}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        {activeStep === '0' && (
          <Step0 plan={plan} updatePlanFields={t.updatePlanFields} onComplete={t.completeStep0} />
        )}
        {activeStep === '1' && (
          <Step1 profile={t.profile} updateProfileFields={t.updateProfileFields} onComplete={t.completeStep1} onBack={() => t.goToStep('0')} />
        )}
        {['2', '3', '4', '5', '6', '7', '8'].includes(activeStep) && (
          <StepAnswer key={activeStep} stepKey={activeStep} t={t} />
        )}
        {activeStep === 'C' && <StepC t={t} />}
        {activeStep === 'E' && <StepE t={t} />}
      </motion.div>
    </div>
  );
}