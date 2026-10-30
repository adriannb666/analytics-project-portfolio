import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import PullToRefresh from '@/components/PullToRefresh';
import Hero from '@/components/dashboard/Hero';
import WeekAhead from '@/components/dashboard/WeekAhead';
import MarketStatusSection from '@/components/dashboard/MarketStatusSection';
import GlobalMarkets from '@/components/dashboard/GlobalMarkets';
import DigitalAssets from '@/components/dashboard/DigitalAssets';
import KeyEvents from '@/components/dashboard/KeyEvents';
import PersonalWorkspace from '@/components/dashboard/PersonalWorkspace';
import DexRiskMonitorSection from '@/components/dashboard/DexRiskMonitorSection';
import RecentBriefings from '@/components/dashboard/RecentBriefings';
import FutureModules from '@/components/dashboard/FutureModules';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('welcome') === '1') {
      toast({ title: '欢迎来到知行交易终端', description: '账户已创建，可以开始制定交易计划。' });
      window.history.replaceState({}, '', '/');
    }
  }, [toast]);

  const { data } = useQuery({
    queryKey: ['dashboard-plan'],
    queryFn: async () => {
      const plans = await base44.entities.TradingPlan.filter({}, '-updated_date', 1);
      const p = plans[0] || null;
      let flags = [];
      if (p && p.id) {
        flags = await base44.entities.CoherenceFlag.filter({ trading_plan_id: p.id }, '-created_date', 100);
      }
      return { plan: p, flags };
    },
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="px-4 md:px-6 py-5 max-w-[1400px] mx-auto space-y-7">
        <Hero />
        <WeekAhead />
        <MarketStatusSection />
        <GlobalMarkets />
        <DigitalAssets />
        <KeyEvents />
        <PersonalWorkspace plan={data?.plan} flags={data?.flags} />
        <DexRiskMonitorSection />
        <RecentBriefings />
        <FutureModules />
        <footer className="border-t border-border pt-4 text-[10px] font-mono text-muted-foreground/60 flex flex-wrap gap-x-3 gap-y-1 select-none">
          <span>知行交易终端 · v0.2.0 EARLY ACCESS</span>
          <span>·</span>
          <span>仅用于交易教育，不构成投资建议</span>
          <span>·</span>
          <span>数据为演示或空状态，不代表实时市场</span>
        </footer>
      </div>
    </PullToRefresh>
  );
}