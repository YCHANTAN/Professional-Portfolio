import type { Project } from '../data/portfolio';
import { ResponsiveImage } from './ResponsiveImage';
import { ProjectSurface } from './motion/ProjectSurface';

export function ProjectCard({ project, onOpen }: { project: Project; onOpen: (project: Project) => void }) {
  return <article className={`project-card tone-${project.tone}`} data-motion="archive-card"><ProjectSurface className="card-image" onClick={() => onOpen(project)} aria-label={`Read about ${project.title}`}><ResponsiveImage src={project.image} alt={project.imageAlt} /><span className="image-caption mono">Illustrative photo</span><span className="card-open" aria-hidden="true">↗</span></ProjectSurface><div className="card-meta mono">{project.discipline}</div><h3><button onClick={() => onOpen(project)}>{project.title}</button></h3><p>{project.summary}</p></article>;
}
