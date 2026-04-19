import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
uniform float uTime;
varying float vDist;

void main() {
  vec3 pos = position;
  
  // Calculate radial distance from origin (center of the grid)
  float r = length(pos.xy);
  vDist = r;
  
  // Gravitational parameters
  float A = 120.0; // intensity
  float c = 5.0; // softening
  
  // Spacetime bending: deeper near the center
  pos.z = -(A / (r * 0.4 + c)) * 2.0;
  
  // Spiral orbital rotation based on inverse distance and time
  float omega = uTime * 0.2 + (15.0 / (r + 2.0));
  float s = sin(omega);
  float cos_omega = cos(omega);
  
  vec2 rotatedXY = vec2(
    pos.x * cos_omega - pos.y * s,
    pos.x * s + pos.y * cos_omega
  );
  
  pos.xy = rotatedXY;
  
  // Particle size: smaller at the singularity core, larger at the event horizon/periphery
  gl_PointSize = clamp(r * 0.08, 0.8, 3.5);
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = `
varying float vDist;

void main() {
  // Create rounded points
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  
  // Soft bloom blur
  float alpha = smoothstep(0.5, 0.1, dist);
  
  // Core dims slightly, edges are brighter
  float brightness = clamp(vDist / 10.0, 0.15, 1.0);
  
  // Theme colors: Neon green (#52ff9d) core, fading to Sky blue (#38bdf8) edges
  vec3 coreColor = vec3(0.32, 1.0, 0.61);
  vec3 edgeColor = vec3(0.22, 0.74, 0.97);
  vec3 color = mix(coreColor, edgeColor, clamp(vDist / 25.0, 0.0, 1.0)) * brightness;
  
  gl_FragColor = vec4(color, alpha * 0.6); // Subtle opacity so it sits in the background well
}
`;

export function SpacetimeSingularity() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Setup Scene
    const scene = new THREE.Scene();
    scene.background = null; // Transparent to inherit dashboard bg
    scene.fog = new THREE.FogExp2('#031525', 0.015); // Match deep blue dashboard

    // 2. Setup Camera
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // 45-degree isometric-like perspective looking down
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, -35, 25);
    camera.lookAt(0, 0, -10);

    // 3. Setup Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent 
    container.appendChild(renderer.domElement);

    // 4. Create Grid Geometry
    const gridSize = 50;
    const gridSegments = 100; // 10k vertices
    const geometry = new THREE.PlaneGeometry(gridSize, gridSize, gridSegments, gridSegments);

    // 5. Create Shader Material
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0.0 }
      }
    });

    // 6. Create Points Object
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // 7. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      material.uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // 8. Handle Resize
    const handleResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      
      geometry.dispose();
      material.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-[inherit] pointer-events-none">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="absolute inset-0 z-0" />
      
      {/* Vignette Overlay to blend with dashboard edges */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,#031525_100%)] opacity-80" />

      {/* Typography Overlay */}
      <div className="absolute bottom-12 left-0 right-0 z-20 flex justify-center">
        <p className="text-[11px] font-medium tracking-[0.2em] text-neon/40 uppercase w-full text-center px-6 drop-shadow-md">
          "Spacetime tells matter how to move, matter tells spacetime how to curve."
        </p>
      </div>
    </div>
  );
}
