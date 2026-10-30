import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      const next = new URLSearchParams(window.location.search).get("next") || "/";
      window.location.href = next;
    } catch (err) {
      setError(err.message || "邮箱或密码错误");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <div className="hidden lg:flex w-1/2 border-r border-border bg-sidebar/30 flex-col justify-between p-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
          <span className="font-heading font-semibold tracking-tight">知行交易终端</span>
          <span className="text-[11px] text-muted-foreground font-mono">v0.1.0</span>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-primary font-mono">TRADER OPERATING SYSTEM</div>
          <h1 className="mt-3 text-3xl font-heading font-bold tracking-tight leading-tight">
            将交易计划、风险控制、执行纪律与复盘<br />统一到一个系统中。
          </h1>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-md">
            面向中文主动交易者的专业交易终端。通过引导式决策，把模糊的交易习惯整理成明确、可执行、可持续修改的个人交易计划。
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span>本工具仅用于交易教育与计划制定，不构成投资建议。</span>
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground/60 font-mono">BUILD v0.1.0 · 已上线工具 2 / 20</div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
            <span className="font-heading font-semibold tracking-tight">知行交易终端</span>
          </div>
          <h2 className="text-xl font-heading font-semibold">登录知行交易终端</h2>
          <p className="mt-1 text-sm text-muted-foreground">登录后，你的交易计划和填写进度将安全保存在个人账户中。</p>

          <Button variant="outline" className="w-full h-11 text-sm font-medium mt-6" onClick={handleGoogle}>
            <GoogleIcon className="w-4 h-4 mr-2" />
            使用 Google 登录
          </Button>
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-[11px] uppercase"><span className="bg-background px-2 text-muted-foreground">或</span></div>
          </div>

          {error && <div className="mb-4 p-2.5 rounded bg-destructive/10 text-destructive text-xs">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">邮箱</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-11 bg-background" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">密码</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">忘记密码？</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 h-11 bg-background" required />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 font-heading" disabled={loading}>
              {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />登录中…</>) : (<><LogIn className="w-4 h-4 mr-2" />登录</>)}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            还没有账户？<Link to="/register" className="text-primary hover:underline">注册</Link>
          </p>
        </div>
      </div>
    </div>
  );
}