import { Fragment, useLayoutEffect, useRef } from 'react';
import { animate, useInView } from 'motion/react';
import { useMotionPreference } from './useMotionPreference';

/** React Bits BlurText adaptation; see THIRD_PARTY_NOTICES.md.
 * Normal inline flow preserves editorial breaks and readable static content.
 */
export function BlurIntro({ lines, className = '' }: { lines: readonly string[]; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const played = useRef(false);
  const inView = useInView(ref, { once: true, amount: 'some' });
  const reduced = useMotionPreference();
  useLayoutEffect(() => {
    const words = Array.from(ref.current?.querySelectorAll<HTMLElement>('.blur-intro-word') ?? []);
    const reset = () => words.forEach(word => {
      word.style.filter = 'none'; word.style.opacity = '1'; word.style.transform = 'none';
    });
    if (reduced) { reset(); return; }
    if (!inView || played.current) return;
    played.current = true;
    const controls = words.map((word, index) => animate(word,
      { filter: ['blur(4px)', 'blur(0px)'], opacity: [.7, 1], y: [8, 0] },
      { duration: .5, delay: index * .06, ease: [.22, 1, .36, 1] }));
    return () => { controls.forEach(control => control.stop()); reset(); };
  }, [inView, reduced]);
  return <p ref={ref} className={className} data-motion="hero-intro-blur">
    <span className="motion-sr-only">{lines.join(' ')}</span>
    <span aria-hidden="true">{lines.map((line, lineIndex) => <Fragment key={lineIndex}>
      {lineIndex > 0 && <br />}
      {line.split(' ').map((word, index) => <Fragment key={index}>
        {index > 0 && ' '}<span className="blur-intro-word">{word}</span>
      </Fragment>)}
    </Fragment>)}</span>
  </p>;
}
