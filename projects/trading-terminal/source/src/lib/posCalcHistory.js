const KEY = 'poscalc_history_v1';
const MAX = 50;

export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function save(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    /* ignore quota errors */
  }
}

export function addHistory(entry) {
  const item = {
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    created_at: new Date().toISOString(),
    ...entry,
  };
  const next = [item, ...loadHistory()].slice(0, MAX);
  save(next);
  return item;
}

export function removeHistory(id) {
  save(loadHistory().filter((h) => h.id !== id));
}

export function clearHistory() {
  save([]);
}