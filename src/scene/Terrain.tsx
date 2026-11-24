import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { type ThreeEvent, useThree } from '@react-three/fiber';
import {
  COLS,
  ROWS,
  X_PER_POINT,
  Y_PER_RUPEE,
  Z_BACK,
  Z_FRONT,
  type View,
} from '../model/constants';
import { fillHeights, rowFraction, snapStrike, strikeAt } from '../model/terrain';
import {
  createTerrainUniforms,
  terrainFragmentShader,
  terrainVertexShader,
} from './terrainShader';

interface TerrainProps {
  view: View;
  onSelectStrike: (strike: number) => void;
}

export function Terrain({ view, onSelectStrike }: TerrainProps) {
  const invalidate = useThree((s) => s.invalidate);
  const heightsRef = useRef<Float32Array>(new Float32Array(COLS * ROWS));

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertexCount = COLS * ROWS;
    const positions = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);

    for (let j = 0; j < ROWS; j++) {
      const frac = rowFraction(j);
      const z = Z_FRONT + (Z_BACK - Z_FRONT) * frac;
      const v = j / (ROWS - 1);
      for (let i = 0; i < COLS; i++) {
        const idx = j * COLS + i;
        const strikeOffset = strikeAt(i, 0);
        positions[idx * 3] = strikeOffset * X_PER_POINT;
        positions[idx * 3 + 1] = 0;
        positions[idx * 3 + 2] = z;
        uvs[idx * 2] = i / (COLS - 1);
        uvs[idx * 2 + 1] = v;
      }
    }

    const quadCount = (COLS - 1) * (ROWS - 1);
    const indices = new Uint32Array(quadCount * 6);
    let ptr = 0;
    for (let j = 0; j < ROWS - 1; j++) {
      for (let i = 0; i < COLS - 1; i++) {
        const a = j * COLS + i;
        const b = a + 1;
        const c = (j + 1) * COLS + i;
        const d = c + 1;
        indices[ptr++] = a;
        indices[ptr++] = b;
        indices[ptr++] = d;
        indices[ptr++] = a;
        indices[ptr++] = d;
        indices[ptr++] = c;
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    return geo;
  }, []);

  const uniforms = useMemo(
    () => createTerrainUniforms(view.spot, view.centre),
    // Memoise once; updated imperatively in the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useEffect(() => {
    const heights = heightsRef.current;
    fillHeights(heights, view);

    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    for (let idx = 0; idx < heights.length; idx++) {
      arr[idx * 3 + 1] = heights[idx] * Y_PER_RUPEE;
    }

    posAttr.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    uniforms.uSpot.value = view.spot;
    uniforms.uCentre.value = view.centre;
    invalidate();
  }, [
    geometry,
    invalidate,
    uniforms,
    view.centre,
    view.iv,
    view.minutesLeft,
    view.spot,
  ]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 4) return;
    e.stopPropagation();
    const strike = snapStrike(e.point.x, view.centre);
    onSelectStrike(strike);
  };

  return (
    <mesh
      name="premium-terrain"
      geometry={geometry}
      onClick={handleClick}
      onPointerOver={() => {
        document.body.style.cursor = 'crosshair';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={terrainVertexShader}
        fragmentShader={terrainFragmentShader}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
