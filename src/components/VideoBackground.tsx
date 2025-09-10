'use client';

import { useState, useEffect, useRef } from 'react';

export default function VideoBackground() {
  const [isClient, setIsClient] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 클라이언트에서만 렌더링되도록 하여 hydration 문제 해결
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 비디오 로드 완료 처리
  const handleVideoLoad = () => {
    setIsLoaded(true);
    // 비디오 재생 시도
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error('Video autoplay failed:', error);
      });
    }
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
      {/* 배경 비디오 */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: 'brightness(0.7) contrast(1.1)',
          willChange: 'transform', // GPU 가속 활성화
          backfaceVisibility: 'hidden', // 렌더링 최적화
        }}
        autoPlay
        muted
        loop
        playsInline
        onLoadedData={handleVideoLoad}
        onError={() => setIsLoaded(true)} // 에러가 나도 로딩 상태는 해제
      >
        <source src="/background3.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* 비디오 위에 미세한 오버레이 */}
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
      
    </div>
  );
}