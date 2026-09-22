export type ColormapName = 'jet' | 'turbo' | 'viridis' | 'inferno' | 'coolwarm';

interface ColorStop {
  pos: number;
  r: number;
  g: number;
  b: number;
}

const COLORMAPS: Record<ColormapName, ColorStop[]> = {
  jet: [
    { pos: 0.0, r: 0, g: 0, b: 143 },
    { pos: 0.15, r: 0, g: 0, b: 255 },
    { pos: 0.4, r: 0, g: 255, b: 255 },
    { pos: 0.7, r: 255, g: 255, b: 0 },
    { pos: 0.9, r: 255, g: 0, b: 0 },
    { pos: 1.0, r: 128, g: 0, b: 0 },
  ],
  turbo: [
    { pos: 0.0, r: 48, g: 18, b: 59 },
    { pos: 0.2, r: 70, g: 134, b: 251 },
    { pos: 0.4, r: 27, g: 229, b: 181 },
    { pos: 0.6, r: 164, g: 252, b: 60 },
    { pos: 0.8, r: 251, g: 126, b: 33 },
    { pos: 1.0, r: 122, g: 4, b: 3 },
  ],
  viridis: [
    { pos: 0.0, r: 68, g: 1, b: 84 },
    { pos: 0.25, r: 59, g: 82, b: 139 },
    { pos: 0.5, r: 33, g: 145, b: 140 },
    { pos: 0.75, r: 94, g: 201, b: 98 },
    { pos: 1.0, r: 253, g: 231, b: 37 },
  ],
  inferno: [
    { pos: 0.0, r: 0, g: 0, b: 4 },
    { pos: 0.25, r: 87, g: 16, b: 110 },
    { pos: 0.5, r: 187, g: 55, b: 84 },
    { pos: 0.75, r: 249, g: 142, b: 9 },
    { pos: 1.0, r: 252, g: 255, b: 164 },
  ],
  coolwarm: [
    { pos: 0.0, r: 59, g: 76, b: 192 },
    { pos: 0.5, r: 221, g: 221, b: 221 },
    { pos: 1.0, r: 180, g: 4, b: 38 },
  ],
};

function sampleColormap(val: number, colormap: ColormapName): [number, number, number] {
  const stops = COLORMAPS[colormap] || COLORMAPS.jet;
  const clamped = Math.max(0, Math.min(1, val));

  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (clamped >= s1.pos && clamped <= s2.pos) {
      const t = (clamped - s1.pos) / (s2.pos - s1.pos);
      const r = Math.round(s1.r + t * (s2.r - s1.r));
      const g = Math.round(s1.g + t * (s2.g - s1.g));
      const b = Math.round(s1.b + t * (s2.b - s1.b));
      return [r, g, b];
    }
  }

  const last = stops[stops.length - 1];
  return [last.r, last.g, last.b];
}

export function drawGradCamOnCanvas(
  canvas: HTMLCanvasElement,
  imageElement: HTMLImageElement,
  focalPoints: { x: number; y: number; radius: number; intensity: number }[],
  options: {
    colormap?: ColormapName;
    opacity?: number;
    threshold?: number;
    showOriginal?: boolean;
    splitPosition?: number; // 0 to 1, if split comparison is active
  } = {}
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  const {
    colormap = 'jet',
    opacity = 0.55,
    threshold = 0.2,
    showOriginal = true,
    splitPosition = 1.0,
  } = options;

  // 1. Draw original image
  ctx.clearRect(0, 0, width, height);
  if (showOriginal) {
    ctx.drawImage(imageElement, 0, 0, width, height);
  }

  // 2. Generate 2D Heatmap Matrix
  const gridW = 64;
  const gridH = 64;
  const heat = new Float32Array(gridW * gridH);

  const scaleX = gridW / 400; // SVGs normalized to 400x400
  const scaleY = gridH / 400;

  for (const fp of focalPoints) {
    const cx = fp.x * scaleX;
    const cy = fp.y * scaleY;
    const r = fp.radius * scaleX;
    const maxVal = fp.intensity;

    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        const dx = gx - cx;
        const dy = gy - cy;
        const distSq = dx * dx + dy * dy;
        const sigmaSq = (r * r) / 2;
        const val = maxVal * Math.exp(-distSq / (2 * sigmaSq));
        heat[gy * gridW + gx] = Math.max(heat[gy * gridW + gx], val);
      }
    }
  }

  // Normalize heatmap
  let maxHeat = 0.0001;
  for (let i = 0; i < heat.length; i++) {
    if (heat[i] > maxHeat) maxHeat = heat[i];
  }
  for (let i = 0; i < heat.length; i++) {
    heat[i] = heat[i] / maxHeat;
  }

  // 3. Render Heatmap to Offscreen Canvas for smooth bicubic upsampling
  const offscreen = document.createElement('canvas');
  offscreen.width = gridW;
  offscreen.height = gridH;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return;

  const imgData = offCtx.createImageData(gridW, gridH);
  const data = imgData.data;

  for (let i = 0; i < heat.length; i++) {
    const val = heat[i];
    if (val < threshold) {
      data[i * 4 + 0] = 0;
      data[i * 4 + 1] = 0;
      data[i * 4 + 2] = 0;
      data[i * 4 + 3] = 0; // transparent below threshold
    } else {
      const remapped = (val - threshold) / (1 - threshold);
      const [r, g, b] = sampleColormap(remapped, colormap);
      data[i * 4 + 0] = r;
      data[i * 4 + 1] = g;
      data[i * 4 + 2] = b;
      data[i * 4 + 3] = Math.round(255 * Math.pow(remapped, 0.8));
    }
  }

  offCtx.putImageData(imgData, 0, 0);

  // 4. Blend onto main canvas respecting split position
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (splitPosition < 1.0) {
    ctx.beginPath();
    ctx.rect(0, 0, width * splitPosition, height);
    ctx.clip();
  }

  ctx.drawImage(offscreen, 0, 0, width, height);
  ctx.restore();

  // 5. Draw divider line if split comparison is on
  if (splitPosition > 0 && splitPosition < 1.0) {
    const splitX = width * splitPosition;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, height);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Small grip circle
    ctx.beginPath();
    ctx.arc(splitX, height / 2, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#0284c7';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
