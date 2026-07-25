import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
import { gsap } from 'gsap';
import {
  SERVICE_SCENES,
  DEFAULT_SCENE,
  resolveQualityTier,
  applyPerformanceMode,
  qualityConfig
} from '../../config/sceneConfig';

function SceneDirector({ activeService, qualityTier, performanceMode }) {
  const { camera, pointer } = useThree();
  const keyLightRef = useRef(null);
  const fillLightRef = useRef(null);
  const config = useMemo(() => qualityConfig(qualityTier), [qualityTier]);

  const cameraTargetRef = useRef({ ...DEFAULT_SCENE.camera });

  useEffect(() => {
    const scene = SERVICE_SCENES[activeService] || DEFAULT_SCENE;
    const sceneColor = new THREE.Color(scene.color);

    gsap.to(cameraTargetRef.current, {
      x: scene.camera.x,
      y: scene.camera.y,
      z: scene.camera.z,
      fov: scene.camera.fov,
      duration: performanceMode === 'efficient' ? 0.58 : performanceMode === 'balanced' ? 0.72 : 0.85,
      ease: 'power3.out'
    });

    if (keyLightRef.current) {
      gsap.to(keyLightRef.current.position, {
        x: scene.key.x,
        y: scene.key.y,
        z: scene.key.z,
        duration: performanceMode === 'efficient' ? 0.62 : performanceMode === 'balanced' ? 0.75 : 0.9,
        ease: 'power3.out'
      });
      gsap.to(keyLightRef.current, {
        intensity: scene.key.intensity,
        duration: performanceMode === 'efficient' ? 0.56 : performanceMode === 'balanced' ? 0.68 : 0.8,
        ease: 'power2.out'
      });
      gsap.to(keyLightRef.current.color, {
        r: sceneColor.r,
        g: sceneColor.g,
        b: sceneColor.b,
        duration: performanceMode === 'efficient' ? 0.62 : performanceMode === 'balanced' ? 0.75 : 0.9,
        ease: 'power2.out'
      });
    }

    if (fillLightRef.current) {
      gsap.to(fillLightRef.current.position, {
        x: scene.fill.x,
        y: scene.fill.y,
        z: scene.fill.z,
        duration: performanceMode === 'efficient' ? 0.66 : performanceMode === 'balanced' ? 0.8 : 0.95,
        ease: 'power3.out'
      });
      gsap.to(fillLightRef.current, {
        intensity: scene.fill.intensity,
        duration: performanceMode === 'efficient' ? 0.56 : performanceMode === 'balanced' ? 0.68 : 0.8,
        ease: 'power2.out'
      });
    }
  }, [activeService, performanceMode]);

  useFrame(() => {
    const cameraTarget = cameraTargetRef.current;

    camera.position.x += (cameraTarget.x + pointer.x * config.parallax - camera.position.x) * config.cameraSmoothing;
    camera.position.y += (cameraTarget.y + pointer.y * config.parallax * 0.65 - camera.position.y) * config.cameraSmoothing;
    camera.position.z += (cameraTarget.z - camera.position.z) * config.cameraSmoothing;

    if (Math.abs(camera.fov - cameraTarget.fov) > 0.03) {
      camera.fov += (cameraTarget.fov - camera.fov) * config.fovSmoothing;
      camera.updateProjectionMatrix();
    }

    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={qualityTier === 'low' ? 0.4 : 0.46} />
      <directionalLight
        ref={keyLightRef}
        color={DEFAULT_SCENE.color}
        position={[DEFAULT_SCENE.key.x, DEFAULT_SCENE.key.y, DEFAULT_SCENE.key.z]}
        intensity={DEFAULT_SCENE.key.intensity}
      />
      <pointLight
        ref={fillLightRef}
        color="#60a5fa"
        position={[DEFAULT_SCENE.fill.x, DEFAULT_SCENE.fill.y, DEFAULT_SCENE.fill.z]}
        intensity={DEFAULT_SCENE.fill.intensity}
      />
      <HeroCluster activeService={activeService} qualityTier={qualityTier} config={config} />
    </>
  );
}

function HeroCluster({ activeService, qualityTier, config }) {
  const scene = SERVICE_SCENES[activeService] || DEFAULT_SCENE;

  return (
    <Physics gravity={[0, -config.gravity, 0]} timeStep="vary">
      <RigidBody type="fixed" colliders="cuboid" position={[0, -2.2, 0]}>
        <mesh>
          <boxGeometry args={[20, 0.2, 20]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      </RigidBody>

      <RigidBody colliders="ball" restitution={0.85} friction={0.2} linearDamping={0.25} angularDamping={0.2} position={[0, 0.5, 0]}>
        <AnimatedSphere activeColor={scene.color} qualityTier={qualityTier} sphereSegments={config.sphereSegments} />
      </RigidBody>

      <RigidBody colliders="hull" restitution={0.9} friction={0.15} linearDamping={0.2} angularDamping={0.1} position={[-1.8, -0.05, -1]}>
        <AnimatedTorus qualityTier={qualityTier} torusSegments={config.torusSegments} />
      </RigidBody>

      <RigidBody colliders="ball" restitution={0.88} friction={0.18} linearDamping={0.2} angularDamping={0.12} position={[1.7, -0.2, 0.8]}>
        <AnimatedOrb qualityTier={qualityTier} sphereSegments={Math.max(18, config.sphereSegments - 12)} />
      </RigidBody>

      {qualityTier === 'high' && (
        <RigidBody colliders="ball" restitution={0.92} friction={0.2} linearDamping={0.22} angularDamping={0.16} position={[0, -0.9, -1.8]}>
          <AnimatedOrb qualityTier={qualityTier} sphereSegments={24} scale={0.72} color="#67e8f9" speedOffset={1.6} />
        </RigidBody>
      )}
    </Physics>
  );
}

function AnimatedSphere({ activeColor, qualityTier, sphereSegments }) {
  const meshRef = useRef(null);
  const materialRef = useRef(null);

  useEffect(() => {
    if (!materialRef.current) {
      return;
    }

    const target = new THREE.Color(activeColor);
    gsap.to(materialRef.current.color, {
      r: target.r,
      g: target.g,
      b: target.b,
      duration: 0.65,
      ease: 'power2.out'
    });
    gsap.to(materialRef.current.emissive, {
      r: target.r,
      g: target.g,
      b: target.b,
      duration: 0.65,
      ease: 'power2.out'
    });
  }, [activeColor]);

  useFrame((state) => {
    if (!meshRef.current) {
      return;
    }

    const speedMultiplier = qualityTier === 'low' ? 0.85 : 1;
    meshRef.current.rotation.y += 0.01 * speedMultiplier;
    meshRef.current.rotation.x += 0.005 * speedMultiplier;
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.4) * 0.12;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.8, sphereSegments, sphereSegments]} />
      <meshStandardMaterial ref={materialRef} color={activeColor} roughness={0.22} metalness={0.4} emissive={activeColor} emissiveIntensity={0.15} />
    </mesh>
  );
}

