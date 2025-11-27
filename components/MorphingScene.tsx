import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { createSpherePoints, createTextPoints } from '../utils/generation';

interface MorphingSceneProps {
  text: string;
}

const MorphingScene: React.FC<MorphingSceneProps> = ({ text }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Refs to store Three.js objects across renders without re-initializing
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const starsRef = useRef<THREE.Points | null>(null); 
  const frameIdRef = useRef<number>(0);
  const isTextModeRef = useRef<boolean>(false);

  // Configuration
  const PARTICLE_COUNT = 7500; 
  const SPHERE_RADIUS = 30;

  // Helper to create a soft glow texture programmatically
  const getGlowTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Radial gradient for soft glow
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); // Bright center
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)'); // Soft halo
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Transparent edge

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  // 1. Initialize Scene (Run once)
  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#010003'); // Even darker black/purple
    scene.fog = new THREE.FogExp2('#010003', 0.003); 

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    
    // Initial camera position check for mobile
    const isMobile = window.innerWidth < 768;
    camera.position.z = isMobile ? 90 : 60;
    camera.position.y = 10;

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // --- BACKGROUND STARS (Space Sphere) ---
    // Increased count and adjusted radius to make the "sphere shape" more visible
    const starCount = 6000;
    // Radius 200 is large enough to enclose, but small enough to see the curve
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = createSpherePoints(200, starCount); 
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    
    // Varied star colors
    const starColors = new Float32Array(starCount * 3);
    for(let i=0; i<starCount; i++) {
        const shade = 0.5 + Math.random() * 0.5; // 0.5 to 1.0
        starColors[i*3] = shade;
        starColors[i*3+1] = shade;
        starColors[i*3+2] = shade + 0.1; // Slight blue tint
    }
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.7,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      depthWrite: false // Helps with the glow effect overlap
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    starsRef.current = stars;

    // --- MAIN PARTICLES ---
    // Create initial geometry (Sphere)
    const geometry = new THREE.BufferGeometry();
    const initialPositions = createSpherePoints(SPHERE_RADIUS, PARTICLE_COUNT);
    geometry.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));

    // --- Colors Setup (All Purple variants) ---
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const purpleBase = new THREE.Color(0xbd00ff);
    const purpleDeep = new THREE.Color(0x6a00a0);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Mix between bright purple and deep purple
      const color = Math.random() > 0.4 ? purpleBase : purpleDeep;
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Material with GLOW Texture
    const material = new THREE.PointsMaterial({
      size: 0.8, // Slightly smaller for refinement
      map: getGlowTexture(),
      sizeAttenuation: true,
      transparent: true,
      opacity: 1.0, 
      blending: THREE.AdditiveBlending, 
      depthWrite: false, 
      vertexColors: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Store refs
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    particlesRef.current = particles;

    // --- Animation Loop ---
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      const currentIsMobile = window.innerWidth < 768;
      // Default standard Z distance: 90 for mobile, 60 for desktop
      const targetZ = currentIsMobile ? 90 : 60; 

      // Always rotate background stars - Gives the "Sphere" effect
      if (starsRef.current) {
        starsRef.current.rotation.y = time * 0.03;
        starsRef.current.rotation.x = time * 0.01;
      }

      if (!isTextModeRef.current) {
        // --- SPHERE MODE: Dynamic Movement ---
        // Orbit logic
        camera.position.x = Math.cos(time * 0.1) * targetZ;
        camera.position.z = Math.sin(time * 0.1) * targetZ;
        camera.position.y = Math.sin(time * 0.05) * 10;
        camera.lookAt(0, 0, 0);

        // Continuous rotation of main particles
        particles.rotation.y = time * 0.05;
      } else {
        // --- TEXT MODE: Stabilize ---
        // Smoothly move camera to front center position
        
        camera.position.x += (0 - camera.position.x) * 0.05;
        camera.position.y += (0 - camera.position.y) * 0.05; // Center vertically
        camera.position.z += (targetZ - camera.position.z) * 0.05;
        camera.lookAt(0, 0, 0);

        // Stabilize particle rotation
        // We find the nearest multiple of 2PI to ensure we don't spin wildly, then lerp to it.
        const currentRot = particles.rotation.y;
        const targetRot = Math.round(currentRot / (Math.PI * 2)) * (Math.PI * 2);
        particles.rotation.y += (targetRot - currentRot) * 0.05;
      }

      renderer.render(scene, camera);
    };
    animate();

    // --- Resize Handler ---
    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameIdRef.current);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      if (starsRef.current) {
        starsRef.current.geometry.dispose();
        (starsRef.current.material as THREE.Material).dispose();
      }
      renderer.dispose();
    };
  }, []);

  // 2. Morph Logic (Run when text changes)
  useEffect(() => {
    if (!particlesRef.current) return;

    const particles = particlesRef.current;
    
    // Determine Target positions
    let targetPositions: Float32Array;

    if (!text || text.trim() === '') {
      // Revert to Sphere
      targetPositions = createSpherePoints(SPHERE_RADIUS, PARTICLE_COUNT);
      isTextModeRef.current = false;
    } else {
      // Create Text Points
      targetPositions = createTextPoints(text, PARTICLE_COUNT);
      isTextModeRef.current = true;
    }

    // Call the specific morph function requested
    morphToText(particles, targetPositions);

  }, [text]);

  function morphToText(particles: THREE.Points, targetPositions: Float32Array) {
    const positions = particles.geometry.attributes.position.array as Float32Array;
    
    // Kill existing tweens on this object to prevent conflict
    gsap.killTweensOf(positions);

    // Iterate through particles
    for (let i = 0; i < positions.length; i += 3) {
      
      const targetConfig: any = {
        duration: 2,
        ease: "power2.inOut",
        // We set the target values for specific indices
        [i]: targetPositions[i],         // Target X
        [i + 1]: targetPositions[i + 1], // Target Y
        [i + 2]: targetPositions[i + 2], // Target Z
      };

      // Add onUpdate callback (Only needed once per frame really, but following prompt pattern)
      // Optimization: attaching to the first particle's tween effectively drives the update
      if (i === 0) {
        targetConfig.onUpdate = () => {
          particles.geometry.attributes.position.needsUpdate = true;
        };
      }

      gsap.to(particles.geometry.attributes.position.array, targetConfig);
    }
  }

  return <div ref={containerRef} className="w-full h-full" />;
};

export default MorphingScene;