import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

export default function ConnectionEditDialog({ open, onOpenChange, connection, plans, onSaved }) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [planId, setPlanId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (connection) { setName(connection.account_name || ''); setPlanId(connection.trading_plan_id || ''); }
  }, [connection]);

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.DexMonitorConnection.update(connection.id, {
        account_name: name.trim() || connection.account_name, trading_plan_id: planId || null,
      });
      toast({ title: '已更新连接' });
      onSaved && onSaved();
      onOpenChange(false);
    } catch (e) {
      toast({ title: '更新失败', description: (e && e.message) || '请重试', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>编辑连接</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">账户名称</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 text-xs" />
          </div>
          <div>
            <Label className="text-xs">关联交易计划</Label>
            <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="mt-1 w-full h-9 text-xs bg-background border border-border rounded px-2">
              <option value="">不关联</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.plan_name}</option>)}
            </select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button onClick={save} disabled={saving}>{saving ? '保存中…' : '保存'}</Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}