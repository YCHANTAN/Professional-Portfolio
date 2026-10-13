import { ProjectBackdrop } from './ProjectBackdrop';
import { useEffect, useRef } from 'react';
import { profile, type Project } from '../data/portfolio';
import { ResponsiveImage } from './ResponsiveImage';

function ProjectCollaboration({ project }: { project: Project }) {
  return <>{project.collaborative && <p className="project-team"><strong>Collaborative project</strong>{project.team && <span>{project.team.join(' · ')}</span>}</p>}{project.role && <><h3>My role</h3><p>{project.role}</p></>}{project.contribution && <><h3>My contribution</h3><p>{project.contribution}</p></>}</>;
}

function ProjectLinks({ project }: { project: Project }) {
  return <>{project.liveUrl || project.repositoryUrl ? <div className="project-links">
    {project.liveUrl && <a className="button button-dark" href={project.liveUrl} target="_blank" rel="noreferrer">Live demo <span aria-hidden="true">↗</span></a>}
    {project.repositoryUrl && <a className="button" href={project.repositoryUrl} target="_blank" rel="noreferrer">Source code <span aria-hidden="true">↗</span></a>}
    {project.implementationUrl && <a className="text-link" href={project.implementationUrl} target="_blank" rel="noreferrer">Implementation branch ↗</a>}
  </div> : project.role || project.collaborative ? null : <><a className="button button-dark" href={profile.github} target="_blank" rel="noreferrer">Visit my GitHub profile <span aria-hidden="true">↗</span></a><p className="link-disclaimer">This links to my profile, not a project-specific repository or live demo.</p></>}
  {project.note && <p className="link-disclaimer">{project.note}</p>}</>;
}

export function ProjectDialog({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!project || !dialog) return;
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      returnFocus.current?.focus({ preventScroll: true });
    };
  }, [project]);
  return <dialog ref={dialogRef} className="project-dialog" aria-labelledby="dialog-title" onCancel={onClose} onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])')).filter(item => item.getClientRects().length > 0);
    const first = items[0], last = items[items.length - 1];
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }} data-motion="project-dialog">
    {project && <><div className="dialog-top mono"><span>Project notes / {project.category}</span><button className="close-button" autoFocus onClick={onClose} aria-label="Close project details">Close <span aria-hidden="true">×</span></button></div><div className={`dialog-image tone-${project.tone}`} data-image-kind={project.imageKind} data-project-art={project.id}><ProjectBackdrop id={project.id} /><ResponsiveImage src={project.image} alt={project.imageAlt} /><span className="image-caption mono">{project.imageKind === 'screenshot' ? 'Supplied application screenshot' : project.imageKind === 'mockup' ? 'Generated device mockup / adapted from supplied screens' : 'Conceptual research illustration / not simulation output'}</span></div><div className="dialog-content"><h2 id="dialog-title">{project.title}</h2><p className="dialog-intro">{project.description}</p><ProjectCollaboration project={project} /><h3>Inside the project</h3><ul className="project-details">{project.details.map(detail => <li key={detail}>{detail}</li>)}</ul><h3>Tools & technologies</h3><div className="tags">{project.stack.map(tool => <span key={tool}>{tool}</span>)}</div><ProjectLinks project={project} /></div></>}
  </dialog>;
}
