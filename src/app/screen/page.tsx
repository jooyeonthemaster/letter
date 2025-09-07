'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import dynamic from 'next/dynamic';

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
  const [windowHeight, setWindowHeight] = useState(800);

  // 종이 충돌 감지 및 쌓임 위치 계산
  const calculateStackPosition = (newX: number, newY: number, paperWidth: number = 180, paperHeight: number = 70) => {
    const allPapers = [...messages, ...drawings].filter(item => item.hasLanded);
    let finalX = newX;
    let finalY = newY;
    let stackHeight = 0;

    // 해당 위치 근처에 있는 종이들 찾기
    const nearbyPapers = allPapers.filter(paper => {
      const distance = Math.sqrt(
        Math.pow(paper.x - newX, 2) + Math.pow(paper.finalY - newY, 2)
      );
      return distance < 150; // 150px 반경 내의 종이들
    });

    if (nearbyPapers.length > 0) {
      // 가장 높은 종이 위에 쌓기
      const highestPaper = nearbyPapers.reduce((highest, current) => 
        (current.finalY < highest.finalY) ? current : highest
      );
      
      stackHeight = nearbyPapers.length;
      finalY = highestPaper.finalY - (paperHeight * 0.7) - (stackHeight * 8); // 70% 겹침 + 쌓임 높이
      
      // X 위치도 약간 조정 (완전히 겹치지 않게)
      finalX = newX + (stackHeight % 3) * 15 - 15; // -15 ~ 15px 범위로 조정
    }

    return { finalX, finalY, stackHeight };
  };

  // 클라이언트 사이드에서만 실행되도록 보장
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      setWindowHeight(window.innerHeight);
    }
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
    const seed = timestamp % 1000;
    
    const baseX = (seed % 60) + 20;
    const baseY = windowHeight - 180;
    const { finalX, finalY, stackHeight } = calculateStackPosition(baseX, baseY);
    
    const newMessage: FloatingMessage = {
      id: `msg-${timestamp}-${randomSuffix}`,
      text,
      x: baseX,
      y: 10,
      color: colors[seed % colors.length],
      hasLanded: false,
      finalY: finalY,
      rotation: (seed % 20) - 10 + (stackHeight * 2) // 쌓일수록 약간씩 더 회전
    };

    setMessages(prev => [...prev, newMessage]);
  };

  const addDrawing = (imageData: string) => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const seed = timestamp % 1000;
    
    const baseX = (seed % 60) + 20;
    const baseY = windowHeight - 200;
    const { finalX, finalY, stackHeight } = calculateStackPosition(baseX, baseY, 120, 80);
    
    const newDrawing: FloatingDrawing = {
      id: `draw-${timestamp}-${randomSuffix}`,
      imageData,
      x: baseX,
      y: 5,
      scale: ((seed % 30) + 40) / 100,
      hasLanded: false,
      finalY: finalY,
      rotation: (seed % 30) - 15 + (stackHeight * 3) // 쌓일수록 약간씩 더 회전
    };

    setDrawings(prev => [...prev, newDrawing]);
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
      addDrawing(data.imageData);
    });

    // 기존 메시지들을 받는 이벤트
    socket.on('existing-messages', (existingMessages: { id: string; text: string; timestamp: string }[]) => {
      console.log('기존 메시지들 수신:', existingMessages.length);
      existingMessages.forEach((msgData) => {
        addMessage(msgData.text);
      });
    });

    // 기존 그림들을 받는 이벤트
    socket.on('existing-drawings', (existingDrawings: { id: string; imageData: string; timestamp: string }[]) => {
      console.log('기존 그림들 수신:', existingDrawings.length);
      existingDrawings.forEach((drawData) => {
        addDrawing(drawData.imageData);
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
        
        {/* 별빛 효과 */}
        {Array.from({ length: 100 }).map((_, i) => {
          const x = Math.random() * 100;
          const y = Math.random() * 100;
          const size = Math.random() * 2 + 0.5;
          const delay = Math.random() * 5;
          
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
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: delay,
                ease: "easeInOut"
              }}
            />
          );
        })}
        
        {/* 플로팅 네온 파티클 */}
        {Array.from({ length: 30 }).map((_, i) => {
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
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ 
              scale: 0.8,
              opacity: 0,
              x: Math.random() * window.innerWidth,
              y: window.innerHeight + 100
            }}
            animate={{ 
              scale: [0.8, 1, 0.9, 1],
              opacity: [0, 1, 0.8, 1],
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1,
                Math.random() * window.innerWidth * 0.6 + window.innerWidth * 0.2,
                Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1
              ],
              y: [
                window.innerHeight + 100,
                Math.random() * window.innerHeight * 0.6 + window.innerHeight * 0.2,
                Math.random() * window.innerHeight * 0.4 + window.innerHeight * 0.3,
                Math.random() * window.innerHeight * 0.6 + window.innerHeight * 0.2
              ],
              rotate: [0, 5, -3, 2, -1]
            }}
            transition={{
              duration: 20 + Math.random() * 10,
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
        ))}
      </AnimatePresence>

      {/* 떠다니는 네온 그림들 */}
      <AnimatePresence>
        {drawings.map((drawing) => (
          <motion.div
            key={drawing.id}
            initial={{ 
              scale: 0.5,
              opacity: 0,
              x: Math.random() * window.innerWidth,
              y: window.innerHeight + 100,
              rotate: Math.random() * 360
            }}
            animate={{
              scale: [0.5, 0.8, 0.6, 0.7, 0.8],
              opacity: [0, 1, 0.7, 0.9, 1],
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth * 0.7 + window.innerWidth * 0.15,
                Math.random() * window.innerWidth * 0.5 + window.innerWidth * 0.25,
                Math.random() * window.innerWidth * 0.7 + window.innerWidth * 0.15,
                Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1
              ],
              y: [
                window.innerHeight + 100,
                Math.random() * window.innerHeight * 0.5 + window.innerHeight * 0.25,
                Math.random() * window.innerHeight * 0.3 + window.innerHeight * 0.35,
                Math.random() * window.innerHeight * 0.4 + window.innerHeight * 0.3,
                Math.random() * window.innerHeight * 0.6 + window.innerHeight * 0.2
              ],
              rotate: [
                Math.random() * 360,
                Math.random() * 360 + 180,
                Math.random() * 360 - 90,
                Math.random() * 360 + 90,
                Math.random() * 360
              ]
            }}
            transition={{
              duration: 25 + Math.random() * 15,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="absolute pointer-events-none select-none z-15"
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
        ))}
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