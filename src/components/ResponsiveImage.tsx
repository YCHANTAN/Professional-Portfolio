import { useState } from 'react';

export function ResponsiveImage({ src, alt, className = '', eager = false, portrait = false }: { src: string; alt: string; className?: string; eager?: boolean; portrait?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className={`image-fallback ${className} ${portrait ? 'portrait-fallback' : ''}`} role="img" aria-label={portrait ? 'Christian Osorno portrait placeholder' : `${alt}. Image unavailable.`}><span aria-hidden="true">{portrait ? 'c.' : '✳'}</span><small>{portrait ? 'Christian Osorno / portrait to come' : 'Illustrative image unavailable'}</small></div>;
  const remote = src.startsWith('https://images.unsplash.com/');
  return <img className={className} src={remote ? `${src}&w=1400` : src} srcSet={remote ? [480, 800, 1400].map(w => `${src}&w=${w} ${w}w`).join(', ') : undefined} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 65vw, 60vw" alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />;
}
