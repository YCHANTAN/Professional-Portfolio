import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { useMotionPreference } from './useMotionPreference';
import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform, type MotionStyle, type MotionValue } from 'motion/react';

/** Native sticky owns the pin/stack, not spring compensation for scrolling.
 * Qualify stationary layout on resize only; no scroll listeners or frame updates. */
function useStageFits(ref: RefObject<HTMLDivElement | null>, kind: 'opening' | 'stack') {
  const reduced = useMotionPreference();
  const [stage, setStage] = useState({ fits: false, runway: 0, pinTop: 0, start: 0, end: 1 });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const header = document.querySelector<HTMLElement>('.site-header');
    const measure = () => {
      // The opening scaffold includes an overlapping pin runway. Measure the
      // hero, not that runway, to avoid resize/eligibility feedback loops.
      const surfaces = Array.from(element.querySelectorAll<HTMLElement>(kind === 'opening' ? '.hero' : '.project-spread'));
      const headerHeight = header?.offsetHeight ?? 0;
      const step = parseFloat(getComputedStyle(element).getPropertyValue('--stack-step')) || 12;
      const room = window.innerHeight - headerHeight;
      const fits = surfaces.length > 0 && (kind === 'opening' || surfaces.every((surface, index) =>
        surface.offsetHeight <= room - step * (index + 1) - 8));
      // Every card must reach its pin before ANY card hits the shared bottom
      // boundary. Leave a short reading hold for the completed stack as well.
      const last = surfaces.at(-1);
      const runway = kind === 'opening' ? surfaces[0]?.offsetHeight ?? 0 : last
        ? Math.max(0, ...surfaces.map((surface, index) =>
          surface.offsetHeight + step * (index + 1) - last.offsetHeight - step * surfaces.length)) + room * .22
        : 0;
      // A tall hero scrolls far enough to reveal its bottom before pinning.
      // This keeps every control reachable on short/mobile screens.
      const pinTop = kind === 'opening' ? Math.min(headerHeight, window.innerHeight - runway) : 0;
      const documentTop = element.getBoundingClientRect().top + window.scrollY;
      const start = kind === 'opening' ? Math.max(0, documentTop - pinTop) : 0;
      const end = kind === 'opening' ? Math.max(start + 1, documentTop + runway - headerHeight) : 1;
      setStage(previous => previous.fits === fits && previous.runway === runway && previous.pinTop === pinTop && previous.start === start && previous.end === end
        ? previous : { fits, runway, pinTop, start, end });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (header) observer.observe(header);
    element.querySelectorAll(kind === 'opening' ? '.hero' : '.project-spread').forEach(surface => observer.observe(surface));
    window.addEventListener('resize', measure);
    let cancelled = false;
    void document.fonts.ready.then(() => { if (!cancelled) measure(); });
    measure();
    return () => { cancelled = true; observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [ref, kind]);
  return { ...stage, enabled: stage.fits && !reduced };
}

export function OpeningDepth({ children }: { children: ReactNode }) {
  const target = useRef<HTMLDivElement>(null);
  const { enabled, runway, pinTop, start, end } = useStageFits(target, 'opening');
  const progress = useMotionValue(0);
  useEffect(() => { if (!enabled) progress.set(0); }, [enabled, progress]);
  return <div id="home" ref={target} className="opening-depth" data-motion="opening-depth" data-depth-enabled={enabled}
    style={{ '--opening-runway': `${runway}px`, '--opening-pin-top': `${pinTop}px` } as CSSProperties}
    onFocus={event => {
      // Native focus scrolling cannot detect that Work occludes a pinned hero.
      // Reveal the original opening for keyboard focus, not a duplicate layer.
      if (enabled && window.scrollY > 0 && event.target.matches(':focus-visible')) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }}>
    <div className="opening-plane">
      <motion.div className="opening-surface" style={{ '--opening-progress': progress } as MotionStyle}>{children}</motion.div>
      {enabled && <OpeningScrollLink start={start} end={end} progress={progress} />}
    </div>
  </div>;
}

/** Transform the visual surface only; sticky geometry stays stationary.
 * Direct scroll mapping reverses immediately, without a delayed animation. */
function OpeningScrollLink({ start, end, progress }: { start: number; end: number; progress: MotionValue<number> }) {
  const { scrollY } = useScroll();
  const mapped = useTransform(scrollY, [start, end], [0, 1]);
  useMotionValueEvent(mapped, 'change', value => progress.set(value));
  useEffect(() => { progress.set(mapped.get()); }, [mapped, progress, start, end]);
  return null;
}

export function ProjectStack({ children }: { children: ReactNode }) {
  const target = useRef<HTMLDivElement>(null);
  const { enabled, runway } = useStageFits(target, 'stack');
  return <div className="featured-spreads" ref={target} data-motion="project-stack" data-stack-enabled={enabled}
    style={{ '--stack-runway': `${runway}px` } as CSSProperties}>{children}</div>;
}

export function StackCard({ children, index }: { children: ReactNode; index: number }) {
  return <div className="stack-card" data-stack-index={index} style={{ '--stack-index': index } as CSSProperties}>{children}</div>;
}
