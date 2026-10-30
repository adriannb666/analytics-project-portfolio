export function getSessionStates(date = new Date()) {
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60;
  return {
    asian: utcHours >= 0 && utcHours < 8,
    european: utcHours >= 7 && utcHours < 16,
    us: utcHours >= 13.5 && utcHours < 20,
  };
}

export function formatUTC(date = new Date()) {
  return date.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour12: false });
}

export function formatLocal(date = new Date()) {
  return date.toLocaleTimeString('en-GB', { hour12: false });
}

const SESSIONS = [
  { key: 'asian', label: '亚洲', open: 0, close: 8 },
  { key: 'european', label: '欧洲', open: 7, close: 16 },
  { key: 'us', label: '美国', open: 13.5, close: 20 },
];

function fmtDur(hoursFloat) {
  const totalMin = Math.max(0, Math.round(hoursFloat * 60));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getSessionCountdowns(date = new Date()) {
  const now = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  return SESSIONS.map((s) => {
    const isOpen = now >= s.open && now < s.close;
    let delta = isOpen ? s.close - now : s.open - now;
    if (delta < 0) delta += 24;
    return { key: s.key, label: s.label, isOpen, phase: isOpen ? 'close' : 'open', countdown: fmtDur(delta) };
  });
}