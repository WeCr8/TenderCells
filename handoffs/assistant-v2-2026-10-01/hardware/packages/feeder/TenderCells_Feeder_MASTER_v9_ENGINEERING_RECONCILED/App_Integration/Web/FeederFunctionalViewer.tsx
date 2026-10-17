// FeederFunctionalViewer.tsx
// Drop-in Three.js product viewer for the existing TenderCells React/Vite UI.
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type FeederTelemetry = {
  feedPercent: number;
  feedWeightGrams?: number;
  batteryPercent: number;
  rotorPocket: number;
  dispenseCount?: number;
  connected: boolean;
  jammed: boolean;
  homed?: boolean;
  lastDispenseAt?: string;
};

export type FeederViewerCommand =
  | { type: 'visual-dispense'; pockets?: number }
  | { type: 'visual-home' }
  | { type: 'request-local-dispense'; pockets?: number }
  | { type: 'request-local-home' };

export interface FeederFunctionalViewerProps {
  modelUrl: string;
  telemetry: FeederTelemetry;
  height?: number | string;
  interactive?: boolean;
  visualOnly?: boolean;
  onCommand?: (command: FeederViewerCommand) => void;
}

const NODE = {
  rotor: 'Rotor',
  feed: 'FeedFill',
  platform: 'LoadCellPlatform',
  led: 'StatusLED',
};

export default function FeederFunctionalViewer({
  modelUrl, telemetry, height = 520, interactive = true, visualOnly = true, onCommand,
}: FeederFunctionalViewerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rotorRef = useRef<THREE.Object3D | null>(null);
  const feedRef = useRef<THREE.Object3D | null>(null);
  const platformRef = useRef<THREE.Object3D | null>(null);
  const ledRef = useRef<THREE.Object3D | null>(null);
  const feedBaseScale = useRef(1);
  const feedBaseZ = useRef(0);
  const platformBaseZ = useRef(0);
  const previousDispense = useRef(telemetry.dispenseCount ?? 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const host = mountRef.current;
    if (!host) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101513);
    scene.up.set(0, 0, 1); // CAD package is Z-up
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, host.clientWidth / Math.max(host.clientHeight, 1), 0.1, 5000);
    camera.up.set(0, 0, 1);
    camera.position.set(500, -650, 420);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x273127, 2.1));
    const sun = new THREE.DirectionalLight(0xffffff, 3.0);
    sun.position.set(300, -250, 600); sun.castShadow = true; scene.add(sun);
    const grid = new THREE.GridHelper(700, 28, 0x42614a, 0x24372a);
    grid.rotation.x = Math.PI / 2; scene.add(grid);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.target.set(0, 0, 190);

    let disposed = false;
    const loader = new GLTFLoader();
    loader.load(modelUrl, gltf => {
      if (disposed) return;
      const model = gltf.scene;
      model.traverse(obj => { if ((obj as THREE.Mesh).isMesh) { const m=obj as THREE.Mesh; m.castShadow=true; m.receiveShadow=true; } });
      scene.add(model);
      rotorRef.current = model.getObjectByName(NODE.rotor) || null;
      feedRef.current = model.getObjectByName(NODE.feed) || null;
      platformRef.current = model.getObjectByName(NODE.platform) || null;
      ledRef.current = model.getObjectByName(NODE.led) || null;
      if (feedRef.current) { feedBaseScale.current = feedRef.current.scale.z; feedBaseZ.current = feedRef.current.position.z; }
      if (platformRef.current) platformBaseZ.current = platformRef.current.position.z;
      // Auto-fit camera from true model bounds.
      const box = new THREE.Box3().setFromObject(model); const sphere = box.getBoundingSphere(new THREE.Sphere());
      controls.target.copy(sphere.center);
      camera.position.set(sphere.center.x + sphere.radius*1.6, sphere.center.y - sphere.radius*2.1, sphere.center.z + sphere.radius*1.25);
      camera.near = Math.max(0.1, sphere.radius/100); camera.far = sphere.radius*20; camera.updateProjectionMatrix();
      setLoading(false);
    }, undefined, e => { setError(`GLB load failed: ${String(e)}`); setLoading(false); });

    let raf=0;
    const animate=()=>{ controls.update(); renderer.render(scene,camera); raf=requestAnimationFrame(animate); }; animate();
    const resize=()=>{ if(!host) return; camera.aspect=host.clientWidth/Math.max(host.clientHeight,1); camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth,host.clientHeight); };
    const ro=new ResizeObserver(resize); ro.observe(host);
    return ()=>{ disposed=true; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); renderer.dispose(); if(renderer.domElement.parentNode===host) host.removeChild(renderer.domElement); scene.clear(); };
  }, [modelUrl]);

  // Drive visible product state from telemetry.
  useEffect(() => {
    const rotor=rotorRef.current;
    if(rotor) rotor.rotation.y = THREE.MathUtils.degToRad((telemetry.rotorPocket % 6) * 60);
    const feed=feedRef.current;
    if(feed){ const p=THREE.MathUtils.clamp(telemetry.feedPercent/100,0.02,1); feed.scale.z=feedBaseScale.current*p; feed.position.z=feedBaseZ.current-(1-p)*60; }
    const platform=platformRef.current;
    if(platform){ const load=Math.min((telemetry.feedWeightGrams ?? 0)/5000,1); platform.position.z=platformBaseZ.current-(0.7*load); }
    const led=ledRef.current;
    if(led){ led.traverse(o=>{ const mesh=o as THREE.Mesh; const mat=mesh.material as THREE.MeshStandardMaterial; if(mat?.color) mat.color.set(telemetry.jammed?0xff3b30:telemetry.connected?0x35c759:0xffcc00); }); }
    const count=telemetry.dispenseCount ?? 0;
    if(count>previousDispense.current && rotor){
      const start=rotor.rotation.y, target=start+THREE.MathUtils.degToRad(60), started=performance.now();
      const tick=(now:number)=>{ const t=Math.min((now-started)/900,1); const eased=1-Math.pow(1-t,3); rotor.rotation.y=THREE.MathUtils.lerp(start,target,eased); if(t<1) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    }
    previousDispense.current=count;
  }, [telemetry]);

  const command=(type:FeederViewerCommand['type'])=>{
    if(!interactive) return;
    if((type==='request-local-dispense'||type==='request-local-home') && visualOnly) return;
    onCommand?.({ type } as FeederViewerCommand);
  };

  return <div style={{position:'relative',width:'100%',height,overflow:'hidden',borderRadius:14}}>
    <div ref={mountRef} style={{position:'absolute',inset:0}} />
    <div style={{position:'absolute',left:12,top:12,padding:'8px 10px',borderRadius:9,background:'rgba(10,14,12,.78)',color:'#fff',font:'12px system-ui'}}>
      {loading ? 'Loading feeder…' : error ?? `${telemetry.feedPercent.toFixed(0)}% feed • ${telemetry.batteryPercent.toFixed(0)}% battery • ${telemetry.jammed?'JAM':'READY'}`}
    </div>
    {interactive && <div style={{position:'absolute',right:12,bottom:12,display:'flex',gap:8}}>
      <button onClick={()=>command(visualOnly?'visual-dispense':'request-local-dispense')}>Dispense view</button>
      <button onClick={()=>command(visualOnly?'visual-home':'request-local-home')}>Home view</button>
    </div>}
  </div>;
}
