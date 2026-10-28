import { useEffect, useId, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useCompanion } from './useCompanion';
import { CompanionSprite } from './CompanionSprite';
import './companion.css';

const ATLAS = '/avatars/christian-animations.png';

export function PixelCompanion({ suspended = false }: { suspended?: boolean }) {
  const companion = useCompanion(suspended);
  const { view, x, y, rootRef, avatarRef, safeRef, showRef } = companion;
  const [atlas, setAtlas] = useState<HTMLImageElement | null>(null);
  const [failed, setFailed] = useState(false);
  const hideRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const helpId = useId(), menuId = useId();

  useEffect(() => {
    let live = true;
    const image = new Image();
    image.onload = () => { if (live) setAtlas(image); };
    image.onerror = () => { if (live) setFailed(true); };
    image.src = ATLAS;
    return () => { live = false; image.onload = null; image.onerror = null; };
  }, []);

  const { closeMenu } = companion;
  useEffect(() => {
    if (!view.menu) return;
    hideRef.current?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) closeMenu(false);
    };
    window.addEventListener('pointerdown', outside);
    return () => window.removeEventListener('pointerdown', outside);
  }, [view.menu, closeMenu, rootRef]);

  const menuWidth = 180;
  const left = Math.min(Math.max(x.get(), companion.bounds.left), Math.max(companion.bounds.left, companion.bounds.right + view.size - menuWidth));
  const menuHeight = 88;
  const preferredTop = y.get() - menuHeight - 8 >= companion.bounds.top ? y.get() - menuHeight - 8 : y.get() + view.size + 8;
  const menuTop = Math.max(companion.bounds.top, Math.min(preferredTop, companion.bounds.bottom + view.size - menuHeight)) - y.get();

  return <div data-pixel-companion className="pixel-companion-layer" aria-hidden={suspended || undefined}>
    <div ref={safeRef} className="companion-safe-area" aria-hidden="true" />
    <span id={helpId} className="companion-sr-only">Drag to move. Double-click or double-tap for Hide and Cancel. Arrow keys move; Shift moves one pixel. Enter opens controls. After placement, the avatar watches for 20 seconds.</span>
    <span className="companion-sr-only" role="status" aria-live="polite">{companion.announcement}</span>
    {view.hidden ? <button ref={showRef} className="companion-show" onClick={companion.show} aria-label="Show avatar" title="Show avatar" disabled={suspended} style={{ left: Math.max(companion.bounds.left, companion.bounds.right + view.size - 130), top: companion.bounds.bottom + view.size - 44, right: 'auto', bottom: 'auto' }}>
      <span aria-hidden="true">☺</span><span>Show avatar</span>
    </button> : <motion.div ref={rootRef} className="pixel-companion" style={{ x, y, width: view.size, height: view.size, visibility: view.ready && atlas && !suspended ? 'visible' : 'hidden' }} data-mode={view.mode} data-frame={view.frame} data-facing={view.facing}>
      <button ref={avatarRef} type="button" className="companion-grab" title="Drag me. Double-click or double-tap for controls." aria-label="Christian pixel avatar" aria-describedby={helpId} aria-haspopup="dialog" aria-expanded={view.menu} aria-controls={view.menu ? menuId : undefined}
        onPointerDown={companion.onPointerDown} onPointerMove={companion.onPointerMove} onPointerUp={companion.onPointerUp} onPointerCancel={companion.onPointerCancel} onLostPointerCapture={companion.onLostPointerCapture}
        onDoubleClick={event => { event.preventDefault(); companion.openMenu(); }} onContextMenu={event => event.preventDefault()} onKeyDown={companion.onKeyDown} disabled={suspended}
      >
        {atlas && <CompanionSprite atlas={atlas} frame={view.frame} facing={view.facing} lookX={view.lookX} lookY={view.lookY} />}
      </button>
      {view.menu && <div id={menuId} className="companion-menu" role="dialog" aria-label="Avatar controls" style={{ left: left - x.get(), top: menuTop }} onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); companion.closeMenu(); }
        if (event.key === 'Tab') {
          event.preventDefault();
          if (document.activeElement === hideRef.current) cancelRef.current?.focus(); else hideRef.current?.focus();
        }
      }}>
        <span className="companion-menu-title">Little Christian /</span>
        <div><button ref={hideRef} type="button" onClick={companion.hide}>Hide</button><button ref={cancelRef} type="button" onClick={() => companion.closeMenu()}>Cancel</button></div>
      </div>}
    </motion.div>}
    {failed && !view.hidden && <button className="companion-show" onClick={companion.hide}>Hide unavailable avatar</button>}
  </div>;
}
