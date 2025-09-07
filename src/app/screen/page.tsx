'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { connectSocket, disconnectSocket } from '@/lib/socket';

// Three.js 컴포넌트를 동적으로 로드 (SSR 방지) - 에러 방지를 위해 제거
// const ThreeBackground = dynamic(() => import('@/components/ThreeBackground').catch(() => ({ default: () => null })), {
//   ssr: false,
//   loading: () => null
// });

interface FloatingMessage {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  hasLanded: boolean;
  finalY: number;
  rotation: number;
}

interface FloatingDrawing {
  id: string;
  imageData: string;
  x: number;
  y: number;
  scale: number;
  hasLanded: boolean;
  finalY: number;
  rotation: number;
}

export default function ScreenPage() {
  const [messages, setMessages] = useState<FloatingMessage[]>([]);
  const [drawings, setDrawings] = useState<FloatingDrawing[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  // 성능 최적화: 최대 표시 개수 제한
  const MAX_DRAWINGS = 15; // 최대 15개 그림만 표시
  const MAX_MESSAGES = 10; // 최대 10개 메시지만 표시

  // 종이 충돌 감지 및 쌓임 위치 계산 (현재 미사용)
  // const calculateStackPosition = (newX: number, newY: number, paperWidth: number = 180, paperHeight: number = 70) => {
  //   const allPapers = [...messages, ...drawings].filter(item => item.hasLanded);
  //   let finalX = newX;
  //   let finalY = newY;
  //   let stackHeight = 0;
  //   // ... 기타 로직
  //   return { finalX, finalY, stackHeight };
  // };

  // 클라이언트 사이드에서만 실행되도록 보장
  useEffect(() => {
    setIsClient(true);
  }, []);

  const colors = [
    'text-gray-800',
    'text-gray-900', 
    'text-black',
    'text-gray-700',
    'text-gray-600'
  ];

  const addMessage = (text: string) => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    
    // 완전 랜덤 위치 생성 (timestamp 기반)
    const seed1 = timestamp % 9973; // 큰 소수
    const seed2 = (timestamp * 7919) % 9967; // 다른 큰 소수
    const seed3 = (timestamp * 7901) % 9949; // 또 다른 큰 소수
    const seed4 = Math.floor(timestamp / 1000) % 9941; // 시간 기반 추가 시드
    
    // 완전 분산된 위치 계산
    const x = ((seed1 * 37 + seed2 * 23 + seed3 * 11 + seed4 * 5) % 85) + 5; // 5% ~ 90%
    const y = ((seed2 * 59 + seed1 * 29 + seed3 * 13 + seed4 * 9) % 85) + 5; // 5% ~ 90%
    
    const newMessage: FloatingMessage = {
      id: `msg-${timestamp}-${randomSuffix}`,
      text,
      x: x,
      y: y,
      color: colors[seed1 % colors.length],
      hasLanded: false,
      finalY: 0,
      rotation: 0
    };

    setMessages(prev => {
      const updated = [...prev, newMessage];
      // 성능 최적화: 최대 개수 초과시 오래된 것 제거
      if (updated.length > MAX_MESSAGES) {
        return updated.slice(-MAX_MESSAGES);
      }
      return updated;
    });
  };

  const addDrawing = (imageData: string, savedPosition?: { x: number; y: number; scale: number }) => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    
    let x, y, scale;
    
    if (savedPosition) {
      // 기존 그림의 저장된 위치 사용
      x = savedPosition.x;
      y = savedPosition.y;
      scale = savedPosition.scale;
      console.log('기존 그림 위치 복원:', { x, y, scale });
    } else {
      // 새 그림을 위한 진짜 랜덤 위치 생성
      const crypto = window.crypto || (window as Window & { msCrypto?: Crypto }).msCrypto;
      const array = new Uint32Array(4);
      crypto.getRandomValues(array);
      
      // 진짜 랜덤 시드 생성
      const seed1 = array[0] % 10000;
      const seed2 = array[1] % 10000; 
      const seed3 = array[2] % 10000;
      const seed4 = array[3] % 10000;
      
      // 화면 전체에 완전 분산된 위치 계산 (0% ~ 100% 범위)
      x = (seed1 * 0.01) % 95 + 2.5; // 2.5% ~ 97.5%
      y = (seed2 * 0.01) % 95 + 2.5; // 2.5% ~ 97.5%
      scale = (seed3 % 40) / 100 + 0.6; // 0.6 ~ 1.0 배율
      
      console.log('새 그림 랜덤 위치 생성:', { x, y, scale, seeds: [seed1, seed2, seed3, seed4] });
    }
    
    const newDrawing: FloatingDrawing = {
      id: `draw-${timestamp}-${randomSuffix}`,
      imageData,
      x: x,
      y: y,
      scale: scale,
      hasLanded: false,
      finalY: 0,
      rotation: 0
    };

    setDrawings(prev => {
      const updated = [...prev, newDrawing];
      // 성능 최적화: 최대 개수 초과시 오래된 것 제거
      if (updated.length > MAX_DRAWINGS) {
        return updated.slice(-MAX_DRAWINGS);
      }
      return updated;
    });
  };

  // Socket.io 연결 및 실시간 메시지/그림 수신
  useEffect(() => {
    const socket = connectSocket();
    
    socket.on('connect', () => {
      console.log('스크린: Socket 연결됨');
    });

    socket.on('new-message', (data) => {
      console.log('스크린 페이지: 새 메시지 수신:', data);
      addMessage(data.text);
    });

    socket.on('new-drawing', (data) => {
      console.log('스크린 페이지: 새 그림 수신:', data);
      addDrawing(data.imageData, data.position);
    });

    // 기존 메시지들을 받는 이벤트
    socket.on('existing-messages', (existingMessages: { id: string; text: string; timestamp: string }[]) => {
      console.log('기존 메시지들 수신:', existingMessages.length);
      existingMessages.forEach((msgData) => {
        addMessage(msgData.text);
      });
    });

    // 기존 그림들을 받는 이벤트
    socket.on('existing-drawings', (existingDrawings: { id: string; imageData: string; timestamp: string; position?: { x: number; y: number; scale: number } }[]) => {
      console.log('기존 그림들 수신:', existingDrawings.length);
      existingDrawings.forEach((drawData) => {
        addDrawing(drawData.imageData, drawData.position);
      });
    });

    socket.on('disconnect', () => {
      console.log('스크린: Socket 연결 해제됨');
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden relative"
         style={{ minHeight: '100vh', height: '100dvh' }}>
      
      {/* Three.js 3D 배경 - 에러 방지를 위해 임시 제거 */}
      {/* <ThreeBackground /> */}
      
      {/* 몽환적인 우주 배경 효과 */}
      <div className="absolute inset-0">
        {/* 우주 먼지 효과 */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, rgba(255, 255, 0, 0.03) 0%, transparent 70%)',
        }} />
        
        {/* 별빛 효과 - 성능 최적화로 개수 감소 */}
        {Array.from({ length: 50 }).map((_, i) => {
          const x = (i * 37 + 13) % 100;
          const y = (i * 53 + 23) % 100;
          const size = (i % 3) + 0.5;
          const delay = (i % 5);
          
          return (
            <motion.div
              key={`star-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${size}px`,
                height: `${size}px`,
                background: '#FFD700',
                boxShadow: `0 0 ${size * 4}px #FFD700`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3 + (i % 3),
                repeat: Infinity,
                delay: delay,
                ease: "easeInOut"
              }}
            />
          );
        })}
        
        {/* 플로팅 네온 파티클 - 성능 최적화로 개수 감소 */}
        {Array.from({ length: 15 }).map((_, i) => {
          const seedX = (i * 47) % 100;
          const seedY = (i * 83) % 100;
          const duration = (i % 6) + 8;
          const size = (i % 4) + 2;
          const xMovement = (i * 13) % 40 - 20;
          const yMovement = (i * 17) % 40 - 20;
          
          return (
            <motion.div
              key={`particle-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${seedX}%`,
                top: `${seedY}%`,
                width: `${size}px`,
                height: `${size}px`,
                background: 'rgba(255, 215, 0, 0.6)',
                boxShadow: `0 0 ${size * 6}px rgba(255, 215, 0, 0.8)`,
                filter: 'blur(0.5px)',
              }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [0.8, 1.2, 0.8],
                x: [0, xMovement, -xMovement/2, xMovement],
                y: [0, yMovement, -yMovement/2, yMovement]
              }}
              transition={{
                duration: duration,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          );
        })}
      </div>
      
      {/* 떠다니는 네온 메시지들 */}
      <AnimatePresence>
        {messages.map((message, index) => {
          // 각 메시지마다 고유한 경로 생성
          const pathSeed = parseInt(message.id.slice(-6), 36);
          const path1X = ((pathSeed * 17 + index * 23) % 80) + 10;
          const path2X = ((pathSeed * 31 + index * 41) % 80) + 10;
          const path3X = ((pathSeed * 47 + index * 53) % 80) + 10;
          const path1Y = ((pathSeed * 19 + index * 29) % 80) + 10;
          const path2Y = ((pathSeed * 37 + index * 43) % 80) + 10;
          const path3Y = ((pathSeed * 59 + index * 61) % 80) + 10;
          
          return (
          <motion.div
            key={message.id}
            initial={{ 
              scale: 0,
              opacity: 0,
              x: `${path1X}%`,
              y: `${path1Y}%`
            }}
            animate={{ 
              scale: [0, 1.2, 0.8, 1, 0.9, 1.1, 1],
              opacity: [0, 1, 0.8, 1, 0.9, 1],
              x: [
                `${path1X}%`,
                `${path2X}%`, 
                `${path3X}%`,
                `${((path1X + path2X) / 2) % 90 + 5}%`,
                `${((path2X + path3X) / 2) % 90 + 5}%`,
                `${path1X}%`
              ],
              y: [
                `${path1Y}%`,
                `${path2Y}%`,
                `${path3Y}%`,
                `${((path1Y + path2Y) / 2) % 90 + 5}%`,
                `${((path2Y + path3Y) / 2) % 90 + 5}%`,
                `${path1Y}%`
              ],
              rotate: [0, 15, -10, 20, -8, 12, -5]
            }}
            transition={{
              duration: 25 + (index % 15),
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="absolute pointer-events-none select-none z-20"
          >
            {/* 네온 글로우 텍스트 */}
            <div className="relative">
              <p className="text-2xl font-bold relative z-10 px-4 py-2"
                 style={{
                   color: '#FFD700',
                   textShadow: `
                     0 0 5px #FFD700,
                     0 0 10px #FFD700,
                     0 0 15px #FFD700,
                     0 0 20px #FFD700,
                     0 0 25px #FFD700
                   `,
                   filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))'
                 }}>
                {message.text}
              </p>
              
              {/* 추가 글로우 효과 */}
              <div className="absolute inset-0 rounded-lg"
                   style={{
                     background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
                     filter: 'blur(10px)',
                   }} />
            </div>
          </motion.div>
        );
        })}
      </AnimatePresence>

      {/* 떠다니는 네온 그림들 */}
      <AnimatePresence>
        {drawings.map((drawing, index) => {
          // addDrawing에서 계산한 실제 랜덤 위치 사용
          const baseX = drawing.x; // 5% ~ 90% 범위
          const baseY = drawing.y; // 5% ~ 90% 범위
          
          // 디버깅: 실제 사용되는 위치 값 확인
          console.log(`그림 ${index} 애니메이션 위치:`, { 
            baseX, baseY, 
            drawingId: drawing.id,
            isUndefined: baseX === undefined || baseY === undefined 
          });
          
          // 현재는 단순한 부유 애니메이션만 사용 (복잡한 경로 계산은 미사용)
          
          return (
          <motion.div
            key={drawing.id}
            initial={{ 
              scale: 0,
              opacity: 0,
              rotate: 0
            }}
            animate={{
              scale: [0, 1.3, 0.7, drawing.scale, 0.8, 1.1, drawing.scale, 0.9, 1.2, drawing.scale],
              opacity: [0, 1, 0.6, 1, 0.8, 1, 0.7, 1, 0.9, 1],
              rotate: [0, 25, -20, 35, -15, 30, -10, 18, -25, 15, 0],
              x: [0, 20, -15, 30, -25, 35, -10, 25, -20, 0],
              y: [0, -30, 20, -25, 35, -15, 30, -20, 25, 0]
            }}
            transition={{
              duration: 20 + (index % 15), // 속도 최적화
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
              // 개별 속성별 transition 제거로 성능 향상
            }}
            className="absolute pointer-events-none select-none z-15"
            style={{
              left: `${baseX}%`,
              top: `${baseY}%`,
            }}
          >
            {/* 네온 글로우 그림 */}
            <div className="relative">
              {/* 외부 글로우 */}
              <div className="absolute inset-0 rounded-lg"
                   style={{
                     background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.3) 0%, rgba(255, 215, 0, 0.1) 50%, transparent 80%)',
                     filter: 'blur(15px)',
                     transform: 'scale(1.5)',
                   }} />
              
              {/* 그림 자체 */}
              <img 
                src={drawing.imageData} 
                alt="User drawing"
                className="relative z-10 rounded-lg w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain"
                style={{
                  filter: `
                    drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))
                    drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))
                    drop-shadow(0 0 30px rgba(255, 215, 0, 0.4))
                    brightness(1.2)
                    contrast(1.1)
                  `,
                  mixBlendMode: 'screen'
                }}
              />
              
              {/* 내부 글로우 */}
              <div className="absolute inset-0 rounded-lg pointer-events-none"
                   style={{
                     background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.05) 0%, transparent 60%)',
                     filter: 'blur(5px)',
                   }} />
            </div>
          </motion.div>
        );
        })}
      </AnimatePresence>
      
      {/* 네온 제목 */}
      <motion.div 
        className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center z-30"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2 }}
      >
        <h1 className="text-6xl font-bold mb-4 tracking-wide"
            style={{
              color: '#FFD700',
              textShadow: `
                0 0 5px #FFD700,
                0 0 10px #FFD700
              `,
              filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))'
            }}>
          보이는 것보다 선명한
        </h1>
        <p className="text-xl font-medium"
           style={{
             color: '#FFD700',
             textShadow: `
               0 0 3px #FFD700,
               0 0 6px #FFD700
             `,
             opacity: 0.7
           }}>
          여러분의 창작물이 우주를 떠돕니다
        </p>
      </motion.div>
      
      {/* 네온 하단 정보 */}
      <motion.div 
        className="absolute bottom-8 left-8 text-sm z-30 p-4 rounded-lg"
        style={{
          background: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.2)'
        }}
        animate={{
          boxShadow: [
            '0 0 20px rgba(255, 215, 0, 0.2)',
            '0 0 30px rgba(255, 215, 0, 0.4)',
            '0 0 20px rgba(255, 215, 0, 0.2)'
          ]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <p style={{ 
          color: '#FFD700', 
          textShadow: '0 0 10px #FFD700',
          marginBottom: '8px'
        }}>
          💬 터치 페이지에서 메시지 입력
        </p>
        <p style={{ 
          color: '#FFD700', 
          textShadow: '0 0 10px #FFD700'
        }}>
          🎨 그리기 페이지에서 작품 제작
        </p>
      </motion.div>

      <motion.div 
        className="absolute bottom-8 right-8 text-sm z-30 p-4 rounded-lg"
        style={{
          background: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.2)'
        }}
        animate={{
          boxShadow: [
            '0 0 20px rgba(255, 215, 0, 0.2)',
            '0 0 30px rgba(255, 215, 0, 0.4)',
            '0 0 20px rgba(255, 215, 0, 0.2)'
          ]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5
        }}
      >
        <p style={{ 
          color: '#FFD700', 
          textShadow: '0 0 10px #FFD700',
          marginBottom: '8px'
        }}>
          실시간 인터랙티브 체험
        </p>
        <p style={{ 
          color: '#FFD700', 
          textShadow: '0 0 10px #FFD700'
        }}>
          창작물들이 우주를 떠돕니다
        </p>
      </motion.div>
    </div>
  );
}