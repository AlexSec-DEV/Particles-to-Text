import * as THREE from 'three';

/**
 * Generates random points on the surface of a sphere.
 * @param radius Radius of the sphere
 * @param count Number of points to generate
 * @returns Float32Array of positions [x, y, z, x, y, z...]
 */
export function createSpherePoints(radius: number, count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Spherical coordinates
    const theta = Math.random() * Math.PI * 2; // Azimuthal angle
    const phi = Math.acos((Math.random() * 2) - 1); // Polar angle

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return positions;
}

/**
 * Generates points representing text by drawing to a 2D canvas and scanning pixels.
 * @param text The text to render
 * @param targetCount The desired number of points (will resample if needed)
 * @returns Float32Array of positions centered in 3D space
 */
export function createTextPoints(text: string, targetCount: number): Float32Array {
  // 1. Setup Canvas
  const canvas = document.createElement('canvas');
  const width = 1600; 
  const height = 400;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new Float32Array(targetCount * 3);

  // 2. Draw Text
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height); // Background
  ctx.fillStyle = '#000000'; // Text color (we scan for black pixels)
  ctx.font = 'bold 250px Arial, sans-serif'; 
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  // 3. Get Image Data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // 4. Extract Coordinates
  let coords: { x: number, y: number }[] = [];
  
  // Optimization: Increased step to 5 to create spacing between particles
  const step = 5; 
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = (y * width + x) * 4;
      // If pixel is dark (our text), add it
      if (data[index] < 128) { 
        coords.push({ x, y });
      }
    }
  }

  // 5. Handle empty text (fallback to empty array)
  if (coords.length === 0) {
    return new Float32Array(targetCount * 3);
  }

  // 6. Map points to target count
  const positions = new Float32Array(targetCount * 3);
  
  const scale = 0.12; // Scale adjustment

  for (let i = 0; i < targetCount; i++) {
    // Modulo allows us to reuse text points if we have more particles than pixels
    const coordIndex = i % coords.length;
    const { x, y } = coords[coordIndex];

    // Added Jitter back to create a natural "particle" look with spacing
    const jitterX = (Math.random() - 0.5) * 0.8; 
    const jitterY = (Math.random() - 0.5) * 0.8;
    const jitterZ = (Math.random() - 0.5) * 0.5; 

    // Center the text: (x - width/2), invert Y because canvas Y is down
    positions[i * 3]     = (x - width / 2) * scale + jitterX;
    positions[i * 3 + 1] = -(y - height / 2) * scale + jitterY;
    positions[i * 3 + 2] = 0 + jitterZ; 
  }

  return positions;
}