import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useMotionValue, type MotionValue } from 'motion/react';
import { useMotionPreference } from '../motion/useMotionPreference';
import { drawCompiledSprite } from './compiledSprite';
import { advanceCat, catFrame, createCatState, type CatPoint } from './catController';
import { catObstacles, catSegmentClear, findCatPath, type CatObstacle } from './catNavigation';

function visibleControls(): CatObstacle[] {
  return Array.from(document.querySelectorAll<HTMLElement>('a[href],button,input,textarea,select')).flatMap(element => {
    if (element.closest('[data-pixel-companion]') || !element.getClientRects().length) return [];
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    if (!rect.width || !rect.height || rect.right <= 0 || rect.bottom <= 0 || rect.left >= innerWidth || rect.top >= innerHeight || style.visibility === 'hidden' || style.display === 'none') return [];
    return [{ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }];
  });
}

type CatSprites = { image: HTMLImageElement; frame: number; facing: number };

export function drawCatFrame(context: CanvasRenderingContext2D, { image, frame }: CatSprites) {
  drawCompiledSprite(context, image, frame, 6);
}

function CatSprite({ image, frame, facing }: CatSprites) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const context = ref.current?.getContext('2d');
    if (context) drawCatFrame(context, { image, frame, facing });
  }, [image, frame, facing]);
  return <canvas ref={ref} width={96} height={96} className="cat-sprite" style={{ transform: `scaleX(${facing})` }} />;
}

/** Independent controller; owner state supplies position, never a cat sprite pose. */
export function CatCompanion({ ownerX, ownerY, ownerSize, ownerMode, paused }: { ownerX: MotionValue<number>; ownerY: MotionValue<number>; ownerSize: number; ownerMode: string; paused: boolean }) {
  const reduced = useMotionPreference();
  const x = useMotionValue(0), y = useMotionValue(0);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [view, setView] = useState({ frame: 0, facing: 1, mode: 'idle', activity: 'rest', speed: 0, size: 88, front: false, ready: false });
  const options = useRef({ ownerSize, ownerMode, paused, reduced });
  options.current = { ownerSize, ownerMode, paused, reduced };

  useEffect(() => {
    let active = true;
    const atlas = new Image();
    atlas.onload = () => { if (active) setImage(atlas); };
    atlas.src = '/avatars/tabby-cat-animations.png';
    return () => { active = false; atlas.onload = null; };
  }, []);

  useEffect(() => {
    if (!image) return;
    const state = createCatState();
    let raf = 0, last = performance.now();
    let obstacles: CatObstacle[] = [], scanAt = 0;
    let safe = { left: 0, right: 0, top: 0, bottom: 0 };
    const measureSafe = () => {
      const element = document.querySelector('.companion-safe-area');
      if (!element) return;
      const style = getComputedStyle(element);
      safe = { left: parseFloat(style.paddingLeft) || 0, right: parseFloat(style.paddingRight) || 0, top: parseFloat(style.paddingTop) || 0, bottom: parseFloat(style.paddingBottom) || 0 };
      state.routeCheckAt = 0;
      scanAt = 0;
    };
    const dirtyRoute = () => { state.routeCheckAt = 0; scanAt = 0; };
    measureSafe(); window.addEventListener('resize', measureSafe);
    window.addEventListener('scroll', dirtyRoute, { passive: true, capture: true });
    const tick = (time: number) => {
      const option = options.current;
      const dt = Math.min(.05, Math.max(0, (time - last) / 1000)); last = time;
      const size = option.ownerSize <= 120 ? 68 : 88;
      const viewport = window.visualViewport;
      const bounds = {
        left: (viewport?.offsetLeft ?? 0) + 12 + safe.left,
        top: (viewport?.offsetTop ?? 0) + 12 + safe.top,
        right: (viewport?.offsetLeft ?? 0) + (viewport?.width ?? innerWidth) - size - 12 - safe.right,
        bottom: (viewport?.offsetTop ?? 0) + (viewport?.height ?? innerHeight) - size - 12 - safe.bottom,
      };
      const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(n, Math.max(low, high)));
      const owner = { x: ownerX.get(), y: ownerY.get() };
      const target = { x: clamp(owner.x - size * .32, bounds.left, bounds.right), y: clamp(owner.y + option.ownerSize * .94 - size * .94, bounds.top, bounds.bottom) };
      const frozen = option.paused || option.ownerMode === 'suspended' || document.hidden;
      const dragging = option.ownerMode === 'drag';
      const quiet = option.reduced !== false;
      const routes = () => {
        if (time >= scanAt) { obstacles = catObstacles(visibleControls(), size); scanAt = time + 200; }
        return obstacles;
      };
      advanceCat(state, { time, dt, target, owner, ownerSize: option.ownerSize, bounds, frozen, reduced: quiet, dragging,
        clear: (from: CatPoint, to: CatPoint) => catSegmentClear(from, to, routes()),
        navigate: (from, destination) => findCatPath(from, destination, bounds, routes()),
      });
      x.set(state.position.x); y.set(state.position.y);
      const next = {
        frame: frozen || quiet || dragging ? 0 : catFrame(state, time), facing: state.facing,
        mode: frozen ? 'suspended' : dragging ? 'watch-owner' : state.animation,
        activity: frozen || quiet || dragging ? 'rest' : state.activity,
        speed: Math.round(state.speed), size, front: state.front && !frozen, ready: true,
      };
      setView(previous => Object.keys(next).every(key => previous[key as keyof typeof next] === next[key as keyof typeof next]) ? previous : next);
      if (!document.hidden) raf = requestAnimationFrame(tick);
    };
    const visibility = () => {
      cancelAnimationFrame(raf); last = performance.now(); state.wasFrozen = true;
      if (!document.hidden) raf = requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange', visibility);
    if (!document.hidden) raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('resize', measureSafe); window.removeEventListener('scroll', dirtyRoute, true);
    };
  }, [image, ownerX, ownerY, x, y]);

  return image && <motion.div className="companion-cat" aria-hidden="true" data-cat-mode={view.mode} data-cat-activity={view.activity} data-cat-speed={view.speed} data-cat-frame={view.frame} style={{ x, y, width: view.size, height: view.size, zIndex: view.front ? 3 : 1, visibility: view.ready ? 'visible' : 'hidden' }}>
    <CatSprite image={image} frame={view.frame} facing={view.facing} />
  </motion.div>;
}
