import { useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import type { View } from '../model/constants';
import { Axes } from './Axes';
import { Flag } from './Flag';
import { GhostLine } from './GhostLine';
import { Terrain } from './Terrain';

interface SceneProps {
  view: View;
  isCompact: boolean;
  onSelectStrike: (strike: number) => void;
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}

function ResponsiveCamera({ isCompact }: { isCompact: boolean }) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    if (isCompact) {
      camera.position.set(-5.5, 16.0, 34.5);
      camera.lookAt(0, -0.4, 0.5);
    } else {
      camera.position.set(-6.5, 12.2, 26.5);
      camera.lookAt(-0.3, 0.4, 0.6);
    }
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, invalidate, isCompact]);

  return null;
}

export function Scene({ view, isCompact, onSelectStrike }: SceneProps) {
  const [webglOk, setWebglOk] = useState<boolean>(() => detectWebGL());
  const [enableBloom, setEnableBloom] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return true;
    return !window.matchMedia('(pointer: coarse)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(pointer: coarse)');
    const onChange = () => setEnableBloom(!mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (!webglOk) {
    return (
      <div className="webgl-fallback" role="alert">
        <p>This page needs WebGL to draw the terrain.</p>
      </div>
    );
  }

  return (
    <div className="scene-wrap">
      <Canvas
        dpr={[1, 2]}
        frameloop="demand"
        camera={{
          position: isCompact ? [-5.5, 16.0, 34.5] : [-6.5, 12.2, 26.5],
          fov: 40,
          near: 0.1,
          far: 180,
        }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setWebglOk(false);
          });
        }}
      >
        <color attach="background" args={['#07090c']} />
        <fog attach="fog" args={['#07090c', 52, 105]} />

        <ResponsiveCamera isCompact={isCompact} />

        <Terrain view={view} onSelectStrike={onSelectStrike} />
        <GhostLine view={view} />
        <Axes centre={view.centre} />
        <Flag view={view} />

        <OrbitControls
          makeDefault
          enablePan={false}
          target={isCompact ? [0, -0.4, 0.5] : [-0.3, 0.4, 0.6]}
          minPolarAngle={0.5}
          maxPolarAngle={1.45}
          minAzimuthAngle={-1.2}
          maxAzimuthAngle={1.2}
          minDistance={12}
          maxDistance={42}
        />

        {enableBloom && (
          <EffectComposer multisampling={4}>
            <Bloom
              luminanceThreshold={0.96}
              luminanceSmoothing={0.22}
              intensity={0.25}
              mipmapBlur
            />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
