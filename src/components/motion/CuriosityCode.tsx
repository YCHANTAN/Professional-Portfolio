import { useEffect, useRef } from 'react';
import { useInView } from 'motion/react';
import { useMotionPreference } from './useMotionPreference';

const canonical = '  curiosity: Infinity';
const alphabet = '01<>/{}';

/** Decorative-only React Bits DecryptedText adaptation; see THIRD_PARTY_NOTICES.md. */
export function CuriosityCode() {
  const ref = useRef<HTMLSpanElement>(null);
  const played = useRef(false);
  const reduced = useMotionPreference();
  const inView = useInView(ref, { once: true, amount: 'some' });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.textContent = canonical;
    if (reduced || !inView || played.current) return;
    played.current = true;
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      // Keep the code key intact; resolve only the eight-character value.
      const resolved = Math.floor(step / 14 * 8);
      element.textContent = canonical.slice(0, -8) + 'Infinity'.split('').map((char, index) =>
        index < resolved ? char : alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
      if (step >= 14) { window.clearInterval(timer); element.textContent = canonical; }
    }, 35);
    return () => { window.clearInterval(timer); element.textContent = canonical; };
  }, [inView, reduced]);
  return <span ref={ref} aria-hidden="true" data-motion="curiosity-code">{canonical}</span>;
}
