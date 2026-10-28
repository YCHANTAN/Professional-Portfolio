import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useMotionValue } from 'motion/react';
import { useMotionPreference } from '../motion/useMotionPreference';
import { COMPANION_TIMING, specialIdleFrame, type SpecialIdle, type TransitionStage } from './animationClips';

type Activity = 'idle' | 'walk' | 'run' | 'eat' | 'wave' | 'look' | 'drag' | 'watch' | 'transitioning' | 'idle_laptop' | 'idle_painting';
type Point = { x: number; y: number };
type Bounds = { left: number; top: number; right: number; bottom: number };
type Press = { id: number; client: Point; origin: Point; dragged: boolean };
type Engine = {
  initialized: boolean; position: Point; anchor: Point; bounds: Bounds; size: number;
  activity: Activity; started: number; until: number; watchUntil: number;
  target: number; facing: 1 | -1; pointer: Point; press: Press | null;
  hidden: boolean; menu: boolean; suspended: boolean; tabHidden: boolean; reduced: boolean;
  lastTap: { time: number; point: Point } | null; obstaclesDirty: boolean;
  standingSince: number; special: SpecialIdle | null; lastSpecial: SpecialIdle | null; specialStage: TransitionStage;
};
type Presentation = { ready: boolean; frame: number; facing: number; mode: string; size: number; hidden: boolean; menu: boolean; boundsKey: string; lookX: number; lookY: number };

const WATCH_MS = 20_000;
const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
const idleDuration = () => 12000 + Math.random() * 8000;
const pointDistance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const now = () => performance.now();

function resetIdle(engine: Engine, time: number, duration = idleDuration()) {
  engine.activity = 'idle'; engine.started = time; engine.until = time + duration;
  engine.standingSince = time; engine.special = null;
}

function gaze(engine: Engine) {
  const dx = engine.pointer.x - (engine.position.x + engine.size / 2);
  const dy = engine.pointer.y - (engine.position.y + engine.size * .24);
  if (Math.hypot(dx, dy) < 12) return 'center';
  const angle = Math.atan2(dy, dx);
  if (Math.abs(angle) <= Math.PI / 4) return 'right';
  if (Math.abs(angle) >= Math.PI * 3 / 4) return 'left';
  return dy < 0 ? 'up' : 'down';
}

/** Direction follows the whole viewport, with no maximum tracking distance. */
function gazeVector(engine: Engine) {
  if (engine.activity !== 'watch' && engine.activity !== 'drag') return { lookX: 0, lookY: 0 };
  const dx = engine.pointer.x - (engine.position.x + engine.size / 2);
  const dy = engine.pointer.y - (engine.position.y + engine.size * .24);
  const distance = Math.hypot(dx, dy);
  const denominator = Math.max(engine.size * .8, distance);
  return { lookX: Math.round(dx / denominator * 100) / 100, lookY: Math.round(dy / denominator * 100) / 100 };
}

function spriteFrame(engine: Engine, time: number) {
  const elapsed = Math.max(0, time - engine.started);
  if (engine.menu || engine.suspended || engine.tabHidden) return 0;
  if (engine.activity === 'drag') return { left: 24, right: 25, up: 26, down: 27, center: 26 }[gaze(engine)];
  if (engine.activity === 'watch') return { left: 3, right: 4, up: 5, down: 28, center: 0 }[gaze(engine)];
  if (engine.reduced) return 0;
  if (engine.activity === 'walk') return 30 + Math.floor(elapsed / COMPANION_TIMING.walkFrame) % 4;
  if (engine.activity === 'run') return 34 + Math.floor(elapsed / COMPANION_TIMING.runFrame) % 4;
  if (engine.special && ['transitioning', 'idle_laptop', 'idle_painting'].includes(engine.activity)) return specialIdleFrame(engine.special, engine.specialStage, elapsed);
  if (engine.activity === 'eat') return 18 + Math.floor(elapsed / 300) % 4;
  if (engine.activity === 'wave') return 22 + Math.floor(elapsed / 300) % 2;
  if (engine.activity === 'look') return [3, 5, 4, 28][Math.floor(elapsed / 1200) % 4];
  const blink = elapsed % 4400;
  return blink > 4050 && blink < 4250 ? 1 : Math.floor(elapsed / 1400) % 2 === 0 ? 0 : 2;
}

