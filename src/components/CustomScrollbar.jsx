import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_THUMB_HEIGHT = 32;

function readScroll(container) {
  if (container) {
    return { scrollTop: container.scrollTop, scrollHeight: container.scrollHeight, clientHeight: container.clientHeight };
  }
  return { scrollTop: window.scrollY, scrollHeight: document.documentElement.scrollHeight, clientHeight: window.innerHeight };
}

function writeScroll(container, top) {
  if (container) container.scrollTop = top;
  else window.scrollTo(0, top);
}

// Renders our own track/thumb over a scroll area (the whole page when no
// `containerRef` is given, or a specific scrollable element when it is),
// with the native scrollbar hidden via CSS. Needed because Chromium's
// Fluent scrollbar redesign on Windows draws its own arrow buttons at the
// OS level, ignoring ::-webkit-scrollbar-button - there is no CSS-only way
// to remove those, so this replaces the scrollbar with a plain thumb.
export default function CustomScrollbar({
  containerRef,
  thumbClassName = 'bg-white/70 hover:bg-white/90 ring-1 ring-black/10 dark:ring-white/15',
}) {
  const trackRef = useRef(null);
  const dragRef = useRef(null);
  const [metrics, setMetrics] = useState({ height: 0, top: 0 });

  // Single source of truth for the current geometry, computed fresh from
  // live DOM measurements every time it's needed - interaction handlers
  // never trust the `metrics` state, since it can lag one frame behind a
  // just-triggered layout change (e.g. content swapping in right as the
  // user starts dragging).
  const computeGeometry = useCallback(() => {
    const container = containerRef?.current ?? null;
    const trackHeight = trackRef.current?.clientHeight ?? window.innerHeight;
    const { scrollTop, scrollHeight, clientHeight } = readScroll(container);
    const scrollable = scrollHeight - clientHeight;
    if (scrollable <= 0) return { trackHeight, scrollable: 0, height: 0, maxTop: 0, top: 0 };
    const height = Math.max((clientHeight / scrollHeight) * trackHeight, MIN_THUMB_HEIGHT);
    const maxTop = trackHeight - height;
    const top = (scrollTop / scrollable) * maxTop;
    return { trackHeight, scrollable, height, maxTop, top };
  }, [containerRef]);

  const recalc = useCallback(() => {
    const { height, top } = computeGeometry();
    setMetrics({ height, top });
  }, [computeGeometry]);

  useEffect(() => {
    const container = containerRef?.current ?? null;
    const scrollTarget = container ?? window;
    recalc();
    scrollTarget.addEventListener('scroll', recalc, { passive: true });
    window.addEventListener('resize', recalc);
    const ro = new ResizeObserver(recalc);
    ro.observe(container ?? document.documentElement);
    return () => {
      scrollTarget.removeEventListener('scroll', recalc);
      window.removeEventListener('resize', recalc);
      ro.disconnect();
    };
  }, [recalc, containerRef]);

  function onThumbPointerDown(e) {
    e.preventDefault();
    const { top } = computeGeometry();
    dragRef.current = { startY: e.clientY, startTop: top };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  function onPointerMove(e) {
    if (!dragRef.current) return;
    const { scrollable, maxTop } = computeGeometry();
    const top = Math.min(Math.max(dragRef.current.startTop + (e.clientY - dragRef.current.startY), 0), maxTop);
    writeScroll(containerRef?.current ?? null, maxTop > 0 ? (top / maxTop) * scrollable : 0);
  }

  function onPointerUp() {
    dragRef.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  }

  function onTrackPointerDown(e) {
    if (e.target !== trackRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const { height, scrollable, maxTop } = computeGeometry();
    const clickTop = Math.min(Math.max(e.clientY - trackRect.top - height / 2, 0), maxTop);
    writeScroll(containerRef?.current ?? null, maxTop > 0 ? (clickTop / maxTop) * scrollable : 0);
  }

  if (metrics.height === 0) return null;

  const trackPositionClass = containerRef
    ? 'absolute right-0 top-0 h-full w-2 z-20'
    : 'hidden md:block fixed right-0 top-0 h-screen w-2.5 z-[60]';

  return (
    <div ref={trackRef} onPointerDown={onTrackPointerDown} className={trackPositionClass}>
      <div
        onPointerDown={onThumbPointerDown}
        className={`absolute right-0.5 w-1.5 rounded-full cursor-pointer ${thumbClassName}`}
        style={{ height: metrics.height, top: metrics.top }}
      />
    </div>
  );
}
