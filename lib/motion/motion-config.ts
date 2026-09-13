export const PRECISION_EASING = [0.16, 1, 0.3, 1] as const;

export const MOTION_DURATIONS = {
  MICRO: 0.16,       // 160ms - buttons, toggles, hover, tooltips, copy/save
  STATE: 0.28,       // 280ms - scores, bars, status changes, cards
  EXPLANATORY: 0.45, // 450ms - resource propagation, memory/offload, stress simulation
} as const;

export const precisionTransition = {
  duration: MOTION_DURATIONS.STATE,
  ease: PRECISION_EASING,
};

export const microTransition = {
  duration: MOTION_DURATIONS.MICRO,
  ease: PRECISION_EASING,
};

export const explanatoryTransition = {
  duration: MOTION_DURATIONS.EXPLANATORY,
  ease: PRECISION_EASING,
};
