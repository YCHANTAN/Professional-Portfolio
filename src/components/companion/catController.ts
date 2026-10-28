export type CatActivity = 'rest' | 'groom' | 'stretch' | 'sleep' | 'orbit';
export type CatAnimation = 'idle' | 'walking' | 'running';
export type CatPoint = { x: number; y: number };
export type CatBounds = { left: number; top: number; right: number; bottom: number };
export type CatState = {
  position: CatPoint; owner: CatPoint; initialized: boolean; following: boolean;
  activity: CatActivity; animation: CatAnimation; started: number; until: number;
  phase: number; facing: number; speed: number; stoppedAt: number; front: boolean;
  routeCheckAt: number; routeAllowed: boolean; wasFrozen: boolean;
  waypoints: CatPoint[]; routeGoal: CatPoint | null; routeTarget: CatPoint | null;
};
type Input = {
  time: number; dt: number; target: CatPoint; owner: CatPoint; ownerSize: number;
  bounds: CatBounds; frozen: boolean; reduced: boolean; dragging: boolean;
  clear: (from: CatPoint, to: CatPoint) => boolean; random?: () => number;
  navigate?: (from: CatPoint, target: CatPoint) => CatPath | null;
};
const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(n, Math.max(low, high)));
const distance = (a: CatPoint, b: CatPoint) => Math.hypot(a.x - b.x, a.y - b.y);

export function createCatState(): CatState {
  return { position: { x: 0, y: 0 }, owner: { x: 0, y: 0 }, initialized: false, following: false,
    activity: 'rest', animation: 'idle', started: 0, until: 0, phase: 0, facing: 1,
    speed: 0, stoppedAt: 0, front: false, routeCheckAt: 0, routeAllowed: true, wasFrozen: false,
    waypoints: [], routeGoal: null, routeTarget: null };
}

function rest(state: CatState, time: number, random: () => number) {
  state.activity = 'rest'; state.started = time; state.until = time + 8000 + random() * 6000;
}

