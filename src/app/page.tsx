import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">
            인터랙티브 미디어 아트
          </h1>
          <p className="text-xl text-white/90 mb-8">
            터치와 그리기로 만드는 살아있는 예술 공간
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link 
            href="/admin"
            className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105 border border-white/20"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">⚙️</div>
              <h2 className="text-2xl font-bold text-white mb-3">관리자</h2>
              <p className="text-white/80">
                콘텐츠 관리 및 시스템 설정
              </p>
            </div>
          </Link>

          <Link 
            href="/touch"
            className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105 border border-white/20"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📱</div>
              <h2 className="text-2xl font-bold text-white mb-3">터치 입력</h2>
              <p className="text-white/80">
                메시지를 입력해서 스크린에 띄우기
              </p>
            </div>
          </Link>

          <Link 
            href="/draw"
            className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105 border border-white/20"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🎨</div>
              <h2 className="text-2xl font-bold text-white mb-3">그리기</h2>
              <p className="text-white/80">
                자유롭게 그림을 그려보세요
              </p>
            </div>
          </Link>

          <Link 
            href="/display"
            className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105 border border-white/20"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <h2 className="text-2xl font-bold text-white mb-3">메시지 디스플레이</h2>
              <p className="text-white/80">
                텍스트가 둥실둥실 떠다니는 화면
              </p>
            </div>
          </Link>

          <Link 
            href="/screen"
            className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105 border border-white/20 md:col-span-2"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🖼️</div>
              <h2 className="text-2xl font-bold text-white mb-3">메인 스크린</h2>
              <p className="text-white/80">
                메시지와 그림이 함께 표시되는 메인 디스플레이
              </p>
            </div>
          </Link>
        </div>

        <div className="text-center">
          <p className="text-white/70 text-lg">
            각 페이지를 클릭해서 인터랙티브 미디어 아트를 체험해보세요!
          </p>
        </div>
      </div>
    </div>
  );
}
