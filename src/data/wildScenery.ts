import { getTerrainHeight } from '@/utils/terrainUtils';

// Deterministic seed for scenery consistency
const SEED = 12345;
function seededRandom(s: number) {
  let mask = 0xffffffff;
  let m_w = (123456789 + s) & mask;
  let m_z = (987654321 - s) & mask;
  return () => {
    m_z = (36969 * (m_z & 65535) + (m_z >>> 16)) & mask;
    m_w = (18000 * (m_w & 65535) + (m_w >>> 16)) & mask;
    let result = ((m_z << 16) + m_w) & mask;
    result /= 4294967296;
    return result + 0.5;
  };
}

const rng = seededRandom(SEED);

export interface WildFarm {
  position: [number, number, number];
  size: number;
  color: string;
}

const CROP_COLORS = [
  '#2d8c2e', '#7ab648', '#c4a820', '#8b6914', '#3da86b', 
  '#6b9e30', '#d4a030', '#4e9e4e', '#a0c040', '#5c8c3e'
];

export function generateWildScenery() {
  const farms: WildFarm[] = [];
  const farmCount = 18;
  const villageRadius = 75;
  
  for (let i = 0; i < farmCount; i++) {
    let tx = 0, tz = 0;
    let valid = false;
    for (let attempt = 0; attempt < 200; attempt++) {
      tx = (rng() - 0.5) * 500;
      tz = -150 + rng() * 600;
      
      // Village Exclusion
      if (Math.abs(tx) < villageRadius && tz > -50 && tz < 300) continue;
      // River Exclusion
      const riverCenter = Math.sin(tz * 0.05) * 8 + 80;
      if (Math.abs(tx - riverCenter) < 25) continue;
      // Overlap with other wild farms
      if (farms.some(f => Math.sqrt((f.position[0] - tx)**2 + (f.position[2] - tz)**2) < 40)) continue;
      
      valid = true;
      break;
    }
    
    if (valid) {
      const size = 8 + rng() * 14;
      farms.push({
        position: [tx, getTerrainHeight(tx, tz), tz],
        size,
        color: CROP_COLORS[Math.floor(rng() * CROP_COLORS.length)]
      });
    }
  }
  
  return { farms };
}

export const wildScenery = generateWildScenery();
