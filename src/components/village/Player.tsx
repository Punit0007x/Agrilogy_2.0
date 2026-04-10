import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls, PointerLockControls } from '@react-three/drei';
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier';
import * as THREE from 'three';
import { useVillageStore } from '@/store/villageStore';
import gsap from 'gsap';

const SPEED = 12;
const direction = new THREE.Vector3();
const frontVector = new THREE.Vector3();
const sideVector = new THREE.Vector3();

// Define our keyboard map here since we are not putting KeyboardControls provider at the very top yet,
// we will have to wrap our App or Index with KeyboardControls.
// Actually, it's easier to just use standard DOM event listeners for WASD if we don't
// want to restructure the whole app with KeyboardControls provider.

export function Player() {
  const { camera } = useThree();
  const rigidBody = useRef<any>(null);
  const [movement, setMovement] = useState({
    forward: false, backward: false, left: false, right: false,
  });

  const selectedId = useVillageStore((s) => s.selectedFarmerId);
  const showPanchayat = useVillageStore((s) => s.showPanchayat);
  const introComplete = useVillageStore((s) => s.introComplete);
  const cameraTarget = useVillageStore((s) => s.cameraTarget);
  // Intro camera sequence controls whether we are in "cinematic" mode
  
  // Is a UI panel open? (If so, unlock the pointer and disable movement)
  const isUIOpen = !!selectedId || showPanchayat;
  // Are we allowed to move?
  const canMove = introComplete && !isUIOpen && !cameraTarget;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['KeyW', 'ArrowUp'].includes(e.code)) setMovement((m) => ({ ...m, forward: true }));
      if (['KeyS', 'ArrowDown'].includes(e.code)) setMovement((m) => ({ ...m, backward: true }));
      if (['KeyA', 'ArrowLeft'].includes(e.code)) setMovement((m) => ({ ...m, left: true }));
      if (['KeyD', 'ArrowRight'].includes(e.code)) setMovement((m) => ({ ...m, right: true }));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['KeyW', 'ArrowUp'].includes(e.code)) setMovement((m) => ({ ...m, forward: false }));
      if (['KeyS', 'ArrowDown'].includes(e.code)) setMovement((m) => ({ ...m, backward: false }));
      if (['KeyA', 'ArrowLeft'].includes(e.code)) setMovement((m) => ({ ...m, left: false }));
      if (['KeyD', 'ArrowRight'].includes(e.code)) setMovement((m) => ({ ...m, right: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state) => {
    if (!rigidBody.current || !introComplete) return;

    // Standard player follow
    if (!cameraTarget) {
      const translation = rigidBody.current.translation();
      // Smoothly move camera to player's head height
      camera.position.lerp(new THREE.Vector3(translation.x, translation.y + 0.8, translation.z), 0.2);
    }

    if (!canMove) return;

    frontVector.set(0, 0, Number(movement.backward) - Number(movement.forward));
    sideVector.set(Number(movement.left) - Number(movement.right), 0, 0);

    // Apply rotation based on camera
    direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(SPEED).applyEuler(camera.rotation);

    // Only set velocity on X and Z
    const velocity = rigidBody.current.linvel();
    rigidBody.current.setLinvel({ x: direction.x, y: velocity.y, z: direction.z }, true);
  });

  return (
    <>
      <RigidBody
        ref={rigidBody}
        colliders={false}
        mass={1}
        type="dynamic"
        position={[0, 5, 20]}
        enabledRotations={[false, false, false]}
        canSleep={false}
      >
        <CapsuleCollider args={[0.5, 0.4]} />
      </RigidBody>

      {introComplete && !isUIOpen && !cameraTarget && (
        <PointerLockControls />
      )}
    </>
  );
}
