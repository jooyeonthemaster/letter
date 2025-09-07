'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// 파티클 시스템 컴포넌트
function ParticleField() {
  const ref = useRef<THREE.Points>(null!);
  
  // 파티클 위치 생성
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(2000 * 3);
    const colors = new Float32Array(2000 * 3);
    
    for (let i = 0; i < 2000; i++) {
      // 랜덤한 3D 위치
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      
      // 회색톤 색상
      const gray = Math.random() * 0.3 + 0.2;
      colors[i * 3] = gray;
      colors[i * 3 + 1] = gray;
      colors[i * 3 + 2] = gray;
    }
    
    return [positions, colors];
  }, []);

  // 애니메이션
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.05;
      ref.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  return (
    <Points ref={ref} positions={positions} colors={colors}>
      <PointMaterial
        transparent
        vertexColors
        size={0.5}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.3}
      />
    </Points>
  );
}

// 기하학적 형태들
function FloatingGeometry() {
  const meshRef = useRef<THREE.Group>(null!);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.1;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <group ref={meshRef}>
      {/* 와이어프레임 구 */}
      <mesh position={[10, 5, -10]}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial 
          color="#333333" 
          wireframe 
          transparent 
          opacity={0.1} 
        />
      </mesh>
      
      {/* 와이어프레임 정육면체 */}
      <mesh position={[-8, -3, 5]}>
        <boxGeometry args={[3, 3, 3]} />
        <meshBasicMaterial 
          color="#666666" 
          wireframe 
          transparent 
          opacity={0.1} 
        />
      </mesh>
      
      {/* 와이어프레임 토러스 */}
      <mesh position={[0, 8, -5]}>
        <torusGeometry args={[2, 0.5, 8, 16]} />
        <meshBasicMaterial 
          color="#444444" 
          wireframe 
          transparent 
          opacity={0.08} 
        />
      </mesh>
    </group>
  );
}

// 메인 3D 배경 컴포넌트
export default function ThreeBackground() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ 
          position: [0, 0, 30], 
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        style={{ 
          background: 'transparent',
          pointerEvents: 'none'
        }}
      >
        {/* 환경광 */}
        <ambientLight intensity={0.3} />
        
        {/* 파티클 필드 */}
        <ParticleField />
        
        {/* 떠다니는 기하학적 형태 */}
        <FloatingGeometry />
        
        {/* 안개 효과 */}
        <fog attach="fog" args={['#f8f9fa', 30, 100]} />
      </Canvas>
    </div>
  );
}