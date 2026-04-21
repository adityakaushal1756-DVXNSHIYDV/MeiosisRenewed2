import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
uniform float uTime;
uniform float uSpeed;
attribute float aSpeed;
attribute float aSize;
varying float vAlpha;

void main() {
  vec3 pos = position;
  
  // Create a cyclic movement towards the camera
  float z = mod(pos.z + uTime * uSpeed * aSpeed, 100.0) - 50.0;
  
  // Perspective transform-like logic: as z increases (gets closer to camera), x and y spread out
  float scale = 50.0 / (50.0 - z);
  vec3 finalPos = vec3(pos.xy * scale, z);
  
  // Calculate alpha based on distance for a fade-in/out effect
  vAlpha = smoothstep(-50.0, -30.0, z) * smoothstep(50.0, 30.0, z);
  
  gl_PointSize = aSize * scale;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
}
`;

const fragmentShader = `
varying float vAlpha;
uniform vec3 uColor;

void main() {
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;
  
  float glow = 1.0 - dist * 2.0;
  gl_FragColor = vec4(uColor, vAlpha * glow);
}
`;

export function SpaceWarp({
  color = '#ffffff',
  speed = 1.0,
  starCount = 1500
}: {
  color?: string;
  speed?: number;
  starCount?: number;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef(speed);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 60;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const speeds = new Float32Array(starCount);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      // Random position in a cylinder
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 40;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

      speeds[i] = 0.5 + Math.random() * 1.5;
      sizes[i] = 1.0 + Math.random() * 2.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0.0 },
        uSpeed: { value: speedRef.current * 10.0 }, // Base speed multiplier
        uColor: { value: new THREE.Color(color) }
      }
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let animationFrameId: number;
    const clock = new THREE.Clock();
    const accumulatedTime = { current: 0.0 };

    const animate = () => {
      const delta = clock.getDelta();
      accumulatedTime.current += delta;
      
      material.uniforms.uTime.value = accumulatedTime.current;
      material.uniforms.uSpeed.value = speedRef.current * 10.0;
      
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
  }, [color, starCount]);

  return (
    <div className="relative w-full h-full overflow-hidden pointer-events-none">
      <div ref={mountRef} className="absolute inset-0 z-0" />
      {/* Cinematic vignette for depth */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, transparent 30%, rgba(3, 21, 37, 0.45) 100%)' }}
      />
    </div>
  );
}
