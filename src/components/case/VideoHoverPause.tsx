import { useEffect } from 'react';

/**
 * Case-study motion pieces (Harbor's GIFs, played as looping videos): hovering one pauses it
 * on the current frame so it can be read; moving the mouse off resumes playback.
 * Works by event delegation on the case-study wrapper (.case-grid), so the page markup stays as is.
 * Touch screens have no hover, so they simply keep playing.
 */
export function VideoHoverPause() {
  useEffect(() => {
    const videoOf = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      const v = el?.closest?.('.case-grid main video') as HTMLVideoElement | null;
      return v;
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const v = videoOf(e.target);
      if (v && !v.paused) v.pause();
    };
    const onOut = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const v = videoOf(e.target);
      // still inside the same video (moving between its own pixels) -> keep paused
      if (!v || (e.relatedTarget instanceof Node && v.contains(e.relatedTarget))) return;
      v.play().catch(() => {});
    };
    document.addEventListener('pointerover', onOver, true);
    document.addEventListener('pointerout', onOut, true);
    return () => {
      document.removeEventListener('pointerover', onOver, true);
      document.removeEventListener('pointerout', onOut, true);
    };
  }, []);
  return null;
}
