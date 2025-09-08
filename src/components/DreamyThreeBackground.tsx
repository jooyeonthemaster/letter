'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, Sphere, Environment } from '@react-three/drei';
import * as THREE from 'three';

// 몽환적인 파티클 필드 컴포넌트
function DreamyParticleField() {
  const ref = useRef<THREE.Points>(null!);
  const particlesRef = useRef<THREE.Points>(null!);
  const shimmerRef = useRef<THREE.Points>(null!);
  
  // 메인 파티클 위치 생성 (별빛 효과)
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(3000 * 3);
    const colors = new Float32Array(3000 * 3);
    
    for (let i = 0; i < 3000; i++) {
      // 3D 공간에 랜덤하게 분산
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
      
      // 흰색 계열의 색상 (약간의 변화)
      const intensity = Math.random() * 0.3 + 0.7; // 0.7 ~ 1.0
      colors[i * 3] = intensity; // R
      colors[i * 3 + 1] = intensity; // G  
      colors[i * 3 + 2] = intensity + Math.random() * 0.1; // B (약간 푸른빛)
    }
    
    return [positions, colors];
  }, []);

  // 윤슬 효과용 파티클 (더 크고 반짝임)
  const [shimmerPositions, shimmerColors] = useMemo(() => {
    const positions = new Float32Array(800 * 3);
    const colors = new Float32Array(800 * 3);
    
    for (let i = 0; i < 800; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 150;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 150;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 150;
      
      // 순백색에 가까운 윤슬
      const white = Math.random() * 0.1 + 0.9;
      colors[i * 3] = white;
      colors[i * 3 + 1] = white;
      colors[i * 3 + 2] = white;
    }
    
    return [positions, colors];
  }, []);

  // 부유하는 파티클 (중간 크기)
  const [floatingPositions, floatingColors] = useMemo(() => {
    const positions = new Float32Array(1200 * 3);
    const colors = new Float32Array(1200 * 3);
    
    for (let i = 0; i < 1200; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 180;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 180;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 180;
      
      // 약간 투명한 흰색
      const opacity = Math.random() * 0.4 + 0.6;
      colors[i * 3] = opacity;
      colors[i * 3 + 1] = opacity;
      colors[i * 3 + 2] = opacity + Math.random() * 0.2;
    }
    
    return [positions, colors];
  }, []);

  // 애니메이션
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // 메인 파티클 회전 (매우 느리게)
    if (ref.current) {
      ref.current.rotation.x = time * 0.02;
      ref.current.rotation.y = time * 0.015;
      ref.current.rotation.z = time * 0.01;
    }

    // 윤슬 파티클 반짝임 효과
    if (shimmerRef.current) {
      shimmerRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
      shimmerRef.current.rotation.y = time * 0.03;
      shimmerRef.current.rotation.z = Math.cos(time * 0.3) * 0.05;
    }

    // 부유 파티클 물결 효과
    if (particlesRef.current) {
      particlesRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
      particlesRef.current.rotation.y = time * 0.025;
      particlesRef.current.rotation.z = Math.cos(time * 0.4) * 0.08;
    }
  });

  return (
    <>
      {/* 메인 별빛 파티클 */}
      <Points ref={ref} positions={positions} colors={colors}>
        <PointMaterial
          transparent
          vertexColors
          size={0.8}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      {/* 윤슬 효과 파티클 */}
      <Points ref={shimmerRef} positions={shimmerPositions} colors={shimmerColors}>
        <PointMaterial
          transparent
          vertexColors
          size={2.5}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      {/* 부유하는 중간 파티클 */}
      <Points ref={particlesRef} positions={floatingPositions} colors={floatingColors}>
        <PointMaterial
          transparent
          vertexColors
          size={1.2}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </>
  );
}

// 몽환적인 기하학적 형태들
function DreamyGeometry() {
  const meshRef = useRef<THREE.Group>(null!);
  const sphere1Ref = useRef<THREE.Mesh>(null!);
  const sphere2Ref = useRef<THREE.Mesh>(null!);
  const sphere3Ref = useRef<THREE.Mesh>(null!);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (meshRef.current) {
      meshRef.current.rotation.x = time * 0.05;
      meshRef.current.rotation.y = time * 0.03;
      meshRef.current.rotation.z = time * 0.02;
    }

    // 개별 구체들의 독립적인 움직임
    if (sphere1Ref.current) {
      sphere1Ref.current.position.y = Math.sin(time * 0.3) * 5;
      sphere1Ref.current.rotation.z = time * 0.4;
    }

    if (sphere2Ref.current) {
      sphere2Ref.current.position.x = Math.cos(time * 0.2) * 8;
      sphere2Ref.current.rotation.y = time * 0.3;
    }

    if (sphere3Ref.current) {
      sphere3Ref.current.position.z = Math.sin(time * 0.4) * 6;
      sphere3Ref.current.rotation.x = time * 0.5;
    }
  });

  return (
    <group ref={meshRef}>
      {/* 와이어프레임 구체들 - 매우 투명하고 몽환적 */}
      <mesh ref={sphere1Ref} position={[20, 10, -30]}>
        <sphereGeometry args={[3, 16, 16]} />
        <meshBasicMaterial 
          color="#ffffff" 
          wireframe 
          transparent 
          opacity={0.08}
        />
      </mesh>
      
      <mesh ref={sphere2Ref} position={[-25, -8, 20]}>
        <sphereGeometry args={[2.5, 12, 12]} />
        <meshBasicMaterial 
          color="#f0f8ff" 
          wireframe 
          transparent 
          opacity={0.06}
        />
      </mesh>
      
      <mesh ref={sphere3Ref} position={[0, 15, -15]}>
        <sphereGeometry args={[4, 20, 20]} />
        <meshBasicMaterial 
          color="#ffffff" 
          wireframe 
          transparent 
          opacity={0.05}
        />
      </mesh>

      {/* 추가적인 기하학적 형태들 */}
      <mesh position={[-15, 5, 10]}>
        <torusGeometry args={[3, 0.8, 8, 16]} />
        <meshBasicMaterial 
          color="#ffffff" 
          wireframe 
          transparent 
          opacity={0.04}
        />
      </mesh>

      <mesh position={[30, -10, -5]}>
        <octahedronGeometry args={[2]} />
        <meshBasicMaterial 
          color="#f8f8ff" 
          wireframe 
          transparent 
          opacity={0.06}
        />
      </mesh>
    </group>
  );
}

// 안개와 깊이감을 위한 컴포넌트
function DreamyFog() {
  const { scene } = useThree();
  
  useEffect(() => {
    // 매우 부드러운 안개 효과
    scene.fog = new THREE.Fog('#000000', 50, 200);
    
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  return null;
}

// 메인 몽환적 배경 컴포넌트
export default function DreamyThreeBackground() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ 
          position: [0, 0, 50], 
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
        {/* 매우 부드러운 환경광 */}
        <ambientLight intensity={0.1} color="#ffffff" />
        
        {/* 포인트 라이트로 미세한 조명 */}
        <pointLight position={[10, 10, 10]} intensity={0.3} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.2} color="#f0f8ff" />
        
        {/* 안개 효과 */}
        <DreamyFog />
        
        {/* 몽환적 파티클 필드 */}
        <DreamyParticleField />
        
        {/* 몽환적 기하학적 형태 */}
        <DreamyGeometry />
      </Canvas>
    </div>
  );
}
