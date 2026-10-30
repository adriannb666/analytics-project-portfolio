import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import TerminalSectionHeader from '@/components/terminal/TerminalSectionHeader';
import WorkspaceModule from '@/components/terminal/WorkspaceModule';
import PreTradeJournalStats from '@/components/dashboard/PreTradeJournalStats';

function planStatus(plan) {
  if (!plan) return 'not_started';
  if (plan.export_ready) return 'done';
  if (plan.coherence_check_completed) return 'ready';
  if (plan.step_8_completed) return 'pending_check';
  return 'building';
}

const STATUS_LABEL = {
  not_started: '未开始',
  building: '制定中',
  pending_check: '待检查',
  ready: '可生成',
  done: '已完成',
};

export default function PersonalWorkspace({ plan, flags }) {
  const completeness = plan?.completeness_score ?? 0;
  const openFlags = (flags || []).filter((f) => f.status === 'open').length;
  const status = planStatus(plan);
  const planName = plan?.plan_name || '我的交易计划';

  return (
    <section>
      <TerminalSectionHeader title="我的交易工作区" english="PERSONAL WORKSPACE" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <WorkspaceModule
          title={planName}
          english="TRADING PLAN"
          status={STATUS_LABEL[status]}
          metrics={[
            { label: '完整度', value: `${completeness}%` },
            { label: '冲突', value: openFlags },
          ]}
          action={
            <Link to="/plan" className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-heading">
              {plan ? '继续制定' : '开始制定'} <ArrowRight className="w-3 h-3" />
            </Link>
          }
        />
        <WorkspaceModule
          title="仓位计算器"
          english="POSITION CALC"
          status="按止损 / 按仓位"
          metrics={[{ label: '模板', value: '2' }]}
          action={
            <Link to="/position-calculator" className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-heading">
              打开计算器 <ArrowRight className="w-3 h-3" />
            </Link>
          }
        />
        <WorkspaceModule
          title="心态壁纸"
          english="MINDSET WALLPAPER"
          status="桌面 / 手机"
          metrics={[{ label: 'DIY', value: '是' }]}
          action={
            <Link to="/wallpaper" className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-heading">
              生成心态壁纸 <ArrowRight className="w-3 h-3" />
            </Link>
          }
        />
      </div>
      <PreTradeJournalStats />
    </section>
  );
}