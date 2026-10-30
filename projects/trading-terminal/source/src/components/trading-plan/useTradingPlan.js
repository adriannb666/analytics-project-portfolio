import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { STEP_WEIGHTS, validateStep, profileComplete, psychRecommended } from '@/components/trading-plan/stepsConfig';
import { computeCoherence } from '@/components/trading-plan/coherenceRules';

const SAVE_DEBOUNCE_MS = 900;
const PLAN_STEP_ORDER = ['0', '1', '2', '3', '4', '5', '6', '7', '8', 'C', 'E'];
const ANSWER_STEPS = ['0', '1', '2', '3', '4', '5', '6', '7', '8'];

function nextStep(code) {
  const i = PLAN_STEP_ORDER.indexOf(code);
  return PLAN_STEP_ORDER[i + 1] || code;
}

function defaultDraft() {
  return {
    plan_name: '我的交易计划', owner_name: '', version: 'v1.0', status: 'draft',
    current_step: '0', completeness_score: 0, unresolved_flags_count: 0,
    step_0_completed: false, step_1_completed: false, step_2_completed: false, step_3_completed: false,
    step_4_completed: false, step_5_completed: false, step_6_completed: false, step_7_completed: false,
    step_8_completed: false, coherence_check_completed: false, export_ready: false, last_generated_date: null,
  };
}

function classifyError(err, fallbackPrefix) {
  const status = err && err.status;
  const msg = err && err.message ? err.message : String(err || '');
  if (status === 401 || /unauthorized|token|认证|登录失效/i.test(msg)) return '登录状态已失效，请重新登录后继续。';
  if (status === 403 || /permission|forbidden|denied|权限|无权/i.test(msg)) return '当前账户无权修改这份交易计划。';
  if (err && err.code === 'ERR_NETWORK' || /network|fetch|connect|网络/i.test(msg)) return '网络连接异常，当前内容尚未保存，请稍后重试。';
  return `${fallbackPrefix}：${msg || '未知错误'}`;
}

function mergeFlags(existing, updated) {
  const map = {};
  existing.forEach((f) => { map[f.id] = f; });
  updated.forEach((f) => { if (f && f.id) map[f.id] = f; });
  return Object.values(map);
}

function stepKeyFromQuestion(key) {
  const head = key.split('_')[0];
  return head.replace('s', '');
}

