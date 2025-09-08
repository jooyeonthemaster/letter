'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';

// 커스텀 윤슬 셰이더 머티리얼
const ShimmerMaterial = {
  uniforms: {
    time: { value: 0 },
    resolution: { value: new THREE.Vector2() },
    opacity: { value: 0.6 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec2 resolution;
    uniform float opacity;
    varying vec2 vUv;
    
    // 노이즈 함수
    float noise(vec2 p) {
      return sin(p.x * 10.0) * sin(p.y * 10.0);
    }
    
    // 윤슬 패턴 생성
    float caustics(vec2 uv, float time) {
      vec2 p = uv * 8.0;
      
      // 여러 레이어의 웨이브
      float wave1 = sin(p.x + time * 0.5) * sin(p.y + time * 0.3);
      float wave2 = sin(p.x * 1.3 + time * 0.7) * sin(p.y * 0.8 + time * 0.4);
      float wave3 = sin(p.x * 0.7 + time * 0.2) * sin(p.y * 1.5 + time * 0.6);
      
      // 윤슬 효과 조합
      float caustic = (wave1 + wave2 * 0.5 + wave3 * 0.3) * 0.5;
      
      // 더 강한 반짝임을 위한 제곱
      caustic = pow(abs(caustic), 0.8);
      
      return caustic;
    }
    
    void main() {
      vec2 uv = vUv;
      
      // 윤슬 패턴 계산
      float shimmer = caustics(uv, time);
      
      // 부드러운 페이드 효과 (경계선 제거)
      float fade = 1.0 - length(uv - 0.5) * 0.8;
      fade = smoothstep(0.0, 1.0, fade);
      fade = clamp(fade, 0.0, 1.0);
      
      // 최종 색상
      vec3 color = vec3(1.0, 1.0, 1.0) * shimmer * fade;
      
      gl_FragColor = vec4(color, shimmer * fade * opacity);
    }
  `
};

// 윤슬 플레인 컴포넌트
function ShimmerPlane() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: ShimmerMaterial.uniforms,
      vertexShader: ShimmerMaterial.vertexShader,
      fragmentShader: ShimmerMaterial.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -20, 0]}>
      <planeGeometry args={[300, 300, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        attach="material"
        {...shaderMaterial}
        uniforms={shaderMaterial.uniforms}
        vertexShader={shaderMaterial.vertexShader}
        fragmentShader={shaderMaterial.fragmentShader}
        transparent={shaderMaterial.transparent}
        blending={shaderMaterial.blending}
      />
    </mesh>
  );
}

// 부유하는 윤슬 레이어들
function FloatingShimmerLayers() {
  const layer1Ref = useRef<THREE.Mesh>(null!);
  const layer2Ref = useRef<THREE.Mesh>(null!);
  const layer3Ref = useRef<THREE.Mesh>(null!);
  
  const materials = useMemo(() => {
    return [
      new THREE.ShaderMaterial({
        uniforms: { ...ShimmerMaterial.uniforms, opacity: { value: 0.3 } },
        vertexShader: ShimmerMaterial.vertexShader,
        fragmentShader: ShimmerMaterial.fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
      }),
      new THREE.ShaderMaterial({
        uniforms: { ...ShimmerMaterial.uniforms, opacity: { value: 0.2 } },
        vertexShader: ShimmerMaterial.vertexShader,
        fragmentShader: ShimmerMaterial.fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
      }),
      new THREE.ShaderMaterial({
        uniforms: { ...ShimmerMaterial.uniforms, opacity: { value: 0.15 } },
        vertexShader: ShimmerMaterial.vertexShader,
        fragmentShader: ShimmerMaterial.fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
      })
    ];
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // 각 레이어의 시간 업데이트
    materials.forEach((material, index) => {
      material.uniforms.time.value = time * (0.5 + index * 0.2);
    });
    
    // 부드러운 움직임
    if (layer1Ref.current) {
      layer1Ref.current.position.y = Math.sin(time * 0.3) * 2;
      layer1Ref.current.rotation.z = time * 0.1;
    }
    
    if (layer2Ref.current) {
      layer2Ref.current.position.y = Math.sin(time * 0.4 + 1) * 3;
      layer2Ref.current.rotation.z = -time * 0.08;
    }
    
    if (layer3Ref.current) {
      layer3Ref.current.position.y = Math.sin(time * 0.2 + 2) * 1.5;
      layer3Ref.current.rotation.z = time * 0.05;
    }
  });

  return (
    <>
      {/* 첫 번째 윤슬 레이어 */}
      <mesh ref={layer1Ref} position={[0, 10, -40]}>
        <planeGeometry args={[150, 150, 1, 1]} />
        <primitive object={materials[0]} attach="material" />
      </mesh>
      
      {/* 두 번째 윤슬 레이어 */}
      <mesh ref={layer2Ref} position={[30, 5, -60]}>
        <planeGeometry args={[120, 120, 1, 1]} />
        <primitive object={materials[1]} attach="material" />
      </mesh>
      
      {/* 세 번째 윤슬 레이어 */}
      <mesh ref={layer3Ref} position={[-20, 0, -50]}>
        <planeGeometry args={[180, 180, 1, 1]} />
        <primitive object={materials[2]} attach="material" />
      </mesh>
    </>
  );
}

// 메인 윤슬 배경 컴포넌트
export default function ShimmerBackground() {
  return (
    <div className="absolute inset-0 z-0">
      {/* CSS 기반 물결 배경 */}
      <div className="absolute inset-0 bg-black">
        {/* 물결 애니메이션 레이어 1 */}
        <div 
          className="absolute inset-0 opacity-8"
          style={{
            background: `
              radial-gradient(ellipse 1200px 400px at 50% 90%, rgba(255, 255, 255, 0.08) 0%, transparent 70%),
              radial-gradient(ellipse 900px 250px at 20% 50%, rgba(255, 255, 255, 0.04) 0%, transparent 70%),
              radial-gradient(ellipse 700px 180px at 80% 30%, rgba(255, 255, 255, 0.06) 0%, transparent 70%)
            `,
            animation: 'shimmerWave1 8s ease-in-out infinite'
          }}
        />
        
        {/* 물결 애니메이션 레이어 2 */}
        <div 
          className="absolute inset-0 opacity-6"
          style={{
            background: `
              radial-gradient(ellipse 1400px 500px at 30% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 80%),
              radial-gradient(ellipse 1000px 300px at 70% 40%, rgba(255, 255, 255, 0.03) 0%, transparent 80%)
            `,
            animation: 'shimmerWave2 12s ease-in-out infinite reverse'
          }}
        />
        
        {/* 물결 애니메이션 레이어 3 */}
        <div 
          className="absolute inset-0 opacity-4"
          style={{
            background: `
              radial-gradient(ellipse 800px 220px at 60% 70%, rgba(255, 255, 255, 0.02) 0%, transparent 90%)
            `,
            animation: 'shimmerWave3 15s ease-in-out infinite'
          }}
        />
      </div>
      
      {/* Three.js 윤슬 효과 */}
      <Canvas
        camera={{ 
          position: [0, 25, 40], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        style={{ 
          background: 'transparent',
          pointerEvents: 'none'
        }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance"
        }}
      >
        {/* 부드러운 환경광 */}
        <ambientLight intensity={0.2} color="#ffffff" />
        
        {/* 메인 윤슬 플레인 */}
        <ShimmerPlane />
        
        {/* 부유하는 윤슬 레이어들 */}
        <FloatingShimmerLayers />
      </Canvas>
      
      {/* CSS 키프레임 애니메이션 */}
      <style jsx>{`
        @keyframes shimmerWave1 {
          0%, 100% {
            transform: translateX(0px) translateY(0px) scale(1);
            opacity: 0.1;
          }
          25% {
            transform: translateX(20px) translateY(-10px) scale(1.05);
            opacity: 0.15;
          }
          50% {
            transform: translateX(-10px) translateY(15px) scale(0.95);
            opacity: 0.08;
          }
          75% {
            transform: translateX(15px) translateY(-5px) scale(1.02);
            opacity: 0.12;
          }
        }
        
        @keyframes shimmerWave2 {
          0%, 100% {
            transform: translateX(0px) translateY(0px) rotate(0deg);
            opacity: 0.08;
          }
          33% {
            transform: translateX(-15px) translateY(20px) rotate(1deg);
            opacity: 0.12;
          }
          66% {
            transform: translateX(25px) translateY(-15px) rotate(-1deg);
            opacity: 0.06;
          }
        }
        
        @keyframes shimmerWave3 {
          0%, 100% {
            transform: translateX(0px) translateY(0px) scale(1) rotate(0deg);
            opacity: 0.06;
          }
          50% {
            transform: translateX(30px) translateY(25px) scale(1.1) rotate(2deg);
            opacity: 0.1;
          }
        }
      `}</style>
    </div>
  );
}
