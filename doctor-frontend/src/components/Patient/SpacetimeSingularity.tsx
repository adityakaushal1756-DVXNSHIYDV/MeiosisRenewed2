import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
uniform float uTime;
varying float vDist;

void main() {
  vec3 pos = position;
  
  // Convert standard grid coordinates to polar
  float r = length(pos.xy);
  float theta = atan(pos.y, pos.x);
  
  // Maximum active radius to consider before respawning
  float max_r = 35.0;
  
  // Inflow dynamic: particles move radially inward.
  // mod() allows them to sink into the singularity and wrap around to the edge
  float new_r = mod(r - uTime * 2.5, max_r);
  
  // Reconstruct XY position in cartesian space
  pos.x = new_r * cos(theta);
  pos.y = new_r * sin(theta);
  
  // Gravitational bending depth
  float A = 140.0; // intensity
  float c = 4.0;   // softening
  
  // Spacetime well drops sharply at the center
  pos.z = -(A / (new_r * 0.4 + c)) * 2.2;
  
  // Orbital rotation (swirl effect) intensifies near the center
  float omega = uTime * 0.3 + (18.0 / (new_r + 1.5));
  float s = sin(omega);
  float cos_omega = cos(omega);
  
  vec2 rotatedXY = vec2(
    pos.x * cos_omega - pos.y * s,
    pos.x * s + pos.y * cos_omega
  );
  
  pos.xy = rotatedXY;
  
  // Scale points up and make them larger towards the edges, smaller in the well
  gl_PointSize = clamp(new_r * 0.15, 1.5, 4.5);
  vDist = new_r; // Forward the dynamically looped radius for color/fade processing
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = `
varying float vDist;
uniform vec3 uCoreColor;
uniform vec3 uEdgeColor;

void main() {
  // Circular point mask with smooth edge
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  
  float alpha = smoothstep(0.5, 0.1, dist);
  
  // Tighter fade in the center so we don't hide the vibrant core color!
  float fade = smoothstep(0.0, 1.5, vDist) * smoothstep(35.0, 25.0, vDist);
  
  // Make the core color much more dominant across the grid by using a power curve
  float blendFactor = clamp(pow(vDist / 35.0, 2.5), 0.0, 1.0);
  vec3 color = mix(uCoreColor, uEdgeColor, blendFactor);
  
  // Overdrive brightness based on how close it is to the core
  float glow = 1.0 + (1.0 - blendFactor) * 1.5; 
  
  gl_FragColor = vec4(color * glow, alpha * fade * 1.5); // Boosted alpha and color glow
}
`;

export function SpacetimeSingularity({
  coreColorHex = '#52ff9d',
  edgeColorHex = '#38bdf8',
  text = '"Spacetime tells matter how to move, matter tells spacetime how to curve."'
}: {
  coreColorHex?: string;
  edgeColorHex?: string;
  text?: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = null; 
    scene.fog = new THREE.FogExp2('#031525', 0.02);

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Zoomed-in camera for denser, up-close view
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, -22, 16);
    camera.lookAt(0, 0, -8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); 
    container.appendChild(renderer.domElement);

    // Increase point density for the closer camera shot
    const gridSize = 50;
    const gridSegments = 130; 
    const geometry = new THREE.PlaneGeometry(gridSize, gridSize, gridSegments, gridSegments);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0.0 },
        uCoreColor: { value: new THREE.Color(coreColorHex) },
        uEdgeColor: { value: new THREE.Color(edgeColorHex) },
      }
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      material.uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

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
  }, [coreColorHex, edgeColorHex]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-[inherit] pointer-events-none">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="absolute inset-0 z-0" />
      
      {/* Vignette Overlay to blend with dashboard edges */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,#031525_100%)] opacity-80" />
    </div>
  );
}