export function useTradingPlan() {
  const [plan, setPlan] = useState(null);
  const [profile, setProfile] = useState(null);
  const [answers, setAnswers] = useState({});
  const [answerRecs, setAnswerRecs] = useState({});
  const [watchlist, setWatchlist] = useState([]);
  const [psychRules, setPsychRules] = useState([]);
  const [flags, setFlags] = useState([]);
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveError, setSaveError] = useState('');

  const planRef = useRef(null); const profileRef = useRef(null); const answersRef = useRef({});
  const answerRecsRef = useRef({}); const watchlistRef = useRef([]); const psychRulesRef = useRef([]);
  const flagsRef = useRef([]); const generatedRef = useRef(null);
  const saveTimer = useRef(null); const savedTimer = useRef(null);
  const pendingAnswers = useRef(null); const pendingPlan = useRef(null); const pendingProfile = useRef(null);
  const inFlight = useRef(false); const needsReflush = useRef(false);
  const completing = useRef(false); const flushRef = useRef(() => {});
  const coherenceTimer = useRef(null); const coherenceInFlight = useRef(false); const coherenceReflush = useRef(false);
  const syncCoherenceRef = useRef(() => {});

  useEffect(() => { planRef.current = plan; }, [plan]);
  useEffect(() => { profileRef.current = profile; }, [profile]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { answerRecsRef.current = answerRecs; }, [answerRecs]);
  useEffect(() => { watchlistRef.current = watchlist; }, [watchlist]);
  useEffect(() => { psychRulesRef.current = psychRules; }, [psychRules]);
  useEffect(() => { flagsRef.current = flags; }, [flags]);
  useEffect(() => { generatedRef.current = generated; }, [generated]);

  const buildCtx = useCallback(() => ({
    plan, profile, answers, watchlist, psychRules, flags,
  }), [plan, profile, answers, watchlist, psychRules, flags]);

  const stepComplete = useCallback((k) => {
    if (k === '0') return !!plan?.id && !!(plan?.plan_name || '').trim();
    if (k === '1') return profileComplete(profile);
    if (['2', '3', '4', '5', '6', '7', '8'].includes(k)) return validateStep(k, { plan, profile, answers, watchlist, psychRules, flags }).ok;
    if (k === 'C') return !!plan?.coherence_check_completed;
    if (k === 'E') return !!plan?.export_ready;
    return false;
  }, [plan, profile, answers, watchlist, psychRules, flags]);

  const isAccessible = useCallback((code) => {
    const idx = PLAN_STEP_ORDER.indexOf(code);
    for (let i = 0; i < idx; i++) { if (!stepComplete(PLAN_STEP_ORDER[i])) return false; }
    return true;
  }, [stepComplete]);

  const computeCompletenessLive = () => {
    let s = 0;
    ANSWER_STEPS.forEach((k) => { if (stepComplete(k)) s += STEP_WEIGHTS[k]; });
    return s;
  };

  const resetSavedTimer = useCallback(() => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaveStatus((s) => (s === 'saved' ? 'idle' : s)), 2500);
  }, []);

  const persistCompletion = useCallback(async () => {
    const p = planRef.current;
    if (!p || !p.id) return;
    const patch = {};
    let comp = 0;
    ANSWER_STEPS.forEach((k) => {
      const done = stepComplete(k);
      const field = `step_${k}_completed`;
      if ((p[field] ?? false) !== done) patch[field] = done;
      if (done) comp += STEP_WEIGHTS[k];
    });
    if ((p.completeness_score ?? 0) !== comp) patch.completeness_score = comp;
    if (Object.keys(patch).length > 0) {
      try {
        const u = await base44.entities.TradingPlan.update(p.id, patch);
        setPlan((prev) => (prev ? { ...prev, ...u } : prev));
      } catch (e) { console.error('完整度同步失败', e); }
    }
  }, [stepComplete]);

  const flushSave = useCallback(async () => {
    if (inFlight.current) { needsReflush.current = true; return; }
    const p = planRef.current;
    if (!p || !p.id) return;
    const ansPatch = pendingAnswers.current;
    const planPatch = pendingPlan.current;
    const profilePatch = pendingProfile.current;
    if (!ansPatch && !planPatch && !profilePatch) return;

    inFlight.current = true;
    pendingAnswers.current = null; pendingPlan.current = null; pendingProfile.current = null;
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    setSaveStatus('saving'); setSaveError('');
    try {
      if (planPatch) {
        const u = await base44.entities.TradingPlan.update(p.id, planPatch);
        setPlan((prev) => (prev ? { ...prev, ...u } : prev));
      }
      if (profilePatch) {
        const prof = profileRef.current;
        if (prof && prof.id) {
          const u = await base44.entities.PlanProfile.update(prof.id, profilePatch);
          setProfile((prev) => (prev ? { ...prev, ...u } : u));
        } else {
          const c = await base44.entities.PlanProfile.create({ trading_plan_id: p.id, ...profilePatch });
          setProfile(c);
        }
      }
      if (ansPatch) {
        const recs = answerRecsRef.current;
        for (const [key, value] of Object.entries(ansPatch)) {
          const rec = recs[key];
          const payload = { answer_value: JSON.stringify(value) };
          if (rec && rec.id) {
            const u = await base44.entities.PlanAnswer.update(rec.id, payload);
            setAnswerRecs((prev) => ({ ...prev, [key]: u }));
          } else {
            const c = await base44.entities.PlanAnswer.create({ trading_plan_id: p.id, step_key: stepKeyFromQuestion(key), question_key: key, ...payload });
            setAnswerRecs((prev) => ({ ...prev, [key]: c }));
          }
        }
      }
      await persistCompletion();
      setSaveStatus('saved'); resetSavedTimer();
    } catch (e) {
      console.error('自动保存失败', e);
      setSaveError(classifyError(e, '保存失败')); setSaveStatus('error');
      pendingAnswers.current = ansPatch ? { ...ansPatch, ...(pendingAnswers.current || {}) } : pendingAnswers.current;
      pendingPlan.current = planPatch ? { ...planPatch, ...(pendingPlan.current || {}) } : pendingPlan.current;
      pendingProfile.current = profilePatch ? { ...profilePatch, ...(pendingProfile.current || {}) } : pendingProfile.current;
    } finally {
      inFlight.current = false;
      if (needsReflush.current) { needsReflush.current = false; flushRef.current(); }
    }
  }, [persistCompletion, resetSavedTimer]);

  flushRef.current = flushSave;

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { flushSave(); }, SAVE_DEBOUNCE_MS);
  }, [flushSave]);

  const syncCoherence = useCallback(async () => {
    const p = planRef.current;
    if (!p || !p.id) return;
    if (!stepComplete('8')) return;
    if (coherenceInFlight.current) { coherenceReflush.current = true; return; }
    coherenceInFlight.current = true;
    try {
      const ctx = buildCtx();
      const computed = computeCoherence(ctx);
      const existing = flagsRef.current;
      const byKey = {}; existing.forEach((f) => { byKey[f.flag_key] = f; });
      const computedKeys = new Set(computed.map((c) => c.key));
      const updated = [];
      for (const c of computed) {
        const ex = byKey[c.key];
        if (!ex) {
          const created = await base44.entities.CoherenceFlag.create({
            trading_plan_id: p.id, flag_key: c.key, severity: c.severity, title: c.title,
            description: c.description, affected_steps: c.affectedSteps.join(','), current_values: c.currentValues,
            recommendation: c.recommendation, status: 'open',
          });
          updated.push(created);
        } else if (ex.status === 'resolved') {
          const u = await base44.entities.CoherenceFlag.update(ex.id, { status: 'open', current_values: c.currentValues });
          updated.push({ ...ex, ...u });
        } else if (ex.status === 'open' && ex.current_values !== c.currentValues) {
          const u = await base44.entities.CoherenceFlag.update(ex.id, { current_values: c.currentValues });
          updated.push({ ...ex, ...u });
        } else {
          updated.push(ex);
        }
      }
      for (const ex of existing) {
        if (ex.status === 'open' && !computedKeys.has(ex.flag_key)) {
          const u = await base44.entities.CoherenceFlag.update(ex.id, { status: 'resolved' });
          updated.push({ ...ex, ...u });
        }
      }
      const merged = mergeFlags(existing, updated);
      setFlags(merged);
      const openCount = merged.filter((f) => f.status === 'open').length;
      if ((p.unresolved_flags_count ?? 0) !== openCount) {
        await base44.entities.TradingPlan.update(p.id, { unresolved_flags_count: openCount });
        setPlan((prev) => (prev ? { ...prev, unresolved_flags_count: openCount } : prev));
      }
    } catch (e) {
      console.error('规则冲突同步失败', e);
    } finally {
      coherenceInFlight.current = false;
      if (coherenceReflush.current) { coherenceReflush.current = false; syncCoherenceRef.current(); }
    }
  }, [buildCtx, stepComplete]);

  syncCoherenceRef.current = syncCoherence;

  const scheduleCoherenceSync = useCallback(() => {
    if (coherenceTimer.current) clearTimeout(coherenceTimer.current);
    coherenceTimer.current = setTimeout(() => { syncCoherenceRef.current(); }, SAVE_DEBOUNCE_MS + 300);
  }, []);

  // 心理规则同步
  const setPsychIssues = useCallback(async (issues) => {
    const p = planRef.current; if (!p || !p.id) return;
    const current = psychRulesRef.current;
    const issuesNorm = (issues || []).filter((i) => i !== '目前没有明显问题' && i !== '其他');
    const toCreate = issuesNorm.filter((i) => !current.some((r) => r.issue_key === i));
    const toDelete = current.filter((r) => !issuesNorm.includes(r.issue_key));
    let next = [...current];
    for (const i of toCreate) {
      try {
        const rec = psychRecommended(i);
        const c = await base44.entities.PsychologyRule.create({ trading_plan_id: p.id, issue_key: i, issue_name: i, severity: '偶尔发生', recommended_rule: rec, final_rule: rec, is_confirmed: false });
        next.push(c);
      } catch (e) { console.error('创建心理规则失败', e); }
    }
    for (const r of toDelete) {
      try { await base44.entities.PsychologyRule.delete(r.id); } catch (e) {}
      next = next.filter((x) => x.id !== r.id);
    }
    setPsychRules(next);
  }, []);

  const updatePsychRule = useCallback(async (issueKey, patch) => {
    const r = psychRulesRef.current.find((x) => x.issue_key === issueKey);
    if (!r) return;
    try {
      const u = await base44.entities.PsychologyRule.update(r.id, patch);
      setPsychRules((prev) => prev.map((x) => (x.id === r.id ? { ...x, ...u } : x)));
    } catch (e) {
      setSaveError(classifyError(e, '保存失败')); setSaveStatus('error');
    }
  }, []);

  const updateAnswer = useCallback((key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    pendingAnswers.current = { ...(pendingAnswers.current || {}), [key]: value };
    if (planRef.current && planRef.current.id) {
      scheduleSave();
      scheduleCoherenceSync();
    }
    if (key === 's7_issues') setPsychIssues(value);
  }, [scheduleSave, scheduleCoherenceSync, setPsychIssues]);

  const updatePlanFields = useCallback((partial) => {
    setPlan((prev) => ({ ...(prev || defaultDraft()), ...partial }));
    pendingPlan.current = { ...(pendingPlan.current || {}), ...partial };
    if (planRef.current && planRef.current.id) scheduleSave();
  }, [scheduleSave]);

  const updateProfileFields = useCallback((partial) => {
    setProfile((prev) => (prev ? { ...prev, ...partial } : { ...partial }));
    pendingProfile.current = { ...(pendingProfile.current || {}), ...partial };
    if (planRef.current && planRef.current.id) scheduleSave();
  }, [scheduleSave]);

  const addWatchlistItem = useCallback(async (item) => {
    const p = planRef.current; if (!p || !p.id) return;
    try {
      const order = watchlistRef.current.length;
      const c = await base44.entities.WatchlistItem.create({ trading_plan_id: p.id, sort_order: order, is_active: true, symbol: item.symbol, name: item.name, market: item.market, notes: item.notes });
      setWatchlist((prev) => [...prev, c]);
    } catch (e) { setSaveError(classifyError(e, '保存失败')); setSaveStatus('error'); }
  }, []);

  const updateWatchlistItem = useCallback(async (id, patch) => {
    try { const u = await base44.entities.WatchlistItem.update(id, patch); setWatchlist((prev) => prev.map((w) => (w.id === id ? { ...w, ...u } : w))); }
    catch (e) { setSaveError(classifyError(e, '保存失败')); setSaveStatus('error'); }
  }, []);

  const removeWatchlistItem = useCallback(async (id) => {
    try { await base44.entities.WatchlistItem.delete(id); setWatchlist((prev) => prev.filter((w) => w.id !== id)); }
    catch (e) { setSaveError(classifyError(e, '保存失败')); setSaveStatus('error'); }
  }, []);

  const setFlagStatus = useCallback(async (flagId, status, reason) => {
    const p = planRef.current; if (!p || !p.id) return;
    try {
      const patch = { status };
      if (status === 'accepted' && reason) patch.accepted_reason = reason;
      const u = await base44.entities.CoherenceFlag.update(flagId, patch);
      const next = flagsRef.current.map((f) => (f.id === flagId ? { ...f, ...u } : f));
      setFlags(next);
      const openCount = next.filter((f) => f.status === 'open').length;
      await base44.entities.TradingPlan.update(p.id, { unresolved_flags_count: openCount });
      setPlan((prev) => (prev ? { ...prev, unresolved_flags_count: openCount } : prev));
    } catch (e) { setSaveError(classifyError(e, '保存失败')); setSaveStatus('error'); }
  }, []);

  const completeStep0 = useCallback(async () => {
    if (completing.current) return;
    completing.current = true;
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    setSaveStatus('saving'); setSaveError('');
    try {
      const p = planRef.current;
      if (p && p.id) {
        const merged = { ...(pendingPlan.current || {}), step_0_completed: true, current_step: '1', completeness_score: 5 };
        pendingPlan.current = null;
        const u = await base44.entities.TradingPlan.update(p.id, merged);
        setPlan((prev) => (prev ? { ...prev, ...u } : u));
      } else {
        const draftFields = p || defaultDraft();
        const createPayload = {
          plan_name: draftFields.plan_name || '我的交易计划', owner_name: draftFields.owner_name || '',
          version: draftFields.version || 'v1.0', status: 'draft', unresolved_flags_count: 0, step_1_completed: false,
          ...(pendingPlan.current || {}), step_0_completed: true, current_step: '1', completeness_score: 5,
        };
        pendingPlan.current = null;
        const created = await base44.entities.TradingPlan.create(createPayload);
        setPlan(created);
      }
      setSaveStatus('saved'); resetSavedTimer();
    } catch (e) {
      console.error('Step 0 保存失败', e);
      setSaveError(classifyError(e, '保存失败')); setSaveStatus('error');
      throw e;
    } finally { completing.current = false; }
  }, [resetSavedTimer]);

  const completeStep1 = useCallback(async () => {
    if (completing.current) return;
    const p = planRef.current;
    if (!p || !p.id) { setSaveError('尚未创建交易计划，请先完成开始步骤。'); setSaveStatus('error'); throw new Error('no plan'); }
    completing.current = true;
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    setSaveStatus('saving'); setSaveError('');
    try {
      const profilePatch = pendingProfile.current || {};
      const prof = profileRef.current;
      if (prof && prof.id) {
        const u = await base44.entities.PlanProfile.update(prof.id, profilePatch); setProfile(u);
      } else {
        const c = await base44.entities.PlanProfile.create({ trading_plan_id: p.id, ...profilePatch }); setProfile(c);
      }
      pendingProfile.current = null;
      const planPatch = { step_1_completed: true, current_step: '2', completeness_score: 10 };
      const u = await base44.entities.TradingPlan.update(p.id, planPatch);
      setPlan((prev) => (prev ? { ...prev, ...u } : u));
      setSaveStatus('saved'); resetSavedTimer();
    } catch (e) {
      console.error('Step 1 保存失败', e);
      setSaveError(classifyError(e, '保存失败')); setSaveStatus('error');
      throw e;
    } finally { completing.current = false; }
  }, [resetSavedTimer]);

  const completeAnswerStep = useCallback(async (n) => {
    if (completing.current) return { ok: false };
    const p = planRef.current;
    if (!p || !p.id) { setSaveError('尚未创建交易计划，请先完成开始步骤。'); setSaveStatus('error'); return { ok: false }; }
    const ctx = buildCtx();
    const v = validateStep(n, ctx);
    if (!v.ok) return { ok: false, missing: v.missing };
    completing.current = true;
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    setSaveStatus('saving'); setSaveError('');
    try {
      if (pendingAnswers.current) { await flushSave(); }
      const comp = computeCompletenessLive();
      const patch = { [`step_${n}_completed`]: true, current_step: nextStep(n), completeness_score: comp };
      const u = await base44.entities.TradingPlan.update(p.id, patch);
      setPlan((prev) => (prev ? { ...prev, ...u } : u));
      if (n === '8') syncCoherenceRef.current();
      setSaveStatus('saved'); resetSavedTimer();
      return { ok: true };
    } catch (e) {
      console.error('Step ' + n + ' 保存失败', e);
      setSaveError(classifyError(e, '保存失败')); setSaveStatus('error');
      return { ok: false, error: e };
    } finally { completing.current = false; }
  }, [buildCtx, flushSave, resetSavedTimer]);

  const completeC = useCallback(async () => {
    if (completing.current) return { ok: false };
    completing.current = true;
    setSaveStatus('saving'); setSaveError('');
    try {
      const p = planRef.current;
      const u = await base44.entities.TradingPlan.update(p.id, { coherence_check_completed: true, current_step: 'E' });
      setPlan((prev) => (prev ? { ...prev, ...u } : u));
      setSaveStatus('saved'); resetSavedTimer();
      return { ok: true };
    } catch (e) {
      setSaveError(classifyError(e, '保存失败')); setSaveStatus('error');
      return { ok: false };
    } finally { completing.current = false; }
  }, [resetSavedTimer]);

  const saveGenerated = useCallback(async (content) => {
    setSaveStatus('saving'); setSaveError('');
    try {
      const p = planRef.current;
      const now = new Date().toISOString();
      const version = p && p.version ? p.version : 'v1.0';
      let gen;
      const existing = generatedRef.current;
      if (existing && existing.id) {
        gen = await base44.entities.GeneratedPlan.update(existing.id, { full_plan_content: content.full, desk_card_content: content.desk, checklist_content: content.checklist, generated_date: now, version });
      } else {
        gen = await base44.entities.GeneratedPlan.create({ trading_plan_id: p.id, version, full_plan_content: content.full, desk_card_content: content.desk, checklist_content: content.checklist, generated_date: now });
      }
      setGenerated(gen);
      const u = await base44.entities.TradingPlan.update(p.id, { export_ready: true, last_generated_date: now, status: 'active', current_step: 'E' });
      setPlan((prev) => (prev ? { ...prev, ...u } : u));
      setSaveStatus('saved'); resetSavedTimer();
      return { ok: true };
    } catch (e) {
      setSaveError(classifyError(e, '保存失败')); setSaveStatus('error');
      return { ok: false };
    }
  }, [resetSavedTimer]);

  const importPlan = useCallback(async (payload) => {
    const p = planRef.current; if (!p || !p.id) throw new Error('no plan');
    setSaveStatus('saving'); setSaveError('');
    try {
      const tp = payload.trading_plan || {};
      const planPatch = {};
      ['plan_name', 'owner_name', 'version', 'status', 'current_step', 'completeness_score', 'unresolved_flags_count'].forEach((f) => { if (tp[f] !== undefined) planPatch[f] = tp[f]; });
      ANSWER_STEPS.forEach((k) => { const f = `step_${k}_completed`; if (tp[f] !== undefined) planPatch[f] = tp[f]; });
      if (tp.coherence_check_completed !== undefined) planPatch.coherence_check_completed = tp.coherence_check_completed;
      if (tp.export_ready !== undefined) planPatch.export_ready = tp.export_ready;
      const u = await base44.entities.TradingPlan.update(p.id, planPatch);
      setPlan((prev) => (prev ? { ...prev, ...u } : u));

      if (payload.plan_profile) {
        const prof = profileRef.current;
        if (prof && prof.id) await base44.entities.PlanProfile.update(prof.id, payload.plan_profile);
        else await base44.entities.PlanProfile.create({ trading_plan_id: p.id, ...payload.plan_profile });
        setProfile({ ...(prof || {}), ...payload.plan_profile });
      }

      const newAnswers = payload.answers || {};
      setAnswers(newAnswers);
      const recs = answerRecsRef.current;
      for (const [key, value] of Object.entries(newAnswers)) {
        const rec = recs[key];
        const vPayload = { answer_value: JSON.stringify(value) };
        if (rec && rec.id) await base44.entities.PlanAnswer.update(rec.id, vPayload);
        else { const c = await base44.entities.PlanAnswer.create({ trading_plan_id: p.id, step_key: stepKeyFromQuestion(key), question_key: key, ...vPayload }); setAnswerRecs((prev) => ({ ...prev, [key]: c })); }
      }

      for (const w of watchlistRef.current) { try { await base44.entities.WatchlistItem.delete(w.id); } catch (e) {} }
      const newWl = [];
      for (let i = 0; i < (payload.watchlist || []).length; i++) {
        const w = payload.watchlist[i];
        const c = await base44.entities.WatchlistItem.create({ trading_plan_id: p.id, sort_order: i, is_active: true, symbol: w.symbol, name: w.name, market: w.market, notes: w.notes });
        newWl.push(c);
      }
      setWatchlist(newWl);

      for (const r of psychRulesRef.current) { try { await base44.entities.PsychologyRule.delete(r.id); } catch (e) {} }
      const newPsych = [];
      for (const r of (payload.psychology_rules || [])) {
        const c = await base44.entities.PsychologyRule.create({ trading_plan_id: p.id, issue_key: r.issue_key, issue_name: r.issue_name, severity: r.severity, recommended_rule: r.recommended_rule, final_rule: r.final_rule, is_confirmed: r.is_confirmed });
        newPsych.push(c);
      }
      setPsychRules(newPsych);

      for (const f of flagsRef.current) { try { await base44.entities.CoherenceFlag.delete(f.id); } catch (e) {} }
      const newFlags = [];
      for (const f of (payload.coherence_flags || [])) {
        const c = await base44.entities.CoherenceFlag.create({ trading_plan_id: p.id, flag_key: f.flag_key, severity: f.severity, title: f.title, description: f.description, affected_steps: f.affected_steps, current_values: f.current_values, recommendation: f.recommendation, status: f.status, accepted_reason: f.accepted_reason });
        newFlags.push(c);
      }
      setFlags(newFlags);

      syncCoherenceRef.current();
      setSaveStatus('saved'); resetSavedTimer();
      return { ok: true };
    } catch (e) {
      console.error('导入失败', e);
      setSaveError(classifyError(e, '导入失败')); setSaveStatus('error');
      throw e;
    }
  }, [resetSavedTimer]);

  const goToStep = useCallback((code) => {
    if (!isAccessible(code)) return;
    if (planRef.current && planRef.current.id) updatePlanFields({ current_step: code });
  }, [isAccessible, updatePlanFields]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const plans = await base44.entities.TradingPlan.filter({}, '-updated_date', 1);
        if (!mounted) return;
        const p = plans[0] || defaultDraft();
        setPlan(p); planRef.current = p;
        if (p.id) {
          const [profiles, ansRecs, wl, psych, fl, gen] = await Promise.all([
            base44.entities.PlanProfile.filter({ trading_plan_id: p.id }, '-updated_date', 1),
            base44.entities.PlanAnswer.filter({ trading_plan_id: p.id }, '-created_date', 300),
            base44.entities.WatchlistItem.filter({ trading_plan_id: p.id }, 'sort_order', 200),
            base44.entities.PsychologyRule.filter({ trading_plan_id: p.id }, '-created_date', 100),
            base44.entities.CoherenceFlag.filter({ trading_plan_id: p.id }, '-created_date', 100),
            base44.entities.GeneratedPlan.filter({ trading_plan_id: p.id }, '-generated_date', 1),
          ]);
          if (!mounted) return;
          if (profiles[0]) { setProfile(profiles[0]); profileRef.current = profiles[0]; }
          const am = {}; const rm = {};
          ansRecs.forEach((r) => { try { am[r.question_key] = JSON.parse(r.answer_value); } catch (e) { am[r.question_key] = r.answer_value; } rm[r.question_key] = r; });
          setAnswers(am); answersRef.current = am; setAnswerRecs(rm); answerRecsRef.current = rm;
          setWatchlist(wl); watchlistRef.current = wl;
          setPsychRules(psych); psychRulesRef.current = psych;
          setFlags(fl); flagsRef.current = fl;
          if (gen[0]) { setGenerated(gen[0]); generatedRef.current = gen[0]; }
        }
      } catch (e) {
        console.error('加载交易计划失败', e);
        if (mounted) setLoadError(classifyError(e, '加载失败'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => () => {
    if (saveTimer.current) { clearTimeout(saveTimer.current); flushRef.current(); }
    if (coherenceTimer.current) clearTimeout(coherenceTimer.current);
    if (savedTimer.current) clearTimeout(savedTimer.current);
  }, []);

  const completeness = computeCompletenessLive();
  const openFlagsCount = flags.filter((f) => f.status === 'open').length;

  return {
    plan, profile, answers, watchlist, psychRules, flags, generated,
    loading, loadError, saveStatus, saveError,
    completeness, openFlagsCount,
    updateAnswer, updatePlanFields, updateProfileFields,
    completeStep0, completeStep1, completeAnswerStep, completeC, saveGenerated,
    goToStep, isAccessible, stepComplete,
    addWatchlistItem, updateWatchlistItem, removeWatchlistItem,
    setPsychIssues, updatePsychRule, setFlagStatus,
    importPlan, buildCtx,
  };
}