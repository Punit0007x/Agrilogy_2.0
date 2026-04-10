import { useMemo } from 'react';
import * as THREE from 'three';
import { useGrassTexture, useMountainTexture } from './ProceduralTextures';
import { useVillageStore } from '@/store/villageStore';

import { fbm, getTerrainHeight } from '@/utils/terrainUtils';


export function Terrain() {
  const store = useVillageStore();
  const grassTex = useGrassTexture();

  const geometry = useMemo(() => {
    // Optimized segments for mobile/web performance
    const segments = 80;
    const geo = new THREE.PlaneGeometry(500, 500, segments, segments);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const h = getTerrainHeight(x, z);
      pos.setZ(i, h);

      // Height-based color variation
      const dist = Math.sqrt(x * x + z * z);
      let r, g, b;

      // Base colors
      // 1. Village green (lighter, richer)
      const n = fbm(x * 0.01, z * 0.01);
      const villageR = 0.22 + n * 0.06;
      const villageG = 0.42 + n * 0.12;
      const villageB = 0.15 + n * 0.04;

      // 2. Hills/Mountain colors (darker grass transitioning to pine green)
      let hillR, hillG, hillB;
      if (h < 8) {
        // Low hills - lush green
        hillR = 0.2 + h * 0.01;
        hillG = 0.42 + h * 0.02;
        hillB = 0.12 + h * 0.005;
      } else {
        // High terrain - deep rich mountain green (no brown/rock)
        const t = Math.min(1, (h - 8) / 40);
        hillR = 0.28 * (1 - t) + 0.18 * t;
        hillG = 0.58 * (1 - t) + 0.35 * t;
        hillB = 0.18 * (1 - t) + 0.14 * t;
      }

      if (h < -0.5) {
        // River area - dark mud (with smooth depth transition)
        const depth = Math.min(1, (-h - 0.5) / 2);
        r = 0.18 * (1 - depth) + 0.12 * depth;
        g = 0.28 * (1 - depth) + 0.18 * depth;
        b = 0.12 * (1 - depth) + 0.08 * depth;
      } else {
        // Smoothly blend the light village green and the darker hill green
        // using the distance from the center to eliminate hard cutoffs
        // Starts blending out at dist 160, completely hill color by dist = 240
        const blend = Math.max(0, Math.min(1, (dist - 160) / 80));
        
        // Use smoothstep for an even more organic natural blend
        const smoothBlend = blend * blend * (3 - 2 * blend);
        
        r = villageR * (1 - smoothBlend) + hillR * smoothBlend;
        g = villageG * (1 - smoothBlend) + hillG * smoothBlend;
        b = villageB * (1 - smoothBlend) + hillB * smoothBlend;
      }

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) * 50, uv.getY(i) * 50);
    }
    return geo;
  }, []);

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      onPointerMove={(e) => {
        if (store.lassoMode && store.buildShape !== 'select') {
          e.stopPropagation();
          store.setCursorPosition([e.point.x, 0.5, e.point.z]);
        }
      }}
      onPointerOut={() => store.setCursorPosition(null)}
      onClick={(e) => {
        if (store.lassoMode && store.buildShape !== 'select') {
          e.stopPropagation();
          if (store.buildShape === 'rectangle' && store.lassoPoints.length >= 2) {
            store.clearLasso();
            store.addLassoPoint([e.point.x, 0.5, e.point.z]);
          } else {
            store.addLassoPoint([e.point.x, 0.5, e.point.z]);
          }
        }
      }}
    >
      <meshStandardMaterial
        map={grassTex}
        vertexColors={true}
        roughness={0.85}
      />
    </mesh>
  );
}

