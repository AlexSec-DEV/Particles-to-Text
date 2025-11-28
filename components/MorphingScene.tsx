import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { createSpherePoints, createTextPoints } from '../utils/generation';

interface MorphingSceneProps {
  text: string;
}

interface Orbiter {
  points: THREE.Points;
  distance: number;
  speed: number;
  angle: number;
  tilt: number;     // Vertical tilt of the orbit
  yOffset: number;  // Base height offset
}

const MorphingScene: React.FC<MorphingSceneProps> = ({ text }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Refs to store Three.js objects across renders without re-initializing
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const starsRef = useRef<THREE.Points | null>(null); 
  const orbitersRef = useRef<Orbiter[]>([]); // Ref for orbiting particle spheres
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
    const starCount = 6000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = createSpherePoints(200, starCount); 
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    
    const starColors = new Float32Array(starCount * 3);
    for(let i=0; i<starCount; i++) {
        const shade = 0.5 + Math.random() * 0.5; 
        starColors[i*3] = shade;
        starColors[i*3+1] = shade;
        starColors[i*3+2] = shade + 0.1; 
    }
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.7,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      depthWrite: false 
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    starsRef.current = stars;

    // --- ORBITING PARTICLE SPHERES (Solar System Effect) ---
    // Instead of meshes, we create 5 mini particle clouds
    const orbiterList: Orbiter[] = [];
    const glowTex = getGlowTexture();

    for (let i = 0; i < 5; i++) {
      // 1. Geometry: Small sphere of points
      const radius = 3 + Math.random() * 3; // Radius 3 to 6
      const pCount = 300 + Math.floor(Math.random() * 200); // 300-500 points
      const orbGeometry = new THREE.BufferGeometry();
      const orbPositions = createSpherePoints(radius, pCount);
      orbGeometry.setAttribute('position', new THREE.BufferAttribute(orbPositions, 3));

      // 2. Material: Single color (we will animate this property)
      const orbMaterial = new THREE.PointsMaterial({
        size: 0.8,
        map: glowTex,
        color: 0xbd00ff, // Start purple
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      });

      const orbPoints = new THREE.Points(orbGeometry, orbMaterial);
      scene.add(orbPoints);

      // 3. Orbit Logic
      // Distance: Ensure they are outside the main sphere (Radius 30)
      // Let's place them between 50 and 100 units away
      const distance = 50 + (i * 12); 
      
      orbiterList.push({
        points: orbPoints,
        distance: distance,
        angle: Math.random() * Math.PI * 2, // Random starting angle
        speed: (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1), // Random speed & direction
        tilt: (Math.random() - 0.5) * 1, // Random orbit tilt
        yOffset: (Math.random() - 0.5) * 20
      });
    }
    orbitersRef.current = orbiterList;


    // --- MAIN PARTICLES ---
    const geometry = new THREE.BufferGeometry();
    const initialPositions = createSpherePoints(SPHERE_RADIUS, PARTICLE_COUNT);
    geometry.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));

    // --- Colors Setup (All Purple variants) ---
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const purpleBase = new THREE.Color(0xbd00ff);
    const purpleDeep = new THREE.Color(0x6a00a0);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const color = Math.random() > 0.4 ? purpleBase : purpleDeep;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.8, 
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
    const colorPurple = new THREE.Color(0xbd00ff);
    const colorDeepBlue = new THREE.Color(0x102c57); // Deep space blue

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      const currentIsMobile = window.innerWidth < 768;
      const targetZ = currentIsMobile ? 90 : 60; 

      // Always rotate background stars
      if (starsRef.current) {
        starsRef.current.rotation.y = time * 0.03;
        starsRef.current.rotation.x = time * 0.01;
      }

      // --- ANIMATE ORBITING PARTICLE SPHERES ---
      orbitersRef.current.forEach((orb, i) => {
        // 1. Update Position (Orbit)
        orb.angle += orb.speed;
        
        // Calculate orbit position with tilt
        const x = Math.cos(orb.angle) * orb.distance;
        const z = Math.sin(orb.angle) * orb.distance;
        const y = Math.sin(orb.angle) * (orb.distance * orb.tilt) + orb.yOffset;

        orb.points.position.set(x, y, z);
        
        // Rotate the mini sphere itself
        orb.points.rotation.y += 0.02;
        orb.points.rotation.z += 0.01;

        // 2. Update Color (Pulse between Purple and Deep Blue)
        const alpha = (Math.sin(time * 1.5 + i * 1.2) + 1) / 2; // Oscillation 0 to 1
        const mat = orb.points.material as THREE.PointsMaterial;
        // Need to cast to Color to use lerpColors
        if (!mat.color) mat.color = new THREE.Color();
        mat.color.lerpColors(colorDeepBlue, colorPurple, alpha);
      });

      if (!isTextModeRef.current) {
        // --- SPHERE MODE ---
        camera.position.x = Math.cos(time * 0.1) * targetZ;
        camera.position.z = Math.sin(time * 0.1) * targetZ;
        camera.position.y = Math.sin(time * 0.05) * 10;
        camera.lookAt(0, 0, 0);

        particles.rotation.y = time * 0.05;
      } else {
        // --- TEXT MODE ---
        camera.position.x += (0 - camera.position.x) * 0.05;
        camera.position.y += (0 - camera.position.y) * 0.05;
        camera.position.z += (targetZ - camera.position.z) * 0.05;
        camera.lookAt(0, 0, 0);

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
      // Clean up orbiting systems
      orbitersRef.current.forEach(orb => {
        orb.points.geometry.dispose();
        (orb.points.material as THREE.Material).dispose();
      });
      renderer.dispose();
    };
  }, []);

  // 2. Morph Logic (Run when text changes)
  useEffect(() => {
    if (!particlesRef.current) return;

    const particles = particlesRef.current;
    
    let targetPositions: Float32Array;

    if (!text || text.trim() === '') {
      targetPositions = createSpherePoints(SPHERE_RADIUS, PARTICLE_COUNT);
      isTextModeRef.current = false;
    } else {
      targetPositions = createTextPoints(text, PARTICLE_COUNT);
      isTextModeRef.current = true;
    }

    morphToText(particles, targetPositions);

  }, [text]);

  function morphToText(particles: THREE.Points, targetPositions: Float32Array) {
    const positions = particles.geometry.attributes.position.array as Float32Array;
    
    gsap.killTweensOf(positions);

    for (let i = 0; i < positions.length; i += 3) {
      const targetConfig: any = {
        duration: 2,
        ease: "power2.inOut",
        [i]: targetPositions[i],         
        [i + 1]: targetPositions[i + 1], 
        [i + 2]: targetPositions[i + 2], 
      };

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