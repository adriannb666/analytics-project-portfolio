import React from 'react';
import { Link } from 'react-router-dom';
import TerminalSectionHeader from '@/components/terminal/TerminalSectionHeader';
import SoonLabel from '@/components/terminal/SoonLabel';

const GROUPS = [
  { label: '市场准备', items: [{ id: 'economic-calendar', label: '经济日历' }, { id: 'earnings-calendar', label: '财报日历' }, { id: 'crypto-calendar', label: '加密日历' }, { id: 'news', label: '新闻' }] },
  { label: '技术分析', items: [{ id: 'trend-compass', label: '趋势罗盘' }, { id: 'rsi-scanner', label: 'RSI 扫描器' }, { id: 'confluence-score', label: '共振评分' }, { id: 'volatility-tracker', label: '波动率追踪' }] },
  { label: '数字资产', items: [{ id: 'btc-pulse', label: 'BTC 市场脉搏' }, { id: 'funding-rate', label: '资金费率' }, { id: 'open-interest', label: '未平仓合约' }, { id: 'liquidation-heatmap', label: '清算热力图' }, { id: 'onchain-valuation', label: '链上估值' }] },
];

export default function FutureModules() {
  return (
    <section>
      <TerminalSectionHeader title="未来功能入口" english="ROADMAP" statusLabel="即将上线" statusTone="demo" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {GROUPS.map((g) => (
          <div key={g.label} className="border border-border rounded-sm bg-card/40 p-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 mb-2">{g.label}</div>
            <ul className="space-y-0.5">
              {g.items.map((it) => (
                <li key={it.id}>
                  <Link to={`/placeholder?module=${it.id}`} className="flex items-center justify-between gap-2 text-xs text-muted-foreground hover:text-foreground py-1">
                    <span>{it.label}</span>
                    <SoonLabel />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}