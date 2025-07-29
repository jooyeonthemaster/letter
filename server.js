const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
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

  // 실시간 통신 이벤트 처리
  io.on('connection', (socket) => {
    console.log('클라이언트 연결됨:', socket.id);

    // 텍스트 메시지 이벤트
    socket.on('send-message', (data) => {
      console.log('메시지 수신:', data);
      // 모든 클라이언트에게 메시지 브로드캐스트
      io.emit('new-message', {
        id: Date.now().toString(),
        text: data.text,
        timestamp: new Date().toISOString()
      });
    });

    // 그림 데이터 이벤트
    socket.on('send-drawing', (data) => {
      console.log('그림 수신');
      // 모든 클라이언트에게 그림 브로드캐스트
      io.emit('new-drawing', {
        id: Date.now().toString(),
        imageData: data.imageData,
        timestamp: new Date().toISOString()
      });
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