/** Only scan when starting a trip or when scrolling changes the route. */
function routeIsClear(engine: Engine, target: number) {
  const box = {
    left: Math.min(engine.position.x, target) + engine.size * .15,
    right: Math.max(engine.position.x, target) + engine.size * .85,
    top: engine.position.y + engine.size * .08,
    bottom: engine.position.y + engine.size * .93,
  };
  return !Array.from(document.querySelectorAll<HTMLElement>('a[href], button, input, textarea, select, [contenteditable="true"]')).some(element => {
    if (element.closest('[data-pixel-companion]') || !element.getClientRects().length) return false;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    return box.left < rect.right + 8 && box.right > rect.left - 8 && box.top < rect.bottom + 8 && box.bottom > rect.top - 8;
  });
}

function chooseActivity(engine: Engine, time: number) {
  engine.started = time;
  const choice = Math.random();
  if (choice < .65) {
    if (time - engine.standingSince >= COMPANION_TIMING.standingBeforeSpecial) {
      engine.special = engine.lastSpecial === 'laptop' ? 'painting' : engine.lastSpecial === 'painting' ? 'laptop' : Math.random() < .5 ? 'laptop' : 'painting';
      engine.lastSpecial = engine.special;
      engine.specialStage = 'enter'; engine.activity = 'transitioning';
      engine.until = time + COMPANION_TIMING.enter;
      return;
    }
    const idle = Math.random();
    engine.activity = idle < .65 ? 'idle' : idle < .8 ? 'eat' : idle < .9 ? 'wave' : 'look';
    engine.until = time + idleDuration();
    if (engine.activity === 'wave') engine.until = time + 8000 + Math.random() * 4000;
    return;
  }
  const left = Math.max(engine.bounds.left, engine.anchor.x - 120);
  const right = Math.min(engine.bounds.right, engine.anchor.x + 120);
  let target = left + Math.random() * (right - left);
  if (Math.abs(target - engine.position.x) < 24) target = engine.position.x - left > right - engine.position.x ? left : right;
  if (Math.abs(target - engine.position.x) < 12 || !routeIsClear(engine, target)) { resetIdle(engine, time); return; }
  engine.activity = choice < .95 ? 'walk' : 'run';
  engine.until = time + (engine.activity === 'walk' ? 10000 : 7000) + Math.random() * 4000;
  engine.target = target;
  engine.facing = target < engine.position.x ? -1 : 1;
  engine.obstaclesDirty = false;
}

