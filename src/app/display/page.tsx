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

export default function DisplayPage() {
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
      id: Date.now().toString(),
      text,
      x: Math.random() * 80 + 10, // 10% ~ 90% 범위
      y: Math.random() * 80 + 10, // 10% ~ 90% 범위
      color: colors[Math.floor(Math.random() * colors.length)]
    };

    setMessages(prev => [...prev, newMessage]);

    // 5초 후 메시지 제거
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
    }, 5000);
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
    // }, 8000);
  };

  // Socket.io 연결 및 실시간 메시지 수신
  useEffect(() => {
    const socket = connectSocket();
    
    socket.on('connect', () => {
      console.log('디스플레이: Socket 연결됨');
    });

    socket.on('new-message', (data) => {
      console.log('새 메시지 수신:', data);
      addMessage(data.text);
    });

    // 그림은 screen 페이지에서만 처리하도록 주석 처리
    // socket.on('new-drawing', (data) => {
    //   console.log('새 그림 수신:', data);
    //   addDrawing(data.imageData);
    // });

    // 기존 메시지들을 받는 이벤트
    socket.on('existing-messages', (existingMessages: { id: string; text: string; timestamp: string }[]) => {
      console.log('기존 메시지들 수신:', existingMessages.length);
      existingMessages.forEach((msgData) => {
        addMessage(msgData.text);
      });
    });

    // 기존 그림들도 screen 페이지에서만 처리하도록 주석 처리
    // socket.on('existing-drawings', (existingDrawings: { id: string; imageData: string; timestamp: string }[]) => {
    //   console.log('기존 그림들 수신:', existingDrawings.length);
    //   existingDrawings.forEach((drawData) => {
    //     addDrawing(drawData.imageData);
    //   });
    // });

    socket.on('disconnect', () => {
      console.log('디스플레이: Socket 연결 해제됨');
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-hidden relative" 
         style={{ minHeight: '100vh', height: '100dvh' }}>
      {/* 배경 그라디언트 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black"></div>
      
      {/* 떠다니는 메시지들 */}
      <AnimatePresence>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ 
              scale: 0,
              rotate: -180,
              opacity: 0,
              x: `${message.x}vw`,
              y: `${message.y}vh`
            }}
            animate={{ 
              scale: [0, 1.2, 1],
              rotate: [0, 10, -10, 5, -5, 0],
              opacity: 1,
              x: [0, 30, -20, 40, -30, 20, -10],
              y: [0, -40, 20, -30, 40, -20, 10]
            }}
            exit={{ 
              scale: 0,
              opacity: 0,
              rotate: 180
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
                duration: 7,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              },
              rotate: {
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }
            }}
            className={`absolute text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold ${message.color} drop-shadow-2xl pointer-events-none select-none`}
            style={{
              left: `${message.x}vw`,
              top: `${message.y}vh`,
              textShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
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
                   rotate: [0, 10, -10, 5, -5, 10, 0],
                   opacity: [0, 1, 1, 0.9],
                   x: [0, 30, -20, 40, -25, 35, -15],
                   y: [0, -20, 15, -30, 25, -10, 20]
                 }}
            exit={{ 
              scale: 0,
              opacity: 0,
              rotate: 180,
              y: -150
            }}
            transition={{
              duration: 6,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
              x: {
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              },
              y: {
                duration: 7,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              },
              rotate: {
                duration: 4,
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
              className="rounded-lg shadow-2xl border-4 border-white/20 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-64 lg:h-64 object-contain"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))'
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* 하단 정보 */}
      <div className="absolute bottom-8 left-8 text-white/50 text-sm">
        미디어 아트 디스플레이 - 터치 페이지에서 메시지를, 그리기 페이지에서 그림을 입력해보세요
      </div>
    </div>
  );
}