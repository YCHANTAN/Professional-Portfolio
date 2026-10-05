import { useEffect, useRef, useState } from 'react';
import { motion, useAnimationFrame, useInView, useMotionValue, useScroll, useSpring, useVelocity } from 'motion/react';
import { useMotionPreference } from './useMotionPreference';

const words = ['THINK IT.', 'DESIGN IT.', 'BUILD IT.', 'MAKE IT MATTER.'];

/** A measured repeat rather than percentage travel: fonts and viewport changes
 * cannot leave a gap. Only resize changes React state; frames update a MotionValue. */
export function DisciplineMarquee() {
  const reduced = useMotionPreference();
  const [held, setHeld] = useState(false);
  const [keyboardPaused, setKeyboardPaused] = useState(false);
  const paused = held || keyboardPaused;
  const activePointer = useRef<number | null>(null);
  const [copies, setCopies] = useState(3);
  const viewport = useRef<HTMLDivElement>(null);
  const unit = useRef<HTMLDivElement>(null);
  const width = useRef(0);
  const x = useMotionValue(0);
  const visible = useInView(viewport, { amount: .01 });
  const background = useRef(false);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(velocity, { stiffness: 150, damping: 28, mass: .65 });
  const direction = useRef(1);

  useEffect(() => {
    const surface = viewport.current;
    const repeat = unit.current;
    if (!surface || !repeat) return;
    let cancelled = false;
    const measure = () => {
      const next = repeat.getBoundingClientRect().width;
      if (!next) return;
      const phase = width.current ? -x.get() / width.current : 0;
      width.current = next;
      x.set(-((phase % 1 + 1) % 1) * next);
      setCopies(Math.max(2, Math.ceil(surface.clientWidth / next) + 2));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(surface);
    observer.observe(repeat);
    measure();
    void document.fonts.ready.then(() => { if (!cancelled) measure(); });
    const release = () => { activePointer.current = null; setHeld(false); };
    const visibility = () => { background.current = document.hidden; if (document.hidden) release(); };
    visibility();
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', release);
    return () => { cancelled = true; observer.disconnect(); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('blur', release); };
  }, [x]);

  useAnimationFrame((_time, delta) => {
    if (reduced || paused || !visible || background.current || !width.current) return;
    const v = Math.max(-2400, Math.min(2400, smoothVelocity.get()));
    // Retain the last scroll direction at rest; reverse from the smoothed
    // velocity, not raw wheel events. Bound both speed and resume-frame travel.
    if (Math.abs(v) > 35) direction.current = v > 0 ? 1 : -1;
    const speed = direction.current * Math.min(180, 24 + Math.abs(v) * .055);
    const next = x.get() - speed * Math.min(delta, 40) / 1000;
    x.set(-(((-next % width.current) + width.current) % width.current));
  });

  return <div className="discipline-strip discipline-marquee" data-motion="discipline-marquee" data-paused={paused} data-static={reduced}
    role="button" tabIndex={0} aria-pressed={paused} aria-disabled={reduced || undefined}
    aria-label={`Think it. Design it. Build it. Make it matter. ${reduced ? 'Motion disabled by reduced motion preference.' : paused ? 'Paused. Press Space or Enter to resume.' : 'Hold to pause. Press Space or Enter to pause.'}`}
    onPointerDown={event => {
      if (reduced || !event.isPrimary || event.button !== 0) return;
      activePointer.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      setHeld(true);
    }}
    onPointerUp={event => { if (activePointer.current === event.pointerId) { activePointer.current = null; setHeld(false); } }}
    onPointerCancel={event => { if (activePointer.current === event.pointerId) { activePointer.current = null; setHeld(false); } }}
    onLostPointerCapture={event => { if (activePointer.current === event.pointerId) { activePointer.current = null; setHeld(false); } }}
    onClick={event => {
      // AT activation synthesizes a non-pointer click. A real pointer click
      // must not toggle persistent pause after its hold has just been released.
      if (!reduced && event.detail === 0) setKeyboardPaused(value => !value);
    }}
    onKeyDown={event => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        if (!reduced && !event.repeat) setKeyboardPaused(value => !value);
      }
    }}>
    <div className="marquee-static" aria-hidden="true">{words.flatMap((word, index) => [<span key={word}>{word}</span>, ...(index < words.length - 1 ? [<span key={`${word}-star`}>✳</span>] : [])])}</div>
    <div className="marquee-viewport" ref={viewport} aria-hidden="true">
      <motion.div className="marquee-track" style={{ x: reduced ? 0 : x }}>
        {Array.from({ length: copies }, (_, index) => <div className="marquee-unit" ref={index === 0 ? unit : undefined} key={index}>{words.flatMap((word, wordIndex) => [<span className="marquee-word" key={word}>{word}</span>, ...(wordIndex < words.length - 1 ? [<span className="marquee-star" key={`${word}-star`}>✳</span>] : [])])}<i className="marquee-seam-star" aria-hidden="true">✳</i></div>)}
      </motion.div>
    </div>
  </div>;
}
