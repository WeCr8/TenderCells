// Viewport3D.tsx - 3D Coop visualization using Three.js
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function Viewport3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1B542B);

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(3, 3, 4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 8, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d7d3d,
      roughness: 0.8,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Coop structure - simple box
    const coopGeometry = new THREE.BoxGeometry(3, 2.5, 3);
    const coopMaterial = new THREE.MeshStandardMaterial({
      color: 0xD4A574,
      roughness: 0.5,
    });
    const coop = new THREE.Mesh(coopGeometry, coopMaterial);
    coop.position.y = 1.25;
    coop.castShadow = true;
    coop.receiveShadow = true;
    scene.add(coop);

    // Roof - pyramid
    const roofGeometry = new THREE.ConeGeometry(2.2, 1.2, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.6,
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 3;
    roof.castShadow = true;
    scene.add(roof);

    // Door
    const doorGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.1);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.5,
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(-1.45, 0.6, -1.5);
    door.castShadow = true;
    scene.add(door);

    // Robot arm base (stylized representation)
    const armBaseGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0xC0C0C0,
      metalness: 0.8,
      roughness: 0.2,
    });
    const armBase = new THREE.Mesh(armBaseGeometry, metalMaterial);
    armBase.position.set(0, 2.3, 0);
    armBase.castShadow = true;
    scene.add(armBase);

    // Arm segment 1
    const segment1Geometry = new THREE.BoxGeometry(0.1, 1, 0.1);
    const segment1 = new THREE.Mesh(segment1Geometry, metalMaterial);
    segment1.position.set(0, 2.8, 0);
    segment1.castShadow = true;
    scene.add(segment1);

    // Simple animation
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Rotate coop slightly
      coop.rotation.y += 0.005;
      roof.rotation.y += 0.005;
      armBase.rotation.y += 0.01;

      // Animate arm
      segment1.rotation.z = Math.sin(Date.now() / 2000) * 0.5;

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
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <Paper
      elevation={3}
      sx={{
        height: 400,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        ref={containerRef}
        sx={{
          width: "100%",
          height: "100%",
        }}
      />
      <Typography
        variant="caption"
        sx={{
          position: "absolute",
          bottom: 8,
          right: 12,
          color: "#E4E7E5",
          background: "rgba(0,0,0,0.5)",
          padding: "4px 8px",
          borderRadius: "4px",
          zIndex: 10,
        }}
      >
        3D Coop Visualization
      </Typography>
    </Paper>
  );
}
