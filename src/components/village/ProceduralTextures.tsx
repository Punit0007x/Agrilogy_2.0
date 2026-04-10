import { useMemo } from 'react';
import * as THREE from 'three';

const TEX_SIZE = 512;

function createCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

// Simple seeded pseudo-random for deterministic textures
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function useGrassTexture() {
  return useMemo(() => createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    // Rich multi-layer grass
    const baseGrad = ctx.createLinearGradient(0, 0, w, h);
    baseGrad.addColorStop(0, '#3d7a2a');
    baseGrad.addColorStop(0.3, '#4a8c35');
    baseGrad.addColorStop(0.6, '#3a7028');
    baseGrad.addColorStop(1, '#4e9638');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, w, h);

    const rng = seededRandom(42);

    // Large organic patches for terrain variation
    for (let i = 0; i < 400; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const r = 15 + rng() * 100;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      const colors = ['#356b22', '#4a8c35', '#5ba040', '#2d5e1a', '#68b048', '#3a6e28'];
      const c = colors[Math.floor(rng() * colors.length)];
      grad.addColorStop(0, c + '55');
      grad.addColorStop(0.6, c + '22');
      grad.addColorStop(1, c + '00');
      ctx.fillStyle = grad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // Fine detail grass blade strokes
    for (let i = 0; i < 15000; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const g = 50 + Math.floor(rng() * 100);
      const alpha = 0.3 + rng() * 0.4;
      ctx.fillStyle = `rgba(${20 + Math.floor(rng() * 30)}, ${g}, ${15 + Math.floor(rng() * 20)}, ${alpha})`;
      const bw = rng() > 0.5 ? 1 : 2;
      const bh = 2 + rng() * 6;
      ctx.fillRect(x, y, bw, bh);
    }

    // Subtle dark patches for depth
    for (let i = 0; i < 80; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const r = 30 + rng() * 50;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(15, 40, 10, 0.25)');
      grad.addColorStop(1, 'rgba(15, 40, 10, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }), []);
}

export function useDirtTexture() {
  return useMemo(() => createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    // Rich earthy base
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#6a5038');
    grad.addColorStop(0.5, '#7c5f45');
    grad.addColorStop(1, '#5e4430');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const rng = seededRandom(99);

    // Large dirt variations
    for (let i = 0; i < 200; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const r = 15 + rng() * 60;
      const grad2 = ctx.createRadialGradient(x, y, 0, x, y, r);
      const c = rng() > 0.5 ? '#5a4030' : '#8a7050';
      grad2.addColorStop(0, c + '55');
      grad2.addColorStop(1, c + '00');
      ctx.fillStyle = grad2;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // Tire/cart tracks
    ctx.strokeStyle = 'rgba(50, 35, 20, 0.3)';
    ctx.lineWidth = 3;
    for (let track = 0; track < 3; track++) {
      const baseY = (h / 4) + track * (h / 3);
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      for (let x = 0; x < w; x += 10) {
        ctx.lineTo(x, baseY + Math.sin(x * 0.03) * 8 + (rng() - 0.5) * 4);
      }
      ctx.stroke();
    }

    // Pebbles and rocks
    for (let i = 0; i < 6000; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const b = 55 + Math.floor(rng() * 45);
      ctx.fillStyle = `rgba(${b + 15}, ${b}, ${b - 15}, 0.5)`;
      ctx.fillRect(x, y, 1 + rng() * 2, 1 + rng() * 2);
    }
  }), []);
}

export function useCropTexture() {
  return useMemo(() => createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(0, 0, w, h);

    // Deep plowing stripes with furrow detail
    for (let x = 0; x < w; x += 28) {
      // Dark trench
      ctx.fillStyle = 'rgba(25, 12, 5, 0.7)';
      ctx.fillRect(x, 0, 12, h);

      // Ridge highlights
      ctx.fillStyle = 'rgba(90, 65, 35, 0.5)';
      ctx.fillRect(x + 12, 0, 16, h);

      // Ridge noise
      const rng = seededRandom(x);
      for (let y = 0; y < h; y += 6) {
        if (rng() > 0.4) {
          ctx.fillStyle = `rgba(${40 + Math.floor(rng() * 20)}, ${25 + Math.floor(rng() * 15)}, ${10 + Math.floor(rng() * 10)}, 0.6)`;
          ctx.fillRect(x + 12 + rng() * 10, y, 3 + rng() * 4, 4 + rng() * 4);
        }
      }
    }
  }), []);
}