/** One controller owns movement, interaction priority, sprite frames and deadlines. */
export function useCompanion(suspended: boolean) {
  const reduced = useMotionPreference();
  const x = useMotionValue(0), y = useMotionValue(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const safeRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const showRef = useRef<HTMLButtonElement>(null);
  const engineRef = useRef<Engine>({
    initialized: false, position: { x: 0, y: 0 }, anchor: { x: 0, y: 0 },
    bounds: { left: 24, top: 24, right: 24, bottom: 24 }, size: 160,
    activity: 'idle', started: 0, until: 0, watchUntil: 0, target: 0, facing: 1,
    pointer: { x: 0, y: 0 }, press: null, hidden: false, menu: false,
    suspended, tabHidden: document.hidden, reduced: reduced !== false, lastTap: null, obstaclesDirty: true,
    standingSince: 0, special: null, lastSpecial: null, specialStage: 'enter',
  });
  const [view, setView] = useState<Presentation>({ ready: false, frame: 0, facing: 1, mode: 'idle', size: 160, hidden: false, menu: false, boundsKey: '', lookX: 0, lookY: 0 });
  const [announcement, setAnnouncement] = useState('');

  const present = useCallback(() => {
    const e = engineRef.current;
    x.set(e.position.x); y.set(e.position.y);
    const next: Presentation = {
      ready: e.initialized, frame: spriteFrame(e, now()), size: e.size, hidden: e.hidden, menu: e.menu, boundsKey: Object.values(e.bounds).join(','),
      facing: (e.activity === 'walk' || e.activity === 'run') && !e.menu && !e.suspended ? e.facing : 1,
      mode: e.hidden ? 'hidden' : e.suspended || e.tabHidden ? 'suspended' : e.menu ? 'menu' : e.activity,
      ...gazeVector(e),
    };
    setView(previous => Object.keys(next).every(key => previous[key as keyof Presentation] === next[key as keyof Presentation]) ? previous : next);
  }, [x, y]);

  const measure = useCallback((reset = false) => {
    const e = engineRef.current;
    const viewport = window.visualViewport;
    const offsetX = viewport?.offsetLeft ?? 0, offsetY = viewport?.offsetTop ?? 0;
    const width = viewport?.width ?? innerWidth, height = viewport?.height ?? innerHeight;
    const safe = safeRef.current ? getComputedStyle(safeRef.current) : null;
    const inset = (side: 'Left' | 'Right' | 'Top' | 'Bottom') => parseFloat(safe?.[`padding${side}`] ?? '0') || 0;
    e.size = window.matchMedia('(max-width: 700px)').matches ? 120 : 160;
    e.bounds = {
      left: offsetX + 24 + inset('Left'), top: offsetY + 24 + inset('Top'),
      right: Math.max(offsetX + 24 + inset('Left'), offsetX + width - e.size - 24 - inset('Right')),
      bottom: Math.max(offsetY + 24 + inset('Top'), offsetY + height - e.size - 24 - inset('Bottom')),
    };
    if (!e.initialized || reset) {
      e.position = { x: e.bounds.right, y: e.bounds.bottom };
      e.anchor = { ...e.position }; e.pointer = { x: e.position.x + e.size / 2, y: e.position.y };
      e.watchUntil = 0; resetIdle(e, now());
    } else {
      e.position = { x: clamp(e.position.x, e.bounds.left, e.bounds.right), y: clamp(e.position.y, e.bounds.top, e.bounds.bottom) };
      e.anchor = { x: clamp(e.anchor.x, e.bounds.left, e.bounds.right), y: e.position.y };
      if (e.activity === 'walk' || e.activity === 'run') resetIdle(e, now());
      if (e.press) { e.press.client = { ...e.pointer }; e.press.origin = { ...e.position }; }
    }
    e.initialized = true; e.obstaclesDirty = true; present();
  }, [present]);

  const finishPress = useCallback((cancel = false) => {
    const e = engineRef.current, press = e.press;
    if (!press) return;
    e.press = null;
    if (press.dragged) {
      e.special = null;
      e.anchor = { ...e.position }; e.watchUntil = now() + WATCH_MS;
      e.activity = 'watch'; e.started = now(); e.lastTap = null;
      setAnnouncement('Avatar placed. Watching for 20 seconds.');
    } else if (cancel) { e.lastTap = null; resetIdle(e, now()); }
    try { if (avatarRef.current?.hasPointerCapture(press.id)) avatarRef.current.releasePointerCapture(press.id); } catch { /* Capture may already be lost on cancellation. */ }
    present();
  }, [present]);

  useLayoutEffect(() => {
    measure();
    const onResize = () => measure();
    const dirty = () => { engineRef.current.obstaclesDirty = true; };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', dirty, { passive: true, capture: true });
    window.visualViewport?.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('scroll', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', dirty, true);
      window.visualViewport?.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('scroll', onResize);
    };
  }, [measure]);

  useEffect(() => {
    const e = engineRef.current;
    e.suspended = suspended; e.reduced = reduced !== false;
    if (suspended) { finishPress(true); e.menu = false; }
    if (e.activity === 'walk' || e.activity === 'run' || e.special) resetIdle(e, now());
    present();
  }, [suspended, reduced, finishPress, present]);

  useEffect(() => {
    let raf = 0, last = now();
    const tick = (time: number) => {
      const e = engineRef.current;
      const dt = Math.min(.05, Math.max(0, (time - last) / 1000)); last = time;
      if (!e.hidden && !e.menu && !e.suspended && !e.tabHidden && !e.press) {
        if (e.activity === 'watch' && time >= e.watchUntil) resetIdle(e, time);
        if (!e.reduced && e.activity !== 'watch') {
          if (e.activity === 'walk' || e.activity === 'run') {
            if (time >= e.until) resetIdle(e, time);
            if (e.obstaclesDirty && !routeIsClear(e, e.target)) resetIdle(e, time);
            e.obstaclesDirty = false;
            if (e.activity === 'walk' || e.activity === 'run') {
              const speed = e.activity === 'walk' ? 30 : 70;
              const step = Math.min(Math.abs(e.target - e.position.x), dt * speed);
              e.position.x = clamp(e.position.x + e.facing * step, e.bounds.left, e.bounds.right);
              if (Math.abs(e.target - e.position.x) < .5) {
                const left = Math.max(e.bounds.left, e.anchor.x - 120);
                const right = Math.min(e.bounds.right, e.anchor.x + 120);
                const next = Math.abs(e.position.x - left) > Math.abs(right - e.position.x) ? left : right;
                if (Math.abs(next - e.position.x) >= 12 && routeIsClear(e, next)) {
                  e.target = next; e.facing = next < e.position.x ? -1 : 1;
                } else resetIdle(e, time);
              }
            }
          } else if (time >= e.until) {
            if (e.special) {
              e.started = time;
              if (e.specialStage === 'enter') {
                e.specialStage = 'active'; e.activity = e.special === 'laptop' ? 'idle_laptop' : 'idle_painting';
                e.until = time + COMPANION_TIMING.specialMinimum + Math.random() * COMPANION_TIMING.specialVariation;
              } else if (e.specialStage === 'active') {
                e.specialStage = 'exit'; e.activity = 'transitioning'; e.until = time + COMPANION_TIMING.exit;
              } else resetIdle(e, time);
            } else chooseActivity(e, time);
          }
        }
      }
      present();
      if (!e.tabHidden) raf = requestAnimationFrame(tick);
    };
    const visibility = () => {
      const e = engineRef.current;
      cancelAnimationFrame(raf); e.tabHidden = document.hidden; last = now();
      if (e.tabHidden) finishPress(true);
      else {
        if (e.activity !== 'watch') resetIdle(e, now());
        raf = requestAnimationFrame(tick);
      }
      present();
    };
    const pointer = (event: PointerEvent) => {
      const e = engineRef.current;
      if (event.pointerType !== 'touch' || e.press) e.pointer = { x: event.clientX, y: event.clientY };
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pointermove', pointer, { passive: true, capture: true });
    if (!document.hidden) raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pointermove', pointer, true);
    };
  }, [finishPress, present]);

  const openMenu = useCallback(() => {
    const e = engineRef.current;
    if (e.hidden || e.suspended || e.press?.dragged) return;
    e.menu = true; e.lastTap = null; present();
  }, [present]);

  const closeMenu = useCallback((restoreFocus = true) => {
    const e = engineRef.current;
    e.menu = false;
    if (e.watchUntil > now()) e.activity = 'watch'; else resetIdle(e, now());
    present();
    if (restoreFocus) requestAnimationFrame(() => avatarRef.current?.focus({ preventScroll: true }));
  }, [present]);

  const hide = useCallback(() => {
    const e = engineRef.current;
    e.hidden = true; e.menu = false; e.lastTap = null; finishPress(true); present();
    setAnnouncement('Avatar hidden. Use Show avatar to bring it back.');
    requestAnimationFrame(() => showRef.current?.focus({ preventScroll: true }));
  }, [finishPress, present]);

  const show = useCallback(() => {
    const e = engineRef.current;
    e.hidden = false; e.menu = false; measure(true); present();
    setAnnouncement('Avatar returned to the bottom-right corner.');
    requestAnimationFrame(() => avatarRef.current?.focus({ preventScroll: true }));
  }, [measure, present]);

  return {
    x, y, view, rootRef, safeRef, avatarRef, showRef, announcement, openMenu, closeMenu, hide, show,
    bounds: engineRef.current.bounds,
    onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
      const e = engineRef.current;
      if (!event.isPrimary || event.button !== 0 || e.menu || e.suspended || e.press) return;
      if (e.special) resetIdle(e, now());
      e.pointer = { x: event.clientX, y: event.clientY };
      e.press = { id: event.pointerId, client: { ...e.pointer }, origin: { ...e.position }, dragged: false };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
      const e = engineRef.current, press = e.press;
      if (!press || press.id !== event.pointerId) return;
      e.pointer = { x: event.clientX, y: event.clientY };
      if (!press.dragged && pointDistance(e.pointer, press.client) < 6) return;
      press.dragged = true; e.activity = 'drag'; e.watchUntil = 0; e.special = null;
      e.position.x = clamp(press.origin.x + event.clientX - press.client.x, e.bounds.left, e.bounds.right);
      e.position.y = clamp(press.origin.y + event.clientY - press.client.y, e.bounds.top, e.bounds.bottom);
      present();
    },
    onPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
      const e = engineRef.current, press = e.press;
      if (!press || press.id !== event.pointerId) return;
      e.pointer = { x: event.clientX, y: event.clientY };
      const dragged = press.dragged;
      finishPress();
      if (!dragged) {
        const previous = e.lastTap, time = now();
        if (previous && time - previous.time <= 350 && pointDistance(previous.point, e.pointer) < 20) openMenu();
        else e.lastTap = { time, point: { ...e.pointer } };
      }
    },
    onPointerCancel() { finishPress(true); },
    onLostPointerCapture() { finishPress(true); },
    onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
      const e = engineRef.current;
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openMenu(); return; }
      if (event.key === 'Escape') {
        if (e.press) {
          e.position = { ...e.press.origin }; finishPress(true);
        }
        return;
      }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) || e.menu || e.suspended) return;
      event.preventDefault();
      const step = event.shiftKey ? 1 : 10;
      e.position.x = clamp(e.position.x + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0), e.bounds.left, e.bounds.right);
      e.position.y = clamp(e.position.y + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0), e.bounds.top, e.bounds.bottom);
      e.anchor = { ...e.position }; e.watchUntil = now() + WATCH_MS; e.activity = 'watch'; e.special = null; e.started = now(); present();
    },
  };
}
