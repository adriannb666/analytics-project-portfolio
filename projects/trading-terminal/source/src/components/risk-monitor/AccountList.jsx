import React from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, RefreshCw, Eye, Pencil, Trash2 } from 'lucide-react';
import { PLATFORM_LABEL, RISK_STATUS, fmtAddr, fmtTime } from '@/lib/dexMonitorFormat';

export default function AccountList({ connections, selectedId, onSelect, onRefresh, onAdd, onEdit, onDelete, syncingId }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-heading text-foreground uppercase tracking-wider">监控账户 · {connections.length}</div>
        <button onClick={onAdd} className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-primary/40 text-primary hover:bg-primary/10">
          <Plus className="w-3.5 h-3.5" />添加监控账户
        </button>
      </div>

      {connections.length === 0 ? (
        <div className="border border-dashed border-border rounded p-6 text-center text-xs text-muted-foreground">
          尚未添加监控账户。点击「添加监控账户」，输入公开钱包地址开始只读监控。
        </div>
      ) : (
        <div className="space-y-1.5">
          {connections.map((c) => {
            const active = c.id === selectedId;
            const st = c.status === 'active' ? 'text-success' : c.status === 'error' ? 'text-destructive' : 'text-muted-foreground';
            return (
              <div key={c.id} onClick={() => onSelect(c.id)}
                className={`group flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-colors ${active ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.status === 'active' ? 'bg-success' : c.status === 'error' ? 'bg-destructive' : 'bg-muted-foreground'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm border border-border text-muted-foreground">{PLATFORM_LABEL[c.platform]}</span>
                    <span className="text-xs font-heading text-foreground truncate">{c.account_name || '未命名账户'}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                    {fmtAddr(c.wallet_address)}{c.platform === 'lighter' && c.lighter_account_index != null ? ` · index ${c.lighter_account_index}` : ''}
                    <span className={`ml-2 ${st}`}>· {c.status === 'active' ? '正常' : c.status === 'error' ? '同步错误' : '已停用'}</span>
                  </div>
                </div>
                <div className="hidden sm:block text-[10px] text-muted-foreground shrink-0">{fmtTime(c.last_synced_at)}</div>
                <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => onRefresh(c.id)} disabled={syncingId === c.id}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50" title="手动刷新">
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingId === c.id ? 'animate-spin' : ''}`} />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent"><MoreHorizontal className="w-3.5 h-3.5" /></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => onSelect(c.id)}><Eye className="w-3.5 h-3.5 mr-2" />查看</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onRefresh(c.id)}><RefreshCw className="w-3.5 h-3.5 mr-2" />手动刷新</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(c)}><Pencil className="w-3.5 h-3.5 mr-2" />修改名称 / 计划</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(c)}><Trash2 className="w-3.5 h-3.5 mr-2" />删除监控</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}