export function Mountains() {
  // Rich procedural textures for each mountain zone
  const rockTex = useMountainTexture();
  const grassTex = useGrassTexture();

  const { innerGeo, midGeo, outerGeo } = useMemo(() => {
    // Reduced radial segments for performance
    const RAD = 80;
    const RING = 6;

    function buildRingGeometry(
      innerRadius: number,
      outerRadius: number,
      heightFn: (angle: number, t: number) => number,
      colorFn: (y: number, maxY: number, ny: number, angle: number) => [number, number, number]
    ) {
      const geo = new THREE.BufferGeometry();
      const positions: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];
      const heights: number[] = [];
      const angles: number[] = [];
      let maxY = 0;

      for (let ri = 0; ri <= RING; ri++) {
        const t = ri / RING;
        const radius = innerRadius + (outerRadius - innerRadius) * t;
        for (let ai = 0; ai <= RAD; ai++) {
          const angle = (ai / RAD) * Math.PI * 2;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const y = heightFn(angle, t);
          heights.push(x, y, z);
          angles.push(angle);
          maxY = Math.max(maxY, y);
        }
      }

      for (let i = 0; i < heights.length; i += 3) {
        positions.push(heights[i], heights[i+1], heights[i+2]);
      }
      for (let ri = 0; ri <= RING; ri++) {
        for (let ai = 0; ai <= RAD; ai++) {
          uvs.push(ai / RAD * 8, ri / RING * 4); // Large UV repeat for texture detail
        }
      }
      for (let ri = 0; ri < RING; ri++) {
        for (let ai = 0; ai < RAD; ai++) {
          const a = ri * (RAD + 1) + ai;
          const b = a + 1;
          const c = a + (RAD + 1);
          const d = c + 1;
          indices.push(a, c, b);
          indices.push(b, c, d);
        }
      }

      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();

      const norms = geo.attributes.normal;
      const colorArr: number[] = [];
      for (let i = 0; i < positions.length / 3; i++) {
        const y = positions[i * 3 + 1];
        const ny = norms.getY(i);
        const angle = angles[i] ?? 0;
        const [r, g, b] = colorFn(y, maxY, ny, angle);
        colorArr.push(r, g, b);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colorArr, 3));
      return geo;
    }

    function peakNoise(angle: number, seed: number): number {
      const a = angle;
      const n1 = Math.sin(a * 5  + seed * 0.7)  * 0.40;
      const n2 = Math.sin(a * 11 + seed * 1.3)  * 0.22;
      const n3 = Math.sin(a * 19 + seed * 2.1)  * 0.14;
      const n4 = Math.sin(a * 37 + seed * 3.7)  * 0.08;
      const n5 = Math.sin(a * 73 + seed * 5.9)  * 0.05;
      return 0.5 + n1 + n2 + n3 + n4 + n5;
    }

    function radialProfile(t: number): number {
      const peak = 0.45;
      if (t < peak) return Math.pow(t / peak, 1.4);
      return Math.pow(1 - (t - peak) / (1 - peak), 0.8);
    }

    // ── INNER RIDGE ─────────────────────────────────────────
    // 5-zone color: vibrant meadow → dark pine → earthy brown scree → grey cliff → warm rocky peak
    const innerGeo = buildRingGeometry(
      195, 320,
      (angle, t) => {
        const h = peakNoise(angle, 1.0);
        return Math.max(0, radialProfile(t) * (75 + h * 40));
      },
      (y, maxY, ny, angle) => {
        const hn = y / maxY;
        // Micro-variation using angle for non-uniform look
        const micro = Math.sin(angle * 31) * 0.03 + Math.cos(angle * 17) * 0.02;
        const steepness = Math.max(0, 1.0 - ny);
        const slopeDark = 1.0 - steepness * 0.45;

        if (hn > 0.88) {
          // ⛰️ Warm golden/tan rocky peak tips — sun-baked stone
          const t2 = (hn - 0.88) / 0.12;
          return [0.58 + t2 * 0.10 + micro, 0.52 + t2 * 0.08, 0.40 + t2 * 0.05];
        } else if (hn > 0.72) {
          // 🪨 Grey-purple rocky cliff face — slate/granite
          const t2 = (hn - 0.72) / 0.16;
          const slate = 0.40 + t2 * 0.18 + micro;
          return [slate * 0.90, slate * 0.88, slate * 0.95]; // slight cool blue cast
        } else if (hn > 0.52) {
          // 🟤 Earthy brown scree / loose dirt belt
          const t2 = (hn - 0.52) / 0.20;
          return [(0.38 + t2 * 0.12 + micro) * slopeDark,
                  (0.28 + t2 * 0.08) * slopeDark,
                  (0.14 + t2 * 0.04) * slopeDark];
        } else if (hn > 0.25) {
          // 🌲 Dark pine forest belt — rich deep green with natural saturation
          const t2 = (hn - 0.25) / 0.27;
          return [
            (0.08 + t2 * 0.05 + micro) * slopeDark,
            (0.30 + t2 * 0.10 + micro) * slopeDark,
            (0.07 + t2 * 0.03) * slopeDark,
          ];
        } else {
          // 🌿 Bright lush meadow base — vivid, natural grassy green
          const baseGreen = 0.44 + micro * 0.08;
          return [
            (0.16 + micro * 0.04) * slopeDark,
            baseGreen * slopeDark,
            (0.10 + micro * 0.02) * slopeDark,
          ];
        }
      }
    );

    // ── MID RIDGE ───────────────────────────────────────────
    // Desaturated, cooler: atmospheric haze starts to show
    const midGeo = buildRingGeometry(
      290, 400,
      (angle, t) => {
        const h = peakNoise(angle, 4.5);
        return Math.max(0, radialProfile(t) * (50 + h * 28));
      },
      (y, maxY, ny, angle) => {
        const hn = y / maxY;
        const micro = Math.sin(angle * 29) * 0.02;
        const steepness = Math.max(0, 1.0 - ny);
        const slopeDark = 1.0 - steepness * 0.30;

        if (hn > 0.75) {
          // Dusty olive/grey rock — slightly warm
          return [0.38 + micro, 0.36 + micro, 0.30];
        } else if (hn > 0.45) {
          // Muted forest — desaturated but still green
          return [
            (0.16 + micro * 0.03) * slopeDark,
            (0.30 + micro * 0.04) * slopeDark,
            (0.18 + micro * 0.02) * slopeDark,
          ];
        } else {
          // Atmospheric green base for mid-range slopes
          return [
            (0.20 + micro * 0.02) * slopeDark,
            (0.34 + micro * 0.03) * slopeDark,
            (0.20 + micro * 0.02) * slopeDark,
          ];
        }
      }
    );

    // ── FAR RIDGE ───────────────────────────────────────────
    // Full atmospheric haze — cool blue-grey silhouette
    const outerGeo = buildRingGeometry(
      370, 480,
      (angle, t) => {
        const h = peakNoise(angle, 9.2);
        return Math.max(0, radialProfile(t) * (35 + h * 20));
      },
      (y, maxY, _ny, angle) => {
        const hn = y / maxY;
        const micro = Math.sin(angle * 41) * 0.015;
        // Atmospheric perspective — everything shifts to cool blue-grey
        // Peaks: slightly lighter periwinkle. Base: dark blue-grey
        const r = 0.22 + hn * 0.14 + micro;
        const g = 0.28 + hn * 0.10 + micro;
        const b = 0.32 + hn * 0.18;
        return [r, g, b];
      }
    );

    return { innerGeo, midGeo, outerGeo };
  }, []);

  return (
    <group>
      {/* Inner ridge — full rich color: meadow → pine → scree → cliff → peak */}
      {/* Optimized: Inner mountains no longer cast player-blocking shadows */}
      <mesh geometry={innerGeo} receiveShadow>
        <meshStandardMaterial
          vertexColors
          map={rockTex}
          roughness={0.88}
          metalness={0.0}
        />
      </mesh>

      {/* Mid ridge — muted/desaturated with rock texture */}
      <mesh geometry={midGeo}>
        <meshStandardMaterial
          vertexColors
          map={grassTex}
          roughness={0.92}
        />
      </mesh>

      {/* Far ridge — misty blue-grey silhouette, no texture for performance */}
      <mesh geometry={outerGeo}>
        <meshStandardMaterial
          vertexColors
          roughness={1}
          metalness={0}
          fog={true}
        />
      </mesh>
    </group>
  );
}

