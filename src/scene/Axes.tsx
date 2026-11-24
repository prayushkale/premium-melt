import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import {
  HALF_WINDOW,
  X_PER_POINT,
  Y_PER_RUPEE,
  Z_BACK,
  Z_FRONT,
} from '../model/constants';
import { createLabelTexture, waitForFonts, type LabelTexture } from './label';

interface AxesProps {
  centre: number;
}

interface LabelEntry {
  key: string;
  label: LabelTexture;
  position: [number, number, number];
  rotation?: [number, number, number];
}

const HEIGHT_TICKS = [100, 200, 300, 400];

export function Axes({ centre }: AxesProps) {
  const invalidate = useThree((s) => s.invalidate);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    waitForFonts().then(() => {
      if (active) {
        setFontsLoaded(true);
        invalidate();
      }
    });
    return () => {
      active = false;
    };
  }, [invalidate]);

  const halfX = HALF_WINDOW * X_PER_POINT;

  const axisLinesGeometry = useMemo(() => {
    const pts: number[] = [];
    // Terrain base perimeter
    pts.push(-halfX, 0.005, Z_FRONT, halfX, 0.005, Z_FRONT);
    pts.push(-halfX, 0.005, Z_BACK, halfX, 0.005, Z_BACK);
    pts.push(-halfX, 0.005, Z_FRONT, -halfX, 0.005, Z_BACK);
    pts.push(halfX, 0.005, Z_FRONT, halfX, 0.005, Z_BACK);

    // Strike tick marks every 200 on the front edge
    for (let offset = -HALF_WINDOW; offset <= HALF_WINDOW; offset += 200) {
      const x = offset * X_PER_POINT;
      pts.push(x, 0.005, Z_FRONT, x, 0.005, Z_FRONT + 0.25);
    }

    // Height axis pole at back-right (clear of the left sliders panel)
    const hx = halfX + 0.35;
    const topY = 400 * Y_PER_RUPEE;
    pts.push(hx, 0, Z_BACK, hx, topY, Z_BACK);
    for (const rupee of HEIGHT_TICKS) {
      const y = rupee * Y_PER_RUPEE;
      pts.push(hx - 0.14, y, Z_BACK, hx + 0.22, y, Z_BACK);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, [halfX]);

  useEffect(() => {
    return () => {
      axisLinesGeometry.dispose();
    };
  }, [axisLinesGeometry]);

  const labels = useMemo<LabelEntry[]>(() => {
    // Re-generate once fonts are ready so IBM Plex Sans Condensed is baked into canvas textures
    void fontsLoaded;
    const entries: LabelEntry[] = [];

    // Strike numbers every 200 on the front edge
    for (let offset = -HALF_WINDOW; offset <= HALF_WINDOW; offset += 200) {
      const strike = centre + offset;
      const x = offset * X_PER_POINT;
      const isMajor = strike % 1000 === 0 || offset === 0;
      entries.push({
        key: `k-${strike}`,
        label: createLabelTexture(strike.toLocaleString('en-US'), {
          fontSize: 32,
          weight: isMajor ? 600 : 400,
          color: isMajor ? '#e9e4d8' : '#8d938f',
          worldHeight: 0.46,
          paddingX: 8,
          paddingY: 4,
        }),
        position: [x, 0.04, Z_FRONT + 0.78],
        rotation: [-Math.PI / 2, 0, 0],
      });
    }

    // Large "NIFTY strikes" label centered at front
    entries.push({
      key: 'title-strikes',
      label: createLabelTexture('NIFTY strikes', {
        fontSize: 48,
        weight: 600,
        color: '#e9e4d8',
        worldHeight: 0.92,
        paddingX: 16,
        paddingY: 6,
      }),
      position: [0, 0.04, Z_FRONT + 1.95],
      rotation: [-Math.PI / 2, 0, 0],
    });

    // "Expiry" at front-left, "Now" at back-left (upright so it never foreshortens)
    entries.push({
      key: 'depth-expiry',
      label: createLabelTexture('Expiry', {
        fontSize: 38,
        weight: 500,
        color: '#8d938f',
        worldHeight: 0.62,
        paddingX: 10,
        paddingY: 4,
      }),
      position: [-halfX - 1.55, 0.04, Z_FRONT - 0.1],
      rotation: [-Math.PI / 2, 0, 0],
    });

    entries.push({
      key: 'depth-now',
      label: createLabelTexture('Now', {
        fontSize: 38,
        weight: 600,
        color: '#e9e4d8',
        worldHeight: 0.62,
        paddingX: 10,
        paddingY: 4,
      }),
      position: [-halfX - 1.35, 0.38, Z_BACK],
    });

    // Height ticks at ₹100, ₹200, ₹300, ₹400 on back-right
    for (const rupee of HEIGHT_TICKS) {
      const y = rupee * Y_PER_RUPEE;
      entries.push({
        key: `h-${rupee}`,
        label: createLabelTexture(`₹${rupee}`, {
          fontSize: 34,
          weight: 500,
          color: '#8d938f',
          worldHeight: 0.54,
          paddingX: 8,
          paddingY: 4,
        }),
        position: [halfX + 1.4, y, Z_BACK],
      });
    }

    return entries;
  }, [centre, fontsLoaded, halfX]);

  useEffect(() => {
    invalidate();
    return () => {
      for (const entry of labels) {
        entry.label.texture.dispose();
      }
    };
  }, [invalidate, labels]);

  return (
    <group name="axes">
      <lineSegments geometry={axisLinesGeometry}>
        <lineBasicMaterial color="#2b3a42" />
      </lineSegments>

      {labels.map((entry) => (
        <mesh
          key={entry.key}
          position={entry.position}
          rotation={entry.rotation}
        >
          <planeGeometry args={[entry.label.width, entry.label.height]} />
          <meshBasicMaterial
            map={entry.label.texture}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
