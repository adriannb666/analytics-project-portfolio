import React from 'react';
import TerminalSectionHeader from './TerminalSectionHeader';
import EmptyDataState from './EmptyDataState';

export default function MarketBriefingSection({ title, english, date, statusLabel, statusTone, action, body, keyConcerns, bottomLine, emptyTitle, emptyNote }) {
  const empty = !body;
  return (
    <section>
      <TerminalSectionHeader title={title} english={english} date={date} statusLabel={statusLabel} statusTone={statusTone} action={action} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          {empty ? (
            <EmptyDataState title={emptyTitle} note={emptyNote} />
          ) : (
            <div className="border border-border rounded-sm bg-card/40 p-4">
              <p className="text-sm text-foreground leading-relaxed max-w-prose">{body}</p>
              {bottomLine && (
                <div className="mt-3 border-t border-border pt-2 text-xs">
                  <span className="font-mono uppercase tracking-wider text-muted-foreground/70 mr-1.5">BOTTOM LINE</span>
                  <span className="text-foreground">{bottomLine}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="border border-border rounded-sm bg-card/40 p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 mb-2">关键关注</div>
          <ul className="space-y-1.5">
            {(keyConcerns || []).map((k, i) => (
              <li key={i} className="text-xs text-foreground flex gap-2">
                <span className="text-muted-foreground/50 font-mono">·</span>
                <span>{k}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}