import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, User, Loader2, ShieldCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
    if (password.length < 6) {
      setError("密码至少需要 6 位");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "注册失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      if (name) {
        try { await base44.auth.updateMe({ full_name: name }); } catch (_) { /* 姓名保存非关键，忽略 */ }
      }
      window.location.href = "/?welcome=1";
    } catch (err) {
      setError(err.message || "验证码错误，请重新输入");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "验证码已重新发送", description: "请查看邮箱获取最新验证码。" });
    } catch (err) {
      setError(err.message || "重新发送失败，请稍后重试");
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/?welcome=1");
  };

  if (showOtp) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
            <span className="font-heading font-semibold tracking-tight">知行交易终端</span>
          </div>
          <h2 className="text-xl font-heading font-semibold">验证你的邮箱</h2>
          <p className="mt-1 text-sm text-muted-foreground">我们已向 {email} 发送验证码。</p>
          {error && <div className="mt-4 p-2.5 rounded bg-destructive/10 text-destructive text-xs">{error}</div>}
          <div className="flex justify-center my-6">
            <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button className="w-full h-11 font-heading" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
            {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />验证中…</>) : "完成注册并登录"}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-4">
            没收到验证码？<button onClick={handleResend} className="text-primary hover:underline">重新发送</button>
          </p>
        </div>
      </div>
    );
  }

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
            建立你的账户，<br />开始制定个人交易计划。
          </h1>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-md">
            注册后即可使用引导式交易计划构建器。你的计划与填写进度将安全保存在个人账户中，可随时继续修改。
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
          <h2 className="text-xl font-heading font-semibold">注册新账户</h2>
          <p className="mt-1 text-sm text-muted-foreground">创建账户后自动登录并进入工作台。</p>

          <Button variant="outline" className="w-full h-11 text-sm font-medium mt-6" onClick={handleGoogle}>
            <GoogleIcon className="w-4 h-4 mr-2" />使用 Google 注册
          </Button>
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-[11px] uppercase"><span className="bg-background px-2 text-muted-foreground">或</span></div>
          </div>

          {error && <div className="mb-4 p-2.5 rounded bg-destructive/10 text-destructive text-xs">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">姓名</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="将显示在账户与计划封面" className="pl-9 h-11 bg-background" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">邮箱</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-11 bg-background" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="password" autoComplete="new-password" placeholder="至少 6 位" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 h-11 bg-background" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">确认密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="password" autoComplete="new-password" placeholder="再次输入密码" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-9 h-11 bg-background" required />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 font-heading" disabled={loading}>
              {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />创建中…</>) : (<><UserPlus className="w-4 h-4 mr-2" />注册并登录</>)}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            已有账户？<Link to="/login" className="text-primary hover:underline">登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
}