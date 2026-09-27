// gltfLoader.ts - one GLTFLoader setup for every robot / garden / coop model.
//
// FIX(2026-09-27): the viewport loaders had no compression support, and
// ModelLoader pointed DRACO at '/draco/' which did not exist, so Draco- or
// Meshopt-compressed GLBs (Blender's "Compression" export option, most
// downloadable robot models) silently failed to load.
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

let draco: DRACOLoader | null = null;

/**
 * Create a GLTFLoader that can decode Draco and Meshopt compressed models.
 *
 * The Draco decoder is served from `<base>/draco/` (public/draco) so it works
 * both standalone and under the website's /app/ path. One shared DRACOLoader
 * keeps a single decoder worker pool for the whole app.
 *
 * @returns A configured GLTFLoader
 * @example
 *   const gltf = await createGltfLoader().loadAsync(url);
 */
export function createGltfLoader(): GLTFLoader {
  if (!draco) {
    draco = new DRACOLoader();
    draco.setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
  }
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  loader.setMeshoptDecoder(MeshoptDecoder);
  return loader;
}

/**
 * Turn a loader error into one line a person can act on.
 *
 * @param err - Error thrown by GLTFLoader / fetch
 * @returns Short human-readable reason
 */
export function describeModelLoadError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  if (/Failed to fetch|NetworkError|Load failed|CORS|blocked/i.test(msg)) {
    return 'the file could not be downloaded (link offline, private, or its host is not allowed)';
  }
  if (/Unexpected token|JSON|magic|Unsupported asset|glTF versions/i.test(msg)) {
    return 'it is not a valid glTF/GLB file (convert OBJ/FBX/USD to .glb first)';
  }
  if (/404|Not Found/i.test(msg)) return 'the file was not found at that link';
  return msg || 'unknown error';
}

// Hosts the live site's Content-Security-Policy lets the viewport download models
// from (firebase.json connect-src). Anything else is blocked by the browser.
const ALLOWED_MODEL_HOSTS = [/(^|\.)tendercells\.com$/, /\.web\.app$/, /\.googleapis\.com$/, /^raw\.githubusercontent\.com$/, /^media\.githubusercontent\.com$/];

/**
 * Check a device/robot model URL before saving it, so problems show in the form
 * instead of as a silent fallback shape in 3D.
 *
 * @param url - Value of the "Custom device asset URL" field
 * @param siteOrigin - Origin relative links resolve against (defaults to this page)
 * @returns A warning to show, or null when the URL looks loadable
 */
export function modelUrlProblem(
  url: string,
  siteOrigin: string = typeof window !== 'undefined' ? window.location.origin : 'https://tendercells.com',
): string | null {
  const value = url.trim();
  if (!value) return null;
  let parsed: URL;
  try {
    parsed = new URL(value, siteOrigin);
  } catch {
    return 'Not a valid link.';
  }
  if (!/^https?:$/.test(parsed.protocol)) return 'Use an https:// link to a .glb file.';
  if (!/\.(glb|gltf)$/i.test(parsed.pathname)) {
    return 'The 3D view loads glTF only (.glb or .gltf). Convert OBJ/FBX/USD in Blender → Export → glTF Binary.';
  }
  const sameSite = parsed.origin === new URL(siteOrigin).origin;
  if (!sameSite && !ALLOWED_MODEL_HOSTS.some((re) => re.test(parsed.hostname))) {
    return `The live site cannot download models from ${parsed.hostname}. Host the .glb on GitHub (raw link), Firebase Storage, or attach it in Property Layout.`;
  }
  return null;
}
