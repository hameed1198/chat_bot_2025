export const SERVICE_SCENES = {
  health: {
    color: '#10b981',
    camera: { x: -0.2, y: 0.35, z: 5.2, fov: 47 },
    key: { x: 2.3, y: 3.1, z: 2.3, intensity: 1.25 },
    fill: { x: -2.5, y: -1.1, z: 2.2, intensity: 0.72 }
  },
  insurance: {
    color: '#06b6d4',
    camera: { x: 0.25, y: 0.15, z: 5.45, fov: 49 },
    key: { x: 2.6, y: 3.3, z: 2.1, intensity: 1.35 },
    fill: { x: -2.7, y: -1.3, z: 2.4, intensity: 0.8 }
  },
  appointments: {
    color: '#8b5cf6',
    camera: { x: 0.35, y: 0.25, z: 5.05, fov: 46 },
    key: { x: 2.9, y: 3.1, z: 2, intensity: 1.4 },
    fill: { x: -2.3, y: -1.4, z: 2.3, intensity: 0.82 }
  },
  general: {
    color: '#f59e0b',
    camera: { x: -0.05, y: 0.3, z: 5.35, fov: 48 },
    key: { x: 2.35, y: 3.25, z: 2.15, intensity: 1.3 },
    fill: { x: -2.45, y: -1.15, z: 2.15, intensity: 0.75 }
  },
  emergency: {
    color: '#ef4444',
    camera: { x: 0.45, y: 0.1, z: 4.85, fov: 45 },
    key: { x: 3.1, y: 3.5, z: 1.8, intensity: 1.55 },
    fill: { x: -2.1, y: -1.4, z: 2, intensity: 0.9 }
  },
  chat: {
    color: '#6366f1',
    camera: { x: 0, y: 0.2, z: 5.4, fov: 48 },
    key: { x: 2.5, y: 3.2, z: 2.2, intensity: 1.35 },
    fill: { x: -2.5, y: -1.2, z: 2, intensity: 0.8 }
  }
};

export const DEFAULT_SCENE = SERVICE_SCENES.chat;

export function resolveQualityTier() {
  if (typeof window === 'undefined') {
    return 'medium';
  }

  const width = window.innerWidth;
  const deviceMemory = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;

  if (width <= 480 || deviceMemory <= 4 || cores <= 4) {
    return 'low';
  }

  if (width <= 1024 || deviceMemory <= 6 || cores <= 6) {
    return 'medium';
  }

  return 'high';
}

export function applyPerformanceMode(tier, performanceMode) {
  if (performanceMode === 'efficient') {
    return 'low';
  }

  if (performanceMode === 'balanced') {
    return tier === 'high' ? 'medium' : tier;
  }

  return tier;
}

export function qualityConfig(tier) {
  if (tier === 'low') {
    return {
      dpr: [1, 1.2],
      sphereSegments: 26,
      torusSegments: 30,
      gravity: 0.26,
      parallax: 0.085,
      cameraSmoothing: 0.045,
      fovSmoothing: 0.05
    };
  }

  if (tier === 'medium') {
    return {
      dpr: [1, 1.55],
      sphereSegments: 34,
      torusSegments: 42,
      gravity: 0.34,
      parallax: 0.12,
      cameraSmoothing: 0.048,
      fovSmoothing: 0.055
    };
  }

  return {
    dpr: [1, 1.9],
    sphereSegments: 48,
    torusSegments: 64,
    gravity: 0.4,
    parallax: 0.2,
    cameraSmoothing: 0.05,
    fovSmoothing: 0.06
  };
}
