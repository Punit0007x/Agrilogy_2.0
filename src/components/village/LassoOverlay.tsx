import { useVillageStore } from '@/store/villageStore';
import { Line, Sphere } from '@react-three/drei';
import * as THREE from 'three';

export function LassoOverlay() {
  const lassoMode = useVillageStore(s => s.lassoMode);
  const lassoPoints = useVillageStore(s => s.lassoPoints);
  const cursorPosition = useVillageStore(s => s.cursorPosition);
  const buildShape = useVillageStore(s => s.buildShape);

  if (!lassoMode || buildShape === 'select') return null;

  // Render nodes
  const points = lassoPoints.map(p => new THREE.Vector3(p[0], 0.5, p[2]));
  const liveCursor = cursorPosition ? new THREE.Vector3(cursorPosition[0], 0.5, cursorPosition[2]) : null;

  let activeLines: THREE.Vector3[] = [];

  if (buildShape === 'polygon') {
    activeLines = [...points];
    if (liveCursor && points.length > 0) {
      activeLines.push(liveCursor);
    }
  } else if (buildShape === 'rectangle') {
    if (points.length === 1 && liveCursor) {
      // Draw 4 corners dynamically
      const p1 = points[0];
      const p2 = liveCursor;
      activeLines = [
        p1,
        new THREE.Vector3(p2.x, 0.5, p1.z),
        p2,
        new THREE.Vector3(p1.x, 0.5, p2.z),
        p1 // close rectangle
      ];
    } else if (points.length === 2) {
      // Box is finished drawn
      const p1 = points[0];
      const p2 = points[1];
      activeLines = [
        p1,
        new THREE.Vector3(p2.x, 0.5, p1.z),
        p2,
        new THREE.Vector3(p1.x, 0.5, p2.z),
        p1
      ];
    }
  }

  return (
    <group>
      {/* Dynamic connecting lines */}
      {activeLines.length > 1 && (
         <Line points={activeLines} color="#ffb033" lineWidth={4} dashed={buildShape === 'polygon' && !liveCursor} />
      )}
      
      {/* If polygon is finished, draw closing line if liveCursor isn't hijacking it */}
      {buildShape === 'polygon' && points.length > 2 && !liveCursor && (
        <Line points={[points[points.length - 1], points[0]]} color="#ffb033" lineWidth={4} dashed={true} />
      )}

      {/* Draw node markers */}
      {points.map((p, i) => (
        <Sphere key={`node-${i}`} position={p} args={[0.5, 16, 16]}>
          <meshBasicMaterial color="#ffb033" />
        </Sphere>
      ))}

      {/* Draw live cursor marker */}
      {liveCursor && (
        <Sphere position={liveCursor} args={[0.4, 16, 16]}>
          <meshBasicMaterial color="#fff" opacity={0.6} transparent />
        </Sphere>
      )}
    </group>
  );
}
