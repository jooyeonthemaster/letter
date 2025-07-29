'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { connectSocket, disconnectSocket } from '@/lib/socket';

interface FloatingMessage {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
}

interface FloatingDrawing {
  id: string;
  imageData: string;
  x: number;
  y: number;
  scale: number;
}

export default function ScreenPage() {
  const [messages, setMessages] = useState<FloatingMessage[]>([]);
  const [drawings, setDrawings] = useState<FloatingDrawing[]>([]);

  const colors = [
    'text-red-400',
    'text-blue-400', 
    'text-green-400',
    'text-yellow-400',
    'text-purple-400',
    'text-pink-400',
    'text-indigo-400',
    'text-orange-400'
  ];

  const addMessage = (text: string) => {
    const newMessage: FloatingMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text,
      x: Math.random() * 70 + 15, // 15% ~ 85% 범위
      y: Math.random() * 70 + 15, // 15% ~ 85% 범위
      color: colors[Math.floor(Math.random() * colors.length)]
    };

    setMessages(prev => [...prev, newMessage]);

    // 8초 후 메시지 제거
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
    }, 8000);
  };

  const addDrawing = (imageData: string) => {
    const newDrawing: FloatingDrawing = {
      id: `draw-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      imageData,
      x: Math.random() * 60 + 20, // 20% ~ 80% 범위
      y: Math.random() * 60 + 20, // 20% ~ 80% 범위
      scale: Math.random() * 0.4 + 0.6 // 0.6 ~ 1.0 배율 (2배 더 크게)
    };

    setDrawings(prev => [...prev, newDrawing]);

    // 그림을 제거하지 않고 계속 떠다니게 함
    // setTimeout(() => {
    //   setDrawings(prev => prev.filter(draw => draw.id !== newDrawing.id));
    // }, 10000);
  };

  // Socket.io 연결 및 실시간 메시지/그림 수신
  useEffect(() => {
    const socket = connectSocket();
    
    socket.on('connect', () => {
      console.log('스크린: Socket 연결됨');
    });

    socket.on('new-message', (data) => {
      console.log('새 메시지 수신:', data);
      addMessage(data.text);
    });

    socket.on('new-drawing', (data) => {
      console.log('새 그림 수신:', data);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/30 to-black overflow-hidden relative"
         style={{ minHeight: '100vh', height: '100dvh' }}>
      {/* 배경 별들 */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => {
          // 고정된 시드값으로 일관된 위치 생성
          const seedX = (i * 37) % 100;
          const seedY = (i * 73) % 100;
          const duration = (i % 3) + 2;
          
          return (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${seedX}%`,
                top: `${seedY}%`,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.5, 1, 0.5]
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
      
      {/* 떠다니는 메시지들 */}
      <AnimatePresence>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ 
              scale: 0,
              rotate: -180,
              opacity: 0,
            }}
            animate={{ 
              scale: [0, 1.3, 1],
              rotate: [0, 15, -15, 10, -10, 0],
              opacity: [0, 1, 1, 0.9],
              x: [0, 50, -30, 40, -20, 30, -10],
              y: [0, -30, 20, -40, 30, -15, 10]
            }}
            exit={{ 
              scale: 0,
              opacity: 0,
              rotate: 360,
              y: -100
            }}
            transition={{
              duration: 10,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
              x: {
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              },
              y: {
                duration: 9,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              },
              rotate: {
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }
            }}
            className={`absolute text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold ${message.color} drop-shadow-2xl pointer-events-none select-none z-20`}
            style={{
              left: `${message.x}%`,
              top: `${message.y}%`,
              textShadow: '0 0 30px rgba(255, 255, 255, 0.7), 0 0 60px rgba(255, 255, 255, 0.3)'
            }}
          >
            {message.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 떠다니는 그림들 */}
      <AnimatePresence>
        {drawings.map((drawing) => (
          <motion.div
            key={drawing.id}
            initial={{ 
              scale: 0,
              rotate: -90,
              opacity: 0
            }}
                           animate={{
                 scale: drawing.scale,
                 rotate: [0, 10, -10, 8, -8, 12, 0],
                 opacity: [0, 1, 1, 0.9],
                 x: [0, 30, -20, 45, -30, 40, -15],
                 y: [0, -20, 15, -35, 30, -15, 25]
               }}
            exit={{ 
              scale: 0,
              opacity: 0,
              rotate: 180,
              y: -150
            }}
            transition={{
              duration: 8,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
              x: {
                duration: 6,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              },
              y: {
                duration: 9,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              },
              rotate: {
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }
            }}
            className="absolute pointer-events-none select-none z-10"
            style={{
              left: `${drawing.x}%`,
              top: `${drawing.y}%`,
            }}
          >
            <img 
              src={drawing.imageData} 
              alt="User drawing"
              className="rounded-lg shadow-2xl border-4 border-white/20 w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-72 lg:h-72 object-contain"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))'
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* 제목 */}
      <motion.div 
        className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center z-30"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2 }}
      >
        <h1 className="text-6xl font-bold text-white mb-2 drop-shadow-2xl">
          인터랙티브 미디어 아트
        </h1>
        <p className="text-xl text-white/80">
          여러분의 창작물이 살아 움직입니다
        </p>
      </motion.div>
      
      {/* 하단 정보 */}
      <div className="absolute bottom-8 left-8 text-white/60 text-lg z-30">
        <p>💬 터치 페이지에서 메시지 입력</p>
        <p>🎨 그리기 페이지에서 작품 제작</p>
      </div>

      <div className="absolute bottom-8 right-8 text-white/60 text-lg z-30">
        <p>실시간 인터랙티브 체험</p>
      </div>
    </div>
  );
}