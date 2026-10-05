import { useEffect, useSyncExternalStore, type PointerEvent } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useMotionPreference } from './useMotionPreference';

const query = '(hover: hover) and (pointer: fine)';
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};
const snapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => false;
const spring = { stiffness: 320, damping: 36, mass: .6 };

/** React Bits Magnet-inspired glyph response; see THIRD_PARTY_NOTICES.md.
 * Local pointer events and interruptible springs never move the anchor hit area.
 */
export function ExploreLink() {
  const reduced = useMotionPreference();
  const finePointer = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const enabled = !reduced && finePointer;
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const x = useSpring(targetX, spring);
  const y = useSpring(targetY, spring);
  const reset = () => { targetX.set(0); targetY.set(0); };
  useEffect(() => {
    if (!enabled) { targetX.set(0); targetY.set(0); x.jump(0); y.jump(0); }
  }, [enabled, targetX, targetY, x, y]);
  const follow = (event: PointerEvent<HTMLAnchorElement>) => {
    if (!enabled || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    targetX.set(Math.max(-6, Math.min(6, (event.clientX - rect.left - rect.width / 2) * .08)));
    targetY.set(Math.max(-4, Math.min(4, (event.clientY - rect.top - rect.height / 2) * .15)));
  };
  return <a className="button button-dark magnetic-explore" href="#work"
    onPointerMove={follow} onPointerLeave={reset} onPointerCancel={reset} onBlur={reset}>
    Explore my work <motion.span aria-hidden="true" data-motion="explore-arrow" style={{ x, y }}>↓</motion.span>
  </a>;
}
