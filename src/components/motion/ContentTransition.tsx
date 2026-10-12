import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { animate, useInView } from 'motion/react';
import { useMotionPreference } from './useMotionPreference';

/** Replays a short reveal after a filter/tab change, without remounting
 * controls, delaying updates, retaining duplicate content, or hiding at rest.
 */
export function ContentTransition({ children, value = '', className = '', reveal = false, delay = 0 }: {
  children: ReactNode;
  value?: string;
  className?: string;
  reveal?: boolean;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useMotionPreference();
  const running = useRef(false);
  const previous = useRef(value);
  const entered = useRef(false);
  const inView = useInView(ref, { once: true, amount: 'some', margin: '0px 0px -40px 0px' });
  useLayoutEffect(() => {
    const changed = previous.current !== value;
    previous.current = value;
    const arriving = reveal && inView && !entered.current;
    if (arriving) entered.current = true;
    const element = ref.current;
    if (!element) return;
    if (reducedMotion) {
      running.current = false;
      element.style.opacity = '1';
      element.style.transform = 'none';
      return;
    }
    if (reveal && !inView && !entered.current) {
      element.style.opacity = '0';
      element.style.transform = 'translateY(28px)';
      return;
    }
    if (!changed && !arriving && !running.current) return;
    // One collection only; controls and their focus stay outside the animated surface.
    // Retarget interrupted transitions from the live presentation, not a new
    // hard-coded start. A fresh transition gets a deliberate arrival offset.
    const presentation = getComputedStyle(element);
    const startOpacity = running.current ? Number(presentation.opacity) : arriving ? 0 : .45;
    const startY = running.current ? (presentation.transform === 'none' ? 0 : new DOMMatrixReadOnly(presentation.transform).m42) : arriving ? 28 : 24;
    running.current = true;
    let cancelled = false;
    const controls = animate(element, { opacity: [startOpacity, 1], y: [startY, 0] }, {
      duration: arriving ? .7 : .48, delay: arriving ? Math.min(delay, .3) : 0, ease: [.22, 1, .36, 1],
    });
    void controls.then(() => { if (!cancelled) running.current = false; });
    return () => {
      cancelled = true;
      controls.stop();
    };
  }, [value, reducedMotion, reveal, inView, delay]);
  return <div ref={ref} className={`content-transition ${className}`} data-reveal={reveal || undefined} onFocusCapture={() => {
    const element = ref.current;
    if (element && reveal && !entered.current) {
      entered.current = true;
      element.style.opacity = '1';
      element.style.transform = 'none';
    }
  }}>{children}</div>;
}
