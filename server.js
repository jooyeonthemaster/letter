const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, orderBy, limit, query, writeBatch, where } = require('firebase/firestore');

// 환경변수 로드 (로컬 개발용, Render에서는 시스템 환경변수 사용)
try {
  require('dotenv').config({ path: '.env.local' });
} catch (error) {
  // Render 등 배포 환경에서는 .env.local이 없을 수 있음
  console.log('No .env.local file found, using system environment variables');
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = dev ? 'localhost' : '0.0.0.0';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Socket.io 서버 설정
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Firebase 클라이언트 SDK 설정 (서버에서 사용)
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBRRd197EOJWDOAEzFpbzGwPPDuyxKapJo",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "floor-b25f5.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "floor-b25f5",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "floor-b25f5.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "1045162394185",
    appId: process.env.FIREBASE_APP_ID || "1:1045162394185:web:b1c8eb0af454afa9c2b598",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-HPSDXW34S3"
  };

  console.log('Firebase 클라이언트 SDK로 초기화 시도:', firebaseConfig.projectId);
  const app = initializeApp(firebaseConfig);

  // 메모리 저장소 초기화 (예비)
  const storedMessages = [];
  const storedDrawings = [];
  
  // 스크린 초기화 시점 추적
  let screenClearTimestamp = null;
  
  let db, messagesCollection, drawingsCollection;
  let useFirestore = false;
  
  try {
    db = getFirestore(app);
    messagesCollection = collection(db, 'messages');
    drawingsCollection = collection(db, 'drawings');
    
    // Firestore 연결 테스트
    const testQuery = query(collection(db, 'messages'), limit(1));
    await getDocs(testQuery);
    
    useFirestore = true;
    console.log('✅ Firebase 초기화 성공 - Firestore 사용 가능');
  } catch (error) {
    console.log('⚠️  Firebase 연결 실패 - 메모리 저장소 사용:', error.message);
    useFirestore = false;
  }
  
  const MAX_STORED_ITEMS = 50;

  // 실시간 통신 이벤트 처리
  io.on('connection', async (socket) => {
    console.log('클라이언트 연결됨:', socket.id);
    
    // 테스트 이벤트 - 즉시 응답
    socket.on('test-connection', () => {
      console.log('테스트 연결 요청 받음:', socket.id);
      socket.emit('test-connection-result', { 
        message: '연결 성공!', 
        timestamp: new Date().toISOString(),
        socketId: socket.id 
      });
    });

    // 새 접속자에게 기존 메시지/그림 전송 (초기화 시점 이후만)
    if (useFirestore) {
      try {
        let messagesQuery = query(messagesCollection, orderBy('timestamp', 'desc'), limit(MAX_STORED_ITEMS));
        let drawingsQuery = query(drawingsCollection, orderBy('timestamp', 'desc'), limit(MAX_STORED_ITEMS));
        
        // 스크린 초기화 시점 이후 데이터만 필터링
        if (screenClearTimestamp) {
          console.log('스크린 초기화 필터 적용:', new Date(screenClearTimestamp).toISOString());
          messagesQuery = query(messagesCollection, where('timestamp', '>', new Date(screenClearTimestamp)), orderBy('timestamp', 'desc'), limit(MAX_STORED_ITEMS));
          drawingsQuery = query(drawingsCollection, where('timestamp', '>', new Date(screenClearTimestamp)), orderBy('timestamp', 'desc'), limit(MAX_STORED_ITEMS));
        }
        
        const messagesSnapshot = await getDocs(messagesQuery);
        if (!messagesSnapshot.empty) {
          const existingMessages = messagesSnapshot.docs.map(doc => ({
            id: doc.id,
            text: doc.data().text,
            timestamp: doc.data().timestamp.toDate().toISOString()
          }));
          socket.emit('existing-messages', existingMessages);
          console.log(`Firestore에서 기존 메시지 ${existingMessages.length}개 전송`);
        }

        const drawingsSnapshot = await getDocs(drawingsQuery);
        if (!drawingsSnapshot.empty) {
          const existingDrawings = drawingsSnapshot.docs.map(doc => ({
            id: doc.id,
            imageData: doc.data().imageData,
            position: doc.data().position,
            timestamp: doc.data().timestamp.toDate().toISOString()
          }));
          socket.emit('existing-drawings', existingDrawings);
          console.log(`Firestore에서 기존 그림 ${existingDrawings.length}개 전송`);
        }
      } catch (error) {
        console.error('Firestore에서 기존 데이터 로드 실패:', error);
      }
    } else {
      // 메모리 저장소에서 전송 (초기화 시점 이후만)
      const filteredMessages = screenClearTimestamp 
        ? storedMessages.filter(msg => new Date(msg.timestamp) > new Date(screenClearTimestamp))
        : storedMessages;
      const filteredDrawings = screenClearTimestamp 
        ? storedDrawings.filter(drawing => new Date(drawing.timestamp) > new Date(screenClearTimestamp))
        : storedDrawings;
        
      if (filteredMessages.length > 0) {
        socket.emit('existing-messages', filteredMessages);
        console.log(`메모리에서 필터링된 메시지 ${filteredMessages.length}개 전송`);
      }
      if (filteredDrawings.length > 0) {
        socket.emit('existing-drawings', filteredDrawings);
        console.log(`메모리에서 필터링된 그림 ${filteredDrawings.length}개 전송`);
      }
    }

    // 텍스트 메시지 이벤트
    socket.on('send-message', async (data) => {
      console.log('메시지 수신:', data);
      
      const messageData = {
        id: Date.now().toString(),
        text: data.text,
        timestamp: new Date().toISOString()
      };

      if (useFirestore) {
        try {
          // Firestore에 메시지 저장
          const docRef = await addDoc(messagesCollection, {
            text: data.text,
            timestamp: new Date()
          });
          
          messageData.id = docRef.id;
          console.log('✅ Firestore에 메시지 저장 성공:', docRef.id);
          
          // 최대 개수 초과시 오래된 메시지들 삭제
          const allMessagesQuery = query(messagesCollection, orderBy('timestamp', 'desc'));
          const allMessages = await getDocs(allMessagesQuery);
          
          if (allMessages.size > MAX_STORED_ITEMS) {
            const messagesToDelete = allMessages.docs.slice(MAX_STORED_ITEMS);
            const batch = writeBatch(db);
            messagesToDelete.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
          }
        } catch (error) {
          console.error('Firestore 메시지 저장 실패:', error);
        }
      } else {
        // 메모리 저장소에 저장
        storedMessages.push(messageData);
        if (storedMessages.length > MAX_STORED_ITEMS) {
          storedMessages.shift();
        }
      }

      // 모든 클라이언트에게 메시지 브로드캐스트
      io.emit('new-message', messageData);
    });

    // 그림 데이터 이벤트
    socket.on('send-drawing', async (data) => {
      console.log('그림 수신', data.position ? '(위치 포함)' : '(위치 없음)');
      
      const drawingData = {
        id: Date.now().toString(),
        imageData: data.imageData,
        timestamp: new Date().toISOString(),
        position: data.position || null
      };

      if (useFirestore) {
        try {
          // Firestore에 그림 저장
          const docRef = await addDoc(drawingsCollection, {
            imageData: data.imageData,
            timestamp: new Date(),
            position: data.position || null
          });
          
          drawingData.id = docRef.id;
          console.log('✅ Firestore에 그림 저장 성공:', docRef.id);

          // 최대 개수 초과시 오래된 그림들 삭제
          const allDrawingsQuery = query(drawingsCollection, orderBy('timestamp', 'desc'));
          const allDrawings = await getDocs(allDrawingsQuery);
          
          if (allDrawings.size > MAX_STORED_ITEMS) {
            const drawingsToDelete = allDrawings.docs.slice(MAX_STORED_ITEMS);
            const batch = writeBatch(db);
            drawingsToDelete.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
          }
        } catch (error) {
          console.error('Firestore 그림 저장 실패:', error);
        }
      } else {
        // 메모리 저장소에 저장
        storedDrawings.push(drawingData);
        if (storedDrawings.length > MAX_STORED_ITEMS) {
          storedDrawings.shift();
        }
      }

      // 모든 클라이언트에게 그림 브로드캐스트
      io.emit('new-drawing', drawingData);
      console.log('그림 브로드캐스트 완료');
    });

    // 스크린 초기화 이벤트 (관리자 전용)
    socket.on('clear-screen', () => {
      console.log('관리자가 스크린 초기화 요청');
      screenClearTimestamp = Date.now();
      
      // 모든 스크린 클라이언트에게 초기화 알림
      io.emit('screen-cleared', {
        timestamp: screenClearTimestamp,
        message: '스크린이 초기화되었습니다'
      });
      
      console.log('스크린 초기화 완료:', new Date(screenClearTimestamp).toISOString());
    });

    // 데이터 카운트 요청 이벤트 (관리자 전용) - 단순화 버전
    socket.on('get-data-count', async () => {
      console.log('✅ get-data-count 이벤트 받음 - socket ID:', socket.id);
      console.log('✅ useFirestore 상태:', useFirestore);
      
      try {
        console.log('✅ 응답 전송 시작...');
        
        // 일단 간단한 응답부터 보내기
        socket.emit('data-count-result', {
          total: { messages: 0, drawings: 0 },
          visible: { messages: 0, drawings: 0 },
          screenClearTimestamp: null,
          debug: 'simplified version working'
        });
        
        console.log('✅ 응답 전송 완료');
        return; // 일단 여기서 리턴하고 복잡한 로직은 나중에
        
        let messageCount = 0;
        let drawingCount = 0;
        let visibleMessageCount = 0;
        let visibleDrawingCount = 0;

        console.log('🔍 데이터 조회 시작...');
        if (useFirestore) {
          console.log('🔍 Firestore 모드로 데이터 조회 중...');
        if (useFirestore) {
          try {
            // 전체 데이터 수
            const allMessagesSnapshot = await getDocs(collection(db, 'messages'));
            const allDrawingsSnapshot = await getDocs(collection(db, 'drawings'));
            messageCount = allMessagesSnapshot.size;
            drawingCount = allDrawingsSnapshot.size;

            // 현재 화면에 표시되는 데이터 수 (초기화 이후)
            if (screenClearTimestamp) {
              const visibleMessagesQuery = query(
                messagesCollection, 
                where('timestamp', '>', new Date(screenClearTimestamp))
              );
              const visibleDrawingsQuery = query(
                drawingsCollection, 
                where('timestamp', '>', new Date(screenClearTimestamp))
              );
              
              const visibleMessagesSnapshot = await getDocs(visibleMessagesQuery);
              const visibleDrawingsSnapshot = await getDocs(visibleDrawingsQuery);
              visibleMessageCount = visibleMessagesSnapshot.size;
              visibleDrawingCount = visibleDrawingsSnapshot.size;
            } else {
              visibleMessageCount = messageCount;
              visibleDrawingCount = drawingCount;
            }
          } catch (error) {
            console.error('Firestore 카운트 조회 실패:', error);
            // Firestore 실패 시 메모리 저장소 사용
            messageCount = storedMessages.length;
            drawingCount = storedDrawings.length;
            visibleMessageCount = messageCount;
            visibleDrawingCount = drawingCount;
          }
        } else {
          // 메모리 저장소에서 카운트
          messageCount = storedMessages.length;
          drawingCount = storedDrawings.length;
          
          if (screenClearTimestamp) {
            visibleMessageCount = storedMessages.filter(msg => 
              new Date(msg.timestamp) > new Date(screenClearTimestamp)
            ).length;
            visibleDrawingCount = storedDrawings.filter(drawing => 
              new Date(drawing.timestamp) > new Date(screenClearTimestamp)
            ).length;
          } else {
            visibleMessageCount = messageCount;
            visibleDrawingCount = drawingCount;
          }
        }

        // 관리자에게 카운트 정보 전송
        console.log('카운트 결과 전송:', { messageCount, drawingCount, visibleMessageCount, visibleDrawingCount });
        socket.emit('data-count-result', {
          total: {
            messages: messageCount,
            drawings: drawingCount
          },
          visible: {
            messages: visibleMessageCount,
            drawings: visibleDrawingCount
          },
          screenClearTimestamp: screenClearTimestamp ? new Date(screenClearTimestamp).toISOString() : null
        });
      } catch (error) {
        console.error('데이터 카운트 처리 중 오류:', error);
        // 에러 발생 시에도 응답 보내기
        socket.emit('data-count-result', {
          total: { messages: 0, drawings: 0 },
          visible: { messages: 0, drawings: 0 },
          screenClearTimestamp: null,
          error: '데이터 조회 중 오류가 발생했습니다.'
        });
      }
    });

    // 연결 해제
    socket.on('disconnect', () => {
      console.log('클라이언트 연결 해제됨:', socket.id);
    });
  });

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log('> Socket.io 서버가 실행 중입니다');
    });
});