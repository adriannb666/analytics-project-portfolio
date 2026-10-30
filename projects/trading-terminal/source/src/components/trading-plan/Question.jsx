import React from 'react';
import QSingle from './questions/QSingle';
import QMulti from './questions/QMulti';
import QTextArea from './questions/QTextArea';
import QText from './questions/QText';
import QNumber from './questions/QNumber';
import { depMet } from './stepsConfig';

export function Question({ q, answers, updateAnswer, errors }) {
  const val = answers[q.key];
  const err = errors?.[q.key];
  return (
    <div className="border border-border bg-card rounded p-4">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-xs text-muted-foreground">Q{q.n}</span>
        <h3 className="text-sm font-heading font-semibold text-foreground">
          {q.label}{q.required ? <span className="text-destructive ml-0.5">*</span> : null}
        </h3>
      </div>
      {q.hint && <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{q.hint}</p>}
      <div className="mt-3">
        {q.type === 'single' && (
          <QSingle
            value={val}
            customValue={answers[`${q.key}_custom`]}
            options={q.options}
            custom={q.custom}
            customOption={q.customOption}
            customType={q.customType}
            customPlaceholder={q.customPlaceholder}
            onChange={(v) => updateAnswer(q.key, v)}
            onCustomChange={(v) => updateAnswer(`${q.key}_custom`, v)}
          />
        )}
        {q.type === 'multi' && (
          <QMulti
            value={val}
            otherValue={answers[`${q.key}_other`]}
            options={q.options}
            other={q.other}
            otherOption={q.otherOption}
            otherPlaceholder={q.otherPlaceholder}
            onChange={(v) => updateAnswer(q.key, v)}
            onOtherChange={(v) => updateAnswer(`${q.key}_other`, v)}
          />
        )}
        {q.type === 'textarea' && <QTextArea value={val} onChange={(v) => updateAnswer(q.key, v)} placeholder={q.placeholder} rows={q.rows} />}
        {q.type === 'text' && <QText value={val} onChange={(v) => updateAnswer(q.key, v)} placeholder={q.placeholder} />}
        {q.type === 'number' && <QNumber value={val} onChange={(v) => updateAnswer(q.key, v)} min={q.min} max={q.max} placeholder={q.placeholder} />}
      </div>
      {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
    </div>
  );
}

export function renderQuestions(questions, ctx) {
  const { answers, updateAnswer, errors, customRenderers } = ctx;
  return questions.map((q) => {
    if (!depMet(q.depends, answers)) return null;
    if (q.type === 'custom') {
      const R = customRenderers?.[q.customKey];
      if (!R) return null;
      return <React.Fragment key={q.key}>{R(q)}</React.Fragment>;
    }
    return <Question key={q.key} q={q} answers={answers} updateAnswer={updateAnswer} errors={errors} />;
  });
}