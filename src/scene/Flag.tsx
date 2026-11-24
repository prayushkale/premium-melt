import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import {
  X_PER_POINT,
  Y_PER_RUPEE,
  Z_BACK,
  type View,
} from '../model/constants';
import { otmPremium } from '../model/pricing';
import { createLabelTexture, waitForFonts } from './label';

interface FlagProps {
  view: View;
}

const POLE_HEIGHT = 2.3;

export function Flag({ view }: FlagProps) {
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

  const pennantGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.85, -0.26);
    shape.lineTo(0, -0.52);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  useEffect(() => {
    return () => {
      pennantGeometry.dispose();
    };
  }, [pennantGeometry]);

  const strike = view.strike;

  const badge = useMemo(() => {
    void fontsLoaded;
    if (strike === null) return null;
    return createLabelTexture(strike.toLocaleString('en-US'), {
      fontSize: 36,
      weight: 600,
      color: '#e9e4d8',
      background: '#0d1217',
      border: '#ff9a3c',
      paddingX: 14,
      paddingY: 7,
      worldHeight: 0.68,
    });
  }, [strike, fontsLoaded]);

  useEffect(() => {
    invalidate();
    return () => {
      badge?.texture.dispose();
    };
  }, [badge, invalidate]);

  if (strike === null || !badge) {
    return null;
  }

  const x = (strike - view.centre) * X_PER_POINT;
  const premium = otmPremium(view.spot, strike, view.iv / 100, view.minutesLeft);
  const y = premium * Y_PER_RUPEE;

  return (
    <group name="strike-flag" position={[x, y, Z_BACK]}>
      {/* Base marker resting directly on the terrain */}
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.11, 16, 12]} />
        <meshBasicMaterial color="#ff9a3c" />
      </mesh>

      {/* Pole */}
      <mesh position={[0, POLE_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.032, 0.032, POLE_HEIGHT, 10]} />
        <meshBasicMaterial color="#e9e4d8" />
      </mesh>

      {/* Pennant */}
      <mesh geometry={pennantGeometry} position={[0.02, POLE_HEIGHT, 0]}>
        <meshBasicMaterial color="#ff9a3c" side={THREE.DoubleSide} />
      </mesh>

      {/* Strike label above pennant */}
      <sprite position={[0, POLE_HEIGHT + 0.62, 0]} scale={[badge.width, badge.height, 1]}>
        <spriteMaterial map={badge.texture} transparent depthTest={false} />
      </sprite>
    </group>
  );
}
