import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import {
  COLS,
  WEEK_MIN,
  X_PER_POINT,
  Y_PER_RUPEE,
  Z_BACK,
  type View,
} from '../model/constants';
import { otmPremium } from '../model/pricing';
import { strikeAt } from '../model/terrain';

interface GhostLineProps {
  view: View;
}

export function GhostLine({ view }: GhostLineProps) {
  const invalidate = useThree((s) => s.invalidate);

  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(COLS * 3);
    for (let i = 0; i < COLS; i++) {
      positions[i * 3] = strikeAt(i, 0) * X_PER_POINT;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Z_BACK;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: '#ff9a3c',
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    return new THREE.Line(geo, mat);
  }, []);

  useEffect(() => {
    return () => {
      lineObj.geometry.dispose();
      (lineObj.material as THREE.Material).dispose();
    };
  }, [lineObj]);

  useEffect(() => {
    const vol = view.iv / 100;
    const posAttr = lineObj.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < COLS; i++) {
      const K = strikeAt(i, view.centre);
      const prem = otmPremium(view.spot, K, vol, WEEK_MIN);
      arr[i * 3 + 1] = prem * Y_PER_RUPEE + 0.04;
    }
    posAttr.needsUpdate = true;
    lineObj.geometry.computeBoundingSphere();

    const meltedRatio = 1 - view.minutesLeft / WEEK_MIN;
    const mat = lineObj.material as THREE.LineBasicMaterial;
    mat.opacity = meltedRatio < 0.01 ? 0.14 : 0.35 + 0.35 * meltedRatio;
    invalidate();
  }, [invalidate, lineObj, view.centre, view.iv, view.minutesLeft, view.spot]);

  return <primitive object={lineObj} />;
}
