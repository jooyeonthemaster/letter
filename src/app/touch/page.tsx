'use client';

import { useState, useEffect } from 'react';
import { connectSocket, disconnectSocket } from '@/lib/socket';

export default function TouchPage() {
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = connectSocket();
    
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket 연결됨');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket 연결 해제됨');
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && isConnected) {
      const socket = connectSocket();
      socket.emit('send-message', { text: message });
      console.log('메시지 전송:', message);
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 w-full max-w-2xl shadow-2xl">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          메시지를 입력하세요
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="여기에 메시지를 입력하면 큰 화면에 둥실둥실 떠다닐 거예요!"
              className="w-full h-32 p-4 text-xl border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
              maxLength={100}
            />
            <div className="text-right text-sm text-gray-500 mt-2">
              {message.length}/100
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!message.trim() || !isConnected}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl font-semibold py-4 rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
          >
            {isConnected ? '메시지 보내기' : '연결 중...'}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            손가락으로 터치해서 입력해보세요!
          </p>
        </div>
      </div>
    </div>
  );
}