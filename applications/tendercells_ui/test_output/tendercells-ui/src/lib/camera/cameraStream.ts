export type StreamSecurity = 'secure' | 'local' | 'insecure-remote' | 'unconfigured';

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\]|[^.]+\.local|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;

export function classifyCameraStream(url: string | undefined): StreamSecurity {
  if (!url) return 'unconfigured';
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') return 'secure';
    if (parsed.protocol === 'http:' && LOCAL_HOST.test(parsed.hostname)) return 'local';
    return 'insecure-remote';
  } catch {
    return 'unconfigured';
  }
}

export function cameraTransform(rotation: number, flipX: boolean, flipY: boolean): string {
  return `rotate(${rotation}deg) scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})`;
}