function AnimatedTorus({ qualityTier, torusSegments }) {
  const meshRef = useRef(null);

  useFrame((state) => {
    if (!meshRef.current) {
      return;
    }

    const speedMultiplier = qualityTier === 'low' ? 0.78 : 1;
    meshRef.current.rotation.y -= 0.012 * speedMultiplier;
    meshRef.current.rotation.z += 0.006 * speedMultiplier;
    meshRef.current.position.y = Math.cos(state.clock.elapsedTime * 1.2) * 0.09;
  });

  return (
    <mesh ref={meshRef} rotation={[0.7, 0, 0.35]}>
      <torusGeometry args={[0.9, 0.24, 20, torusSegments]} />
      <meshStandardMaterial color="#a5b4fc" metalness={0.82} roughness={0.2} />
    </mesh>
  );
}

function AnimatedOrb({ qualityTier, sphereSegments, scale = 1, color = '#e2e8f0', speedOffset = 1.2 }) {
  const meshRef = useRef(null);

  useFrame((state) => {
    if (!meshRef.current) {
      return;
    }

    const speedMultiplier = qualityTier === 'low' ? 0.8 : 1;
    meshRef.current.rotation.x -= 0.009 * speedMultiplier;
    meshRef.current.rotation.y += 0.008 * speedMultiplier;
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.6 + speedOffset) * 0.1;
  });

  return (
    <mesh ref={meshRef} scale={scale}>
      <sphereGeometry args={[0.52, sphereSegments, sphereSegments]} />
      <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
    </mesh>
  );
}

export default function ImmersiveHeroScene({ activeService = 'chat', performanceMode = 'balanced' }) {
  const [canRender3D, setCanRender3D] = useState(true);
  const [qualityTier, setQualityTier] = useState(() => applyPerformanceMode(resolveQualityTier(), performanceMode));
  const activeScene = useMemo(() => SERVICE_SCENES[activeService] || DEFAULT_SCENE, [activeService]);
  const config = useMemo(() => qualityConfig(qualityTier), [qualityTier]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const checkWebGLSupport = () => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch {
        return false;
      }
    };

    const updateCapability = () => {
      const hasWebGL = checkWebGLSupport();
      setCanRender3D(hasWebGL && !mediaQuery.matches);
      setQualityTier(applyPerformanceMode(resolveQualityTier(), performanceMode));
    };

    updateCapability();

    const handleResize = () => setQualityTier(applyPerformanceMode(resolveQualityTier(), performanceMode));
    window.addEventListener('resize', handleResize);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateCapability);
    } else {
      mediaQuery.addListener(updateCapability);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateCapability);
      } else {
        mediaQuery.removeListener(updateCapability);
      }
    };
  }, [performanceMode]);

  if (!canRender3D) {
    return <div className={`immersive-hero-fallback tier-${qualityTier}`} aria-hidden="true" />;
  }

  return (
    <div className={`immersive-hero tier-${qualityTier}`} aria-hidden="true">
      <Canvas camera={{ position: [DEFAULT_SCENE.camera.x, DEFAULT_SCENE.camera.y, DEFAULT_SCENE.camera.z], fov: DEFAULT_SCENE.camera.fov }} dpr={config.dpr} gl={{ antialias: qualityTier !== 'low', powerPreference: 'high-performance' }}>
        <color attach="background" args={['#0b1020']} />
        <fog attach="fog" args={['#0b1020', 4, 12]} />
        <Suspense fallback={null}>
          <SceneDirector activeService={activeService} qualityTier={qualityTier} performanceMode={performanceMode} />
        </Suspense>
      </Canvas>
      <div className="immersive-hero-overlay" style={{ '--scene-accent': activeScene.color }} />
    </div>
  );
}
