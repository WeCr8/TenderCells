// Viewport3D.tsx - 3D Coop with model loading
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { useCoopModel } from '../../hooks/useCoopModel';
import CoopModelSelector from './CoopModelSelector';

export default function Viewport3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const { model, loadedScene, loading } = useCoopModel();

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1B542B);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    const container = containerRef.current;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(8, 10, 8);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d7d3d,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Load custom model or render default fallback
    const cameraControl = { angle: 0 };
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Rotate scene
      cameraControl.angle += 0.005;
      camera.position.x = Math.cos(cameraControl.angle) * 8;
      camera.position.z = Math.sin(cameraControl.angle) * 8;
      camera.lookAt(0, 1, 0);

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Add loaded model to scene
    if (loadedScene) {
      loadedScene.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(loadedScene);
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [loadedScene]);

  return (
    <Paper elevation={3} sx={{ height: 500, position: 'relative', overflow: 'hidden' }}>
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: '100%',
        }}
      />
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <CircularProgress />
          <Typography variant="caption" color="white">
            Loading model...
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: '#E4E7E5',
            background: 'rgba(0,0,0,0.5)',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
        >
          {model.name} ({model.dimensions.width}×{model.dimensions.depth}×{model.dimensions.height}ft)
        </Typography>
        <CoopModelSelector
          currentModel={model}
          onSelectModel={(m) => {}}
          onUploadCustom={async () => {}}
        />
      </Box>
    </Paper>
  );
}
