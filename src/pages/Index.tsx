import { Canvas, useThree } from '@react-three/fiber';
import { FogExp2 } from 'three';
import * as THREE from 'three';
import { useVillageStore } from '@/store/villageStore';
import { useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useIsMobile } from '@/hooks/use-mobile';
import { Terrain, Mountains } from '@/components/village/Terrain';
import { getTerrainHeight } from '@/utils/terrainUtils';
import { VillageStructures } from '@/components/village/VillageStructures';
import { VillageShops } from '@/components/village/Shops';
import { Trees } from '@/components/village/NatureElements';
import GramPanchayat from '@/components/village/GramPanchayat';
import { VillageSchool } from '@/components/village/VillageSchool';
import { Lighting, Sky, AutoDayNightCycle } from '@/components/village/Environment';
import { CameraController } from '@/components/village/CameraController';
import { FarmPanel, PanchayatPanel, SchoolPanel } from '@/components/ui/VillagePanels';
import { CinematicOverlay, HUD } from '@/components/ui/Overlays';
import { Bvh, AdaptiveDpr, AdaptiveEvents, Preload } from '@react-three/drei';
import { WaterSystem, VillagePonds } from '@/components/village/WaterSystem';
import { LassoOverlay } from '@/components/village/LassoOverlay';
import { SoundSystem } from '@/components/village/SoundSystem';

// Pre-allocate color objects for fog to avoid per-frame garbage collection
const _nightFogColor = new THREE.Color('#144014');
const _dayFogColor = new THREE.Color('#388e3c');

// Dynamic Fog Controller - Synchronizes HUD slider with the 3D scene
function DynamicFogController() {
  const fogDensity = useVillageStore((s) => s.fogDensity);
  const { scene } = useThree();

  useEffect(() => {
    if (!scene.fog) {
      scene.fog = new FogExp2('#4a8b4a', 0.002);
    }
  }, [scene]);

  useFrame(({ gl }) => {
    if (!scene.fog) return;
    const timeOfDay = useVillageStore.getState().timeOfDay;
    const fog = scene.fog as FogExp2;
    
    // Automatic density logic for "good looking" atmospheric depth
    const sunAngle = (timeOfDay * 2 - 0.5) * Math.PI;
    const sunY = Math.sin(sunAngle);
    const nightFactor = sunY < 0.1 ? (sunY < -0.1 ? 1 : (0.1 - sunY) / 0.2) : 0;
    
    // Adjust Exposure/Contrast at night/moonrise
    // Day: ~1.1, Night: ~0.7 (More contrast)
    const targetExposure = 1.1 - nightFactor * 0.45;
    gl.toneMappingExposure = THREE.MathUtils.lerp(gl.toneMappingExposure, targetExposure, 0.05);

    // Morning mist effect: Thickest at dawn/morning, clears up at noon
    let autoDensity = 0.003; 
    if (timeOfDay > 0.22 && timeOfDay < 0.35) {
      autoDensity = 0.007; // Very thick morning green mist
    } else if (timeOfDay >= 0.35 && timeOfDay <= 0.65) {
      autoDensity = 0.0035; // Noticeable lush green haze
    } else if (nightFactor > 0.8) {
      autoDensity = 0.002; // Subtle deep green night
    }

    // Smoothly transition density over time
    fog.density = THREE.MathUtils.lerp(fog.density, autoDensity, 0.015);
    
    if (nightFactor > 0.5) {
      fog.color.lerp(_nightFogColor, 0.05);
    } else {
      fog.color.lerp(_dayFogColor, 0.05);
    }
  });

  return null;
}

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className="w-screen h-screen bg-background" style={{ touchAction: 'none', WebkitTapHighlightColor: 'transparent' }}>
      <Canvas
        shadows={false}
        dpr={isMobile ? [0.35, 0.8] : [0.5, 1.0]}
        performance={{ min: 0.1, max: isMobile ? 0.7 : 1.2, debounce: 100 }}
        camera={{ fov: 55, near: 0.1, far: 600, position: [80, 40, 80] }}
        gl={{
          antialias: false,
          powerPreference: isMobile ? 'low-power' : 'high-performance',
          toneMapping: 3,
          toneMappingExposure: 1.1,
          stencil: false,
        }}
      >
        <Bvh firstHitOnly>
          <DynamicFogController />
          <AutoDayNightCycle />
          <Sky />
          <Lighting />
          <CameraController />
          <Terrain />
          <Mountains />
          <WaterSystem />
          <VillagePonds />
          <VillageStructures />
          <VillageShops />
          <Trees />
          <GramPanchayat position={[(Math.sin(-20 * 0.05) * 12) - 5, getTerrainHeight((Math.sin(-20 * 0.05) * 12) - 5, -20), -20]} rotation={[0, 0, 0]} />
          <VillageSchool position={[22, 0, 15]} />
          <LassoOverlay />
          <SoundSystem />
        </Bvh>
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        <Preload all />
      </Canvas>
      <CinematicOverlay />
      <HUD />
      <FarmPanel />
      <PanchayatPanel />
      <SchoolPanel />
    </div>
  );
};

export default Index;
