import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    let socketUrl: string;
    
    // 브라우저 환경에서만 동작
    if (typeof window !== 'undefined') {
      const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
      
      // 환경변수가 localhost를 가리키거나 없으면 현재 호스트 사용
      if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
        socketUrl = `${window.location.protocol}//${window.location.host}`;
      } else {
        socketUrl = envUrl;
      }
    } else {
      // 서버 사이드에서는 기본값 사용
      socketUrl = 'http://localhost:3000';
    }
    
    console.log('Socket.io connecting to:', socketUrl);
        
    socket = io(socketUrl, {
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = () => {
  const socket = getSocket();
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};