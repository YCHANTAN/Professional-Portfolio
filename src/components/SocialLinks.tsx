import { profile } from '../data/portfolio';
import { Icon, type IconName } from './Icon';
import { DownloadResume } from './DownloadResume';

const socialIcons: Record<string, IconName> = { GitHub: 'GitHub', LinkedIn: 'LinkedIn', Instagram: 'Instagram', Facebook: 'Facebook', Email: 'Email' };

export function SocialLinks({ compact = false, includeResume = false }: { compact?: boolean; includeResume?: boolean }) {
  const links = [...profile.socials, { name: 'Email', url: `mailto:${profile.email}` }];
  return <nav className={`social-links${compact ? ' social-links-compact' : ''}`} aria-label={compact ? 'Find Christian online' : 'Social profiles and email'}>
    {links.map(link => <a key={link.name} href={link.url} aria-label={link.name === 'Email' ? 'Email Christian Osorno' : `Christian Osorno on ${link.name}`} title={link.name} target={link.name === 'Email' ? undefined : '_blank'} rel={link.name === 'Email' ? undefined : 'noreferrer'}>
      <Icon name={socialIcons[link.name] ?? 'Email'} />{!compact && <span>{link.name}</span>}
    </a>)}
    {includeResume && <DownloadResume compact={compact} />}
  </nav>;
}
