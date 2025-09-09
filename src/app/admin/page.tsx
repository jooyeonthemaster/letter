'use client';

import { useState, useEffect, useRef } from 'react';
import { connectSocket, disconnectSocket } from '@/lib/socket';

interface DataCount {
  total: {
    messages: number;
    drawings: number;
  };
  visible: {
    messages: number;
    drawings: number;
  };
  screenClearTimestamp: string | null;
}

export default function AdminPage() {
  const [dataCount, setDataCount] = useState<DataCount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [connectionTest, setConnectionTest] = useState<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 테스트 연결 함수
  const handleTestConnection = () => {
    const socket = connectSocket();
    socket.emit('test-connection');
    console.log('테스트 연결 요청 전송');
  };

  // 함수들을 먼저 정의  
  const handleRefreshData = (socket?: any) => {
    console.log('데이터 새로고침 요청 시작');
    setIsLoading(true);
    setError('');
    const activeSocket = socket || connectSocket();
    
    // 기존 타임아웃 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    activeSocket.emit('get-data-count');
    console.log('get-data-count 이벤트 전송됨');
    
    // 10초 타임아웃 설정 (useRef 사용)
    timeoutRef.current = setTimeout(() => {
      console.error('데이터 요청 타임아웃');
      setIsLoading(false);
      setError('요청 시간 초과: 서버 응답이 없습니다. 서버 로그를 확인하세요.');
    }, 10000);
  };

  const handleClearScreen = () => {
    if (confirm('정말로 스크린을 초기화하시겠습니까? 현재 표시된 모든 그림과 메시지가 화면에서 사라집니다.')) {
      const socket = connectSocket();
      socket.emit('clear-screen');
      
      // 초기화 후 데이터 새로고침
      setTimeout(() => {
        handleRefreshData();
      }, 1000);
    }
  };

  // Socket.io 연결 및 이벤트 처리
  useEffect(() => {
    const socket = connectSocket();
    
    socket.on('connect', () => {
      console.log('Admin: Socket 연결됨');
      setConnectionTest('Socket 연결 성공');
      // 연결되면 즉시 데이터 카운트 요청 (기존 socket 재사용)
      handleRefreshData(socket);
    });

    // 테스트 연결 결과
    socket.on('test-connection-result', (data: any) => {
      console.log('테스트 연결 결과:', data);
      setConnectionTest(`테스트 성공: ${data.message} (${data.socketId})`);
    });

    socket.on('data-count-result', (data: DataCount & { error?: string }) => {
      console.log('데이터 카운트 결과 수신:', data);
      
      // 타임아웃 클리어
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (data.error) {
        setError(data.error);
        setDataCount(null);
      } else {
        setDataCount(data);
        setError('');
      }
      
      setLastUpdate(new Date().toLocaleString());
      setIsLoading(false);
    });

    socket.on('disconnect', () => {
      console.log('Admin: Socket 연결 해제됨');
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          미디어 아트 관리자 페이지
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">텍스트 메시지 관리</h2>
            <p className="text-gray-600 mb-4">
              디스플레이에 표시될 텍스트 메시지를 관리합니다.
            </p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              메시지 관리
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">그림 갤러리 관리</h2>
            <p className="text-gray-600 mb-4">
              현재 스크린에 표시되는 모든 그림과 메시지를 관리합니다.
            </p>
            
            {/* 연결 상태 */}
            <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
              <h4 className="font-medium mb-1">연결 상태</h4>
              <p className="text-blue-700">{connectionTest || '연결 확인 중...'}</p>
              <button 
                onClick={handleTestConnection}
                className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                연결 테스트
              </button>
            </div>

            {/* 데이터 현황 */}
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">데이터 현황</h3>
              
              {error ? (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded">
                  <p className="font-medium">오류 발생:</p>
                  <p>{error}</p>
                  <button 
                    onClick={() => handleRefreshData()}
                    className="mt-2 px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    다시 시도
                  </button>
                </div>
              ) : dataCount ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">전체 저장된 데이터:</p>
                    <p>메시지: {dataCount.total.messages}개</p>
                    <p>그림: {dataCount.total.drawings}개</p>
                  </div>
                  <div>
                    <p className="font-medium">현재 화면 표시:</p>
                    <p>메시지: {dataCount.visible.messages}개</p>
                    <p>그림: {dataCount.visible.drawings}개</p>
                  </div>
                  {dataCount.screenClearTimestamp && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">
                        마지막 초기화: {new Date(dataCount.screenClearTimestamp).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                  <p>데이터를 불러오는 중...</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleRefreshData}
                disabled={isLoading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? '새로고침 중...' : '데이터 새로고침'}
              </button>
              <button 
                onClick={handleClearScreen}
                disabled={isLoading}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
              >
                스크린 초기화
              </button>
            </div>
            
            {lastUpdate && (
              <p className="text-xs text-gray-500 mt-2">
                마지막 업데이트: {lastUpdate}
              </p>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">시스템 설정</h2>
            <p className="text-gray-600 mb-4">
              애니메이션 속도, 색상 등을 설정합니다.
            </p>
            <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              설정 관리
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}