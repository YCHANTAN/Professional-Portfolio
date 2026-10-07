import { useEffect, useLayoutEffect, useRef, useState } from 'react';

type Theme = 'light' | 'dark';
const storageKey = 'portfolio-theme';
const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark';
function savedTheme(): Theme | null {
  try { const value = localStorage.getItem(storageKey); return isTheme(value) ? value : null; }
  catch { return null; }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  const preference = useRef<Theme | null>(savedTheme());
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#101216' : '#f4f0e6');
  }, [theme]);
  useEffect(() => {
    const system = window.matchMedia('(prefers-color-scheme: dark)');
    const followSystem = () => { if (!preference.current) setTheme(system.matches ? 'dark' : 'light'); };
    const synchronize = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== null) return;
      preference.current = isTheme(event.newValue) ? event.newValue : null;
      setTheme(preference.current ?? (system.matches ? 'dark' : 'light'));
    };
    system.addEventListener('change', followSystem);
    window.addEventListener('storage', synchronize);
    return () => { system.removeEventListener('change', followSystem); window.removeEventListener('storage', synchronize); };
  }, []);
  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    preference.current = next;
    setTheme(next);
    try { localStorage.setItem(storageKey, next); } catch { /* The switch still works when storage is unavailable. */ }
  }
  return <button type="button" className="theme-toggle" aria-label="Dark mode" aria-pressed={theme === 'dark'} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} onClick={toggle}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {theme === 'light' ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5" /></> : <path d="M20.5 13.2A8.6 8.6 0 0 1 10.8 3.5 8.6 8.6 0 1 0 20.5 13.2Z" />}
    </svg>
  </button>;
}
