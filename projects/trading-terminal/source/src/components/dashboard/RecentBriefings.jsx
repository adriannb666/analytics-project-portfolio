import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TerminalSectionHeader from '@/components/terminal/TerminalSectionHeader';
import BriefingHero from '@/components/terminal/BriefingHero';

export default function RecentBriefings() {
  const { data } = useQuery({
    queryKey: ['recent-briefings'],
    queryFn: async () => base44.entities.Briefing.filter({ status: 'published' }, '-published_at', 5),
  });
  const items = data || [];
  return (
    <section>
      <TerminalSectionHeader
        title="近期市场简报"
        english="RECENT BRIEFINGS"
        statusLabel={items.length ? `${items.length} 篇` : '等待数据源'}
        statusTone={items.length ? 'live' : 'pending'}
      />
      {items.length === 0 ? (
        <div className="border border-dashed border-border rounded-sm bg-card/40 px-4 py-5 text-sm text-muted-foreground">暂无已发布简报。</div>
      ) : (
        <div className="space-y-2">
          {items.map((b) => (
            <BriefingHero
              key={b.id}
              type={b.briefing_type}
              date={b.published_at}
              title={b.title}
              summary={b.summary}
              tags={b.tags}
              onRead={() => {}}
            />
          ))}
        </div>
      )}
    </section>
  );
}