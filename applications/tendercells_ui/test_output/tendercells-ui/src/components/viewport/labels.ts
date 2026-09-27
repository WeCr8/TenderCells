// labels.ts - camera-facing text labels for the 3D yard (areas, markers, station flags).
import * as THREE from 'three';

export interface LabelStyle {
  title: string;
  subtitle?: string;
  /** Title colour. */
  color?: string;
  /** Background. */
  bg?: string;
  /** Left accent bar colour (e.g. flag severity). */
  accent?: string;
  /** World height of the label in scene units (feet). */
  height?: number;
  /**
   * Constant on-screen size instead: label height as a fraction of the viewport
   * height (e.g. 0.05). Keeps station flags readable when zoomed out over a big yard.
   */
  screenSize?: number;
}

/**
 * Build a sprite label that always faces the camera and stays readable over terrain.
 *
 * @param style - Text, colours and size
 * @returns A THREE.Sprite sized to its text
 */
export function makeTextSprite(style: LabelStyle): THREE.Sprite {
  const { title, subtitle, color = '#F0EDE4', bg = 'rgba(13,43,30,0.86)', accent, height = 1.1, screenSize } = style;
  const scale = 2; // canvas px per logical px, keeps text crisp
  const padX = 18, lineH = subtitle ? 58 : 44;
  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = 'bold 26px system-ui, sans-serif';
  const wTitle = measure.measureText(title).width;
  measure.font = '20px system-ui, sans-serif';
  const wSub = subtitle ? measure.measureText(subtitle).width : 0;
  const w = Math.ceil(Math.max(wTitle, wSub) + padX * 2 + (accent ? 10 : 0));
  const h = lineH + 16;

  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(2, 2, w - 4, h - 4, 10);
  ctx.fill();
  if (accent) {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(2, 2, 8, h - 4, [10, 0, 0, 10]);
    ctx.fill();
  }
  const x0 = padX + (accent ? 8 : 0);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(title, x0, subtitle ? 24 : h / 2);
  if (subtitle) {
    ctx.fillStyle = '#C8B882';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText(subtitle, x0, 50);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  // toneMapped: false keeps label colours true under the scene's ACES tone mapping.
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, toneMapped: false }));
  if (screenSize) {
    sprite.material.sizeAttenuation = false;
    sprite.scale.set((w / h) * screenSize, screenSize, 1);
  } else {
    sprite.scale.set((w / h) * height, height, 1);
  }
  sprite.renderOrder = 10;
  return sprite;
}
