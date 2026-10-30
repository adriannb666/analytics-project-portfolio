import React from 'react';
import { Link } from 'react-router-dom';
import TerminalSectionHeader from '@/components/terminal/TerminalSectionHeader';
import KeyEventRow from '@/components/terminal/KeyEventRow';

export default function KeyEvents({ events = [] }) {
  return (
    <section>
      <TerminalSectionHeader
        title="本周关键事件"
        english="KEY EVENTS"
        statusLabel={events.length ? `${events.length} 项` : '等待数据源'}
        statusTone={events.length ? 'live' : 'pending'}
        action={<Link to="/placeholder?module=economic-calendar" className="text-[11px] font-mono text-primary hover:underline">查看市场日历 →</Link>}
      />
      <div className="border border-border rounded-sm bg-card/40 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-3 py-1.5 border-b border-border bg-card/60 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
          <div className="col-span-3 sm:col-span-2">日期</div>
          <div className="col-span-2 sm:col-span-2">分类</div>
          <div className="col-span-4 sm:col-span-5">事件</div>
          <div className="col-span-2 sm:col-span-2">市场</div>
          <div className="col-span-1 text-right">重要</div>
        </div>
        {events.length > 0 ? (
          events.map((e, i) => <KeyEventRow key={i} {...e} />)
        ) : (
          <div className="px-3 py-5 text-center">
            <div className="text-xs text-muted-foreground">尚未接入经济日历与加密事件数据。</div>
            <div className="mt-1 text-[11px] text-muted-foreground/70 leading-relaxed">未来将自动汇总宏观、财报、央行、监管与代币解锁事件。</div>
          </div>
        )}
      </div>
    </section>
  );
}