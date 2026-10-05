import { useEffect, useRef, type ComponentPropsWithoutRef, type ReactNode, type RefObject } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue, type MotionStyle, type MotionProps } from 'motion/react';
import { useMotionPreference } from './useMotionPreference';

type SurfaceProps = Omit<ComponentPropsWithoutRef<'div'>, keyof MotionProps> & { children?: ReactNode };
type Props = SurfaceProps & {
  kind: 'collage' | 'title' | 'heading' | 'image';
};

/** The stationary wrapper measures scroll; only its visual children move.
 * CSS owns responsive travel and keeps the scaffold's original rotations.
 * No scroll state, custom observers, or wheel/touch interception is needed.
 */
export function ScrollComposition({ kind, className = '', ...props }: Props) {
  const reducedMotion = useMotionPreference();
  const target = useRef<HTMLDivElement>(null);
  const depth = useMotionValue(0);
  const classes = `motion-composition motion-${kind} ${className}`;
  useEffect(() => { if (reducedMotion !== false) depth.set(0); }, [reducedMotion, depth]);
  // Only the subscription remounts on preference changes, never the content.
  return <motion.div {...props} ref={target} className={classes} style={{ '--scroll-depth': depth } as MotionStyle}>
    {props.children}
    {reducedMotion === false && <LinkedComposition target={target} depth={depth} />}
  </motion.div>;
}

function LinkedComposition({ target, depth }: { target: RefObject<HTMLDivElement | null>; depth: MotionValue<number> }) {
  const { scrollYProgress } = useScroll({ target, offset: ['start end', 'end start'] });
  const mapped = useTransform(scrollYProgress, [0, 1], [-1, 1]);
  const smoothed = useSpring(mapped, { stiffness: 150, damping: 28, mass: .65 });
  useMotionValueEvent(smoothed, 'change', value => depth.set(value));
  useEffect(() => { depth.set(smoothed.get()); }, [depth, smoothed]);
  return null;
}