export function useSoilTexture() {
  return useMemo(() => createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#5c4033');
    grad.addColorStop(0.5, '#4a3219');
    grad.addColorStop(1, '#5c4033');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const rng = seededRandom(77);
    for (let i = 0; i < 10000; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const b = 20 + Math.floor(rng() * 40);
      ctx.fillStyle = `rgba(${50 + rng() * 30}, ${b + 10}, ${b}, 0.35)`;
      ctx.fillRect(x, y, 1 + rng() * 3, 1 + rng() * 3);
    }

    // Pebbles
    for (let i = 0; i < 3000; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const shade = 90 + rng() * 110;
      const radius = 0.5 + rng() * 2.5;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.arc(x + 1, y + 1, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.85)`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(30, 20, 10, 0.35)';
    ctx.lineWidth = 2;
    for (let y = 0; y < h; y += 10) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.random() * 3);
      for (let x = 0; x < w; x += 12) {
        ctx.lineTo(x, y + Math.random() * 5);
      }
      ctx.stroke();
    }
  }), []);
}

export function useWallTexture() {
  return useMemo(() => createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    // Adobe/mud wall look
    ctx.fillStyle = '#c4993a';
    ctx.fillRect(0, 0, w, h);

    const rng = seededRandom(55);

    // Large tonal patches
    for (let i = 0; i < 150; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const r = 20 + rng() * 80;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      const c = rng() > 0.5 ? '#b88830' : '#d4a845';
      grad.addColorStop(0, c + '44');
      grad.addColorStop(1, c + '00');
      ctx.fillStyle = grad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // Fine grain
    for (let i = 0; i < 4000; i++) {
      const x = rng() * w;
      const y = rng() * h;
      ctx.fillStyle = `rgba(${140 + Math.floor(rng() * 60)}, ${95 + Math.floor(rng() * 55)}, ${25 + Math.floor(rng() * 35)}, 0.2)`;
      ctx.fillRect(x, y, 1 + rng() * 3, 1 + rng() * 3);
    }

    // Crack lines for weathered look
    ctx.strokeStyle = 'rgba(80, 55, 20, 0.15)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      let cx = rng() * w;
      let cy = rng() * h;
      ctx.moveTo(cx, cy);
      for (let j = 0; j < 5 + rng() * 10; j++) {
        cx += (rng() - 0.5) * 30;
        cy += rng() * 20;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
  }), []);
}

export function useRoofTexture() {
  return useMemo(() => createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    // Thatched roof - straw appearance
    ctx.fillStyle = '#8B5020';
    ctx.fillRect(0, 0, w, h);

    const rng = seededRandom(33);

    // Straw bundles
    for (let y = 0; y < h; y += 4) {
      ctx.strokeStyle = `rgba(${110 + Math.floor(rng() * 40)}, ${70 + Math.floor(rng() * 35)}, ${25 + Math.floor(rng() * 25)}, 0.5)`;
      ctx.lineWidth = 0.8 + rng() * 1.2;
      ctx.beginPath();
      for (let x = 0; x < w; x += 3) {
        ctx.moveTo(x, y + rng() * 2);
        ctx.lineTo(x + 2 + rng() * 3, y + 1 + rng() * 3);
      }
      ctx.stroke();
    }

    // Cross-hatching for depth
    ctx.globalAlpha = 0.2;
    for (let x = 0; x < w; x += 8) {
      ctx.strokeStyle = `rgba(60, 35, 15, 0.3)`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + h * 0.3, h);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }), []);
}

export function useStoneTexture() {
  return useMemo(() => createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    ctx.fillStyle = '#858585';
    ctx.fillRect(0, 0, w, h);

    const rng = seededRandom(22);

    // Stone blocks with mortar lines
    for (let row = 0; row < h; row += 24) {
      const offset = (Math.floor(row / 24) % 2) * 18;
      for (let col = 0; col < w; col += 36) {
        const x = col + offset;
        const shade = 110 + Math.floor(rng() * 55);
        const r = shade + Math.floor(rng() * 8);
        const g = shade + Math.floor(rng() * 5);
        const b = shade + Math.floor(rng() * 3);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x + 1, row + 1, 34, 22);

        // Stone grain
        for (let k = 0; k < 8; k++) {
          ctx.fillStyle = `rgba(${shade - 20}, ${shade - 15}, ${shade - 10}, 0.2)`;
          ctx.fillRect(x + 2 + rng() * 30, row + 2 + rng() * 18, 2 + rng() * 4, 1 + rng() * 3);
        }
      }
    }

    // Mortar lines
    ctx.strokeStyle = 'rgba(60, 60, 55, 0.4)';
    ctx.lineWidth = 1.5;
    for (let row = 0; row < h; row += 24) {
      ctx.beginPath();
      ctx.moveTo(0, row);
      ctx.lineTo(w, row);
      ctx.stroke();
    }
  }), []);
}

export function useWoodTexture() {
  return useMemo(() => createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    ctx.fillStyle = '#8B6820';
    ctx.fillRect(0, 0, w, h);

    const rng = seededRandom(11);

    // Wood grain lines
    ctx.lineWidth = 0.6;
    for (let y = 0; y < h; y += 2) {
      const waveAmp = 2 + rng() * 4;
      const waveFreq = 0.015 + rng() * 0.01;
      const shade = 80 + Math.floor(rng() * 40);
      ctx.strokeStyle = `rgba(${shade + 20}, ${shade}, ${shade - 20}, 0.3)`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < w; x += 5) {
        ctx.lineTo(x, y + Math.sin(x * waveFreq + y * 0.008) * waveAmp);
      }
      ctx.stroke();
    }

    // Knot holes
    for (let i = 0; i < 4; i++) {
      const kx = 50 + rng() * (w - 100);
      const ky = 50 + rng() * (h - 100);
      const kr = 6 + rng() * 12;
      const grad = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr);
      grad.addColorStop(0, '#4a3510');
      grad.addColorStop(0.6, '#6a5020');
      grad.addColorStop(1, '#8B682000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(kx, ky, kr, kr * 0.7, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }), []);
}

export function useWaterTexture() {
  return useMemo(() => createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#023e8a');
    grad.addColorStop(0.3, '#0077b6');
    grad.addColorStop(0.5, '#0096c7');
    grad.addColorStop(0.7, '#48cae4');
    grad.addColorStop(1, '#023e8a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Caustic-like light patterns
    const rng = seededRandom(88);
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 60; i++) {
      const cx = rng() * w;
      const cy = rng() * h;
      const rx = 12 + rng() * 35;
      const ry = 3 + rng() * 10;
      ctx.strokeStyle = `rgba(180, 230, 255, ${0.2 + rng() * 0.3})`;
      ctx.lineWidth = 0.5 + rng();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, rng() * Math.PI, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Foam streaks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      let sx = rng() * w;
      let sy = rng() * h;
      ctx.moveTo(sx, sy);
      for (let j = 0; j < 6; j++) {
        sx += 10 + rng() * 30;
        sy += (rng() - 0.5) * 8;
        ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }
  }), []);
}

// NEW: Mountain/rock texture
export function useMountainTexture() {
  return useMemo(() => createCanvasTexture(TEX_SIZE, TEX_SIZE, (ctx, w, h) => {
    // Rocky grey-brown base
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#6a6a6a');
    grad.addColorStop(0.4, '#7a7268');
    grad.addColorStop(0.7, '#5e5548');
    grad.addColorStop(1, '#4a4438');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const rng = seededRandom(66);

    // Large rocky patches
    for (let i = 0; i < 300; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const r = 10 + rng() * 60;
      const shade = 60 + Math.floor(rng() * 70);
      const grad2 = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad2.addColorStop(0, `rgba(${shade}, ${shade - 5}, ${shade - 10}, 0.4)`);
      grad2.addColorStop(1, `rgba(${shade}, ${shade - 5}, ${shade - 10}, 0)`);
      ctx.fillStyle = grad2;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // Crack lines
    ctx.strokeStyle = 'rgba(30, 28, 25, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      let cx = rng() * w;
      let cy = rng() * h;
      ctx.moveTo(cx, cy);
      for (let j = 0; j < 3 + rng() * 8; j++) {
        cx += (rng() - 0.5) * 25;
        cy += 5 + rng() * 15;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    // Fine detail noise
    for (let i = 0; i < 8000; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const s = 50 + Math.floor(rng() * 60);
      ctx.fillStyle = `rgba(${s}, ${s - 3}, ${s - 6}, 0.3)`;
      ctx.fillRect(x, y, 1 + rng() * 2, 1 + rng() * 2);
    }

    // Moss patches (green tint)
    for (let i = 0; i < 30; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const r = 8 + rng() * 25;
      const grad3 = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad3.addColorStop(0, 'rgba(45, 80, 35, 0.25)');
      grad3.addColorStop(1, 'rgba(45, 80, 35, 0)');
      ctx.fillStyle = grad3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }), []);
}
