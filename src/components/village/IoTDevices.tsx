import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useIsMobile } from '@/hooks/use-mobile';

export function IoTStation({ position }: { position: [number, number, number] }) {
  // A small solar-powered probe with spinning anemometer
  const rotorRef = useRef<THREE.Group>(null);
  const isMobile = useIsMobile();
  
  useFrame(({ clock }) => {
    if (isMobile || !rotorRef.current) return; // DISABLE on mobile
      rotorRef.current.rotation.y = clock.getElapsedTime() * 4;
  });

  return (
    <group position={position}>
      {/* Tripod base */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 4]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Main device body */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.3, 0.4, 0.3]} />
        <meshStandardMaterial color="#eee" />
      </mesh>
      {/* Small solar panel */}
      <mesh position={[0, 1.15, 0]} rotation={[-0.4, 0, 0]} castShadow>
        <boxGeometry args={[0.5, 0.05, 0.4]} />
        <meshStandardMaterial color="#002266" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Spinning anemometer (wind sensor) */}
      <group ref={rotorRef} position={[0.2, 1.2, 0]}>
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
           <cylinderGeometry args={[0.02, 0.02, 0.4]} />
           <meshStandardMaterial color="#666" />
        </mesh>
        {[0, Math.PI * 2 / 3, Math.PI * 4 / 3].map((angle, i) => (
           <mesh key={i} position={[Math.cos(angle) * 0.2, 0, Math.sin(angle) * 0.2]}>
              <sphereGeometry args={[0.06, 8, 8, 0, Math.PI]} />
              <meshStandardMaterial color="#ff4444" />
           </mesh>
        ))}
      </group>
    </group>
  );
}

export function ScrutinyCamera({ position }: { position: [number, number, number] }) {
  // A sleek 360 camera post with a blinking LED
  const ledRef = useRef<THREE.MeshBasicMaterial>(null);
  const isMobile = useIsMobile();

  useFrame(({ clock }) => {
    if (isMobile || !ledRef.current) return; // DISABLE on mobile
      ledRef.current.opacity = Math.sin(clock.getElapsedTime() * 8) > 0 ? 1 : 0.2;
  });

  return (
    <group position={position}>
      {/* Tall sleek post */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 3, 8]} />
        <meshStandardMaterial color="#444" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Rotating Head */}
      <mesh position={[0, 3.1, 0]} castShadow>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshStandardMaterial color="#222" metalness={0.8} />
      </mesh>
      {/* Lens */}
      <mesh position={[0, 3.1, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.1]} />
        <meshStandardMaterial color="#000" emissive="#1a1a1a" />
      </mesh>
      {/* Blinking Status LED */}
      <mesh position={[0.1, 3.25, 0.15]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial ref={ledRef} color="#ff0000" transparent />
      </mesh>
    </group>
  );
}

export function WeatherStation({ position }: { position: [number, number, number] }) {
  // Advanced central weather station
  return (
    <group position={position}>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 4, 8]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[0, 4.2, 0]}>
        <boxGeometry args={[0.8, 0.4, 0.8]} />
        <meshStandardMaterial color="#ffcc00" />
      </mesh>
      <IoTStation position={[0, 0, 0]} />
      <mesh position={[0, 3, 0]} rotation={[0, Math.PI/4, 0]}>
        <boxGeometry args={[0.6, 0.05, 0.6]} />
        <meshStandardMaterial color="#3b6ab5" metalness={0.9} />
      </mesh>
    </group>
  );
}

export function SmartGateController({ position }: { position: [number, number, number] }) {
  // A modern touchpad/security pillar for the gate
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.2, 1.2, 0.3]} />
        <meshStandardMaterial color="#111" metalness={1} roughness={0} />
      </mesh>
      <mesh position={[0, 1, 0.16]}>
        <planeGeometry args={[0.15, 0.2]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}
