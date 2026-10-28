export const COMPANION_TIMING = {
  standingBeforeSpecial: 12_000,
  specialMinimum: 18_000,
  specialVariation: 8_000,
  enter: 1_100,
  exit: 900,
  walkFrame: 150,
  runFrame: 105,
} as const;

export type SpecialIdle = 'laptop' | 'painting';
export type TransitionStage = 'enter' | 'active' | 'exit';

/** Frame IDs 38–53 belong to the activities atlas, never to a movement clip. */
export function specialIdleFrame(kind: SpecialIdle, stage: TransitionStage, elapsed: number) {
  if (stage === 'enter') {
    const sequence = kind === 'laptop' ? [0, 1, 2, 3] : [0, 8, 9, 10];
    const frame = sequence[Math.min(3, Math.floor(elapsed / (COMPANION_TIMING.enter / 4)))];
    return frame === 0 ? 0 : 38 + frame;
  }
  if (stage === 'exit') {
    const sequence = kind === 'laptop' ? [2, 1, 15, 0] : [14, 8, 15, 0];
    const frame = sequence[Math.min(3, Math.floor(elapsed / (COMPANION_TIMING.exit / 4)))];
    return frame === 0 ? 0 : 38 + frame;
  }
  // Longer thinking and blinking holds break up the faster hand movements.
  if (kind === 'painting') {
    const painting = [[9, 800], [10, 900], [11, 1000], [12, 1100], [13, 1100], [14, 2000]];
    let cursor = elapsed;
    for (const [frame, duration] of painting) {
      if (cursor < duration) return 38 + frame;
      cursor -= duration;
    }
    // The finished canvas persists while the artist adds details, thinks, and blinks.
    const finish = [[54, 550], [55, 650], [56, 1600], [57, 150], [56, 850]];
    cursor %= finish.reduce((sum, [, duration]) => sum + duration, 0);
    for (const [frame, duration] of finish) {
      if (cursor < duration) return frame;
      cursor -= duration;
    }
    return 56;
  }
  const sequence = [[3, 320], [4, 320], [3, 320], [5, 400], [4, 320], [6, 150], [5, 500], [7, 1500], [4, 320]];
  const length = sequence.reduce((sum, [, duration]) => sum + duration, 0);
  let cursor = elapsed % length;
  for (const [frame, duration] of sequence) {
    if (cursor < duration) return 38 + frame;
    cursor -= duration;
  }
  return 38 + sequence[0][0];
}
