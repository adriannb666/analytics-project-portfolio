export const RISK_STATUS = {
  normal: { label: '正常', dot: 'bg-success', badge: 'border-success/40 bg-success/10 text-success' },
  cautious: { label: '谨慎', dot: 'bg-warning', badge: 'border-warning/40 bg-warning/10 text-warning' },
  high: { label: '高风险', dot: 'bg-orange-400', badge: 'border-orange-400/40 bg-orange-400/10 text-orange-400' },
  pause: { label: '建议暂停', dot: 'bg-destructive', badge: 'border-destructive/40 bg-destructive/10 text-destructive' },
};

export const SEVERITY = {
  info: { label: '提示', badge: 'border-info/40 bg-info/10 text-info' },
  warning: { label: '提醒', badge: 'border-warning/40 bg-warning/10 text-warning' },
  high: { label: '高风险', badge: 'border-orange-400/40 bg-orange-400/10 text-orange-400' },
  critical: { label: '严重', badge: 'border-destructive/40 bg-destructive/10 text-destructive' },
};

export const PLATFORM_LABEL = { hyperliquid: 'Hyperliquid', lighter: 'Lighter' };
export const STOP_LABEL = { full: '已覆盖全部仓位', partial: '部分覆盖', none: '未检测到止损', unknown: '无法确认' };
export const STOP_BADGE = {
  full: 'border-success/40 bg-success/10 text-success',
  partial: 'border-warning/40 bg-warning/10 text-warning',
  none: 'border-destructive/40 bg-destructive/10 text-destructive',
  unknown: 'border-info/40 bg-info/10 text-info',
};
export const DIR_LABEL = { long: '多', short: '空' };
export const DIR_BADGE = { long: 'text-success', short: 'text-destructive' };

export function fmtNum(v, d = 2) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  const n = Number(v);
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return n.toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: 0 });
}
export function fmtAddr(a) {
  if (!a) return '—';
  const s = String(a);
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}
export function fmtTime(t) {
  if (!t) return '—';
  try { return new Date(t).toLocaleString('zh-CN', { hour12: false }); } catch (e) { return '—'; }
}
export function fmtPrice(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  const n = Math.abs(Number(v));
  let d;
  if (n >= 100) d = 2;
  else if (n >= 10) d = 3;
  else if (n >= 1) d = 4;
  else if (n >= 0.01) d = 6;
  else { // <0.01：按有效数字显示，不截断
    return Number(Number(v).toPrecision(10)).toString();
  }
  return Number(v).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: 0 });
}
export function fmtPct(v, d = 2) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  return Number(v).toFixed(d) + '%';
}