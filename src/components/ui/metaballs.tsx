"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// Optimized shader - represents "compounding" through growing, merging forms
const fragmentShader = `
  precision mediump float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;

  varying vec2 vUv;

  // Simple smooth min
  float smin(float a, float b, float k) {
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * k * 0.25;
  }

  // Simple sphere
  float sphere(vec3 p, float r) {
    return length(p) - r;
  }

  // Scene: Dynamic compound forms
  float scene(vec3 p) {
    float t = uTime * 1.2; // Faster!

    // Mouse influence
    p.x += (uMouse.x - 0.5) * 0.2;
    p.y += (uMouse.y - 0.5) * 0.15;

    // Breathing core with fast pulse
    float pulse = sin(t * 3.0) * 0.04;
    float core = sphere(p, 0.22 + pulse);

    // Dynamic orbiter 1 - fast elliptical path
    vec3 p2 = p;
    p2.x += sin(t * 1.4) * 0.35 + cos(t * 2.1) * 0.1;
    p2.y += cos(t * 1.2) * 0.25;
    p2.z += sin(t * 0.9) * 0.15;
    float orb1 = sphere(p2, 0.16 + sin(t * 2.5) * 0.03);

    // Dynamic orbiter 2 - counter rotation
    vec3 p3 = p;
    p3.x += cos(t * 1.6) * 0.3;
    p3.y += sin(t * 1.8) * 0.2 + cos(t * 2.4) * 0.1;
    p3.z += cos(t * 1.1) * 0.2;
    float orb2 = sphere(p3, 0.14 + cos(t * 2.8) * 0.025);

    // Small fast particle
    vec3 p4 = p;
    p4.x += sin(t * 2.5) * 0.4;
    p4.y += cos(t * 2.2) * 0.3;
    p4.z += sin(t * 1.8) * 0.25;
    float particle = sphere(p4, 0.08 + sin(t * 4.0) * 0.02);

    // Compound everything
    float d = smin(core, orb1, 0.3);
    d = smin(d, orb2, 0.28);
    d = smin(d, particle, 0.25);

    return d;
  }

  // Fast normal calculation
  vec3 normal(vec3 p) {
    vec2 e = vec2(0.002, 0.0);
    return normalize(vec3(
      scene(p + e.xyy) - scene(p - e.xyy),
      scene(p + e.yxy) - scene(p - e.yxy),
      scene(p + e.yyx) - scene(p - e.yyx)
    ));
  }

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= uResolution.x / uResolution.y;

    vec3 ro = vec3(0.0, 0.0, 2.0);
    vec3 rd = normalize(vec3(uv, -1.2));

    // Optimized ray march - only 32 steps
    float t = 0.0;
    bool hit = false;

    for(int i = 0; i < 32; i++) {
      float d = scene(ro + rd * t);
      if(d < 0.005) { hit = true; break; }
      if(t > 4.0) break;
      t += d;
    }

    // Transparent background
    if(!hit) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }

    vec3 p = ro + rd * t;
    vec3 n = normal(p);
    vec3 v = -rd;

    // Dynamic lighting
    float fres = pow(1.0 - max(dot(v, n), 0.0), 2.2);

    vec3 l1 = normalize(vec3(0.5, 0.7, 0.5));
    vec3 l2 = normalize(vec3(-0.6, 0.3, 0.6));

    float diff1 = max(dot(n, l1), 0.0);
    float diff2 = max(dot(n, l2), 0.0) * 0.4;
    float spec = pow(max(dot(reflect(-l1, n), v), 0.0), 48.0);

    // Muted with sage green accent (brand color)
    vec3 base = vec3(0.05, 0.055, 0.055);
    vec3 mid = vec3(0.10, 0.12, 0.11);
    vec3 rim = vec3(0.29, 0.42, 0.34); // Sage green accent

    vec3 color = base;
    color += mid * (diff1 + diff2);
    color += rim * fres * 0.7;
    color += rim * pow(fres, 4.0) * 0.4;
    color += vec3(0.95, 0.92, 0.90) * spec * 0.5;

    gl_FragColor = vec4(color, 0.95);
  }
`;

function MetaballScene() {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouse = useRef(new THREE.Vector2(0.5, 0.5));
  const { size } = useThree();

  // Create uniforms once - never recreate on resize
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
  }), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = state.clock.elapsedTime;

    // Update resolution on every frame to handle resize
    mat.uniforms.uResolution.value.set(size.width, size.height);

    mouse.current.x += ((state.pointer.x + 1) / 2 - mouse.current.x) * 0.05;
    mouse.current.y += ((state.pointer.y + 1) / 2 - mouse.current.y) * 0.05;
    mat.uniforms.uMouse.value.copy(mouse.current);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
}

interface MetaballsProps {
  className?: string;
}

type FrameLoop = "always" | "demand" | "never";

// Memoised: the hero re-renders on every headline rotation, the artwork needn't.
export const Metaballs = memo(function Metaballs({ className }: MetaballsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  // Render only while the artwork is on screen; with reduced motion, draw a
  // single still frame (and redraw only on resize).
  const [frameloop, setFrameloop] = useState<FrameLoop>("always");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let onScreen = true;
    const update = () => setFrameloop(reduce.matches ? "demand" : onScreen ? "always" : "never");
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      update();
    });
    io.observe(root);
    reduce.addEventListener("change", update);
    update();
    return () => {
      io.disconnect();
      reduce.removeEventListener("change", update);
    };
  }, []);

  return (
    <div ref={rootRef} className={className}>
      <Canvas
        frameloop={frameloop}
        // By default the canvas re-measures its page position on every
        // scroll (re-rendering ~20 times a second). Only page-coordinate
        // pointer events need that; the pointer here is canvas-relative.
        resize={{ scroll: false }}
        camera={{ position: [0, 0, 1] }}
        dpr={[1, 1.5]} // Lower DPR for performance
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "default", // decorative: don't wake a discrete GPU
          stencil: false,
          depth: false,
        }}
        style={{ background: 'transparent' }}
      >
        <MetaballScene />
      </Canvas>
    </div>
  );
});
