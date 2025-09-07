'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SignatureCanvas from 'react-signature-canvas';
import { connectSocket, disconnectSocket } from '@/lib/socket';

export default function DrawPage() {
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState('#FFFFFF');
  const [isConnected, setIsConnected] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [eraserSize, setEraserSize] = useState(10);
  const [showBookList, setShowBookList] = useState(false);
  const [selectedBook, setSelectedBook] = useState<{
    id: number;
    author: string;
    authorEng: string;
    title: string;
    publisher: string;
    year: number;
    quotes: string;
  } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);



  // Socket 연결 관리
  useEffect(() => {
    const socket = connectSocket();
    
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('그리기: Socket 연결됨');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('그리기: Socket 연결 해제됨');
    });

    return () => {
      disconnectSocket();
    };
  }, []);

      // 그리기 도구 및 기능들
  const clearCanvas = () => {
    if (sigCanvasRef.current) {
      try {
        sigCanvasRef.current.clear();
      } catch (error) {
        console.warn('Canvas clear error:', error);
        // 캔버스 재초기화 시도
        if (sigCanvasRef.current) {
          const canvas = sigCanvasRef.current.getCanvas();
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }
        }
      }
    }
  };

  const toggleEraserMode = () => {
    setIsEraserMode(!isEraserMode);
  };

  // 전체화면 토글 함수
  const toggleFullscreen = () => {
    const elem = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      mozRequestFullScreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    };
    
    const doc = document as Document & {
      webkitFullscreenElement?: Element;
      mozFullScreenElement?: Element;
      webkitExitFullscreen?: () => Promise<void>;
      mozCancelFullScreen?: () => Promise<void>;
      msExitFullscreen?: () => Promise<void>;
    };
    
    if (!document.fullscreenElement && 
        !doc.webkitFullscreenElement && 
        !doc.mozFullScreenElement) {
      // 전체화면 진입
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) { // Safari/iOS
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) { // Firefox
        elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) { // IE/Edge
        elem.msRequestFullscreen();
      }
    } else {
      // 전체화면 종료
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (doc.webkitExitFullscreen) { // Safari/iOS
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) { // Firefox
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) { // IE/Edge
        doc.msExitFullscreen();
      }
    }
  };

  // 전체화면 상태 감지 및 아이패드 최적화
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as Document & {
        webkitFullscreenElement?: Element;
        mozFullScreenElement?: Element;
      };
      
      const isCurrentlyFullscreen = !!(document.fullscreenElement || 
           doc.webkitFullscreenElement || 
           doc.mozFullScreenElement);
           
      setIsFullscreen(isCurrentlyFullscreen);
      
      // 전체화면 모드에서 iOS Safari 최적화
      if (isCurrentlyFullscreen) {
        // HTML과 Body에 강력한 스크롤 방지
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.position = 'fixed';
        document.documentElement.style.width = '100%';
        document.documentElement.style.height = '100%';
        document.documentElement.style.touchAction = 'none';
        
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100vh';
        document.body.style.touchAction = 'none';
        document.body.style.userSelect = 'none';
        (document.body.style as unknown as Record<string, string>).WebkitUserSelect = 'none';
        (document.body.style as unknown as Record<string, string>).WebkitTouchCallout = 'none';
        (document.body.style as unknown as Record<string, string>).WebkitOverflowScrolling = 'touch';
        
        // iOS Safari 전용 높이 설정
        const updateHeight = () => {
          document.body.style.height = `${window.innerHeight}px`;
          document.documentElement.style.height = `${window.innerHeight}px`;
        };
        updateHeight();
        window.addEventListener('resize', updateHeight);
        
        console.log('전체화면 모드: 모든 스크롤 및 터치 이벤트 차단');
      } else {
        // 전체화면 해제 시 모든 스타일 복원
        document.documentElement.style.overflow = '';
        document.documentElement.style.position = '';
        document.documentElement.style.width = '';
        document.documentElement.style.height = '';
        document.documentElement.style.touchAction = '';
        
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.touchAction = '';
        document.body.style.userSelect = '';
        (document.body.style as unknown as Record<string, string>).WebkitUserSelect = '';
        (document.body.style as unknown as Record<string, string>).WebkitTouchCallout = '';
        (document.body.style as unknown as Record<string, string>).WebkitOverflowScrolling = '';
        
        window.removeEventListener('resize', () => {});
        console.log('전체화면 해제: 모든 스타일 복원');
      }
    };

    // 강력한 전체화면 해제 방지 핸들러
    const preventAllScrolling = (e: Event) => {
      if (isFullscreen) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    // 전체화면 상태 변경 이벤트
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    
    // 모든 스크롤 및 터치 이벤트 차단 (iOS Safari 전용)
    const eventOptions = { passive: false, capture: true };
    
    // 터치 이벤트 차단
    document.addEventListener('touchstart', preventAllScrolling, eventOptions);
    document.addEventListener('touchmove', preventAllScrolling, eventOptions);
    document.addEventListener('touchend', preventAllScrolling, eventOptions);
    
    // 스크롤 이벤트 차단  
    document.addEventListener('scroll', preventAllScrolling, eventOptions);
    document.addEventListener('wheel', preventAllScrolling, eventOptions);
    
    // iOS Safari 제스처 이벤트 차단
    document.addEventListener('gesturestart', preventAllScrolling, eventOptions);
    document.addEventListener('gesturechange', preventAllScrolling, eventOptions);
    document.addEventListener('gestureend', preventAllScrolling, eventOptions);
    
    // 키보드 이벤트로 인한 스크롤 방지
    document.addEventListener('keydown', (e) => {
      if (isFullscreen && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown' || e.key === ' ')) {
        e.preventDefault();
      }
    }, eventOptions);

    return () => {
      // 모든 이벤트 리스너 제거
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      
      // 강화된 이벤트 리스너들 제거
      document.removeEventListener('touchstart', preventAllScrolling, { capture: true });
      document.removeEventListener('touchmove', preventAllScrolling, { capture: true });
      document.removeEventListener('touchend', preventAllScrolling, { capture: true });
      document.removeEventListener('scroll', preventAllScrolling, { capture: true });
      document.removeEventListener('wheel', preventAllScrolling, { capture: true });
      document.removeEventListener('gesturestart', preventAllScrolling, { capture: true });
      document.removeEventListener('gesturechange', preventAllScrolling, { capture: true });
      document.removeEventListener('gestureend', preventAllScrolling, { capture: true });
      
      // 모든 스타일 복원
      document.documentElement.style.overflow = '';
      document.documentElement.style.position = '';
      document.documentElement.style.width = '';
      document.documentElement.style.height = '';
      document.documentElement.style.touchAction = '';
      
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.touchAction = '';
      document.body.style.userSelect = '';
      (document.body.style as unknown as Record<string, string>).WebkitUserSelect = '';
      (document.body.style as unknown as Record<string, string>).WebkitTouchCallout = '';
      (document.body.style as unknown as Record<string, string>).WebkitOverflowScrolling = '';
    };
  }, [isFullscreen]);

  const saveDrawing = () => {
    if (!sigCanvasRef.current || !isConnected) return;

    try {
      const dataURL = sigCanvasRef.current.toDataURL();
    
    // 위치 정보 생성 (crypto API 사용)
    const crypto = window.crypto || (window as Window & { msCrypto?: Crypto }).msCrypto;
    const array = new Uint32Array(4);
    crypto.getRandomValues(array);
    
    const position = {
      x: (array[0] % 9500) / 100 + 2.5, // 2.5% ~ 97.5%
      y: (array[1] % 9500) / 100 + 2.5, // 2.5% ~ 97.5%
      scale: (array[2] % 40) / 100 + 0.6 // 0.6 ~ 1.0
    };
    
    const socket = connectSocket();
    socket.emit('send-drawing', { 
      imageData: dataURL,
      position: position
    });
      console.log('편지 전송 완료 (위치:', position, ')');
      
      // 그림 전송 후 캔버스 초기화
      clearCanvas();
    } catch (error) {
      console.error('그림 저장 중 오류:', error);
      // 에러 발생 시에도 캔버스는 초기화
      clearCanvas();
    }
  };

  // 네온 색상 팔레트 (어두운 배경용)
  const inkColors = [
    { name: '순백', color: '#FFFFFF' },
    { name: '네온 옐로우', color: '#FFD700' },
    { name: '네온 시안', color: '#00FFFF' },
    { name: '네온 핑크', color: '#FF1493' },
    { name: '네온 그린', color: '#00FF00' },
    { name: '네온 오렌지', color: '#FF6600' }
  ];

  const brushSizes = [
    { name: '세필', size: 1 },
    { name: '가는 붓', size: 3 },
    { name: '보통 붓', size: 6 },
    { name: '굵은 붓', size: 10 },
    { name: '큰 붓', size: 15 }
  ];

  const eraserSizes = [
    { name: '정밀', size: 5 },
    { name: '보통', size: 10 },
    { name: '넓게', size: 20 },
    { name: '크게', size: 30 }
  ];

  // 책 목록 데이터
  const books = [
    { id: 1, author: '현기영', authorEng: 'Hyun Ki Young', title: '제주도우다 1', publisher: '창비', year: 2023, quotes: '"하하하, 우린 북도 아니고 남도 아니고, 제주도다!"' },
    { id: 2, author: '성해나', authorEng: 'Haena Sung', title: '혼모노', publisher: '창비', year: 2025, quotes: '가벼워진다. 모든 것에서 놓여나듯. 이제야 진짜 가짜가 된 듯.' },
    { id: 3, author: '김초엽', authorEng: 'Kim Choyeop', title: '파견자들', publisher: '퍼블리온', year: 2023, quotes: '"네가 보는 이 풍경은 어때?"' },
    { id: 4, author: '김숨', authorEng: 'Kim Soom', title: '무지개 눈', publisher: '민음사', year: 2025, quotes: '우리가 보았던 것은 바다가 아니라 파도예요.' },
    { id: 5, author: '전하영', authorEng: 'Jeon Hayoung', title: '시차와 시대착오', publisher: '문학동네', year: 2024, quotes: '기꺼이 속는 것이야말로 젊은 사람들의 표식이다, 라고 숙희는 생각했다.' },
    { id: 6, author: '윤은성', authorEng: 'Eunseong Yoon', title: '유리 광장에서', publisher: '도서출판 빠마', year: 2024, quotes: '내가 나를 증명하지 않는 것이 노래에 가깝다고 해요' },
    { id: 7, author: '이수지', authorEng: 'Suzy Lee', title: '춤을 추었어', publisher: '안그라픽스', year: 2024, quotes: '모두 춤을 추었어' },
    { id: 8, author: '장이지', authorEng: 'Jang I-Ji', title: '오리배가 지나간 호수의 파랑', publisher: '아침달', year: 2025, quotes: '나와 세계를 송두리째 바꾸는 꿈' },
    { id: 9, author: '김성중', authorEng: 'Kim Seong Joong', title: '화성의 아이', publisher: '문학동네', year: 2024, quotes: '내 삶은 인간을 사랑하는 것과 사랑하지 않는 것 사이의 투쟁이었다.' },
    { id: 10, author: '이금이', authorEng: 'Lee Geum-yi', title: '알로하, 나의 엄마들', publisher: '창비', year: 2020, quotes: '내 딸은 좋은 시상에서 내보다 나은 삶을 살아야 한다.' },
    { id: 11, author: '이제니', authorEng: 'Lee Jenny', title: '그리하여 흘려 쓴 것들', publisher: '문학과지성사', year: 2019, quotes: '꾸며낸 이야기가 가본 적 없는 거리의 풍경을 불러들인다.' },
    { id: 12, author: '황여정', authorEng: 'Hwang Yeo Jung', title: '숨과 입자', publisher: '창비', year: 2024, quotes: '"다가가보는 수밖에 없지 않겠어? 그걸 원한다면."' },
    { id: 13, author: '강지영', authorEng: 'Kang Ji-young', title: '심여사는 킬러', publisher: '네오픽션', year: 2023, quotes: '이제 나는 보통의 아줌마가 아니다. 킬러다.' },
    { id: 14, author: '이설야', authorEng: 'Lee Sul Ya', title: '내 얼굴이 도착하지 않았다', publisher: '창비', year: 2022, quotes: '오늘은 오늘의 마음을 다 쓰겠습니다' },
    { id: 15, author: '우다영', authorEng: 'Woo Dayoung', title: '그러나 누군가는 더 검은 밤을 원한다', publisher: '문학과지성사', year: 2023, quotes: '"지금 미래를 무너뜨리고 있는 건 누구죠?"' },
    { id: 16, author: '심보선', authorEng: 'Shim Bo-Seon', title: '네가 봄에 써야지 속으로 생각했던', publisher: '아침달', year: 2025, quotes: '인생은 스무 번의 낙담 뒤엔 그냥 살아지는 거지' },
    { id: 17, author: '최진영', authorEng: 'Choi Jin young', title: '단 한 사람', publisher: '한겨레출판', year: 2023, quotes: '나 또한 한 번뿐인 삶을 사는 단 한 명임을 기억하라고.' },
    { id: 18, author: '이훤', authorEng: 'Hwon Lee', title: '눈에 덜 띄는', publisher: '마음산책', year: 2024, quotes: '눈에 덜 띄는 것들은 비밀을 품고 있다.' },
    { id: 19, author: '김수우', authorEng: 'Kim Soo Woo', title: '뿌리주의자', publisher: '창비', year: 2021, quotes: '나는 또 어느 우주로 돌아갈 것인가' },
    { id: 20, author: '옌롄커', authorEng: 'Yan Lianke', title: '해가 죽던 날', publisher: '글항아리', year: 2024, quotes: '이제 제 이야기를 시작하겠습니다.' },
    { id: 21, author: '김주혜', authorEng: 'Juhea Kim', title: '밤새들의 도시', publisher: '다산책방', year: 2025, quotes: '뭔가를 남겨둘 것인지, 아니면 자신의 모든 것과 자신 그 자체를 예술에 바칠 것인지 예술이 묻는다.' },
    { id: 22, author: '마테오 B. 비앙키', authorEng: 'Matteo B. Bianchi', title: '남겨진 자들의 삶', publisher: '문예출판사', year: 2024, quotes: '왜 사람들은 남겨진 자들의 고통을 외면하는 것일까?' },
    { id: 23, author: '아드리앵 파를랑주', authorEng: 'Adrien Parlange', title: '봄은 또 오고', publisher: '봄볕', year: 2024, quotes: '열여섯의 봄, 우리는 사랑에 빠져.' },
    { id: 24, author: '패트릭 드윗', authorEng: 'Patrick deWitt', title: '시스터스 브라더스', publisher: '문학동네', year: 2019, quotes: '슬픔과 걱정에서 완전히 벗어날 수 있는 사람은 없어.' },
    { id: 25, author: '엘비라 나바로', authorEng: 'Elvira Navarro', title: '토끼들의 섬', publisher: '비채', year: 2024, quotes: '모든 일이 너무나 빠르게 벌어지고 있다.' },
    { id: 26, author: '후즈키 유미', authorEng: 'Yumi Fuzuki', title: '적절한 세계의 적절할 수밖에 없는 나', publisher: '', year: 0, quotes: '바람을 가르고, 구름을 향해 달려 오르는 나.' },
    { id: 27, author: '요나스 하센 케미리', authorEng: 'Jonas Hassen Khemiri', title: '몬테코어', publisher: '민음사', year: 2024, quotes: '무슨 일이 일어나고 있지만 그게 무엇인지 확실히 모른다.' },
    { id: 28, author: '세라 핀스커', authorEng: 'Sarah Pinsker', title: '언젠가 모든 것은 바다로 떨어진다', publisher: '창비', year: 2025, quotes: '우리가 모두 같은 걸 보고 있기는 한 걸까?' },
    { id: 29, author: '빅토리아 마스', authorEng: 'Victoria Mas', title: '미친 여자들의 무도회', publisher: '문학동네', year: 2023, quotes: '이 책은······ 내가 미치지 않았다는 사실을 일깨워줬어요.' }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden ${
      isFullscreen ? 'select-none' : ''
    }`}
         style={isFullscreen ? {
           userSelect: 'none',
           WebkitUserSelect: 'none',
           WebkitTouchCallout: 'none',
           WebkitTapHighlightColor: 'transparent',
           touchAction: 'none', // 전체화면에서 모든 터치 제스처 차단
           overscrollBehavior: 'none',
           overscrollBehaviorX: 'none', 
           overscrollBehaviorY: 'none',
           height: '100vh',
           position: 'fixed',
           top: 0,
           left: 0,
           right: 0,
           bottom: 0
         } : {}}>
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(90deg, #000 1px, transparent 1px),
            linear-gradient(#000 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* 헤더 */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center py-8"
        >
                    <h1 className="text-5xl font-light text-white mb-2 tracking-wide">
            보이는 것보다 선명한
        </h1>
          <p className="text-lg text-gray-300 font-light">
            디지털 캔버스에 마음을 담아보세요
          </p>
        </motion.div>



                {/* 통합 플로팅 버튼들 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed top-20 left-6 z-50 space-y-3"
        >
          {/* 도구 패널 버튼 */}
          <button
            onClick={() => setShowTools(true)}
            className="p-4 rounded-xl shadow-lg border-2 bg-gray-100/90 text-gray-700 border-gray-200 hover:bg-gray-200/90 transition-all duration-200 backdrop-blur-sm"
            title="필기 도구"
          >
            🎨
          </button>

          {/* 책 목록 버튼 */}
          <button
            onClick={() => setShowBookList(true)}
            className="p-4 rounded-xl shadow-lg border-2 bg-blue-100/90 text-blue-700 border-blue-300 hover:bg-blue-200/90 transition-all duration-200 backdrop-blur-sm"
            title="책 목록 보기"
          >
            📚
          </button>
          
          {/* 모드 전환 버튼 */}
          <button
            onClick={toggleEraserMode}
            className={`p-4 rounded-xl shadow-lg border-2 transition-all duration-200 backdrop-blur-sm font-medium ${
              isEraserMode 
                ? 'bg-red-100/90 text-red-700 border-red-300' 
                : 'bg-blue-100/90 text-blue-700 border-blue-300'
            }`}
            title={isEraserMode ? '지우개 모드' : '쓰기 모드'}
          >
            {isEraserMode ? '🧹' : '✍️'}
          </button>
          
          {/* 전체 지우기 버튼 */}
          <button
            onClick={clearCanvas}
            className="p-4 rounded-xl shadow-lg border-2 bg-gray-100/90 text-gray-700 border-gray-200 hover:bg-gray-200/90 transition-all duration-200 backdrop-blur-sm"
            title="전체 지우기"
          >
            🗑️
          </button>

          {/* 전체화면 버튼 */}
          <button
            onClick={toggleFullscreen}
            className={`p-4 rounded-xl shadow-lg border-2 transition-all duration-200 backdrop-blur-sm font-medium ${
              isFullscreen 
                ? 'bg-green-100/90 text-green-700 border-green-300' 
                : 'bg-purple-100/90 text-purple-700 border-purple-300'
            }`}
            title={isFullscreen ? '전체화면 종료' : '전체화면 모드'}
          >
            {isFullscreen ? '🔲' : '⛶'}
          </button>
        </motion.div>

        {/* 도구 패널 모달 */}
        <AnimatePresence>
          {showTools && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowTools(false)}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">필기 도구</h2>
                  <p className="text-gray-600 mt-1">붓과 색상을 선택해보세요</p>
                </div>
                
                                <div className="p-8">
                  <div className="grid grid-cols-3 gap-8">
                    {/* 도구 모드 선택 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">도구 모드</label>
                      <div className="space-y-3">
                        <button
                          onClick={() => setIsEraserMode(false)}
                          className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                            !isEraserMode 
                              ? 'border-gray-900 bg-gray-50 text-gray-900' 
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <div className="text-2xl mb-2">✍️</div>
                          <div className="text-sm">쓰기</div>
                        </button>
                        <button
                          onClick={() => setIsEraserMode(true)}
                          className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                            isEraserMode 
                              ? 'border-red-500 bg-red-50 text-red-700' 
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <div className="text-2xl mb-2">🧹</div>
                          <div className="text-sm">지우개</div>
                        </button>
                      </div>
          </div>
          
                    {/* 붓 크기 또는 지우개 크기 선택 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        {isEraserMode ? '지우개 크기' : '붓 크기'}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {(isEraserMode ? eraserSizes : brushSizes).map((tool) => (
                <button
                            key={tool.size}
                            onClick={() => isEraserMode ? setEraserSize(tool.size) : setBrushSize(tool.size)}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                              (isEraserMode ? eraserSize : brushSize) === tool.size 
                                ? `border-${isEraserMode ? 'red' : 'gray'}-${isEraserMode ? '500' : '900'} bg-${isEraserMode ? 'red' : 'gray'}-50` 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="text-sm text-gray-600 mb-2">{tool.name}</div>
                            <div 
                              className={`w-full rounded-full mx-auto ${isEraserMode ? 'bg-red-400' : 'bg-gray-900'}`}
                              style={{ height: `${Math.max(tool.size / 3, 2)}px` }}
                            />
                          </button>
              ))}
            </div>
          </div>
          
                    {/* 먹 색상 선택 (쓰기 모드일 때만) */}
                    {!isEraserMode && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">먹 색상</label>
                        <div className="grid grid-cols-3 gap-3">
                          {inkColors.map((ink) => (
                            <button
                              key={ink.color}
                              onClick={() => setBrushColor(ink.color)}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                brushColor === ink.color 
                                  ? 'border-gray-900 bg-gray-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-xs text-gray-600 mb-2">{ink.name}</div>
                              <div 
                                className="w-8 h-8 rounded-full mx-auto border border-gray-300"
                                style={{ backgroundColor: ink.color }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 책 목록 모달 */}
        <AnimatePresence>
          {showBookList && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowBookList(false)}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="absolute top-20 left-1/2 transform -translate-x-1/2 w-full max-w-4xl max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">책 목록</h2>
                  <p className="text-gray-600 mt-1">따라 쓰고 싶은 책을 선택해보세요</p>
                </div>
                
                <div className="max-h-96 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {books.map((book) => (
                      <button
                        key={book.id}
                        onClick={() => {
                          setSelectedBook(book);
                          setShowBookList(false);
                        }}
                        className="text-left p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                      >
                        <div className="font-medium text-gray-900 mb-1">{book.title}</div>
                        <div className="text-sm text-gray-600">{book.author}</div>
                        <div className="text-xs text-gray-500 mt-1">{book.publisher} · {book.year}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 선택된 책 인용문 영역 (헤더 아래) */}
        <AnimatePresence>
          {selectedBook && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-8 pb-4"
            >
              <div className="flex-1 max-w-7xl mx-auto w-full px-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-100">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-medium text-gray-900">{selectedBook.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{selectedBook.author} · {selectedBook.publisher} ({selectedBook.year})</p>
                    </div>
            <button
                      onClick={() => setSelectedBook(null)}
                      className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
            >
                      ✕
            </button>
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
                    {selectedBook.quotes}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 메인 콘텐츠 */}
        <div className={`flex-1 max-w-7xl mx-auto w-full px-6 pb-8 ${selectedBook ? 'pt-4' : 'pt-8'}`}>
                      {/* 편지지 캔버스 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="w-full"
            >
              <div className="relative h-full min-h-[calc(100vh-200px)]">
                {/* 디지털 캔버스 배경 */}
                <div className="absolute inset-0 bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden"
                     style={{
                       boxShadow: '0 0 30px rgba(255, 215, 0, 0.2), inset 0 0 50px rgba(0, 0, 0, 0.5)'
                     }}>
                  {/* 종이 질감 효과 */}
                  <div className="absolute inset-0 opacity-[0.03]">
                    <div className="w-full h-full" style={{
                      backgroundImage: `
                        radial-gradient(circle at 20% 30%, #000 1px, transparent 1px),
                        radial-gradient(circle at 80% 70%, #000 1px, transparent 1px),
                        radial-gradient(circle at 40% 80%, #000 0.5px, transparent 0.5px),
                        linear-gradient(45deg, transparent 49%, rgba(0,0,0,0.01) 50%, transparent 51%)
                      `,
                      backgroundSize: '40px 40px, 60px 60px, 20px 20px, 3px 3px'
                    }} />
                  </div>
                  

                  
                  {/* 편지지 테이프 효과 (상단) */}
                  <motion.div 
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-8 bg-gradient-to-b from-gray-100 to-gray-200 opacity-60 rounded-b-lg"
                    style={{
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(240,240,240,0.8) 100%)'
                    }}
                  />
                  
                  {/* 미세한 종이 접힘 효과 */}
                  <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.02]">
                    <div className="w-full h-full bg-gradient-to-bl from-gray-400 to-transparent rounded-bl-3xl" />
                  </div>
                  
                                    

                  {/* 디지털 캔버스 헤더 */}
                  <div className="relative z-10 p-8 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* 네온 인디케이터 */}
                        <motion.div 
                          animate={{ 
                            boxShadow: [
                              '0 0 10px rgba(255, 215, 0, 0.5)',
                              '0 0 20px rgba(255, 215, 0, 0.8)',
                              '0 0 10px rgba(255, 215, 0, 0.5)'
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-3 h-3 rounded-full"
                          style={{ 
                            background: '#FFD700',
                            boxShadow: '0 0 15px #FFD700'
                          }}
                        />
                        <div>
                          <h2 className="text-2xl font-light text-white">디지털 캔버스</h2>
                          <p className="text-sm text-gray-300 mt-1">검은 우주에 빛나는 작품을 그려보세요</p>
                        </div>
                      </div>
                      
                      {/* 편지 보내기 버튼 */}
                      <div className="flex items-center gap-4">
                        {/* 연결 상태 */}
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} 
                               style={{
                                 boxShadow: isConnected ? '0 0 10px #00FF00' : '0 0 10px #FF0000'
                               }} />
                          <span className="text-xs text-gray-300">
                            {isConnected ? '연결됨' : '연결 끊김'}
                          </span>
                        </div>
                        
            <button
              onClick={saveDrawing}
              disabled={!isConnected}
                          className="px-6 py-3 rounded-xl shadow-lg border-2 bg-white text-gray-900 border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-medium"
            >
                          <span className="text-lg">📤</span>
                          <span className="text-sm">작품 보내기</span>
            </button>
          </div>
        </div>
                  </div>
        
                  {/* 캔버스 영역 */}
                  <div className="relative p-8 h-full">
                    {/* 스마트 캔버스 */}
                    <div className="relative">
                                <SignatureCanvas
                        ref={sigCanvasRef}
                        penColor={isEraserMode ? '#000000' : brushColor}
                        canvasProps={{
                          className: 'w-full h-full border-0 rounded-lg',
                          style: { 
                            minHeight: 'calc(100vh - 300px)',
                            background: '#000000',
                            touchAction: isFullscreen ? 'none' : 'manipulation', // 전체화면에서는 완전 차단
                            cursor: isEraserMode ? 'crosshair' : 'crosshair',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            WebkitTouchCallout: 'none',
                            WebkitTapHighlightColor: 'transparent',
                            // iOS Safari 전용 속성들
                            WebkitOverflowScrolling: 'touch',
                            overscrollBehavior: 'none',
                            overscrollBehaviorX: 'none',
                            overscrollBehaviorY: 'none'
                          },
                          // 전체화면에서 추가 이벤트 차단
                          onTouchStart: (e: React.TouchEvent) => {
                            if (isFullscreen) {
                              e.stopPropagation(); // 부모로의 이벤트 전파 차단
                            }
                          },
                          onTouchMove: (e: React.TouchEvent) => {
                            if (isFullscreen) {
                              e.stopPropagation(); // 부모로의 이벤트 전파 차단
                            }
                          }
                        }}
                        minWidth={isEraserMode ? eraserSize * 0.8 : brushSize * 0.3}
                        maxWidth={isEraserMode ? eraserSize * 1.2 : brushSize * 2}
                        velocityFilterWeight={0.8}
                        throttle={8}
                        dotSize={isEraserMode ? eraserSize * 0.3 : brushSize * 0.1}
                        backgroundColor="rgba(255,255,255,0)"
                        onBegin={() => {
                          try {
                            if (sigCanvasRef.current) {
                              const canvas = sigCanvasRef.current.getCanvas();
                              const ctx = canvas?.getContext('2d');
                              if (ctx) {
                                if (isEraserMode) {
                                  ctx.save();
                                  ctx.globalCompositeOperation = 'destination-out';
                                  ctx.lineWidth = eraserSize;
                                } else {
                                  ctx.globalCompositeOperation = 'source-over';
                                  ctx.strokeStyle = brushColor;
                                  ctx.lineWidth = brushSize;
                                }
                              }
                            }
                          } catch (error) {
                            console.warn('Canvas onBegin error:', error);
                          }
                        }}
                        onEnd={() => {
                          try {
                            if (sigCanvasRef.current && isEraserMode) {
                              const canvas = sigCanvasRef.current.getCanvas();
                              const ctx = canvas?.getContext('2d');
                              if (ctx) {
                                ctx.restore();
                              }
                            }
                          } catch (error) {
                            console.warn('Canvas onEnd error:', error);
                          }
                        }}
                      />
                      
                      {/* 노트 라인 (실제 노트처럼) */}
                      <div className="absolute inset-0 pointer-events-none">
                        {/* 가로 줄 (파란색, 넓은 간격) */}
                        <div className="w-full h-full opacity-[0.12]" style={{
                          backgroundImage: 'repeating-linear-gradient(transparent, transparent 35px, #2563eb 35px, #2563eb 36px)',
                          backgroundPosition: '0 80px'
                        }} />
                        
                        {/* 여백선 (빨간색) - 실제 노트처럼 */}
                        <div className="absolute left-12 top-0 bottom-0 w-0.5 bg-red-400 opacity-50" />
                        
                        {/* 상단 여백 구분선 */}
                        <div className="absolute top-12 left-0 right-0 h-px bg-red-300 opacity-25" />
                        
                        {/* 하단 여백 */}
                        <div className="absolute bottom-8 left-0 right-0 h-px bg-blue-200 opacity-20" />
                        
                        {/* 노트 모서리 효과 */}
                        <div className="absolute top-0 left-0 w-8 h-8 opacity-[0.05]">
                          <div className="w-full h-full bg-gradient-to-br from-gray-400 to-transparent" />
                        </div>
                      </div>
                      
                      {/* 홀로그램 오버레이 또는 지우개 모드 오버레이 */}
                      {isEraserMode ? (
                        <div className="absolute inset-0 pointer-events-none rounded-lg">
                          <motion.div 
                            className="absolute inset-0 border-2 border-dashed border-red-300 rounded-lg"
                            animate={{
                              opacity: [0.3, 0.7, 0.3]
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                          {/* 지우개 모드 배경 효과 */}
                          <div className="absolute inset-0 bg-red-50/10 rounded-lg" />
                        </div>
                      ) : (
                        <motion.div 
                          className="absolute inset-0 pointer-events-none rounded-lg"
                          style={{
                            background: 'linear-gradient(45deg, transparent 30%, rgba(59, 130, 246, 0.05) 50%, transparent 70%)',
                            backgroundSize: '200% 200%'
                          }}
                          animate={{
                            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* 종이 그림자 효과 (다층) */}
                <div className="absolute -inset-1 bg-gradient-to-br from-gray-200/20 to-gray-400/20 rounded-3xl blur-sm -z-10" />
                <div className="absolute -inset-2 bg-gradient-to-br from-gray-300/10 to-gray-500/10 rounded-3xl blur-md -z-20" />
                <div className="absolute -inset-3 bg-gradient-to-br from-gray-400/5 to-gray-600/5 rounded-3xl blur-lg -z-30" />
                
                {/* 미래지향적 모서리 효과 */}
                <div className="absolute top-4 right-4 w-8 h-8 opacity-10">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-full h-full border border-gray-400 rounded-full"
                  />
                  <div className="absolute inset-2 border border-gray-300 rounded-full" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        
                {/* 하단 정보 패널 (도구 패널이 열렸을 때만) */}
        {showTools && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-8 max-w-7xl mx-auto px-6"
          >
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div className="flex flex-col items-center">
                <motion.div 
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-2xl mb-2"
                >
                  {isEraserMode ? '🧹' : '✍️'}
                </motion.div>
                <h3 className="font-medium text-gray-900 mb-1">
                  {isEraserMode ? '지우개 모드' : '터치펜 최적화'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isEraserMode ? '정밀한 부분 지우기' : 'Apple Pencil과 완벽 호환'}
                </p>
              </div>

              <div className="flex flex-col items-center">
                <motion.div 
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  className="text-2xl mb-2"
                >
                  🎯
                </motion.div>
                <h3 className="font-medium text-gray-900 mb-1">스마트 도구</h3>
                <p className="text-sm text-gray-600">쓰기 ↔ 지우기 모드 전환</p>
              </div>
              
              <div className="flex flex-col items-center">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
                  className="text-2xl mb-2"
                >
                  🎨
                </motion.div>
                <h3 className="font-medium text-gray-900 mb-1">실시간 전송</h3>
                <p className="text-sm text-gray-600">즉시 큰 화면에 표시</p>
        </div>
        
              <div className="flex flex-col items-center">
                <motion.div 
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1.4 }}
                  className="text-2xl mb-2"
                >
                  📜
                </motion.div>
                <h3 className="font-medium text-gray-900 mb-1">디지털 편지지</h3>
                <p className="text-sm text-gray-600">전통과 미래의 만남</p>
        </div>
      </div>
          </div>
          </motion.div>
        )}

        {/* 미래지향적 하단 시그니처 */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="text-center py-8"
        >
          <div className="inline-flex items-center gap-2 text-xs text-gray-400 font-mono">
            <motion.div 
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-1 h-1 bg-blue-400 rounded-full"
            />
            POWERED_BY_NEURAL_CREATIVITY_ENGINE
            <motion.div 
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
              className="w-1 h-1 bg-purple-400 rounded-full"
            />
          </div>
        </motion.div>
    </div>
  );
}