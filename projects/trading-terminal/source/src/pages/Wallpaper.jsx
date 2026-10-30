import React from 'react';
import MindsetWallpaperEditor from '@/components/wallpaper/MindsetWallpaperEditor';
import TerminalSectionHeader from '@/components/terminal/TerminalSectionHeader';

export default function Wallpaper() {
  return (
    <div className="px-4 md:px-6 py-5 max-w-[1200px] mx-auto space-y-4">
      <TerminalSectionHeader title="心态壁纸" english="MINDSET WALLPAPER" statusLabel="DIY 编辑器" statusTone="live" />
      <p className="text-sm text-muted-foreground -mt-1 max-w-2xl">
        生成一张适合作为桌面或手机壁纸的交易心态提醒图。勾选默认纪律句、添加你自己的话，选择背景与排版，实时预览并下载 PNG。
      </p>
      <MindsetWallpaperEditor />
    </div>
  );
}