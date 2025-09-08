'use client';

import { useState, useEffect } from 'react';

export default function VideoBackground() {
  const [isClient, setIsClient] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // 클라이언트에서만 렌더링되도록 하여 hydration 문제 해결
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 이미지 로드 완료 처리
  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  // 서버 렌더링 시에는 간단한 배경만 표시
  if (!isClient) {
    return (
      <div className="absolute inset-0 z-0 bg-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white opacity-30">
            <div className="animate-pulse">로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0">
      {/* 배경 이미지 */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/background.jpg)',
          filter: 'brightness(0.7) contrast(1.1)',
          willChange: 'transform', // GPU 가속 활성화
          backfaceVisibility: 'hidden', // 렌더링 최적화
        }}
      />
      
      {/* 이미지 로드 확인용 숨겨진 img 태그 */}
      <img
        src="/background.jpg"
        alt=""
        className="hidden"
        onLoad={handleImageLoad}
        onError={() => setIsLoaded(true)} // 에러가 나도 로딩 상태는 해제
      />
      
      {/* 이미지 위에 미세한 오버레이 */}
      <div 
        className="absolute inset-0 bg-black"
        style={{ opacity: 0.2 }}
      />
      
      {/* 로딩 상태 표시 */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-white opacity-50">
            <div className="animate-pulse">배경 로딩 중...</div>
          </div>
        </div>
      )}
      
      {/* 디버그 정보 (개발 중에만 표시) */}
      {process.env.NODE_ENV === 'development' && isClient && (
        <div className="absolute top-4 left-4 text-white text-xs bg-black bg-opacity-50 p-2 rounded z-10">
          <div>배경: JPG 이미지</div>
          <div>로드됨: {isLoaded ? '예' : '아니오'}</div>
        </div>
      )}
    </div>
  );
}