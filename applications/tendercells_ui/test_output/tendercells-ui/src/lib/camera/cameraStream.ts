export type StreamSecurity = 'secure' | 'local' | 'insecure-remote' | 'unconfigured';

// Whole-hostname checks. The old prefix regex had no end anchor, so public names
// such as "10.attacker.example", "192.168.evil.example", "localhost.evil.example" or
// "cam.localhost.example" were labelled 'local' (plain-HTTP-is-fine) by mistake.
const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const MDNS_HOST = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.local$/i;

function isPrivateIpv4(host: string): boolean {
  const m = IPV4.exec(host);
  if (!m) return false;
  const [a, b, c, d] = m.slice(1).map(Number);
  if ([a, b, c, d].some((n) => n > 255)) return false;
  return a === 10 || a === 127 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
}

export function isLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host === '[::1]') return true;
  if (/^\[(fe80|fc|fd)[0-9a-f]*:/.test(host)) return true; // IPv6 link-local / ULA
  return MDNS_HOST.test(host) || isPrivateIpv4(host);
}

export function classifyCameraStream(url: string | undefined): StreamSecurity {
  if (!url) return 'unconfigured';
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') return 'secure';
    if (parsed.protocol === 'http:' && isLocalHost(parsed.hostname)) return 'local';
    return 'insecure-remote';
  } catch {
    return 'unconfigured';
  }
}

export function cameraTransform(rotation: number, flipX: boolean, flipY: boolean): string {
  return `rotate(${rotation}deg) scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})`;
}
