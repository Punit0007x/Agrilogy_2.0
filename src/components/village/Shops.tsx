import React, { useMemo, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useVillageStore } from '@/store/villageStore';
import { getTerrainHeight } from '@/utils/terrainUtils';
import { useWoodTexture, useWallTexture, useRoofTexture } from './ProceduralTextures';

const _tempColor = new THREE.Color();
const _eqSignOff = new THREE.Color('#d98014');
const _eqSignOn = new THREE.Color('#ffaa00');
const _fertAwningOff = new THREE.Color('#44b55c');
const _fertAwningOn = new THREE.Color('#ffaa44');
const _fertSignOff = new THREE.Color('#1a6e34');
const _fertSignOn = new THREE.Color('#ffcc44');

// --- Animated Glassmorphism Price Menu ---
function ShopPriceMenu({ items, title, onClose }: { items: {name: string, price: string, image?: string, emoji?: string, action?: string}[], title: string, onClose: () => void }) {
  return (
    <Html position={[0, 6.5, 0]} center zIndexRange={[100, 0]}>
      <div 
        className="bg-[#0a0a0d]/85 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 min-w-[340px] text-white shadow-[0_24px_64px_rgba(0,0,0,0.8)] relative transition-all duration-300"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors cursor-pointer bg-white/5 hover:bg-white/10 rounded-full p-1.5"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <h3 className="text-2xl font-bold mb-6 text-[#8bd0f0] border-b border-white/10 pb-3 tracking-wide">{title}</h3>
        <ul className="space-y-3">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-center gap-4 text-sm bg-white/[0.03] p-3 rounded-xl border border-white/5 hover:bg-white-[0.08] hover:border-white/20 transition-all cursor-pointer group shadow-sm hover:shadow-xl">
              {item.image ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-white flex-shrink-0 border border-white/10 shadow-inner p-1">
                   <img src={item.image} alt={item.name} className="w-full h-full object-contain rounded" />
                </div>
              ) : item.emoji ? (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center flex-shrink-0 text-3xl shadow-inner border border-white/10">
                   {item.emoji}
                </div>
              ) : null}
              <div className="flex-1">
                 <h4 className="text-gray-100 font-semibold text-[15px] group-hover:text-white transition-colors">{item.name}</h4>
                 <p className="font-mono font-bold text-[#4ade80] text-lg mt-0.5">{item.price}</p>
              </div>
              <div className="px-3 py-1.5 bg-[#8bd0f0]/10 text-[#8bd0f0] group-hover:bg-[#8bd0f0] group-hover:text-black transition-colors rounded-lg font-bold text-xs uppercase tracking-wider">
                {item.action || 'PURCHASE'}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Html>
  );
}

// --- Procedural Tractor ---
function Tractor({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  // A chunky tractor made of primitive shapes
  // Colors: bright red/orange body, black tires, white details
  return (
    <group position={position} rotation={rotation}>
      {/* Back massive tires */}
      <mesh position={[-0.9, 0.8, -1]} castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.8, 0.8, 0.4, 12]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>
      <mesh position={[0.9, 0.8, -1]} castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.8, 0.8, 0.4, 12]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>
      
      {/* Front smaller tires */}
      <mesh position={[-0.6, 0.5, 1]} castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 12]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>
      <mesh position={[0.6, 0.5, 1]} castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 12]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>
      
      {/* Main body (Engine + Chassis) */}
      <mesh position={[0, 0.8, 0.2]} castShadow>
        <boxGeometry args={[0.8, 0.6, 2.2]} />
        <meshStandardMaterial color="#d12c1f" roughness={0.6} />
      </mesh>
      
      {/* Front Engine grill */}
      <mesh position={[0, 0.8, 1.31]} castShadow>
        <boxGeometry args={[0.6, 0.4, 0.1]} />
        <meshStandardMaterial color="#333" roughness={0.8} />
      </mesh>
      
      {/* Cabin/Seat area */}
      <mesh position={[0, 1.4, -0.8]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#d12c1f" roughness={0.6} />
      </mesh>
      {/* Cabin Roof */}
      <mesh position={[0, 2.0, -0.8]} castShadow>
        <boxGeometry args={[1.2, 0.1, 1.2]} />
        <meshStandardMaterial color="#eeeeee" roughness={0.4} />
      </mesh>
      
      {/* Smoke Pipe */}
      <mesh position={[0.3, 1.5, 0.8]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
        <meshStandardMaterial color="#444" roughness={0.8} />
      </mesh>
    </group>
  );
}

