import React, { useEffect, useRef, useState } from 'react';
import { drawMindsetWallpaper, loadBgImage } from '@/lib/mindsetCanvas';

export default function MindsetPreview({ state }) {
  const ref = useRef(null);
  const [img, setImg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (state.bgType === 'image' && state.bgUrl) {
      loadBgImage(state.bgUrl).then((im) => { if (!cancelled) setImg(im); });
    } else {
      setImg(null);
    }
    return () => { cancelled = true; };
  }, [state.bgType, state.bgUrl]);

  useEffect(() => {
    if (!ref.current) return;
    drawMindsetWallpaper(ref.current, state, img);
  }, [state, img]);

  return <canvas ref={ref} className="max-h-[70vh] max-w-full rounded-sm" />;
}