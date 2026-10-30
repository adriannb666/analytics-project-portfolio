import React from 'react';

export default function WorkspaceModule({ title, english, status, metrics, action, future }) {
  return (
    <div className={`border border-border rounded-sm bg-card/40 p-3 ${future ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          {english && <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">{english}</div>}
          <div className="text-sm font-heading text-foreground truncate">{title}</div>
        </div>
        {status && <span className="text-[10px] font-mono text-muted-foreground shrink-0">{status}</span>}
      </div>
      {metrics && metrics.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {metrics.map((m) => (
            <div key={m.label} className="text-[11px]">
              <span className="text-muted-foreground">{m.label} </span>
              <span className="font-mono text-foreground">{m.value}</span>
            </div>
          ))}
        </div>
      )}
      {action && <div className="mt-2.5">{action}</div>}
    </div>
  );
}