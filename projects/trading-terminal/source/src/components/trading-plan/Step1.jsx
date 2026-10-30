import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SingleChoice, MultiChoice } from './OptionSelect';

const CURRENCIES = ['USD', 'CNY', 'USDT', 'HKD'];
const BRACKETS = ['2,000 以下', '2,000–10,000', '10,000–50,000', '50,000–250,000', '250,000 以上'];

const QUESTIONS = [
  { id: 'trading_experience', label: '你的真实资金交易经验有多久？', hint: '只计算真实资金交易，不计算单纯看盘或模拟盘时间。', type: 'single', options: ['第一次建立交易计划', '实盘不足 1 年', '1–3 年', '3–5 年', '5 年以上'] },
  { id: 'daily_screen_time', label: '每个交易日可以长期维持多少实际盯盘时间？', hint: '填写普通一周可以持续做到的时间，而不是偶尔状态最好时的时间。', type: 'single', options: ['少于 30 分钟', '30–60 分钟', '1–3 小时', '超过 3 小时'] },
  { id: 'days_per_week', label: '每周可以参与市场几天？', type: 'single', options: ['1–2 天', '3–4 天', '5 天或以上'] },
  { id: 'available_sessions', label: '你能够稳定参与哪些交易时段？', hint: '按照自己的本地时间选择，可以多选。', type: 'multi', options: ['A 股早盘', 'A 股午盘', '港股时段', '亚洲时段', '欧洲时段', '美股盘前', '美股正常交易时段', '美股盘后', '24 小时加密市场'] },
  { id: 'capital', label: '用于交易的资金规模属于哪个区间？', hint: '只计算即使损失也不会显著影响生活的资金。无需填写精确金额。', type: 'capital' },
  { id: 'income_dependency', label: '你是否需要依靠交易收入支付生活成本？', hint: '这是影响交易心理和风险承受能力的重要因素，请如实选择。', type: 'single', options: ['不需要，生活成本由其他收入承担', '部分需要，交易收入可以补充生活', '需要，计划依靠交易收入生活'] },
  { id: 'account_types', label: '你使用哪些账户或交易产品？', hint: '可以多选。', type: 'multi', options: ['现货，无杠杆', '股票现金账户', '融资融券或保证金账户', '期货', '永续合约', '期权', 'CFD', '其他'], other: true, otherField: 'other_account_type' },
];

export default function Step1({ profile, updateProfileFields, onComplete, onBack }) {
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!profile?.trading_experience) e.trading_experience = '请选择一项';
    if (!profile?.daily_screen_time) e.daily_screen_time = '请选择一项';
    if (!profile?.days_per_week) e.days_per_week = '请选择一项';
    if (!profile?.available_sessions || profile.available_sessions.length === 0) e.available_sessions = '至少选择一项';
    if (!profile?.preferred_currency || !profile?.capital_bracket) e.capital = '请选择计价币种与资金区间';
    if (!profile?.income_dependency) e.income_dependency = '请选择一项';
    if (!profile?.account_types || profile.account_types.length === 0) e.account_types = '至少选择一项';
    if (profile?.account_types?.includes('其他') && !profile?.other_account_type) e.account_types = '选择"其他"时请填写说明';
    return e;
  };

  const clearError = (id) => setErrors(prev => ({ ...prev, [id]: undefined }));

  const handleSave = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSubmitting(true);
    try {
      await onComplete();
    } catch (err) {
      // 保存状态由 hook 管理
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-heading font-semibold text-foreground">交易者画像</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-3xl">
          先确认你的经验、时间、资金和现实约束。后续的交易方式与风险规则必须与这些条件匹配。
        </p>
      </div>

      <div className="space-y-4">
        {QUESTIONS.map((q, idx) => (
          <div key={q.id} className="border border-border bg-card rounded p-4">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xs text-muted-foreground">Q{idx + 1}</span>
              <h3 className="text-sm font-heading font-semibold text-foreground">{q.label}</h3>
            </div>
            {q.hint && <p className="mt-1 text-xs text-muted-foreground">{q.hint}</p>}
            <div className="mt-3">
              {q.type === 'single' && (
                <SingleChoice
                  value={profile?.[q.id] || ''}
                  options={q.options}
                  onChange={v => { updateProfileFields({ [q.id]: v }); clearError(q.id); }}
                />
              )}
              {q.type === 'multi' && (
                <MultiChoice
                  value={profile?.[q.id] || []}
                  options={q.options}
                  other={q.other}
                  otherValue={profile?.[q.otherField] || ''}
                  onOtherChange={v => updateProfileFields({ [q.otherField]: v })}
                  onChange={v => { updateProfileFields({ [q.id]: v }); clearError(q.id); }}
                />
              )}
              {q.type === 'capital' && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1.5">计价币种</div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {CURRENCIES.map(c => (
                        <button key={c} type="button"
                          onClick={() => { updateProfileFields({ preferred_currency: c }); clearError('capital'); }}
                          className={`px-2 py-2 rounded border text-xs font-mono ${profile?.preferred_currency === c ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>{c}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1.5">资金区间</div>
                    <div className="grid gap-1.5">
                      {BRACKETS.map(b => (
                        <button key={b} type="button"
                          onClick={() => { updateProfileFields({ capital_bracket: b }); clearError('capital'); }}
                          className={`px-2.5 py-1.5 rounded border text-xs text-left font-heading ${profile?.capital_bracket === b ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>{b}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {errors[q.id] && <p className="mt-2 text-xs text-destructive">{errors[q.id]}</p>}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 sticky bottom-0 bg-background/90 backdrop-blur border border-border rounded p-3">
        <Button variant="outline" onClick={onBack} className="font-heading"><ArrowLeft className="w-4 h-4 mr-1.5" />上一步</Button>
        <Button onClick={handleSave} disabled={submitting} className="font-heading">保存并继续 <ArrowRight className="w-4 h-4 ml-1.5" /></Button>
      </div>
    </div>
  );
}