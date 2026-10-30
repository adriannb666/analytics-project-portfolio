import React from 'react';
import TerminalSectionHeader from '@/components/terminal/TerminalSectionHeader';
import MarketStatusStrip from '@/components/terminal/MarketStatusStrip';

const ITEMS = [
  { name: '全球风险偏好', value: '等待数据源', note: '综合风险偏好指标', updated: '—' },
  { name: '宏观环境', value: '等待经济数据接口', note: '增长 / 通胀 / 就业', updated: '—' },
  { name: '股票市场', value: '等待行情接口', note: '主要指数与板块', updated: '—' },
  { name: '数字资产', value: '等待加密市场数据接口', note: 'BTC / ETH / 总市值', updated: '—' },
  { name: '波动率', value: '等待波动率数据', note: 'VIX 与隐含波动率', updated: '—' },
  { name: '流动性', value: '等待流动性指标', note: '资金面与美元流动性', updated: '—' },
];

export default function MarketStatusSection() {
  return (
    <section>
      <TerminalSectionHeader title="关键市场状态" english="MARKET STATE" statusLabel="等待数据源" statusTone="pending" />
      <MarketStatusStrip items={ITEMS} />
    </section>
  );
}