'use client';

import {MotionConfig} from 'motion/react';

/** Every animation on the site follows the visitor's reduced-motion setting. */
export function MotionProvider({children}) {
	return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
