import { useLayoutEffect, useRef, useState } from 'react';
import { animate, motion } from 'motion/react';
import { skills } from '../data/portfolio';
import { SectionHeading } from './SectionHeading';
import { useMotionPreference } from './motion/useMotionPreference';

type Discipline = keyof typeof skills;
const disciplines: Discipline[] = ['Development', 'Design'];
const statements = { Design: 'Before the pixels, the people.', Development: 'Behind the experience, a solid foundation.' };

/** Toolkit-only exit/commit/entry: controls stay responsive, one panel is visible. */
export function SkillsToolkit() {
  const [requested, setRequested] = useState<Discipline>('Development');
  const [displayed, setDisplayed] = useState<Discipline>('Development');
  const surface = useRef<HTMLDivElement>(null);
  const reducedMotion = useMotionPreference();

  useLayoutEffect(() => {
    const element = surface.current;
    if (!element) return;
    const groups = Array.from(element.querySelectorAll<HTMLElement>('.skill-groups'));
    const statement = element.querySelector<HTMLElement>('.skills-statement');
    if (!statement) return;
    const measure = () => {
      // Measure both disciplines in the SAME grid before paint. Restore the
      // committed text/visibility immediately; never mount a duplicate statement.
      const text = statement.textContent;
      const hidden = groups.map(group => group.hidden);
      let height = 0;
      disciplines.forEach((mode, index) => {
        statement.textContent = statements[mode];
        groups.forEach((group, groupIndex) => { group.hidden = index !== groupIndex; });
        height = Math.max(height, element.querySelector<HTMLElement>('.skill-content')!.getBoundingClientRect().height);
      });
      statement.textContent = text;
      groups.forEach((group, index) => { group.hidden = hidden[index]; });
      element.style.minHeight = `${height}px`;
    };
    measure();
    let width = element.getBoundingClientRect().width;
    const observer = new ResizeObserver(entries => {
      const nextWidth = entries[0].contentRect.width;
      if (width !== nextWidth) { width = nextWidth; measure(); }
    });
    observer.observe(element);
    let cancelled = false;
    void document.fonts.ready.then(() => { if (!cancelled) measure(); });
    return () => { cancelled = true; observer.disconnect(); };
  }, []);

  useLayoutEffect(() => {
    const element = surface.current;
    if (!element) return;
    if (reducedMotion) {
      element.style.opacity = '1'; element.style.transform = 'none';
      setDisplayed(requested);
      return;
    }
    let cancelled = false;
    // Motion starts from its current presentation; reversing mid-entry never
    // resets opacity/position. Cancelled exits cannot commit stale selections.
    const controls = animate(element, requested !== displayed ? { opacity: 0, y: 4 } : { opacity: 1, y: 0 }, {
      duration: requested !== displayed ? .15 : .2, ease: [.22, 1, .36, 1],
    });
    void controls.then(() => { if (!cancelled && requested !== displayed) setDisplayed(requested); });
    return () => { cancelled = true; controls.stop(); };
  }, [requested, displayed, reducedMotion]);

  return <section className="skills-section" id="skills">
    <div className="skills-header">
      <SectionHeading label="03 / My toolkit" title="LEFT BRAIN. RIGHT BRAIN." />
      <div className="skill-switch" role="group" aria-label="Choose a skills discipline">
        {disciplines.map(mode => <button key={mode} aria-pressed={requested === mode} onClick={() => setRequested(mode)}>
          {requested === mode && <motion.span className="skill-active-indicator" layoutId="skill-active-indicator" transition={{ duration: reducedMotion ? 0 : .2, ease: [.22, 1, .36, 1] }} />}
          <span className="skill-tab-label">{mode} <span aria-hidden="true">{mode === 'Design' ? '✳' : '</>'}</span></span>
        </button>)}
      </div>
    </div>
    <div ref={surface} className="skills-panel" data-motion="skills-content" aria-live="polite" aria-busy={requested !== displayed}>
      <div className="skill-content">
        <p className="serif skills-statement">{statements[displayed]}</p>
        {disciplines.map(mode => <div key={mode} className="skill-groups" hidden={displayed !== mode}>{skills[mode].map(group => <div className="skill-group" key={group.label}><h3>{group.label}</h3><div className="tags">{group.items.map(item => <span key={item}>{item}</span>)}</div></div>)}</div>)}
      </div>
    </div>
  </section>;
}
