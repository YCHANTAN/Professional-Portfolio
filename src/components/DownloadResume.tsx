import { Icon } from './Icon';

export function DownloadResume({ subtle = false, compact = false }: { subtle?: boolean; compact?: boolean }) {
  return <a className={compact ? 'download-resume' : subtle ? 'text-link download-link' : 'button button-dark download-resume'} href={import.meta.env.BASE_URL + 'Christian-Osorno-Resume.pdf'} download="Christian-Osorno-Resume.pdf" aria-label={compact ? 'Download résumé (PDF)' : undefined} title="Download résumé (PDF)"><Icon name="Download" />{!compact && <>Download résumé{subtle && <span className="mono">PDF</span>}</>}</a>;
}
