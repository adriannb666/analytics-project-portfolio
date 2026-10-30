import React from 'react';

export default function Hero() {
  const now = new Date();
  const updated = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return (
    <section className="border-b border-border pb-5">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground/70">ZHIXING RESEARCH</div>
      <h1 className="mt-1 text-xl sm:text-2xl font-heading font-bold text-foreground tracking-tight">知行交易终端</h1>
      <div className="mt-0.5 text-[11px] font-mono uppercase tracking-[0.18em] text-primary/90">MARKET INTELLIGENCE & TRADING WORKSPACE</div>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">
        覆盖全球市场、宏观环境、数字资产与个人交易系统，提供每周准备、风险管理和交易执行工具。
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-muted-foreground select-none">
        <span className="flex items-center gap-1 text-success"><span className="w-1.5 h-1.5 rounded-full bg-success" />ONLINE</span>
        <span>BUILD v0.2.0</span>
        <span>TOOLS 3 / 20</span>
        <span>UPDATED {updated}</span>
        <span className="text-warning">EARLY ACCESS</span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground/80 leading-relaxed max-w-2xl border-l-2 border-warning/40 pl-3">
        当前版本处于早期测试阶段。交易计划与仓位计算功能已经开放，市场情报、日历与数据模块将逐步接入。用户反馈将直接影响后续开发优先级。
      </p>
    </section>
  );
}