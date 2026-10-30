// 心态壁纸编辑器：默认文案、标题预设、背景色、文字色、版式密度、文字位置、背景图分类、尺寸

export const DEFAULT_SENTENCES = [
  '不追单',
  '不报复交易',
  '不扩大止损',
  '不为回本降低标准',
  '先执行计划，再评价结果',
  '情绪上头时，停止交易',
  '错过机会，比做错交易更好',
  '盈利不代表正确，亏损不代表错误',
  '保护本金，等待高质量机会',
  '交易的核心不是预测，而是执行',
  '计划优先，情绪靠后',
  '先活下来，再谈收益',
  '纪律比判断更重要',
  '不是每一天都需要交易',
  '看不懂就不做',
  '不做计划外交易',
];

export const TITLE_PRESETS = ['保持清醒', '交易纪律', '我的原则', '交易提醒', '执行优先'];

export const BG_COLORS = [
  { key: 'ink', label: '深黑', hex: '#0a0a0b' },
  { key: 'graphite', label: '深灰', hex: '#1a1c1f' },
  { key: 'blueblack', label: '蓝黑', hex: '#0b1420' },
  { key: 'charcoal', label: '炭灰', hex: '#1c1f22' },
  { key: 'navy', label: '深海军蓝', hex: '#0f1e33' },
  { key: 'forest', label: '深墨绿', hex: '#0e1f1a' },
  { key: 'wine', label: '暗酒红', hex: '#1f0f14' },
];

export const TEXT_COLORS = [
  { key: 'white', label: '白色', title: '#f5f6f8', body: '#f5f6f8' },
  { key: 'cream', label: '米白', title: '#efe9da', body: '#efe9da' },
  { key: 'gold', label: '金色', title: '#e8a532', body: '#e8c97a' },
  { key: 'gray', label: '浅灰', title: '#c2c8d2', body: '#aeb4be' },
  { key: 'whitegold', label: '白色+金色重点', title: '#e8a532', body: '#f5f6f8' },
];

// 排版密度（与对齐解耦；对齐由文字位置决定）
export const LAYOUTS = [
  { key: 'normal', label: '标准' },
  { key: 'compact', label: '紧凑' },
  { key: 'sparse', label: '极简稀疏' },
];

// 文字位置：决定整组文字在画布的位置与对齐
export const POSITIONS = [
  { key: 'top', label: '靠上', v: 'top', h: 'center' },
  { key: 'center', label: '靠中', v: 'middle', h: 'center' },
  { key: 'bottom', label: '靠下', v: 'bottom', h: 'center' },
  { key: 'topleft', label: '左上', v: 'top', h: 'left' },
  { key: 'topright', label: '右上', v: 'top', h: 'right' },
  { key: 'bottomleft', label: '左下', v: 'bottom', h: 'left' },
  { key: 'bottomright', label: '右下', v: 'bottom', h: 'right' },
];

export function getPositionMeta(key) {
  return POSITIONS.find((p) => p.key === key) || POSITIONS[0];
}

const BASE = 'https://media.base44.com/images/public/6a543c86e03e317c87bd93a3/';
export const BG_CATEGORIES = [
  { key: 'ferrari', label: '法拉利', url: BASE + 'ce45e75c7_generated_image.png' },
  { key: 'yacht', label: '游艇', url: BASE + 'ac79a8346_generated_image.png' },
  { key: 'skyline', label: '城市天际线', url: BASE + '8301de272_generated_image.png' },
  { key: 'finnight', label: '金融城市夜景', url: BASE + 'fe1394a4a_generated_image.png' },
  { key: 'skyscraper', label: '摩天大楼', url: BASE + 'a271cc6ec_generated_image.png' },
  { key: 'sunset', label: '海边日落', url: BASE + '8b792f9bd_generated_image.png' },
  { key: 'mtnroad', label: '山顶公路', url: BASE + '71baf8dc3_generated_image.png' },
  { key: 'jet', label: '私人飞机', url: BASE + '21cc0f960_generated_image.png' },
  { key: 'office', label: '高级写字楼', url: BASE + '7f84635a1_generated_image.png' },
  { key: 'desk', label: '交易员办公桌', url: BASE + '5479a13d7_generated_image.png' },
  { key: 'interior', label: '极简现代室内', url: BASE + '4e24e501e_generated_image.png' },
  { key: 'deserthwy', label: '沙漠公路', url: BASE + 'df574d2e0_generated_image.png' },
  { key: 'snowmt', label: '雪山', url: BASE + '4636d9fe6_generated_image.png' },
  { key: 'milkyway', label: '星空银河', url: BASE + '22917f534_generated_image.png' },
  { key: 'bridgenight', label: '桥梁夜景', url: BASE + '55c7b32ac_generated_image.png' },
  { key: 'fogforest', label: '雾林', url: BASE + '19060282d_generated_image.png' },
  { key: 'lake', label: '平静湖面', url: BASE + '1a664de8a_generated_image.png' },
  { key: 'golf', label: '高尔夫球场', url: BASE + '8fba3466e_generated_image.png' },
  { key: 'cliff', label: '悬崖海岸', url: BASE + '296cfdace_generated_image.png' },
  { key: 'vineyard', label: '葡萄园', url: BASE + '892527b8d_generated_image.png' },
];

export const MINDSET_SIZES = {
  desktop: [
    { key: '1920x1080', w: 1920, h: 1080, label: '1920 × 1080' },
    { key: '2560x1440', w: 2560, h: 1440, label: '2560 × 1440' },
  ],
  mobile: [
    { key: '1290x2796', w: 1290, h: 2796, label: '1290 × 2796' },
    { key: '1170x2532', w: 1170, h: 2532, label: '1170 × 2532' },
  ],
};

export function getMindsetSize(device, key) {
  const list = MINDSET_SIZES[device] || MINDSET_SIZES.desktop;
  return list.find((s) => s.key === key) || list[0];
}