// --- Procedural Truck ---
function Truck({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  // A flatbed truck
  return (
    <group position={position} rotation={rotation}>
      {/* Tires */}
      <mesh position={[-0.8, 0.4, -1.2]} castShadow rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[0.4, 0.4, 0.3, 12]}/><meshStandardMaterial color="#222" roughness={0.9}/></mesh>
      <mesh position={[0.8, 0.4, -1.2]} castShadow rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[0.4, 0.4, 0.3, 12]}/><meshStandardMaterial color="#222" roughness={0.9}/></mesh>
      <mesh position={[-0.8, 0.4, 1.2]} castShadow rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[0.4, 0.4, 0.3, 12]}/><meshStandardMaterial color="#222" roughness={0.9}/></mesh>
      <mesh position={[0.8, 0.4, 1.2]} castShadow rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[0.4, 0.4, 0.3, 12]}/><meshStandardMaterial color="#222" roughness={0.9}/></mesh>
      
      {/* Chassis/Flatbed */}
      <mesh position={[0, 0.8, -0.2]} castShadow>
        <boxGeometry args={[1.8, 0.2, 3.2]} />
        <meshStandardMaterial color="#333" roughness={0.8} />
      </mesh>
      {/* Flatbed walls */}
      <mesh position={[-0.85, 1.0, -0.2]} castShadow><boxGeometry args={[0.1, 0.4, 3.2]} /><meshStandardMaterial color="#a09d94" /></mesh>
      <mesh position={[0.85, 1.0, -0.2]} castShadow><boxGeometry args={[0.1, 0.4, 3.2]} /><meshStandardMaterial color="#a09d94" /></mesh>
      <mesh position={[0, 1.0, -1.75]} castShadow><boxGeometry args={[1.8, 0.4, 0.1]} /><meshStandardMaterial color="#a09d94" /></mesh>
      
      {/* Cabin */}
      <mesh position={[0, 1.3, 1.4]} castShadow>
        <boxGeometry args={[1.7, 1.2, 1.2]} />
        <meshStandardMaterial color="#3b6ab5" roughness={0.5} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, 1.5, 2.01]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[1.5, 0.6, 0.05]} />
        <meshStandardMaterial color="#8bd0f0" roughness={0.2} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// --- Fertilizer Bags (Stacked) ---
