import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TerminalSectionHeader from '@/components/terminal/TerminalSectionHeader';
import BriefingHero from '@/components/terminal/BriefingHero';

const DEMO = {
  title: '本周市场重点关注通胀数据、主要公司财报与数字资产供给事件',
  summary: '风险资产的方向将取决于宏观数据是否继续支持流动性改善。本周关注通胀数据、主要公司财报与数字资产供给事件。',
  bottomLine: '风险资产的方向将取决于宏观数据是否继续支持流动性改善。',
  tags: ['通胀', '财报', '数字资产'],
};

function weekRange() {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) => `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
  return `${now.getFullYear()} 年 ${fmt(monday)}—${fmt(sunday)}`;
}

export default function WeekAhead() {
  const dateRange = weekRange();
  const { data } = useQuery({
    queryKey: ['week-ahead'],
    queryFn: async () => {
      const items = await base44.entities.Briefing.filter({ briefing_type: 'week_ahead', status: 'published' }, '-published_at', 1);
      return items[0] || null;
    },
  });
  const briefing = data || null;
  return (
    <section>
      <TerminalSectionHeader
        title="本周市场前瞻"
        english="WEEK AHEAD"
        date={dateRange}
        statusLabel={briefing ? '研究简报' : '演示数据'}
        statusTone={briefing ? 'live' : 'demo'}
      />
      {briefing ? (
        <BriefingHero
          type="week_ahead"
          date={briefing.published_at}
          title={briefing.title}
          summary={briefing.summary}
          bottomLine={briefing.bottom_line}
          tags={briefing.tags}
        />
      ) : (
        <div className="space-y-2">
          <BriefingHero type="week_ahead" date={dateRange} demo title={DEMO.title} summary={DEMO.summary} bottomLine={DEMO.bottomLine} tags={DEMO.tags} />
          <p className="text-xs text-muted-foreground">市场简报数据尚未接入。后续将自动汇总宏观、股票与数字资产的重要事件。</p>
        </div>
      )}
    </section>
  );
}