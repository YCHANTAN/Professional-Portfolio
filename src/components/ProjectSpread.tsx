import type { Project } from '../data/portfolio';
import { ResponsiveImage } from './ResponsiveImage';
import { StackCard } from './motion/SectionDepth';

export function ProjectSpread({ project, index, onOpen }: { project: Project; index: number; onOpen: (project: Project) => void }) {
  return <StackCard index={index}><article className={`project-spread spread-${project.id} tone-${project.tone}`} data-motion="project-spread">
    <div className="spread-copy"><div className="spread-top mono"><span>Selected work / {String(index + 1).padStart(2, '0')}</span><span>{project.category}</span></div><h3>{project.title}</h3><p className="spread-summary">{project.summary}</p><div className="spread-bottom"><span className="mono">{project.discipline}</span><button className="round-link" onClick={() => onOpen(project)} aria-label={`Read project notes for ${project.title}`}><span>Project notes</span><span className="round-arrow" aria-hidden="true">↗</span></button></div></div>
    <button type="button" className="spread-art static-project-art" onClick={() => onOpen(project)} aria-label={`Explore ${project.title}`} data-motion="spread-art" data-image-motion="static"><div className="spread-static-image"><ResponsiveImage src={project.image} alt={project.imageAlt} /></div><span className="art-wash" /><span className="art-headline" aria-hidden="true">{project.headline}</span><span className="art-stamp" aria-hidden="true">{project.id === 'elven' ? '✿' : project.id === 'pasabuy' ? '↗' : project.id === 'educaite' ? '✳' : '≈'}</span><span className="image-caption mono">Illustrative photo / not a product screenshot</span></button>
  </article></StackCard>;
}