export function CaveOpenings() {
  const caves = useMemo(() => {
    const result: { position: [number, number, number]; rotation: number; scale: number }[] = [];
    const positions: [number, number][] = [
      [240, 60], [-220, 120], [180, -200], [-260, -80], [100, 260]
    ];

    positions.forEach(([x, z], i) => {
      const angle = Math.atan2(z, x);
      result.push({
        position: [x, getTerrainHeight(x, z) + 2, z],
        rotation: angle + Math.PI, // Face toward village
        scale: 3 + Math.sin(i * 2.1) * 1.5,
      });
    });
    return result;
  }, []);

  return (
    <>
      {caves.map((cave, i) => (
        <group key={i} position={cave.position} rotation={[0, cave.rotation, 0]}>
          {/* Dark cave interior */}
          <mesh position={[0, cave.scale * 0.4, -0.5]} castShadow>
            <sphereGeometry args={[cave.scale, 8, 8, 0, Math.PI]} />
            <meshBasicMaterial color="#0a0806" side={THREE.BackSide} />
          </mesh>
          {/* Rock arch around cave */}
          <mesh position={[0, cave.scale * 0.4, 0]}>
            <torusGeometry args={[cave.scale, cave.scale * 0.35, 6, 8, Math.PI]} />
            <meshStandardMaterial color="#5a5045" roughness={1} flatShading />
          </mesh>
        </group>
      ))}
    </>
  );
}
