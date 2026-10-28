import type { CatBounds, CatPoint } from './catController';

export type CatObstacle = { left: number; top: number; right: number; bottom: number };
export type CatPath = { goal: CatPoint; waypoints: CatPoint[] };
const distance = (a: CatPoint, b: CatPoint) => Math.hypot(a.x - b.x, a.y - b.y);
const contains = (r: CatObstacle, p: CatPoint) => p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom;

/** Expand controls into forbidden top-left positions for the visible cat footprint. */
export function catObstacles(controls: CatObstacle[], size: number) {
  return controls.map(r => ({ left: r.left - size * .85 - 6, right: r.right - size * .15 + 6,
    top: r.top - size * .94 - 6, bottom: r.bottom - size * .3 + 6 }));
}

/** Exact segment/rectangle clipping avoids rejecting clear diagonal routes by their bounding box. */
export function catSegmentClear(from: CatPoint, to: CatPoint, obstacles: CatObstacle[], escapeOrigin = false) {
  return !obstacles.some(rect => {
    if (escapeOrigin && contains(rect, from) && !contains(rect, to)) return false;
    let enter = 0, leave = 1;
    for (const [start, delta, low, high] of [[from.x, to.x - from.x, rect.left, rect.right], [from.y, to.y - from.y, rect.top, rect.bottom]]) {
      if (Math.abs(delta) < .00001) { if (start <= low || start >= high) return false; }
      else {
        const a = (low - start) / delta, b = (high - start) / delta;
        enter = Math.max(enter, Math.min(a, b)); leave = Math.min(leave, Math.max(a, b));
        if (enter >= leave) return false;
      }
    }
    return enter < leave;
  });
}

/** A small visibility graph routes around page controls without jumping or crossing them. */
export function findCatPath(from: CatPoint, intended: CatPoint, bounds: CatBounds, obstacles: CatObstacle[]): CatPath | null {
  const inBounds = (p: CatPoint) => p.x >= bounds.left && p.x <= bounds.right && p.y >= bounds.top && p.y <= bounds.bottom;
  const free = (p: CatPoint) => inBounds(p) && !obstacles.some(r => contains(r, p));
  const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(n, Math.max(low, high)));
  const desired = { x: clamp(intended.x, bounds.left, bounds.right), y: clamp(intended.y, bounds.top, bounds.bottom) };
  const corners = obstacles.flatMap(r => [
    { x: r.left - 2, y: r.top - 2 }, { x: r.right + 2, y: r.top - 2 },
    { x: r.left - 2, y: r.bottom + 2 }, { x: r.right + 2, y: r.bottom + 2 },
  ]).filter(free);
  const goals = free(desired) ? [desired] : obstacles.flatMap(r => [
    { x: desired.x, y: r.top - 2 }, { x: desired.x, y: r.bottom + 2 },
    { x: r.left - 2, y: desired.y }, { x: r.right + 2, y: desired.y },
  ]).concat(corners).filter(free).sort((a, b) => distance(a, desired) - distance(b, desired));
  // Usually the first landing point is reachable. Alternatives handle an obstructed drop.
  for (const goal of goals) {
    if (catSegmentClear(from, goal, obstacles, true)) return { goal, waypoints: [goal] };
    const nodes = [from, goal, ...corners];
    const costs = nodes.map(() => Infinity), previous = nodes.map(() => -1), visited = new Set<number>();
    costs[0] = 0;
    for (let step = 0; step < nodes.length; step++) {
      let current = -1;
      for (let i = 0; i < nodes.length; i++) if (!visited.has(i) && (current === -1 || costs[i] < costs[current])) current = i;
      if (current < 0 || !Number.isFinite(costs[current])) break;
      if (current === 1) {
        const waypoints: CatPoint[] = [];
        for (let i = 1; i !== 0; i = previous[i]) waypoints.unshift(nodes[i]);
        return { goal, waypoints };
      }
      visited.add(current);
      for (let i = 1; i < nodes.length; i++) {
        if (visited.has(i) || !catSegmentClear(nodes[current], nodes[i], obstacles, current === 0)) continue;
        const cost = costs[current] + distance(nodes[current], nodes[i]);
        if (cost < costs[i]) { costs[i] = cost; previous[i] = current; }
      }
    }
  }
  return null;
}
