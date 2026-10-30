// 基于 Canvas 2D 渲染交易规则壁纸并导出 PNG

export const COLORS = {
  bg: '#0e1218',
  panel: '#141a23',
  border: '#222c38',
  text: '#eef2f7',
  muted: '#828d9c',
  dim: '#5b6573',
  amber: '#e8a532',
  amberSoft: '#c98a28',
  red: '#dd605f',
};

export const SIZES = {
  desktop: [
    { key: '1920x1080', w: 1920, h: 1080, label: '1920 × 1080' },
    { key: '2560x1440', w: 2560, h: 1440, label: '2560 × 1440' },
  ],
  mobile: [
    { key: '1290x2796', w: 1290, h: 2796, label: '1290 × 2796' },
    { key: '1170x2532', w: 1170, h: 2532, label: '1170 × 2532' },
  ],
};

export function getSize(device, key) {
  const list = SIZES[device] || SIZES.desktop;
  return list.find((s) => s.key === key) || list[0];
}

const FONT = '"Inter","PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
const MONO = '"JetBrains Mono","SF Mono",Menlo,monospace';

function setFont(ctx, size, weight, family) {
  ctx.font = `${weight ? weight + ' ' : ''}${size}px ${family}`;
}

function dateStr(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

function layoutConsts(device) {
  if (device === 'desktop') {
    return { titleSize: 50, subSize: 26, headBlock: 150, groupTitle: 24, groupGap: 14, rowGap: 18, labSize: 24, valNorm: 26, valHi: 36, prohibItem: 40, bottomLine: 40, bottomGap: 30 };
  }
  return { titleSize: 54, subSize: 30, headBlock: 175, groupTitle: 26, groupGap: 20, rowGap: 26, labSize: 28, valNorm: 32, valHi: 44, prohibItem: 48, bottomLine: 44, bottomGap: 34 };
}

function drawGroup(ctx, x, y, w, title, rows, scale, isHi, C) {
  setFont(ctx, C.groupTitle * scale, '600', FONT);
  ctx.fillStyle = COLORS.amberSoft;
  ctx.textAlign = 'left';
  ctx.fillText(title, x, y);
  y += (C.groupTitle + 8) * scale;
  ctx.fillStyle = COLORS.border;
  ctx.fillRect(x, y, w, 1 * scale);
  y += C.groupGap * scale;
  for (const r of rows) {
    const valSize = (isHi && r.highlight) ? C.valHi * scale : C.valNorm * scale;
    const valColor = (isHi && r.highlight) ? COLORS.amber : COLORS.text;
    const valWeight = (isHi && r.highlight) ? '700' : '600';
    setFont(ctx, C.labSize * scale, '500', FONT);
    ctx.fillStyle = COLORS.muted;
    ctx.textAlign = 'left';
    ctx.fillText(r.label, x, y + (valSize - C.labSize * scale) / 2);
    setFont(ctx, valSize, valWeight, FONT);
    ctx.fillStyle = valColor;
    ctx.textAlign = 'right';
    ctx.fillText(r.value, x + w, y);
    ctx.textAlign = 'left';
    y += valSize + C.rowGap * scale;
  }
  return y + C.groupGap * scale;
}

function drawProhib(ctx, x, y, w, items, scale, C) {
  setFont(ctx, C.groupTitle * scale, '600', FONT);
  ctx.fillStyle = COLORS.amberSoft;
  ctx.textAlign = 'left';
  ctx.fillText('禁止事项', x, y);
  y += (C.groupTitle + 8) * scale;
  ctx.fillStyle = COLORS.border;
  ctx.fillRect(x, y, w, 1 * scale);
  y += C.groupGap * scale;
  for (const p of items) {
    ctx.fillStyle = COLORS.red;
    ctx.fillRect(x, y + 6 * scale, 4 * scale, (C.prohibItem - 12) * scale);
    setFont(ctx, C.prohibItem * scale, '600', FONT);
    ctx.fillStyle = COLORS.text;
    ctx.fillText(p, x + 18 * scale, y);
    y += (C.prohibItem + 8) * scale;
  }
  return y + C.groupGap * scale;
}

export function drawWallpaper(canvas, rules, { device = 'desktop', template = 'minimal', sizeKey, showPlanName = true, showDate = true, showFlags = true, bottomLine } = {}) {
  const reminder = bottomLine || rules.bottomLine;
  const size = getSize(device, sizeKey);
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  const W = size.w;
  const H = size.h;
  const scale = device === 'desktop' ? W / 1920 : W / 1290;
  const C = layoutConsts(device);
  const isHi = template === 'highlight';
  const margin = 80 * scale;

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS.amber;
  ctx.fillRect(0, 0, W * 0.16, 3 * scale);

  ctx.textBaseline = 'top';

  // header
  let y = margin;
  setFont(ctx, 18 * scale, '600', MONO);
  ctx.fillStyle = COLORS.amber;
  ctx.textAlign = 'left';
  ctx.fillText('ZHIXING · 知行交易终端', margin, y);
  y += 30 * scale;
  setFont(ctx, C.titleSize * scale, '700', FONT);
  ctx.fillStyle = COLORS.text;
  ctx.fillText('我的交易规则', margin, y);
  y += (C.titleSize + 18) * scale;
  setFont(ctx, C.subSize * scale, '500', FONT);
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(showPlanName ? `${rules.planName}   ·   ${rules.version}` : rules.version, margin, y);
  y += (C.subSize + 16) * scale;
  ctx.fillStyle = COLORS.border;
  ctx.fillRect(margin, y, W - margin * 2, 1.5 * scale);
  y += 26 * scale;

  let contentBottom;
  if (device === 'desktop') {
    const gap = 56 * scale;
    const colW = (W - margin * 2 - gap) / 2;
    const leftX = margin;
    const rightX = margin + colW + gap;
    let ly = y;
    let ry = y;
    ly = drawGroup(ctx, leftX, ly, colW, '交易范围', rules.scope, scale, isHi, C);
    ly = drawGroup(ctx, leftX, ly, colW, '风险规则', rules.risk, scale, isHi, C);
    ry = drawGroup(ctx, rightX, ry, colW, '执行规则', rules.exec, scale, isHi, C);
    ry = drawGroup(ctx, rightX, ry, colW, '纪律规则', rules.discipline, scale, isHi, C);
    if (rules.prohibitions.length) ry = drawProhib(ctx, rightX, ry, colW, rules.prohibitions, scale, C);
    contentBottom = Math.max(ly, ry);
  } else {
    const colW = W - margin * 2;
    y = drawGroup(ctx, margin, y, colW, '交易范围', rules.scope, scale, isHi, C);
    y = drawGroup(ctx, margin, y, colW, '风险规则', rules.risk, scale, isHi, C);
    y = drawGroup(ctx, margin, y, colW, '执行规则', rules.exec, scale, isHi, C);
    y = drawGroup(ctx, margin, y, colW, '纪律规则', rules.discipline, scale, isHi, C);
    if (rules.prohibitions.length) y = drawProhib(ctx, margin, y, colW, rules.prohibitions, scale, C);
    contentBottom = y;
  }

  // bottom
  const bottomReserve = (C.bottomLine + C.bottomGap + 46) * scale;
  let by = Math.max(contentBottom + 24 * scale, H - margin - bottomReserve);
  ctx.fillStyle = COLORS.border;
  ctx.fillRect(margin, by, W - margin * 2, 1 * scale);
  by += C.bottomGap * scale;
  setFont(ctx, C.bottomLine * scale, '600', FONT);
  ctx.fillStyle = COLORS.amber;
  ctx.textAlign = 'left';
  ctx.fillText(reminder, margin, by);
  by += (C.bottomLine + 16) * scale;
  if (showDate) {
    setFont(ctx, 18 * scale, '500', MONO);
    ctx.fillStyle = COLORS.dim;
    ctx.fillText(`生成日期 ${dateStr(rules.generatedDate)}   ·   ${rules.version}   ·   BUILD v0.2.0`, margin, by);
    by += 28 * scale;
  }
  if (showFlags && rules.highOpen > 0) {
    setFont(ctx, 20 * scale, '600', FONT);
    ctx.fillStyle = COLORS.red;
    ctx.fillText(`当前未解决高风险冲突：${rules.highOpen} 项`, margin, by);
  }
}

export function downloadWallpaper(rules, { device, template, sizeKey, showPlanName, showDate, showFlags, bottomLine }) {
  const canvas = document.createElement('canvas');
  drawWallpaper(canvas, rules, { device, template, sizeKey, showPlanName, showDate, showFlags, bottomLine });
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const ds = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
  const ts = template === 'highlight' ? 'b' : 'a';
  const name = `trading-rules-${device}-${ts}-${ds}.png`;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
}