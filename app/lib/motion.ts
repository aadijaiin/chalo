import { Easing, FadeIn, FadeInDown, Keyframe, SlideInDown, SlideOutDown } from 'react-native-reanimated';

// One motion language for the app: quick, eased, no overshoot. Things settle into
// place rather than bounce; springs are kept for direct touch feedback only.

/** Decelerating curve (easeOutQuint): fast start, gentle stop. */
export const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN = Easing.bezier(0.4, 0, 1, 1);

export const motion = {
  /** Bottom sheets and dialogs. */
  sheetIn: SlideInDown.duration(320).easing(EASE_OUT),
  sheetOut: SlideOutDown.duration(200).easing(EASE_IN),

  /** Small elements appearing in place: fade up from slightly smaller. */
  settle: (delay = 0) =>
    new Keyframe({
      0: { opacity: 0, transform: [{ scale: 0.92 }] },
      100: { opacity: 1, transform: [{ scale: 1 }], easing: EASE_OUT },
    })
      .duration(220)
      .delay(delay),

  /** Cards and sections entering a screen. */
  rise: (delay = 0) => FadeInDown.duration(320).delay(delay).easing(EASE_OUT),

  fade: (delay = 0) => FadeIn.duration(200).delay(delay),
};
