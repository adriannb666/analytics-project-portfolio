import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    // 先删除用户记录；若失败则不删除任何数据
    try {
      await base44.asServiceRole.entities.User.delete(userId);
    } catch (e) {
      const msg = e?.message || '未知错误';
      if (/owner/i.test(msg)) {
        return Response.json({ error: '当前账户为本应用所有者，无法自助删除。如需删除，请联系 Base44 支持。' }, { status: 403 });
      }
      return Response.json({ error: '无法删除账户：' + msg }, { status: 500 });
    }

    // 尽力清理该用户的交易计划及关联数据
    try {
      const plans = await base44.asServiceRole.entities.TradingPlan.filter({ created_by_id: userId }, '-updated_date', 500);
      for (const p of plans) {
        await base44.asServiceRole.entities.PlanProfile.deleteMany({ trading_plan_id: p.id });
        await base44.asServiceRole.entities.PlanAnswer.deleteMany({ trading_plan_id: p.id });
        await base44.asServiceRole.entities.WatchlistItem.deleteMany({ trading_plan_id: p.id });
        await base44.asServiceRole.entities.PsychologyRule.deleteMany({ trading_plan_id: p.id });
        await base44.asServiceRole.entities.CoherenceFlag.deleteMany({ trading_plan_id: p.id });
        await base44.asServiceRole.entities.GeneratedPlan.deleteMany({ trading_plan_id: p.id });
        await base44.asServiceRole.entities.TradingPlan.delete(p.id);
      }
    } catch (e) {
      // 账户已删除，关联数据清理失败不阻塞
      console.error('cleanup error', e);
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});