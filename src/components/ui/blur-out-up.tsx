'use client';

/**
 * @smoothui/blur-out-up - SmoothUI Text Entrance Component
 * Words lift out of a soft blur and drift upward into place with a subtle stagger.
 * Built with Motion (Framer Motion), Tailwind CSS, and respects prefers-reduced-motion.
 */

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface BlurOutUpProps {
  children?: React.ReactNode;
  text?: string;
  className?: string;
  wordStagger?: number;
  duration?: number;
  delay?: number;
  as?: React.ElementType;
}

export function BlurOutUp({
  children,
  text,
  className,
  wordStagger = 0.028,
  duration = 0.56,
  delay = 0,
  as: Component = 'div',
}: BlurOutUpProps) {
  const content = text || (typeof children === 'string' ? children : '');
  const shouldReduceMotion = useReducedMotion();

  if (!content) {
    return <Component className={className}>{children}</Component>;
  }

  const words = content.split(' ');

  if (shouldReduceMotion) {
    return <Component className={className}>{content}</Component>;
  }

  return (
    <Component className={cn('blur-out-up-container inline-flex flex-wrap gap-x-[0.28em]', className)}>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={{
            opacity: 0,
            filter: 'blur(12px)',
            y: 18,
          }}
          animate={{
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
          }}
          transition={{
            duration,
            delay: delay + index * wordStagger,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="blur-out-up-word inline-block"
        >
          {word}
        </motion.span>
      ))}
    </Component>
  );
}

export default BlurOutUp;
