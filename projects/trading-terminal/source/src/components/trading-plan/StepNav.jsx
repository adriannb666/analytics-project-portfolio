import React, { useState } from 'react';
import { PLAN_STEPS } from '@/components/terminal/navConfig';
import { cn } from '@/lib/utils';
import { Lock, Check, ChevronDown } from 'lucide-react';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';

export default function StepNav({ activeStep, isAccessible, stepComplete, onNavigate }) {
  const [notice, setNotice] = useState('');
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleClick = (step) => {
    if (isAccessible(step.code)) {
      onNavigate(step.code);
      setNotice('');
      setOpen(false);
    } else {
      setNotice('请先完成前面的步骤。');
    }
  };

  const activeStepObj = PLAN_STEPS.find((s) => s.code === activeStep) || PLAN_STEPS[0];

  if (isMobile) {
    return (
      <div className="border border-border bg-card rounded p-3 select-none">
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <button className="mobile-tap w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded border border-border text-sm">
              <span className="flex items-center gap-2">
                <span className="font-mono text-xs text-primary">{activeStep}</span>
                <span className="font-heading text-foreground">{activeStepObj.name}</span>
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">切换步骤 <ChevronDown className="w-4 h-4" /></span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="select-none">
            <DrawerHeader className="text-left">
              <DrawerTitle>选择步骤</DrawerTitle>
              <DrawerDescription>完成前置步骤后即可进入后续步骤。</DrawerDescription>
            </DrawerHeader>
            <div className="px-2 pb-4 space-y-1 max-h-[60vh] overflow-y-auto">
              {PLAN_STEPS.map((step) => {
                const accessible = isAccessible(step.code);
                const active = activeStep === step.code;
                const completed = stepComplete(step.code);
                return (
                  <button
                    key={step.code}
                    onClick={() => handleClick(step)}
                    className={cn(
                      'mobile-tap w-full flex items-center gap-3 px-3 py-3 rounded text-left text-sm',
                      active && 'bg-primary/10 text-primary',
                      !active && accessible && 'text-foreground hover:bg-accent',
                      !accessible && 'text-muted-foreground/50'
                    )}
                  >
                    <span className="w-7 h-7 rounded border flex items-center justify-center font-mono text-xs shrink-0">
                      {accessible ? step.code : <Lock className="w-3 h-3" />}
                    </span>
                    <span className="flex-1 font-heading">{step.name}</span>
                    {completed && <Check className="w-4 h-4 text-success" />}
                    {active && <span className="text-[10px] text-primary">当前</span>}
                  </button>
                );
              })}
            </div>
          </DrawerContent>
        </Drawer>
        {notice && <div className="mt-2 text-xs text-warning font-heading">{notice}</div>}
      </div>
    );
  }

  return (
    <div className="border border-border bg-card rounded p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {PLAN_STEPS.map((step) => {
          const accessible = isAccessible(step.code);
          const active = activeStep === step.code;
          const completed = stepComplete(step.code);
          return (
            <button
              key={step.code}
              onClick={() => handleClick(step)}
              title={`${step.code} · ${step.name}`}
              className={cn(
                'group relative flex flex-col items-center justify-center w-10 h-10 rounded border text-xs font-mono transition-colors',
                active && 'border-primary bg-primary/10 text-primary',
                !active && accessible && 'border-border text-foreground hover:border-primary/50 hover:text-primary',
                !accessible && 'border-border/60 text-muted-foreground/50 cursor-not-allowed'
              )}
            >
              {accessible ? step.code : <Lock className="w-3 h-3" />}
              {completed && !active && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-success border border-card" />}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground overflow-x-auto">
        {PLAN_STEPS.map((s) => (
          <span key={s.code} className={cn(activeStep === s.code && 'text-primary', 'whitespace-nowrap')}>
            <span className="font-mono">{s.code}</span> {s.name}
          </span>
        ))}
      </div>
      {notice && <div className="mt-2 text-xs text-warning font-heading">{notice}</div>}
    </div>
  );
}