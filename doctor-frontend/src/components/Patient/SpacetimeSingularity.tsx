import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
uniform float uTime;
uniform float uModern;
uniform vec2 uMouseNDC;
uniform float uAspect;
varying float vDist;
varying float vTheta;
varying float vBeaming;
varying float vFilament;

// Simplex 2D noise for higher-fidelity turbulence
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 a0 = x - floor(x + 0.5);
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec3 pos = position;
  float r = length(pos.xy);
  float theta = atan(pos.y, pos.x);
  
  float max_r = 55.0; // Expanded radius for immersion
  float new_r = mod(r - uTime * 2.2, max_r);
  
  // Turbulence
  if (uModern > 0.5) {
     float noise = snoise(vec2(pos.xy * 0.12 + uTime * 0.4));
     new_r += noise * 1.8 * (new_r / max_r);
  }

  pos.x = new_r * cos(theta);
  pos.y = new_r * sin(theta);
  
  // Orbital rotation
  float omega = uTime * 0.25 + (18.0 / (new_r + 2.0));
  float s = sin(omega);
  float cos_omega = cos(omega);
  
  vec2 rotatedXY = vec2(
    pos.x * cos_omega - pos.y * s,
    pos.x * s + pos.y * cos_omega
  );
  pos.xy = rotatedXY;

  // Gravitational well
  float A = 150.0;
  float c = 4.5;
  pos.z -= (A / (new_r * 0.35 + c)) * 2.5;

  // Initial Projection to NDC space to find screen distance
  vec4 clipPos = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  vec2 ndcPos = clipPos.xy / clipPos.w;

  // Calculate distance from this vertex to the mouse in screen space, adjusting for aspect ratio
  float mouseDistScreen = length((ndcPos - uMouseNDC) * vec2(uAspect, 1.0));

  // Gravitational Filaments & Screen Space Ripple
  float filament = 0.0;
  if (uModern > 0.5) {
     float threadNoise = snoise(pos.xy * 0.02 + uTime * 0.08);
     filament = smoothstep(0.72, 0.98, abs(threadNoise)) * (1.0 - new_r / max_r);
     pos.z += filament * 12.0;

     // Mouse Ripple based on exactly where the cursor is on screen
     // Lowered the decay multiplier (from 18->6) to spread it out, and widened the waves (40->15)
     float ripple = sin(mouseDistScreen * 15.0 - uTime * 4.0) * exp(-mouseDistScreen * 6.0);
     pos.z += ripple * 10.0;

     // Reproject after modifying Z
     clipPos = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
  
  vFilament = filament;
  
  gl_PointSize = clamp(new_r * 0.22, 1.0, 5.5);
  if (uModern > 0.5) gl_PointSize *= 1.35;

  vDist = new_r;
  vTheta = theta + omega;
  
  // Relativistic Beaming calculation
  vec2 velocity = vec2(-sin(vTheta), cos(vTheta));
  vBeaming = dot(velocity, vec2(1.0, 0.0)); 

  gl_Position = clipPos;
}
`;

const fragmentShader = `
uniform float uModern;
varying float vDist;
varying float vTheta;
varying float vBeaming;
varying float vFilament;
uniform vec3 uCoreColor;
uniform vec3 uEdgeColor;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  
  float alpha = smoothstep(0.5, 0.1, dist);
  // Wider fade-out for immersion
  float fade = smoothstep(0.0, 1.5, vDist) * smoothstep(55.0, 40.0, vDist);
  
  if (uModern > 0.5) {
     fade *= smoothstep(0.5, 2.8, vDist);
  }

  float blendFactor = clamp(pow(vDist / 55.0, 2.4), 0.0, 1.0);
  vec3 color = mix(uCoreColor, uEdgeColor, blendFactor);
  
  float intensity = 1.0 + (1.0 - blendFactor) * 1.5; 
  
  // Inject filament glow
  if (uModern > 0.5) {
    intensity += vFilament * 3.5;
    color = mix(color, uCoreColor, vFilament * 0.6);
  }

  // Relativistic Beaming
  if (uModern > 0.5) {
    intensity *= (1.0 + vBeaming * 0.55);
  }
  
  gl_FragColor = vec4(color * intensity, alpha * fade * 1.5);
}
`;

export function SpacetimeSingularity({
  coreColorHex = '#67e8f9',
  edgeColorHex = '#06111d',
  modern = false,
  speed = 1.0
}: {
  coreColorHex?: string;
  edgeColorHex?: string;
  modern?: boolean;
  speed?: number;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef(speed);

  // Sync speed prop to ref for the animation loop
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  
  const mouseNDCRef = useRef(new THREE.Vector2(-999, -999));

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = null; 

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    // Tilted, wider camera for immersion
    camera.position.set(0, -32, 22);
    camera.lookAt(0, 0, -5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); 
    container.appendChild(renderer.domElement);

    // Large grid for immersive coverage
    const gridSegments = modern ? 160 : 100; 
    const geometry = new THREE.PlaneGeometry(80, 80, gridSegments, gridSegments);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0.0 },
        uModern: { value: modern ? 1.0 : 0.0 },
        uMouseNDC: { value: mouseNDCRef.current },
        uAspect: { value: camera.aspect },
        uCoreColor: { value: new THREE.Color(coreColorHex) },
        uEdgeColor: { value: new THREE.Color(edgeColorHex) }
      }
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let animationFrameId: number;
    const clock = new THREE.Clock();
    const accumulatedTime = { current: 0.0 };

    const animate = () => {
      const delta = clock.getDelta();
      accumulatedTime.current += delta * speedRef.current;
      
      material.uniforms.uTime.value = accumulatedTime.current;
      material.uniforms.uMouseNDC.value = mouseNDCRef.current;
      material.uniforms.uAspect.value = camera.aspect;
      
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    const handleMouseMove = (e: MouseEvent) => {
       if (!container) return;
       const rect = container.getBoundingClientRect();
       mouseNDCRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
       mouseNDCRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    
    const handleMouseLeave = () => {
       // Move out of view when mouse leaves container
       mouseNDCRef.current.set(-999, -999);
    };

    const handleResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      material.uniforms.uAspect.value = camera.aspect;
      renderer.setSize(nw, nh);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
      geometry.dispose();
      material.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [coreColorHex, edgeColorHex, modern]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-[inherit] pointer-events-auto">
      <div ref={mountRef} className="absolute inset-0 z-0" />
      <div 
        className="absolute inset-0 z-10 opacity-90 pointer-events-none" 
        style={{ background: `radial-gradient(ellipse at center, transparent 0%, ${edgeColorHex} 100%)` }}
      />
    </div>
  );
}



