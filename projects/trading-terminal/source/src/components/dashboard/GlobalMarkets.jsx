import React from 'react';
import MarketBriefingSection from '@/components/terminal/MarketBriefingSection';

const KEY_CONCERNS = ['宏观数据', '财报', '政策', '地缘风险', '流动性变化'];

export default function GlobalMarkets() {
  return (
    <MarketBriefingSection
      title="全球市场"
      english="GLOBAL MARKETS"
      statusLabel="等待数据源"
      statusTone="pending"
      emptyTitle="全球市场数据尚未接入。"
      emptyNote="未来将自动整合美股、利率、美元、商品、宏观数据和重大公司事件。"
      keyConcerns={KEY_CONCERNS}
    />
  );
}