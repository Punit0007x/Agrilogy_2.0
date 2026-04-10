import { useEffect, useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import { MapControls } from '@react-three/drei';
import { useVillageStore } from '@/store/villageStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { getTerrainHeight } from '@/utils/terrainUtils';
import * as THREE from 'three';
import type { MapControls as MapControlsImpl } from 'three-stdlib';

const MOVE_SPEED = 30;
const MIN_CAMERA_HEIGHT = 3;

// Terrain height cache for performance
const terrainCache = new Map<string, number>();
const CACHE_GRID_SIZE = 2; // 2 unit grid

function getCachedTerrainHeight(x: number, z: number): number {
  const key = `${Math.floor(x / CACHE_GRID_SIZE)},${Math.floor(z / CACHE_GRID_SIZE)}`;
  if (terrainCache.has(key)) {
    return terrainCache.get(key)!;
  }
  const height = getTerrainHeight(x, z);
  terrainCache.set(key, height);
  return height;
}

export function CameraController() {
  const { camera } = useThree();
  const isMobile = useIsMobile();
  const introComplete = useVillageStore((s) => s.introComplete);
  const setIntroComplete = useVillageStore((s) => s.setIntroComplete);
  const cameraTarget = useVillageStore((s) => s.cameraTarget);
  const controlsRef = useRef<MapControlsImpl>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const velocityRef = useRef(new THREE.Vector3());
  const forwardRef = useRef(new THREE.Vector3());
  const rightRef = useRef(new THREE.Vector3());
  const inputRef = useRef(new THREE.Vector3());
  const frameCounterRef = useRef(0);

  const moveSpeed = isMobile ? MOVE_SPEED * 0.65 : MOVE_SPEED;

  // Key tracking
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.key.toLowerCase());
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.key.toLowerCase());
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Cinematic intro
  useEffect(() => {
    // Find the end point of the village based on farmer positions
    const state = useVillageStore.getState();
    let maxZ = 60;
    state.farmerOrder.forEach((fid) => {
      const f = state.farmers[fid];
      if (f && f.position[2] > maxZ) {
        maxZ = f.position[2];
      }
    });

    const startZ = maxZ + 25;
    const startX = Math.sin(startZ * 0.05) * 12; // align perfectly with road curve
    const startY = getTerrainHeight(startX, startZ) + 2.5 + 60; // start 60 units high

    camera.position.set(startX, startY, startZ);
    camera.lookAt(Math.sin((startZ - 20) * 0.05) * 12, getTerrainHeight(startX, startZ) + 2.5, startZ - 20);

    const tl = gsap.timeline({
      onComplete: () => setIntroComplete(true),
    });

    // Pre-calculate segments for the intro path to avoid per-frame terrain sampling
    const pathSegments = 50;
    const pathPoints: {x: number, y: number, z: number}[] = [];
    for(let i = 0; i <= pathSegments; i++) {
        const p = i / pathSegments;
        const cz = startZ + (35 - startZ) * p;
        const cx = Math.sin(cz * 0.05) * 12;
        const cy = getTerrainHeight(cx, cz);
        pathPoints.push({ x: cx, y: cy, z: cz });
    }

    const route = { z: startZ };

    tl.to(route, {
      z: 35, 
      duration: 12, 
      ease: 'power3.inOut',
      onUpdate: () => {
         const progress = 1 - (route.z - 35) / (startZ - 35);
         const idx = Math.min(pathSegments - 1, Math.floor(progress * pathSegments));
         const subProgress = (progress * pathSegments) % 1;
         const p1 = pathPoints[idx];
         const p2 = pathPoints[idx + 1] || p1;
         
         const cz = route.z;
         const cx = p1.x + (p2.x - p1.x) * subProgress;
         const baseHeight = (p1.y + (p2.y - p1.y) * subProgress) + 2.5; 
         
         let heightOffset = 0;
         if (progress < 0.2) {
             const swoopProgress = 1 - (progress / 0.2); 
             heightOffset = Math.pow(swoopProgress, 2) * 60; 
         } else if (progress > 0.75) {
             const craneProgress = (progress - 0.75) / 0.25; 
             heightOffset = Math.pow(craneProgress, 2) * 12;
         }
         
         const cy = baseHeight + heightOffset;
         camera.position.set(cx, cy, cz);
         
         const lookZ = Math.max(0, cz - 20);
         const lookX = Math.sin(lookZ * 0.05) * 12;

         if (progress > 0.4) {
            const factor = Math.min(1, (progress - 0.4) / 0.6);
            camera.lookAt(lookX * (1 - factor), 2 + 3 * factor, lookZ * (1 - factor));
         } else {
            camera.lookAt(lookX, 2.0, lookZ);
         }
      }
    });
  }, [camera, setIntroComplete]);

  // Fly-to on building/farmer select
  useEffect(() => {
    if (!cameraTarget || !introComplete) return;

    const { position, lookAt } = cameraTarget;
    const controls = controlsRef.current;

    gsap.to(camera.position, {
      x: position[0],
      y: position[1],
      z: position[2],
      duration: 1.5,
      ease: 'power3.inOut',
      onUpdate: () => {
        if (controls) controls.update();
      },
    });

    if (controls) {
      const target = controls.target as THREE.Vector3;
      gsap.to(target, {
        x: lookAt[0],
        y: lookAt[1],
        z: lookAt[2],
        duration: 1.5,
        ease: 'power3.inOut',
      });
    }
  }, [camera, cameraTarget, introComplete]);

  // WASD movement + height clamping
  useFrame((_, delta) => {
    if (!introComplete || !controlsRef.current) return;

    const keys = keysRef.current;
    const controls = controlsRef.current;
    const target = controls.target as THREE.Vector3;
    
    // Get camera forward/right vectors (projected on XZ plane)
    const forward = forwardRef.current;
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = rightRef.current;
    right.crossVectors(forward, camera.up).normalize();

    // Input
    const input = inputRef.current;
    input.set(0, 0, 0);
    if (keys.has('w') || keys.has('arrowup')) input.add(forward);
    if (keys.has('s') || keys.has('arrowdown')) input.sub(forward);
    if (keys.has('d') || keys.has('arrowright')) input.add(right);
    if (keys.has('a') || keys.has('arrowleft')) input.sub(right);
    if (keys.has('q') || keys.has(' ')) input.y += 1; // Up
    if (keys.has('e') || keys.has('shift')) input.y -= 1; // Down

    if (input.lengthSq() > 0) {
      input.normalize().multiplyScalar(moveSpeed * delta);
      
      // Smooth velocity
      velocityRef.current.lerp(input, 0.25);
    } else {
      // Decelerate
      velocityRef.current.multiplyScalar(0.92);
    }

    if (velocityRef.current.lengthSq() > 0.0001) {
      camera.position.add(velocityRef.current);
      target.add(velocityRef.current);

      // Height clamping - only check every 3 frames for performance
      frameCounterRef.current++;
      if (frameCounterRef.current >= 3) {
        frameCounterRef.current = 0;
        const terrainH = getCachedTerrainHeight(camera.position.x, camera.position.z);
        const minH = terrainH + MIN_CAMERA_HEIGHT;
        if (camera.position.y < minH) {
          camera.position.y = THREE.MathUtils.lerp(camera.position.y, minH, 0.2);
          target.y = THREE.MathUtils.lerp(target.y, minH - MIN_CAMERA_HEIGHT, 0.2);
        }
      }

      controls.update();
    }
  });

  return introComplete ? (
    <MapControls
      ref={controlsRef}
      enableDamping={true}
      dampingFactor={isMobile ? 0.15 : 0.2}
      zoomSpeed={isMobile ? 0.45 : 0.8}
      panSpeed={isMobile ? 0.7 : 1.0}
      rotateSpeed={isMobile ? 0.45 : 0.7}
      minDistance={4}
      maxDistance={isMobile ? 220 : 280}
      maxPolarAngle={Math.PI / 2.1}
      screenSpacePanning={true}
      touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
    />
  ) : null;
}
