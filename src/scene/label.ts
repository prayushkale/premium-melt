import * as THREE from 'three';

export interface LabelOptions {
  fontSize?: number;
  weight?: 400 | 500 | 600;
  color?: string;
  background?: string;
  border?: string;
  paddingX?: number;
  paddingY?: number;
  worldHeight?: number;
}

export interface LabelTexture {
  texture: THREE.CanvasTexture;
  width: number;
  height: number;
}

let fontsReadyPromise: Promise<unknown> | null = null;

export function waitForFonts(): Promise<unknown> {
  if (!fontsReadyPromise) {
    fontsReadyPromise =
      typeof document !== 'undefined' && document.fonts
        ? document.fonts.ready
        : Promise.resolve();
  }
  return fontsReadyPromise;
}

export function createLabelTexture(
  text: string,
  opts: LabelOptions = {},
): LabelTexture {
  const {
    fontSize = 36,
    weight = 500,
    color = '#e9e4d8',
    background,
    border,
    paddingX = 14,
    paddingY = 8,
    worldHeight = 0.55,
  } = opts;

  const scale = 2; // double resolution for crisp text
  const font = `${weight} ${fontSize}px "IBM Plex Sans Condensed", system-ui, sans-serif`;

  const measureCanvas = document.createElement('canvas');
  const mctx = measureCanvas.getContext('2d')!;
  mctx.font = font;
  const metrics = mctx.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const cssWidth = Math.max(16, textWidth + paddingX * 2);
  const cssHeight = Math.max(16, Math.ceil(fontSize * 1.25) + paddingY * 2);

  const canvas = document.createElement('canvas');
  canvas.width = cssWidth * scale;
  canvas.height = cssHeight * scale;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  if (background) {
    const r = 4;
    ctx.fillStyle = background;
    ctx.beginPath();
    ctx.roundRect(0.5, 0.5, cssWidth - 1, cssHeight - 1, r);
    ctx.fill();
    if (border) {
      ctx.strokeStyle = border;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cssWidth / 2, cssHeight / 2 + 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  const aspect = cssWidth / cssHeight;
  return {
    texture,
    width: worldHeight * aspect,
    height: worldHeight,
  };
}
