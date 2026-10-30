import React, { useEffect, useRef } from 'react';
import { drawWallpaper } from '@/lib/wallpaperCanvas';

export default function WallpaperPreview({ rules, device, template, sizeKey, options }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !rules) return;
    drawWallpaper(ref.current, rules, { device, template, sizeKey, ...(options || {}) });
  }, [rules, device, template, sizeKey, options]);
  return <canvas ref={ref} className="max-h-[60vh] max-w-full rounded-sm" />;
}