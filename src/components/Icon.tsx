import type { ReactNode } from 'react';

export type IconName = 'Download' | 'Check' | 'Spinner' | 'Email' | 'GitHub' | 'LinkedIn' | 'Instagram' | 'Facebook';

/** Small, decorative icons; the containing control supplies the accessible name. */
export function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    Download: <><path d="M12 3v12m-5-5 5 5 5-5" /><path d="M4 16v5h16v-5" /></>,
    Check: <path d="m5 12 4 4L19 6" />,
    Spinner: <path d="M20 12a8 8 0 1 1-8-8" />,
    Email: <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m3 6 9 7 9-7" /></>,
    GitHub: <path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.58 9.58 0 0 1 5 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />,
    LinkedIn: <><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M7 10v7m4 0v-7m0 3c0-4 6-4 6 0v4" /><circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" /></>,
    Instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></>,
    Facebook: <path fill="currentColor" stroke="none" d="M14 22v-9h3l.5-4H14V7c0-1.2.4-2 2-2h2V1.5A25 25 0 0 0 15 1c-3 0-5 1.8-5 5v3H7v4h3v9Z" />,
  };
  return <svg className={`icon icon-${name.toLowerCase()}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}
