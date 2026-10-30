import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Menu, BookOpen, HelpCircle, LogOut, ChevronDown, UserX } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { getSessionCountdowns, formatUTC, formatLocal } from './MarketSessions';
import { ONLINE_TOOLS_COUNT, TOTAL_TOOLS } from './navConfig';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { deleteAccount } from '@/functions/deleteAccount';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

export default function TopStatusBar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [now, setNow] = useState(new Date());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await deleteAccount({});
      if (res.data && res.data.ok) {
        setDeleteOpen(false);
        await logout('/');
      } else {
        toast({ title: '删除账户失败', description: (res.data && res.data.error) || '请稍后重试或联系支持。', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: '删除账户失败', description: (e && e.message) || '网络异常，请稍后重试。', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const sessions = getSessionCountdowns(now);
  const initial = user?.email ? user.email[0].toUpperCase() : 'U';

  const triggerBtn = (
    <button className="flex items-center gap-2 pl-2 ml-1 border-l border-border py-1 text-muted-foreground hover:text-foreground">
      <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-heading font-semibold text-[11px]">{initial}</div>
      <span className="hidden xl:inline truncate max-w-[140px]">{user?.full_name || user?.email || '交易者'}</span>
      <ChevronDown className="w-3.5 h-3.5 opacity-60" />
    </button>
  );

  return (
    <>
      <header className="h-11 shrink-0 border-b border-border bg-sidebar flex items-center gap-2 px-2 md:px-3 text-[11px] font-mono select-none">
        <button className="md:hidden mobile-tap p-1.5 -ml-1 text-muted-foreground hover:text-foreground" onClick={onMenuClick} aria-label="菜单">
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />ONLINE
          </span>
          <span className="font-heading font-semibold text-foreground tracking-tight text-xs hidden sm:inline">知行交易终端</span>
          <span className="hidden sm:inline text-muted-foreground">BUILD v0.2.0</span>
          <span className="hidden md:inline text-muted-foreground">TOOLS <span className="text-foreground">{ONLINE_TOOLS_COUNT}</span>/{TOTAL_TOOLS}</span>
        </div>

        <div className="hidden md:flex flex-1 min-w-0 items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap mx-auto">
          {sessions.map((s, i) => (
            <React.Fragment key={s.key}>
              {i > 0 && <span className="text-border">|</span>}
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${s.isOpen ? 'bg-success' : 'bg-muted-foreground/40'}`} />
                <span className="text-muted-foreground">{s.label}</span>
                <span className={s.isOpen ? 'text-success' : 'text-muted-foreground'}>{s.isOpen ? '开' : '关'}</span>
                <span className="text-muted-foreground/70">{s.isOpen ? `距收盘 ${s.countdown}` : `距开盘 ${s.countdown}`}</span>
              </span>
            </React.Fragment>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <button onClick={() => navigate('/placeholder?module=guide')} className="hidden lg:flex items-center gap-1 px-1.5 py-1 text-muted-foreground hover:text-foreground">
            <BookOpen className="w-3.5 h-3.5" /><span>指南</span>
          </button>
          <button onClick={() => navigate('/placeholder?module=help')} className="hidden lg:flex items-center gap-1 px-1.5 py-1 text-muted-foreground hover:text-foreground">
            <HelpCircle className="w-3.5 h-3.5" /><span>帮助</span>
          </button>
          <span className="hidden md:flex items-center gap-2 text-muted-foreground">
            <span>UTC <span className="text-foreground">{formatUTC(now)}</span></span>
            <span className="text-border">|</span>
            <span>本地 <span className="text-foreground">{formatLocal(now)}</span></span>
          </span>
          {isMobile ? (
            <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
              <DrawerTrigger asChild>{triggerBtn}</DrawerTrigger>
              <DrawerContent className="select-none">
                <DrawerHeader className="text-left">
                  <DrawerTitle>{user?.full_name || '交易者'}</DrawerTitle>
                  <DrawerDescription>{user?.email}</DrawerDescription>
                </DrawerHeader>
                <div className="px-2 pb-4 space-y-1">
                  <button onClick={() => { setMenuOpen(false); logout(); }} className="mobile-tap w-full flex items-center gap-2 px-3 py-3 rounded text-sm text-destructive hover:bg-destructive/10">
                    <LogOut className="w-4 h-4" /> 退出登录
                  </button>
                  <button onClick={() => { setMenuOpen(false); setDeleteOpen(true); }} className="mobile-tap w-full flex items-center gap-2 px-3 py-3 rounded text-sm text-destructive hover:bg-destructive/10">
                    <UserX className="w-4 h-4" /> 删除账户
                  </button>
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>{triggerBtn}</DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-sm font-heading text-foreground">{user?.full_name || '交易者'}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
                  <LogOut className="w-3.5 h-3.5 mr-2" /> 退出登录
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive focus:text-destructive">
                  <UserX className="w-3.5 h-3.5 mr-2" /> 删除账户
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除账户</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销。将永久删除你的账户、交易计划及所有关联数据，并立即退出登录。请确认你已备份需要保留的内容。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteAccount(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? '删除中…' : '确认删除账户'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}