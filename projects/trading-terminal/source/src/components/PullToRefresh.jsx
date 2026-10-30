import React, { useRef, useState, useCallback } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PullToRefresh({ onRefresh, children, threshold = 70, maxPull = 110 }) {
  const scrollRef = useRef(null);
  const startYRef = useRef(0);
  const startTopRef = useRef(0);
  const pullingRef = useRef(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const reset = useCallback(() => {
    setDragging(false);
    setPull(0);
  }, []);

  const onTouchStart = (e) => {
    if (refreshing) return;
    startYRef.current = e.touches[0].clientY;
    startTopRef.current = scrollRef.current ? scrollRef.current.scrollTop : 0;
    pullingRef.current = false;
  };

  const onTouchMove = (e) => {
    if (refreshing) return;
    const dy = e.touches[0].clientY - startYRef.current;
    if (startTopRef.current <= 0 && dy > 0) {
      const resisted = Math.min(maxPull, dy * 0.5);
      setPull(resisted);
      pullingRef.current = true;
      setDragging(true);
      if (e.cancelable) e.preventDefault();
    } else if (pullingRef.current) {
      pullingRef.current = false;
      setDragging(false);
      setPull(0);
    }
  };

  const onTouchEnd = async () => {
    if (!pullingRef.current) return;
    pullingRef.current = false;
    if (pull >= threshold) {
      setDragging(false);
      setPull(threshold);
      setRefreshing(true);
      try {
        await onRefresh?.();
      } finally {
        setRefreshing(false);
        reset();
      }
    } else {
      reset();
    }
  };

  const pct = Math.min(1, pull / threshold);

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto overscroll-y-contain"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        style={{
          transform: `translateY(${pull}px)`,
          transition: dragging ? 'none' : 'transform 0.28s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div
          className="flex justify-center items-end overflow-hidden"
          style={{ height: pull, marginTop: -pull }}
        >
          <div
            className={cn(
              'flex items-center justify-center transition-opacity',
              pull > 0 || refreshing ? 'opacity-100' : 'opacity-0'
            )}
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : (
              <ArrowDown
                className="w-4 h-4 text-primary"
                style={{ transform: `rotate(${pct * 180}deg)` }}
              />
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}