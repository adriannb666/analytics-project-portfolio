import {
  LayoutDashboard, ClipboardList, Calculator, ListChecks, BookOpen,
  ShieldAlert, RotateCcw, Globe, CalendarDays, Calendar, BarChart3,
  Rocket, Newspaper, Compass, Activity, Sparkles, Waves, Radar,
  Bitcoin, Percent, Layers, Grid3x3, ArrowLeftRight, Network,
  User, Database, Info,
} from 'lucide-react';

export const ONLINE_TOOLS_COUNT = 3;
export const TOTAL_TOOLS = 20;

export const navConfig = [
  {
    category: '首页',
    items: [
      { id: 'dashboard', label: '总览', path: '/', available: true, icon: LayoutDashboard },
    ],
  },
  {
    category: '交易工作区',
    items: [
      { id: 'trading-plan', label: '交易计划', path: '/plan', available: true, icon: ClipboardList },
      { id: 'position-calc', label: '仓位计算器', path: '/position-calculator', available: true, icon: Calculator, description: '根据账户权益、入场价、止损价和单笔风险，自动计算仓位规模与保证金占用。' },
      { id: 'pre-trade-check', label: '交易前检查', path: '/pretrade', available: true, icon: ListChecks, description: '在执行交易前，逐项核对计划、风险、仓位与纪律规则。' },
      { id: 'journal', label: '交易日志', path: '/journal', available: true, icon: BookOpen, description: '记录每笔交易的决策、执行与结果，支持标签、筛选与统计。' },
      { id: 'risk-monitor', label: '风险监控', path: '/risk-monitor', available: true, icon: ShieldAlert, description: '通过公开地址监控 Hyperliquid 与 Lighter 账户的仓位、杠杆与回撤风险。' },
      { id: 'review', label: '复盘中心', available: false, icon: RotateCcw, description: '按周期与策略复盘交易表现，提炼可改进点。' },
    ],
  },
  {
    category: '市场准备',
    items: [
      { id: 'today-market', label: '今日市场', available: false, icon: Globe, description: '概览当日主要市场动态与关注事件。' },
      { id: 'economic-calendar', label: '经济日历', available: false, icon: CalendarDays, description: '跟踪重要经济数据发布与央行决议时间。' },
      { id: 'crypto-calendar', label: '加密日历', available: false, icon: Calendar, description: '追踪代币解锁、升级与重要链上事件。' },
      { id: 'earnings-calendar', label: '财报日历', available: false, icon: BarChart3, description: '查看上市公司财报发布时间与市场预期。' },
      { id: 'ipo-calendar', label: 'IPO 日历', available: false, icon: Rocket, description: '了解即将上市的公司与发行安排。' },
      { id: 'news', label: '新闻', available: false, icon: Newspaper, description: '聚合市场新闻与重要公告。' },
    ],
  },
  {
    category: '技术分析',
    items: [
      { id: 'trend-compass', label: '趋势罗盘', available: false, icon: Compass, description: '多周期趋势方向综合判定工具。' },
      { id: 'rsi-scanner', label: 'RSI 扫描器', available: false, icon: Activity, description: '扫描超买超卖标的与 RSI 背离。' },
      { id: 'confluence-score', label: '共振评分', available: false, icon: Sparkles, description: '综合多技术信号计算共振强度评分。' },
      { id: 'volatility-tracker', label: '波动率追踪', available: false, icon: Waves, description: '追踪波动率水平与变化趋势。' },
      { id: 'trend-scanner', label: '趋势扫描器', available: false, icon: Radar, description: '扫描全市场趋势强度与方向。' },
    ],
  },
  {
    category: '加密数据',
    items: [
      { id: 'btc-pulse', label: 'BTC 市场脉搏', available: false, icon: Bitcoin, description: '比特币市场情绪与关键指标综合面板。' },
      { id: 'funding-rate', label: '资金费率', available: false, icon: Percent, description: '追踪永续合约资金费率水平与极值。' },
      { id: 'open-interest', label: '未平仓合约', available: false, icon: Layers, description: '监控各交易所未平仓合约变化。' },
      { id: 'liquidation-heatmap', label: '清算热力图', available: false, icon: Grid3x3, description: '可视化清算密度与价格分布。' },
      { id: 'exchange-flow', label: '交易所资金流', available: false, icon: ArrowLeftRight, description: '追踪交易所流入流出与净变化。' },
      { id: 'onchain-valuation', label: '链上估值', available: false, icon: Network, description: '基于链上数据的估值指标分析。' },
    ],
  },
  {
    category: '设置',
    items: [
      { id: 'profile', label: '个人资料', available: false, icon: User, description: '管理账户资料与偏好设置。' },
      { id: 'data-export', label: '数据与导出', available: false, icon: Database, description: '导出与备份你的交易计划与日志数据。' },
      { id: 'about', label: '关于本终端', available: false, icon: Info, description: '了解知行交易终端的版本、架构与设计理念。' },
    ],
  },
];

const extraModules = {
  guide: { id: 'guide', label: '使用指南', description: '了解如何通过引导式步骤，把个人交易习惯整理成可执行的交易计划。' },
  help: { id: 'help', label: '帮助', description: '常见问题、使用说明与术语解释。' },
};

export function getModuleMeta(id) {
  if (extraModules[id]) return extraModules[id];
  for (const cat of navConfig) {
    for (const item of cat.items) {
      if (item.id === id) return item;
    }
  }
  return { id, label: '模块', description: '该模块正在开发中。' };
}

export const PLAN_STEPS = [
  { code: '0', name: '开始之前' },
  { code: '1', name: '交易者画像' },
  { code: '2', name: '目标与预期' },
  { code: '3', name: '市场范围' },
  { code: '4', name: '策略与优势' },
  { code: '5', name: '风险与资金' },
  { code: '6', name: '执行与持仓' },
  { code: '7', name: '心理与纪律' },
  { code: '8', name: '记录与复盘' },
  { code: 'C', name: '规则冲突' },
  { code: 'E', name: '生成计划' },
];

export const TOTAL_STEPS = PLAN_STEPS.length;