import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import MindsetWallpaperEditor from './MindsetWallpaperEditor';

export default function MindsetWallpaperDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-w-6xl w-[95vw] max-h-[92vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 pr-12 border-b border-border shrink-0 text-left">
          <DialogTitle>生成心态壁纸</DialogTitle>
          <DialogDescription>勾选或自定义交易心态句子，选择背景与排版，生成桌面或手机壁纸。</DialogDescription>
        </DialogHeader>
        <MindsetWallpaperEditor embedded onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}