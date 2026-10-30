import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

function WatchlistRow({ item, onUpdate, onRemove }) {
  const [v, setV] = useState({ symbol: item.symbol || '', name: item.name || '', market: item.market || '', notes: item.notes || '' });
  useEffect(() => {
    setV({ symbol: item.symbol || '', name: item.name || '', market: item.market || '', notes: item.notes || '' });
  }, [item.id]);
  const commit = () => onUpdate(item.id, v);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2 border border-border rounded bg-background">
      <Input className="bg-card h-8 sm:col-span-2 font-mono text-xs" value={v.symbol} onChange={(e) => setV({ ...v, symbol: e.target.value })} onBlur={commit} placeholder="代码" />
      <Input className="bg-card h-8 sm:col-span-3 text-xs" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} onBlur={commit} placeholder="名称" />
      <Input className="bg-card h-8 sm:col-span-2 text-xs" value={v.market} onChange={(e) => setV({ ...v, market: e.target.value })} onBlur={commit} placeholder="市场" />
      <Input className="bg-card h-8 sm:col-span-4 text-xs" value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} onBlur={commit} placeholder="备注" />
      <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(item.id)} className="sm:col-span-1 text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
    </div>
  );
}

export default function WatchlistEditor({ t }) {
  const { watchlist } = t;
  const [draft, setDraft] = useState({ symbol: '', name: '', market: '', notes: '' });

  const add = async () => {
    if (!draft.symbol.trim()) return;
    await t.addWatchlistItem({ symbol: draft.symbol.trim(), name: draft.name, market: draft.market, notes: draft.notes });
    setDraft({ symbol: '', name: '', market: '', notes: '' });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 border border-dashed border-border rounded">
        <Input placeholder="标的代码" value={draft.symbol} onChange={(e) => setDraft({ ...draft, symbol: e.target.value })} className="bg-background h-9 font-mono text-sm" />
        <Input placeholder="名称" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="bg-background h-9 text-sm" />
        <Input placeholder="所属市场" value={draft.market} onChange={(e) => setDraft({ ...draft, market: e.target.value })} className="bg-background h-9 text-sm" />
        <div className="flex gap-2">
          <Input placeholder="备注" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="bg-background h-9 text-sm" />
          <Button type="button" size="sm" onClick={add} className="shrink-0"><Plus className="w-4 h-4" /></Button>
        </div>
      </div>
      {watchlist.length === 0 ? (
        <p className="text-xs text-muted-foreground">尚未添加标的。</p>
      ) : (
        <div className="space-y-2">
          {watchlist.map((w) => (
            <WatchlistRow key={w.id} item={w} onUpdate={t.updateWatchlistItem} onRemove={t.removeWatchlistItem} />
          ))}
        </div>
      )}
    </div>
  );
}