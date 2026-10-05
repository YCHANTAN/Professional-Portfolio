import type { ReactNode } from 'react';
import { ScrollComposition } from './motion/ScrollComposition';

export function SectionHeading({ label, title, children }: { label: string; title: string; children?: ReactNode }) {
  return <ScrollComposition kind="heading" className="section-heading" data-motion="section-heading"><span className="mono section-label">{label}</span><h2>{title}</h2>{children && <div className="heading-note">{children}</div>}</ScrollComposition>;
}
