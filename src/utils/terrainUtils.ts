// Procedural noise for natural terrain
export function hash(x: number, z: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + z * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

export function noise2D(x: number, z: number, seed: number = 0): number {
  const i = Math.floor(x);
  const j = Math.floor(z);
  const fX = x - i;
  const fZ = z - j;

  // Smoothstep smoothing
  const u = fX * fX * (3.0 - 2.0 * fX);
  const v = fZ * fZ * (3.0 - 2.0 * fZ);

  const a = hash(i, j, seed);
  const b = hash(i + 1, j, seed);
  const c = hash(i, j + 1, seed);
  const d = hash(i + 1, j + 1, seed);

  const result = a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  return result; // 0 to 1 range
}

export function fbm(x: number, z: number, octaves: number = 4): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value += noise2D(x * frequency, z * frequency, i * 100) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value / maxValue;
}

export function getTerrainHeight(x: number, z: number): number {
  const dist = Math.sqrt(x * x + z * z);
  let height = 0;

  // Extended flat area for village
  if (dist < 200) {
    // Very subtle undulation for realism (not perfectly flat)
    height = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 0.15;
  }
  // Gentle slope transition
  else if (dist < 240) {
    const t = (dist - 200) / 40;
    const base = t * t * 3;
    height = base + fbm(x * 0.005, z * 0.005) * t * 2;
  }
  // Majestic rolling green hills beyond the village
  else {
    const angle = Math.atan2(z, x);
    const distanceFactor = dist - 240;

    // Procedural noisy hills
    const wave1 = Math.sin(angle * 6) * 18;
    const wave2 = Math.cos(angle * 14) * 10;
    const wave3 = Math.sin(angle * 3 + x * 0.008) * 22;
    const noise = fbm(x * 0.003, z * 0.003) * 15;

    const hillDetail = Math.max(0, wave1 + wave2 + wave3 + noise);

    // Hills scale up as you go further out
    height = 3 + (distanceFactor * 0.25) + (distanceFactor * hillDetail * 0.018);

    // Create an enclosing bowl at the extreme distance
    if (dist > 300) {
      const edgeDist = Math.min(dist - 300, 120);
      height += edgeDist * 0.5 + fbm(angle * 3, dist * 0.01) * edgeDist * 0.1;
    }
  }

  // --- River Trench Carving ---
  const riverCenter = Math.sin(z * 0.05) * 8 + 80;
  const distToRiver = Math.abs(x - riverCenter);

  if (distToRiver < 12 && dist > 180) {
    const trenchFactor = Math.cos((distToRiver / 12) * (Math.PI / 2));
    height = height * (1 - trenchFactor) + (-2.5) * trenchFactor;
  } else if (distToRiver < 12) {
    const trenchFactor = Math.cos((distToRiver / 12) * (Math.PI / 2));
    height = height * (1 - trenchFactor) + (-1.8) * trenchFactor;
  }

  return height;
}