/** One position update, then exactly one animation decision, per tick. */
export function advanceCat(state: CatState, input: Input) {
  const { time, dt, target, owner, ownerSize, bounds, frozen, reduced, dragging, clear } = input;
  const random = input.random ?? Math.random;
  const bounded = (point: CatPoint) => ({ x: clamp(point.x, bounds.left, bounds.right), y: clamp(point.y, bounds.top, bounds.bottom) });
  if (!state.initialized) {
    state.position = { ...target }; state.owner = { ...owner }; state.initialized = true;
    state.stoppedAt = time; rest(state, time, random);
  }
  state.position = bounded(state.position);
  const before = { ...state.position };
  const ownerSpeed = dt > 0 ? Math.min(100, distance(owner, state.owner) / dt) : 0;
  state.owner = { ...owner };
  state.front = false;
  if (frozen || reduced || dragging) {
    if (reduced && !frozen && !dragging) state.position = { ...target };
    state.animation = 'idle'; state.speed = 0; state.wasFrozen = true;
    return;
  }
  if (state.wasFrozen) {
    rest(state, time, random); state.wasFrozen = false; state.following = false;
    state.waypoints = []; state.routeGoal = null; state.routeTarget = null; state.routeCheckAt = 0;
  }

  const targetMoved = !state.routeTarget || distance(target, state.routeTarget) > 2;
  const gap = distance(state.position, !targetMoved && state.routeGoal ? state.routeGoal : target);
  // Hysteresis replaces the old single 6px cutoff that toggled sit/walk every few frames.
  if ((state.activity !== 'orbit' && gap > 14) || (ownerSpeed > 2 && gap > 1)) {
    if (!state.following) { state.following = true; state.routeCheckAt = 0; }
    if (state.activity !== 'rest') rest(state, time, random);
  }
  if (state.following) {
    // Keep an unobstructed final leg attached to a continuously moving owner.
    // Waiting for the 200ms path planner here would alternate motion and pauses.
    if (state.routeAllowed && state.waypoints.length <= 1 && (ownerSpeed > 2 || targetMoved)) {
      if (clear(state.position, target)) {
        state.waypoints = [target]; state.routeGoal = { ...target }; state.routeTarget = { ...target };
      } else state.routeCheckAt = 0;
    }
    if (time >= state.routeCheckAt || (state.routeTarget && distance(target, state.routeTarget) > 14)) {
      const path = input.navigate ? input.navigate(state.position, target) : clear(state.position, target) ? { goal: target, waypoints: [target] } : null;
      state.routeAllowed = path !== null; state.waypoints = path?.waypoints ?? [];
      state.routeGoal = path?.goal ?? null; state.routeTarget = { ...target }; state.routeCheckAt = time + 200;
    }
    while (state.waypoints.length && distance(state.position, state.waypoints[0]) < .2) state.waypoints.shift();
    const waypoint = state.waypoints[0];
    if (state.routeAllowed && waypoint) {
      const speed = ownerSpeed > 54 || gap > 110 ? 95 : gap > 24 ? 65 : Math.max(30, ownerSpeed);
      const waypointGap = distance(state.position, waypoint);
      const amount = Math.min(1, speed * dt / waypointGap);
      state.position = bounded({ x: before.x + (waypoint.x - before.x) * amount, y: before.y + (waypoint.y - before.y) * amount });
    }
    if (state.routeGoal && distance(state.position, state.routeGoal) <= 3 && ownerSpeed < 2) {
      state.following = false; rest(state, time, random);
    }
  } else {
    if (time >= state.until) {
      const choice = random(); state.started = time;
      state.activity = choice < .35 ? 'rest' : choice < .55 ? 'groom' : choice < .7 ? 'stretch' : choice < .82 ? 'sleep' : 'orbit';
      state.until = time + (state.activity === 'sleep' ? 14000 + random() * 8000 : state.activity === 'orbit' ? 10000 : 8000 + random() * 6000);
      if (state.activity === 'orbit') {
        const from = { x: owner.x - ownerSize * .5, y: target.y - 16 };
        const to = { x: owner.x + ownerSize, y: target.y + 16 };
        if (!clear(from, to)) rest(state, time, random);
      }
    }
    if (state.activity === 'orbit') {
      const phase = Math.PI + (time - state.started) / 10000 * Math.PI * 2;
      const size = ownerSize <= 120 ? 68 : 88;
      const destination = bounded({ x: owner.x + ownerSize / 2 + Math.cos(phase) * ownerSize * .48 - size / 2, y: target.y + Math.sin(phase) * 14 });
      // Approach the ellipse at walking speed instead of teleporting to its first point.
      const gapToOrbit = distance(state.position, destination);
      const amount = gapToOrbit ? Math.min(1, 65 * dt / gapToOrbit) : 0;
      if (time >= state.routeCheckAt) {
        state.routeAllowed = clear(state.position, destination); state.routeCheckAt = time + 200;
      }
      if (state.routeAllowed) {
        state.position = { x: before.x + (destination.x - before.x) * amount, y: before.y + (destination.y - before.y) * amount };
        state.front = Math.sin(phase) > 0;
      } else rest(state, time, random);
    }
  }

  // The renderer cannot choose an idle pose while this tick actually moved the cat.
  const actualSpeed = dt > 0 ? distance(before, state.position) / dt : 0;
  state.speed = actualSpeed;
  const previous = state.animation;
  state.animation = actualSpeed < 1 ? 'idle' : actualSpeed > (previous === 'running' ? 48 : 58) ? 'running' : 'walking';
  if (state.animation !== 'idle') {
    if (Math.abs(state.position.x - before.x) > .02) state.facing = state.position.x < before.x ? -1 : 1;
    state.phase += dt * (state.animation === 'running' ? 10 : 6.5) * Math.max(.6, Math.min(1.2, actualSpeed / (state.animation === 'running' ? 85 : 45)));
    state.stoppedAt = time;
  } else if (previous !== 'idle') state.stoppedAt = time;
}

export function catFrame(state: CatState, time: number) {
  if (state.animation === 'walking') return 16 + Math.floor(state.phase) % 4;
  if (state.animation === 'running') return 20 + Math.floor(state.phase) % 4;
  // Brief standing settle uses the same quadruped silhouette before sitting.
  if (state.following || time - state.stoppedAt < 450 || state.activity === 'orbit') return 12;
  const elapsed = time - state.started;
  if (state.activity === 'groom') return 8 + Math.floor(elapsed / 450) % 2;
  if (state.activity === 'stretch') return elapsed % 5000 < 3200 ? 10 : 3;
  if (state.activity === 'sleep') return 11;
  return elapsed % 5200 > 4800 ? 1 : Math.floor(elapsed / 1800) % 2 === 0 ? 0 : 2;
}
import type { CatPath } from './catNavigation';

