import { useLayoutEffect, useRef, useState } from 'react';
import { animate, useInView } from 'motion/react';
import { categories, projects, type Category, type Project } from '../data/portfolio';
import { ProjectCard } from './ProjectCard';
import { useMotionPreference } from './motion/useMotionPreference';

/** Archive-only exit/commit/entry coordinator. One mounted collection also
 * keeps native dialog openers stable while the grid follows visible content. */
export function ProjectArchive({ onOpen }: { onOpen: (project: Project) => void }) {
  const [requested, setRequested] = useState<Category>('All work');
  const [displayed, setDisplayed] = useState<Category>('All work');
  const [requestedPage, setRequestedPage] = useState(1);
  const [displayedPage, setDisplayedPage] = useState(1);
  const pageSize = 9;
  const [phase, setPhase] = useState<'idle' | 'exit' | 'entry'>('idle');
  const grid = useRef<HTMLDivElement>(null);
  const reducedMotion = useMotionPreference();
  const inView = useInView(grid, { once: true, amount: 'some' });
  const arrived = useRef(false);
  const filteredProjects = projects.filter(p => displayed === 'All work' || p.category === displayed);
  const pageCount = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const visibleProjects = filteredProjects.slice((displayedPage - 1) * pageSize, displayedPage * pageSize);

  useLayoutEffect(() => {
    const element = grid.current;
    if (!element) return;
    let cancelled = false;
    const controls: ReturnType<typeof animate>[] = [];
    const entries = Array.from(element.querySelectorAll<HTMLElement>('.archive-entry:not([hidden])'));
    if (reducedMotion) {
      element.style.opacity = '1';
      element.querySelectorAll<HTMLElement>('.archive-entry').forEach(entry => { entry.style.opacity = '1'; entry.style.transform = 'none'; });
      setDisplayed(requested); setDisplayedPage(requestedPage); setPhase('idle');
      if (inView) arrived.current = true;
      return;
    }
    if (requested !== displayed || requestedPage !== displayedPage) {
      setPhase('exit');
      const exit = animate(element, { opacity: [Number(getComputedStyle(element).opacity), .35] }, { duration: .12, ease: 'easeOut' });
      controls.push(exit);
      void exit.then(() => { if (!cancelled) { setDisplayed(requested); setDisplayedPage(requestedPage); setPhase('entry'); } });
    } else {
      element.style.opacity = '1';
      const initial = inView && !arrived.current;
      if (initial) arrived.current = true;
      if (phase === 'entry' || initial || phase === 'exit') {
        setPhase('entry');
        entries.forEach((entry, index) => {
          const style = getComputedStyle(entry);
          const fresh = phase === 'entry' || initial;
          controls.push(animate(entry, { opacity: [fresh ? .55 : Number(style.opacity), 1], y: [fresh ? (initial ? 14 : 8) : (style.transform === 'none' ? 0 : new DOMMatrixReadOnly(style.transform).m42), 0] }, { duration: initial ? .45 : .18, delay: Math.min(index * .025, .05), ease: [.22, 1, .36, 1] }));
        });
        void Promise.all(controls).then(() => { if (!cancelled) setPhase('idle'); });
      }
    }
    return () => { cancelled = true; controls.forEach(control => control.stop()); };
    // Phase changes mark progress, not new animation requests.
  }, [requested, displayed, requestedPage, displayedPage, reducedMotion, inView]);

  return <>
    <div className="archive-toolbar"><div className="archive-filters" role="group" aria-label="Filter projects">{categories.map(category => <button key={category} aria-pressed={requested === category} onClick={() => { setRequested(category); setRequestedPage(1); }}>{category}<span>{category === 'All work' ? projects.length : projects.filter(p => p.category === category).length}</span></button>)}</div><span className="mono result-count" role="status">{pageCount > 1 ? `${(displayedPage - 1) * pageSize + 1}–${Math.min(displayedPage * pageSize, filteredProjects.length)} of ${filteredProjects.length}` : filteredProjects.length} projects / {displayed}</span></div>
    <div id="archive-projects" ref={grid} className="archive-grid" data-archive-phase={phase} aria-busy={phase !== 'idle' || requested !== displayed || requestedPage !== displayedPage}>
      {projects.map(project => <div key={project.id} className="archive-entry" hidden={!visibleProjects.includes(project)}><ProjectCard project={project} onOpen={project => { setRequested(displayed); setRequestedPage(displayedPage); onOpen(project); }} /></div>)}
    </div>
    {pageCount > 1 && <nav className="archive-pagination" aria-label="Project pages">
      <button disabled={requestedPage <= 1} onClick={() => setRequestedPage(page => page - 1)} aria-controls="archive-projects">← Previous</button>
      <div className="archive-page-numbers">{Array.from({ length: pageCount }, (_, index) => index + 1).map(page => <button key={page} aria-label={`Page ${page}`} aria-current={requestedPage === page ? 'page' : undefined} aria-controls="archive-projects" onClick={() => setRequestedPage(page)}>{String(page).padStart(2, '0')}</button>)}</div>
      <button disabled={requestedPage >= pageCount} onClick={() => setRequestedPage(page => page + 1)} aria-controls="archive-projects">Next →</button>
    </nav>}
  </>;
}
