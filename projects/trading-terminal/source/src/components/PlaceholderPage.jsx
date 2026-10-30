import React from 'react';
import { Link } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';

export default function PlaceholderPage({ moduleName, description }) {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> 返回总览
      </Link>
      <div className="border border-border bg-card rounded p-8 md:p-10 text-center">
        <Construction className="w-10 h-10 text-warning mx-auto" />
        <h1 className="mt-4 text-xl font-heading font-semibold text-foreground">{moduleName}</h1>
        {description && <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">{description}</p>}
        <div className="mt-4 inline-block px-2.5 py-0.5 rounded border border-warning/30 bg-warning/10 text-[11px] font-heading text-warning">即将上线</div>
        <p className="mt-6 text-xs text-muted-foreground/70">功能开发中</p>
      </div>
    </div>
  );
}