import { motion, type HTMLMotionProps } from 'motion/react';
import { useMotionPreference } from './useMotionPreference';

/** A decorative stamp responds, not the button's hit area or focus ring.
 * Motion springs retarget from the current value on fast hover/press changes.
 */
export function ProjectSurface(props: HTMLMotionProps<'button'>) {
  const reducedMotion = useMotionPreference();
  return <motion.button
    {...props}
    initial={false}
    animate={{ '--stamp-turn': 0, '--stamp-scale': 1, '--surface-lift': 0 }}
    whileHover={reducedMotion !== false ? undefined : { '--stamp-turn': 12, '--stamp-scale': 1.12, '--surface-lift': -6 }}
    whileTap={reducedMotion !== false ? undefined : { '--stamp-turn': -6, '--stamp-scale': 0.94, '--surface-lift': 2 }}
    transition={{ type: 'spring', stiffness: 320, damping: 32 }}
  />;
}
