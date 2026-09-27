// huggingFace.ts - turn a Hugging Face Hub reference into a downloadable model URL.
//
// Accepts what people copy from the Hub:
//   https://huggingface.co/<owner>/<repo>/blob/main/models/robot.glb   (file page)
//   https://huggingface.co/<owner>/<repo>/resolve/main/robot.glb       (download link)
//   https://huggingface.co/datasets/<owner>/<repo>/blob/main/scene.glb (dataset repo)
//   <owner>/<repo>/robot.glb   or   datasets/<owner>/<repo>/scene.glb  (shorthand, main)
// and returns the /resolve/ URL, which the Hub serves with CORS and redirects to its
// file CDN (*.hf.co) - both allowed in the site's security policy.

const NAME = '[A-Za-z0-9][A-Za-z0-9_.-]{0,95}';
const PREFIX = '(?:(datasets|spaces)\\/)?';
const URL_RE = new RegExp(`^https:\\/\\/huggingface\\.co\\/${PREFIX}(${NAME})\\/(${NAME})\\/(?:blob|resolve)\\/([^/]+)\\/(.+)$`);
const SHORT_RE = new RegExp(`^${PREFIX}(${NAME})\\/(${NAME})\\/(.+)$`);

export interface HfModelRef {
  url: string;   // resolve URL to load
  repo: string;  // owner/repo
  path: string;  // file path in the repo
}

/**
 * Parse a Hub link or shorthand into a glTF download URL.
 *
 * @param input - Hub URL or "owner/repo/path.glb"
 * @returns The resolve URL + parts
 * @throws {Error} with a user-facing message when the reference is not a .glb/.gltf on the Hub
 */
export function hfModelUrl(input: string): HfModelRef {
  const value = input.trim().replace(/\?.*$/, '');
  let kind: string | undefined, owner: string, repo: string, rev = 'main', path: string;
  const full = URL_RE.exec(value);
  const short = full ? null : SHORT_RE.exec(value);
  if (full) {
    [, kind, owner, repo, rev, path] = full;
  } else if (short && !value.includes('://')) {
    [, kind, owner, repo, path] = short;
  } else {
    throw new Error('Paste a Hugging Face file link, or owner/repo/path/model.glb');
  }
  if (path.split('/').some((seg) => seg === '..' || seg === '')) throw new Error('That file path is not valid.');
  if (!/\.(glb|gltf)$/i.test(path)) {
    throw new Error('The 3D view loads glTF only (.glb/.gltf). URDF/STL robots need converting to GLB first.');
  }
  const base = kind ? `https://huggingface.co/${kind}/${owner}/${repo}` : `https://huggingface.co/${owner}/${repo}`;
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return { url: `${base}/resolve/${encodeURIComponent(rev)}/${encodedPath}`, repo: `${owner}/${repo}`, path };
}