function FertilizerBags({ position }: { position: [number, number, number] }) {
  // A stack of white bags using arrays to build the shape
  const bags = useMemo(() => {
    const arr = [];
    for (let layer = 0; layer < 3; layer++) {
      for (let x = 0; x < 2; x++) {
        for (let z = 0; z < 2; z++) {
          arr.push({ x: x*0.6 - 0.3 + (Math.random()*0.1), y: layer*0.2 + 0.1, z: z*0.8 - 0.4 + (Math.random()*0.1) });
        }
      }
    }
    return arr;
  }, []);

  return (
    <group position={position}>
      {bags.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, b.z]} castShadow rotation={[(Math.random()-0.5)*0.1, (Math.random()-0.5)*0.2, (Math.random()-0.5)*0.1]}>
          <boxGeometry args={[0.5, 0.2, 0.7]} />
          <meshStandardMaterial color="#e8eedd" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// --- Equipment Shop ---
function EquipmentShop({ zPos, isLeft }: { zPos: number, isLeft: boolean }) {
  const wallTex = useWallTexture();
  const xDir = isLeft ? -1 : 1;
  const xStart = Math.sin(zPos * 0.05) * 12 + (16 * xDir);
  const rot = isLeft ? Math.PI/2 : -Math.PI/2;

  const store = useVillageStore();
  const y = getTerrainHeight(xStart, zPos);

  const signGeometry = useMemo(() => new THREE.BoxGeometry(3.5, 0.8, 0.1), []);

  const [isActive, setIsActive] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hovered]);

  const pricing = [
    { name: 'Deutz-Fahr Tractor', price: '₹1,500 / day', image: '/assets/tractor.png', action: 'RENT' },
    { name: 'Combine Harvester', price: '₹5,000 / day', emoji: '🌾', action: 'RENT' },
    { name: 'Industrial Plow', price: '₹800 / day', emoji: '🚜', action: 'RENT' },
    { name: 'Flatbed Truck', price: '₹2,500 / day', emoji: '🚛', action: 'RENT' }
  ];


  // Night lighting logic
  const lightsRef = useRef<THREE.Group>(null);
  const signRef = useRef<THREE.MeshStandardMaterial>(null);
  
  useFrame(() => {
    const ts = useVillageStore.getState().timeOfDay;
    let nightFactor = 0;
    if (ts < 0.25 || ts > 0.75) nightFactor = 1;
    else if (ts >= 0.25 && ts < 0.3) nightFactor = 1 - (ts - 0.25) / 0.05;
    else if (ts > 0.7 && ts <= 0.75) nightFactor = (ts - 0.7) / 0.05;

    if (lightsRef.current) {
       lightsRef.current.children.forEach((l) => {
         const pl = l as THREE.PointLight;
         if (pl.isPointLight) pl.intensity = nightFactor * 2.5;
       });
    }
    if (signRef.current) {
       signRef.current.emissiveIntensity = nightFactor * 1.5;
       signRef.current.color.copy(_eqSignOff).lerp(_eqSignOn, nightFactor);
    }
  });

  return (
    <group 
      position={[xStart, y, zPos]} 
      rotation={[0, rot, 0]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onClick={(e) => { e.stopPropagation(); setIsActive(!isActive); }}
    >
      {/* Night Lighting */}
      <group ref={lightsRef}>
        <pointLight position={[0, 4, 2]} intensity={0} color="#ffaa44" distance={12} decay={2} />
      </group>

      {hovered && !isActive && (
        <Html position={[0, 5.5, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-[#0a0a0d]/90 border border-[#8bd0f0]/30 text-[#8bd0f0] px-5 py-2.5 rounded-xl text-lg font-black shadow-[0_0_30px_rgba(139,208,240,0.3)] backdrop-blur-xl whitespace-nowrap animate-in fade-in zoom-in duration-200 tracking-widest uppercase pointing-events-none">
            🚜 Kisan Equipment
          </div>
        </Html>
      )}
      {isActive && <ShopPriceMenu title="Kisan Equipment Rentals" items={pricing} onClose={() => setIsActive(false)} />}

      {/* Concrete Base */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[8, 0.1, 7]} />
        <meshStandardMaterial color="#666" roughness={1} />
      </mesh>

      {/* Shop Building (Wider like a garage) */}
      <mesh position={[0, 1.8, -1.0]} castShadow>
        <boxGeometry args={[6, 3.6, 4]} />
        <meshStandardMaterial map={wallTex} color="#bbbbbe" />
      </mesh>
      {/* Flat Industrial Roof */}
      <mesh position={[0, 3.7, -1.0]} castShadow>
        <boxGeometry args={[6.2, 0.2, 4.2]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      {/* Large Garage Door (Open) */}
      <mesh position={[0, 1.2, 1.0]} castShadow>
        <boxGeometry args={[4, 2.4, 0.05]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      
      {/* Signage */}
      <mesh position={[0, 3.1, 1.05]} geometry={signGeometry}>
        <meshStandardMaterial 
          ref={signRef}
          color={'#d98014'} 
          emissive={'#ff5500'} 
          emissiveIntensity={0}
          metalness={0.2} 
          roughness={0.8} 
        />
      </mesh>

      {/* Vehicles parked outside */}
      <Tractor position={[1.5, 0, 2.0]} rotation={[0, Math.PI / 4, 0]} />
      <Truck position={[-2, 0, 3.0]} rotation={[0, -Math.PI / 6, 0]} />
    </group>
  );
}

// --- Fertilizer Shop ---
function FertilizerShop({ zPos, isLeft }: { zPos: number, isLeft: boolean }) {
  const wallTex = useWallTexture();
  const roofTex = useRoofTexture();
  const woodTex = useWoodTexture();
  const store = useVillageStore();

  const xDir = isLeft ? -1 : 1;
  const xStart = Math.sin(zPos * 0.05) * 12 + (12 * xDir);
  const rot = isLeft ? Math.PI/2 : -Math.PI/2;

  const y = getTerrainHeight(xStart, zPos);

  const [isActive, setIsActive] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hovered]);

  const pricing = [
    { name: 'Premium Urea (50kg)', price: '₹266', emoji: '🌱', action: 'BUY' },
    { name: 'DAP Fertilizer (50kg)', price: '₹1,350', emoji: '🧪', action: 'BUY' },
    { name: 'NPK 12:32:16 Blend', price: '₹1,470', emoji: '✨', action: 'BUY' },
    { name: 'Organic Compost', price: '₹400', emoji: '🍃', action: 'BUY' }
  ];

  // Night lighting logic
  const lightsRef = useRef<THREE.Group>(null);
  const awningRef = useRef<THREE.MeshStandardMaterial>(null);
  const signRef = useRef<THREE.MeshStandardMaterial>(null);
  
  useFrame(() => {
    const ts = useVillageStore.getState().timeOfDay;
    let nightFactor = 0;
    if (ts < 0.25 || ts > 0.75) nightFactor = 1;
    else if (ts >= 0.25 && ts < 0.3) nightFactor = 1 - (ts - 0.25) / 0.05;
    else if (ts > 0.7 && ts <= 0.75) nightFactor = (ts - 0.7) / 0.05;

    if (lightsRef.current) {
       lightsRef.current.children.forEach((l) => {
         const pl = l as THREE.PointLight;
         if (pl.isPointLight) pl.intensity = nightFactor * 2.2;
       });
    }
    if (awningRef.current) {
       awningRef.current.emissiveIntensity = nightFactor * 0.4;
       awningRef.current.color.copy(_fertAwningOff).lerp(_fertAwningOn, nightFactor);
    }
    if (signRef.current) {
       signRef.current.emissiveIntensity = nightFactor * 1.5;
       signRef.current.color.copy(_fertSignOff).lerp(_fertSignOn, nightFactor);
    }
  });

  return (
    <group 
      position={[xStart, y, zPos]} 
      rotation={[0, rot, 0]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onClick={(e) => { e.stopPropagation(); setIsActive(!isActive); }}
    >
      {/* Night Lighting */}
      <group ref={lightsRef}>
        <pointLight position={[0, 4, 2]} intensity={0} color="#ffffaa" distance={10} decay={2} />
      </group>

      {hovered && !isActive && (
        <Html position={[0, 5.5, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-[#0a0a0d]/90 border border-[#4ade80]/30 text-[#4ade80] px-5 py-2.5 rounded-xl text-lg font-black shadow-[0_0_30px_rgba(74,222,128,0.3)] backdrop-blur-xl whitespace-nowrap animate-in fade-in zoom-in duration-200 tracking-widest uppercase pointing-events-none">
            🌱 Agri-Supply Store
          </div>
        </Html>
      )}
      {isActive && <ShopPriceMenu title="Agri-Supply Store" items={pricing} onClose={() => setIsActive(false)} />}

      {/* Concrete display base */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[5, 0.1, 5]} />
        <meshStandardMaterial color="#7a756b" roughness={1} />
      </mesh>

      {/* Shop Building */}
      <mesh position={[0, 1.4, -0.5]} castShadow>
        <boxGeometry args={[3.5, 2.8, 3]} />
        <meshStandardMaterial map={wallTex} color="#e0c79b" />
      </mesh>
      {/* Slanted Roof */}
      <mesh position={[0, 3.5, -0.5]} castShadow rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[3.5, 1.8, 4]} />
        <meshStandardMaterial map={roofTex} color="#5e804d" />
      </mesh>
      
      {/* Awning/Porch */}
      <mesh position={[0, 2.0, 1.8]} castShadow rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[3.8, 0.1, 1.8]} />
        <meshStandardMaterial ref={awningRef} color="#44b55c" emissive="#442200" emissiveIntensity={0} />
      </mesh>
      {/* Porch posts */}
      <mesh position={[-1.7, 1.0, 2.4]} castShadow><cylinderGeometry args={[0.05,0.05,2.0,6]}/><meshStandardMaterial map={woodTex}/></mesh>
      <mesh position={[1.7, 1.0, 2.4]} castShadow><cylinderGeometry args={[0.05,0.05,2.0,6]}/><meshStandardMaterial map={woodTex}/></mesh>
      
      {/* Signage */}
      <mesh position={[0, 2.5, 1.05]}>
        <boxGeometry args={[2.5, 0.6, 0.05]} />
        <meshStandardMaterial ref={signRef} color="#1a6e34" emissive="#ffaa00" emissiveIntensity={0} />
      </mesh>

      {/* Display Counter */}
      <mesh position={[0, 0.6, 1.2]} castShadow>
        <boxGeometry args={[2.5, 1, 0.6]} />
        <meshStandardMaterial map={woodTex} />
      </mesh>

      {/* Fertilizer Bags outside */}
      <FertilizerBags position={[-1.5, 0, 1.5]} />
      <FertilizerBags position={[1.5, 0, 1.8]} />
      <FertilizerBags position={[1.0, 0, 2.5]} />
    </group>
  );
}

export function VillageShops() {
  // Place 2 of each shop in the gaps between the village houses
  const shopData = useMemo(() => [
    { type: 'equipment', zPos: 42, isLeft: true },
    { type: 'fertilizer', zPos: 67, isLeft: false },
    { type: 'fertilizer', zPos: 92, isLeft: true },
    { type: 'equipment', zPos: 117, isLeft: false }
  ], []);

  return (
    <group>
      {shopData.map((s, i) => {
        if (s.type === 'equipment') {
          return <EquipmentShop key={i} zPos={s.zPos} isLeft={s.isLeft} />;
        } else {
          return <FertilizerShop key={i} zPos={s.zPos} isLeft={s.isLeft} />;
        }
      })}
    </group>
  );
}
