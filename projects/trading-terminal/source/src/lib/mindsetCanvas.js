// 心态壁纸 Canvas 渲染与 PNG 导出

import { TEXT_COLORS, getMindsetSize, getPositionMeta } from './mindsetBackgrounds';

const SERIF = '"Songti SC","STSong","Source Han Serif SC","Noto Serif SC","SimSun","STSongti",serif';
const MONO = '"JetBrains Mono","SF Mono",Menlo,monospace';

const imgCache = {};

export function loadBgImage(url) {
  return new Promise((resolve) => {
    if (imgCache[url] && imgCache[url].complete) { resolve(imgCache[url]); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imgCache[url] = img; resolve(img); };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function setFont(ctx, size, weight, family) {
  ctx.font = `${weight ? weight + ' ' : ''}${size}px ${family}`;
}

function wrap(ctx, text, maxW) {
  const chars = Array.from(text);
  const lines = [];
  let line = '';
  for (const ch of chars) {
    if (ctx.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch; }
    else line += ch;
  }
  if (line) lines.push(line);
  return lines;
}

function lighten(hex, amt) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.min(255, Math.round(r + 255 * amt));
  g = Math.min(255, Math.round(g + 255 * amt));
  b = Math.min(255, Math.round(b + 255 * amt));
  return `rgb(${r},${g},${b})`;
}

function drawCover(ctx, img, W, H) {
  const ir = img.width / img.height;
  const cr = W / H;
  let dw, dh;
  if (ir > cr) { dh = H; dw = H * ir; } else { dw = W; dh = W / ir; }
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
}

export function drawMindsetWallpaper(canvas, state, img) {
  const size = getMindsetSize(state.device, state.sizeKey);
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  const W = size.w;
  const H = size.h;
  const portrait = state.device === 'mobile';
  const tc = TEXT_COLORS.find((t) => t.key === state.textColor) || TEXT_COLORS[0];
  const pos = getPositionMeta(state.position);
  const sparse = state.layout === 'sparse';
  const compact = state.layout === 'compact';

  // background
  if (state.bgType === 'image' && img) {
    drawCover(ctx, img, W, H);
    ctx.fillStyle = 'rgba(6,8,12,0.55)';
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(6,8,12,0.18)');
    g.addColorStop(1, 'rgba(6,8,12,0.72)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else {
    const c = state.bgType === 'image' ? '#0a0a0b' : (state.bgColor || '#0a0a0b');
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, W, H);
    if (state.gradient) {
      const g = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
      g.addColorStop(0, lighten(c, 0.1));
      g.addColorStop(1, c);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  }

  const margin = (portrait ? 0.1 : 0.085) * W;
  const contentW = W - margin * 2;
  const maxLines = sparse ? 4 : compact ? (portrait ? 9 : 12) : (portrait ? 7 : 9);
  const lines = (state.lines || []).slice(0, maxLines);

  const titleSize = (portrait ? 0.068 : 0.04) * W;
  const lineSize = (portrait ? 0.044 : 0.026) * W;
  const titleLineH = titleSize * 1.2;
  const lineH = lineSize * 1.36;
  const sentGap = sparse ? lineH * 1.25 : compact ? lineH * 0.4 : lineH * 0.8;

  ctx.textBaseline = 'top';

  // measure total content height
  let titleH = 0;
  if (state.showTitle && state.title) {
    setFont(ctx, titleSize, '600', SERIF);
    const tl = wrap(ctx, state.title, contentW);
    titleH = tl.length * titleLineH + titleSize * 0.32 + Math.max(2.5, titleSize * 0.05) + titleSize * 0.72;
  }
  let bodyH = 0;
  setFont(ctx, lineSize, '400', SERIF);
  lines.forEach((ln, i) => {
    const wl = wrap(ctx, ln, contentW);
    bodyH += wl.length * lineH;
    if (i < lines.length - 1) bodyH += sentGap;
  });
  const totalH = titleH + bodyH;
  const pad = H * 0.085;
  let startY;
  if (pos.v === 'top') startY = pad;
  else if (pos.v === 'middle') startY = Math.max(pad, (H - totalH) / 2);
  else startY = Math.max(pad, H - pad - totalH);

  const hAlign = pos.h;
  ctx.textAlign = hAlign;
  const cx = hAlign === 'left' ? margin : hAlign === 'right' ? (W - margin) : W / 2;

  const useShadow = state.bgType === 'image' && img;
  const applyShadow = () => {
    if (useShadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = Math.max(4, W * 0.004);
      ctx.shadowOffsetY = Math.max(2, W * 0.002);
    }
  };
  const clearShadow = () => { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; };

  let y = startY;
  if (state.showTitle && state.title) {
    setFont(ctx, titleSize, '600', SERIF);
    ctx.fillStyle = tc.title;
    applyShadow();
    const tl = wrap(ctx, state.title, contentW);
    tl.forEach((t) => { ctx.fillText(t, cx, y); y += titleLineH; });
    clearShadow();
    y += titleSize * 0.32;
    ctx.fillStyle = tc.title;
    const aw = titleSize * 1.4;
    const ah = Math.max(2.5, titleSize * 0.05);
    if (hAlign === 'center') ctx.fillRect(cx - aw / 2, y, aw, ah);
    else if (hAlign === 'left') ctx.fillRect(cx, y, aw, ah);
    else ctx.fillRect(cx - aw, y, aw, ah);
    y += ah + titleSize * 0.72;
  }

  setFont(ctx, lineSize, '400', SERIF);
  ctx.fillStyle = tc.body;
  applyShadow();
  lines.forEach((ln, i) => {
    const wl = wrap(ctx, ln, contentW);
    wl.forEach((wseg) => { ctx.fillText(wseg, cx, y); y += lineH; });
    if (i < lines.length - 1) y += sentGap;
  });
  clearShadow();

  // footer
  setFont(ctx, Math.max(13, W * 0.014), '500', MONO);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textAlign = hAlign;
  ctx.fillText('知行交易终端 · MINDSET', hAlign === 'left' ? margin : hAlign === 'right' ? (W - margin) : W / 2, H - pad * 0.5);
}

export async function downloadMindset(state) {
  const canvas = document.createElement('canvas');
  let img = null;
  if (state.bgType === 'image' && state.bgUrl) img = await loadBgImage(state.bgUrl);
  drawMindsetWallpaper(canvas, state, img);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('blob')); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const d = new Date();
      const p = (n) => String(n).padStart(2, '0');
      const ds = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
      a.href = url;
      a.download = `mindset-wallpaper-${state.device}-${ds}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      resolve();
    }, 'image/png');
  });
}