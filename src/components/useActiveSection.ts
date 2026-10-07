import { useEffect, useState } from 'react';

/** Read the native scroll position once per frame; never intercept navigation. */
export function useActiveSection() {
  const [active, setActive] = useState('');
  useEffect(() => {
    const sections = ['work', 'about', 'archive', 'contact'].map(id => document.getElementById(id)).filter((section): section is HTMLElement => !!section);
    let frame = 0;
    const measure = () => {
      frame = 0;
      const header = document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 0;
      const readingLine = Math.max(header + 24, window.innerHeight * .28);
      let current = '';
      for (const section of sections) { if (section.getBoundingClientRect().top <= readingLine) current = `#${section.id}`; }
      setActive(previous => previous === current ? previous : current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    const main = document.getElementById('main');
    if (main) observer.observe(main);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    measure();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, []);
  return active;
}
