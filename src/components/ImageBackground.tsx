'use client';

import { useState } from 'react';

export default function ImageBackground() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="absolute inset-0 z-0">
      {/* 배경 이미지 */}
      <img
        src="/background1.png"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: 'brightness(0.7) contrast(1.1)',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        }}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
        loading="eager"
        decoding="async"
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
    </div>
  );
}


