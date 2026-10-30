import React from 'react';
import MarketBriefingSection from '@/components/terminal/MarketBriefingSection';

const KEY_CONCERNS = ['BTC 市场结构', 'ETH 相对强弱', '资金费率', 'OI 变化', '大额解锁', '监管与机构动态'];

export default function DigitalAssets() {
  return (
    <MarketBriefingSection
      title="数字资产"
      english="DIGITAL ASSETS"
      statusLabel="等待数据源"
      statusTone="pending"
      emptyTitle="数字资产市场数据尚未接入。"
      emptyNote="未来将整合价格、衍生品、ETF 资金流、代币解锁、链上数据和监管事件。"
      keyConcerns={KEY_CONCERNS}
    />
  );
}