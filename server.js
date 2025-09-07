const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = dev ? 'localhost' : '0.0.0.0';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
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

  // 메시지와 그림을 저장할 배열들 (최대 50개씩 유지)
  const storedMessages = [];
  const storedDrawings = [];
  const MAX_STORED_ITEMS = 50;

  // 실시간 통신 이벤트 처리
  io.on('connection', (socket) => {
    console.log('클라이언트 연결됨:', socket.id);

    // 새 접속자에게 기존 메시지/그림 전송
    if (storedMessages.length > 0) {
      socket.emit('existing-messages', storedMessages);
    }
    if (storedDrawings.length > 0) {
      socket.emit('existing-drawings', storedDrawings);
    }

    // 텍스트 메시지 이벤트
    socket.on('send-message', (data) => {
      console.log('메시지 수신:', data);
      
      const messageData = {
        id: Date.now().toString(),
        text: data.text,
        timestamp: new Date().toISOString()
      };

      // 메시지 저장 (최대 개수 초과시 오래된 것 제거)
      storedMessages.push(messageData);
      if (storedMessages.length > MAX_STORED_ITEMS) {
        storedMessages.shift();
      }

      // 모든 클라이언트에게 메시지 브로드캐스트
      io.emit('new-message', messageData);
    });

    // 그림 데이터 이벤트
    socket.on('send-drawing', (data) => {
      console.log('그림 수신', data.position ? '(위치 포함)' : '(위치 없음)');
      
      const drawingData = {
        id: Date.now().toString(),
        imageData: data.imageData,
        timestamp: new Date().toISOString(),
        // 위치 정보도 함께 저장
        position: data.position || null
      };

      // 그림 저장 (최대 개수 초과시 오래된 것 제거)
      storedDrawings.push(drawingData);
      if (storedDrawings.length > MAX_STORED_ITEMS) {
        storedDrawings.shift();
      }

      // 모든 클라이언트에게 그림 브로드캐스트
      io.emit('new-drawing', drawingData);
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