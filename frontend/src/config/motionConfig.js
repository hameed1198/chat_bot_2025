export const SERVICE_CHAT_MOTION = {
  health: {
    containerStart: { x: -14, y: 14, scale: 0.985 },
    containerExit: { x: 12, y: -12 },
    itemOffsetX: -12,
    ease: [0.22, 1, 0.36, 1],
    duration: 0.34
  },
  insurance: {
    containerStart: { x: 14, y: 12, scale: 0.986 },
    containerExit: { x: -12, y: -12 },
    itemOffsetX: 10,
    ease: [0.2, 0.95, 0.18, 1],
    duration: 0.36
  },
  appointments: {
    containerStart: { x: 0, y: 18, scale: 0.982 },
    containerExit: { x: 0, y: -16 },
    itemOffsetX: 0,
    ease: [0.17, 0.84, 0.44, 1],
    duration: 0.38
  },
  general: {
    containerStart: { x: 10, y: 14, scale: 0.985 },
    containerExit: { x: -10, y: -12 },
    itemOffsetX: 6,
    ease: [0.2, 1, 0.3, 1],
    duration: 0.35
  },
  emergency: {
    containerStart: { x: 0, y: 20, scale: 0.98 },
    containerExit: { x: 0, y: -18 },
    itemOffsetX: 0,
    ease: [0.26, 1, 0.4, 1],
    duration: 0.32
  },
  chat: {
    containerStart: { x: 0, y: 16, scale: 0.985 },
    containerExit: { x: 0, y: -14 },
    itemOffsetX: 0,
    ease: [0.22, 1, 0.36, 1],
    duration: 0.34
  }
};

export const MOTION_MODE_PROFILE = {
  cinematic: {
    durationScale: 1,
    distanceScale: 1,
    staggerScale: 1,
    blurScale: 1
  },
  balanced: {
    durationScale: 0.84,
    distanceScale: 0.76,
    staggerScale: 0.82,
    blurScale: 0.6
  },
  efficient: {
    durationScale: 0.66,
    distanceScale: 0.56,
    staggerScale: 0.64,
    blurScale: 0.3
  }
};

export const MOTION_OPTIONS = [
  { key: 'auto', label: 'Auto' },
  { key: 'cinematic', label: 'Cinematic' },
  { key: 'balanced', label: 'Balanced' },
  { key: 'efficient', label: 'Efficient' }
];

export const MOTION_PREF_STORAGE_KEY = 'medicare-motion-preference';

export function detectAutoMotionMode() {
  if (typeof window === 'undefined') {
    return 'balanced';
  }

  const width = window.innerWidth;
  const memory = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion || width <= 540 || memory <= 4 || cores <= 4) {
    return 'efficient';
  }

  if (width <= 1024 || memory <= 6 || cores <= 6) {
    return 'balanced';
  }

  return 'cinematic';
}

export function getStoredMotionPreference() {
  if (typeof window === 'undefined') {
    return 'auto';
  }

  try {
    const storedPreference = window.localStorage.getItem(MOTION_PREF_STORAGE_KEY);
    const validPreference = MOTION_OPTIONS.some((option) => option.key === storedPreference);
    return validPreference ? storedPreference : 'auto';
  } catch {
    return 'auto';
  }
}
