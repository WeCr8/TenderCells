// ArmKinematics3D.tsx — live 6DOF forward-kinematics arm in 3D.
//
// True position kinematics: a nested joint hierarchy (base yaw → shoulder → elbow →
// wrist roll/pitch → tool roll). Each joint rotates its whole subtree, so the end
// effector position emerges from the joint angles — not faked. Driven by the live
// `joints` from the backend (state/arm) and mounted at the gantry X/Y position.

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type Props = {
  joints: number[];            // 6 angles in degrees
  gantry?: { x: number; y: number };
  height?: number;
};

// Link lengths (scene units) and each joint's local rotation axis.
const LINKS = [0.6, 1.4, 1.2, 0.7, 0.5, 0.35];
const AXES: Array<'x' | 'y' | 'z'> = ['y', 'x', 'x', 'y', 'x', 'y'];
const D2R = Math.PI / 180;

export default function ArmKinematics3D({ joints, gantry, height = 320 }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const jointsRef = useRef(joints);   jointsRef.current = joints;
  const gantryRef = useRef(gantry);   gantryRef.current = gantry;
  const groupsRef = useRef<THREE.Group[]>([]);
  const rootRef = useRef<THREE.Group | null>(null);
  const eeRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d2b1e);
    const w = mount.clientWidth || 400;
    const camera = new THREE.PerspectiveCamera(50, w / height, 0.01, 100);
    camera.position.set(5, 4, 5);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, height);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 2, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x223322, 1.1));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9); dir.position.set(3, 6, 3); scene.add(dir);
    scene.add(new THREE.GridHelper(8, 16, 0x4a7c59, 0x1a3d2b));

    // Build the joint chain. Each joint group sits at the tip of the previous link.
    const root = new THREE.Group(); scene.add(root); rootRef.current = root;
    const gold = new THREE.MeshStandardMaterial({ color: 0xc8b882, metalness: 0.2, roughness: 0.6 });
    const accent = new THREE.MeshStandardMaterial({ color: 0x4a7c59, metalness: 0.1, roughness: 0.7 });

    let parent: THREE.Object3D = root;
    const groups: THREE.Group[] = [];
    for (let i = 0; i < 6; i++) {
      const g = new THREE.Group();
      parent.add(g);
      // joint marker
      const joint = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 20), accent);
      g.add(joint);
      // link segment along local +Y
      const len = LINKS[i];
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, len, 16), gold);
      seg.position.y = len / 2;
      g.add(seg);
      // next joint sits at this link's tip
      const tip = new THREE.Group();
      tip.position.y = len;
      g.add(tip);
      groups.push(g);
      parent = tip;
    }
    // end-effector marker
    const ee = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xe8a020 }));
    parent.add(ee); eeRef.current = ee;
    groupsRef.current = groups;

    let raf = 0;
    const animate = () => {
      const j = jointsRef.current;
      groups.forEach((g, i) => {
        const a = (j[i] ?? 0) * D2R;
        g.rotation.x = AXES[i] === 'x' ? a : 0;
        g.rotation.y = AXES[i] === 'y' ? a : 0;
        g.rotation.z = AXES[i] === 'z' ? a : 0;
      });
      const gp = gantryRef.current;
      if (gp && rootRef.current) {
        // map gantry mm → scene units (0.01) so motion is visible but bounded
        rootRef.current.position.set(gp.x * 0.01, 0, gp.y * 0.01);
      }
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const cw = mount.clientWidth || 400;
      camera.aspect = cw / height; camera.updateProjectionMatrix();
      renderer.setSize(cw, height);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [height]);

  return <div ref={mountRef} style={{ width: '100%', height, borderRadius: 12, overflow: 'hidden' }} />;
}
