'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SignatureCanvas from 'react-signature-canvas';
import { connectSocket, disconnectSocket } from '@/lib/socket';

export default function DrawPage() {
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState('#1a1a1a');
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
      sigCanvasRef.current.clear();
    }
  };

  const toggleEraserMode = () => {
    setIsEraserMode(!isEraserMode);
  };

  const saveDrawing = () => {
    if (!sigCanvasRef.current || !isConnected) return;

    const dataURL = sigCanvasRef.current.toDataURL();
    const socket = connectSocket();
    socket.emit('send-drawing', { imageData: dataURL });
    console.log('편지 전송 완료');
    
    // 그림 전송 후 캔버스 초기화
    clearCanvas();
  };

  // 고급 색상 팔레트 (화이트&블랙 컨셉)
  const inkColors = [
    { name: '깊은 먹', color: '#1a1a1a' },
    { name: '연한 먹', color: '#4a4a4a' },
    { name: '회색 먹', color: '#6b7280' },
    { name: '푸른 먹', color: '#1e3a8a' },
    { name: '붉은 먹', color: '#7f1d1d' },
    { name: '진한 먹', color: '#000000' }
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
    { id: 1, author: '현기영', authorEng: 'Hyun Ki Young', title: '제주도우다 1', publisher: '창비', year: 2023, quotes: '우린 그때 살아도 살아 있는 걸로 생각 못 했어. 하늘로도 도망 못 가고, 땅으로도 도망갈 데가 없었주.\n먼저 그 참사에 대해서 쓰지 않고서는 다른 글을 쓸 수가 없다는 걸 깨달은 거라.\n그래, 오냐오냐, 이제 그 얘길 해보자!\n빼앗긴 식민지 바다, 그럼에도 제주 바다는 여전히 아름답다.\n하하하, 우린 북도 아니고 남도 아니고, 제주도다!' },
    { id: 2, author: '성해나', authorEng: 'Haena Sung', title: '혼모노', publisher: '창비', year: 2025, quotes: '스무드\n사람들과 마찬가지로 나 역시도 그런 매끈한 세계를 추앙했다.\n\n혼모노\n가벼워진다. 모든 것에서 놓여나듯. 이제야 진짜 가짜가 된 듯.\n\n구의 집: 갈월동 98번지\n무형의 공간에 선을 더하고 면을 채우고 종국에는 인간까지 집어넣는 일.\n\n우호적 감정\n알렉스, 너무 애쓰지 마요. 애쓰면 더 멀어져.\n\n메탈\n이 시절이 영원할 것처럼 그들은 짙푸른 밤을 내달렸다.' },
    { id: 3, author: '김초엽', authorEng: 'Kim Choyeop', title: '파견자들', publisher: '퍼블리온', year: 2023, quotes: '자꾸만 나타났다가 흩어지는 풍경이 있다.\n평생 뇌의 한구석을 그 존재에게 내줄 수 있어?\n잘 생각해봐. 네가 정말 하나의 존재인지\n한때는 인간이 갈 수 있고 소유할 수도 있다고 믿었던 먼 곳의 행성으로부터.\n네가 보는 이 풍경은 어때?' },
    { id: 4, author: '김숨', authorEng: 'Kim Soom', title: '무지개 눈', publisher: '민음사', year: 2025, quotes: '오늘 밤 내 아이들은 새장을 찾아 떠날 거예요\n그녀는 빛을 못 보지만 세상에는 빛이 있어야 한다고 생각한다.\n\n파도를 만지는 남자\n우리가 보았던 것은 바다가 아니라 파도예요.\n\n빨간 집에 사는 소녀\n눈을 감는다는 건 아무도 보고 싶지 않다는 거야.\n\n검은색 양말을 신은 기타리스트\n내 눈雪동자는 떨어지고 있고 녹고 있으며 보고 있다.\n\n무지개 눈\n내게는 보려는 몸짓이 아직 남아 있어.' },
    { id: 5, author: '전하영', authorEng: 'Jeon Hayoung', title: '시차와 시대착오', publisher: '문학동네', year: 2024, quotes: '검은 일기\n이해할 수 없는 것과는 싸우려 들지 말라, 그것이 내 신조였다.\n\n남쪽에서\n보이지 않아도 쓰이는 어떤 삶을. 어딘가에 존재하는 질서를. 그 깊고 어두운 세계를.\n\n영향\n우리는 모두 언젠가 상처받을 것이다. 우리가 사랑했던 아름다움으로부터······\n\n숙희가 만든 실험영화\n기꺼이 속는 것이야말로 젊은 사람들의 표식이다, 라고 숙희는 생각했다.\n\n경로 이탈\n어릴 적에 들은 짧은 이야기 하나 때문에 그는 나무 그림자를 밟지 않는 사람이 되었다.' },
    { id: 6, author: '윤은성', authorEng: 'Eunseong Yoon', title: '유리 광장에서', publisher: '도서출판 빠마', year: 2024, quotes: '우재\n너 없이 오직 다짐들과 시간들뿐이네.\n\n둑과 빛과 물의 시\n사라질 것 같으면 돌을 물에 던지듯 이야기를 만들었다\n\n봄 방학\n이번 겨울에는 나의 도시에 한번 다녀가세요.\n\n모르는 일들로부터\n그럼 내 숲의 초록빛도 한 번씩 밖으로 내비춰지고\n\n좁고 긴 옷\n내가 나를 증명하지 않는 것이 노래에 가깝다고 해요' },
    { id: 7, author: '이수지', authorEng: 'Suzy Lee', title: '춤을 추었어', publisher: '안그라픽스', year: 2024, quotes: '뛰어오르는 물고기\n나비의 날갯짓\n땅 밑 여행\n꽃의 환대\n모두 춤을 추었어' },
    { id: 8, author: '장이지', authorEng: 'Jang I-Ji', title: '오리배가 지나간 호수의 파랑', publisher: '아침달', year: 2025, quotes: '무지개\n그것이 아직 덜 쓰였다는 점에서 얼마간 지우고 있는 것과 구분할 수 없다\n\n헤어지는 중\n헤어짐은 만남이야, 바보야\n\n혼자만 찬란한 것\n돌아누우면, 아무도 없구나\n\n칠월\n나와 세계를 송두리째 바꾸는 꿈\n\nWhen You Wish Upon A Star\n너와 나 사이에 하얗게 눈이 내려 쌓였으면······' },
    { id: 9, author: '김성중', authorEng: 'Kim Seong Joong', title: '화성의 아이', publisher: '문학동네', year: 2024, quotes: '장소를 묻는 건 우리가 누구인지 묻는 것과 같아.\n무언가를 간절히 기다리는 마음, 무엇인지도 모르는 채 간절해지기만 하는 마음.\n내 삶은 인간을 사랑하는 것과 사랑하지 않는 것 사이의 투쟁이었다.\n처음부터 나는 그 아이를 사랑하지 않을 자신이 없었다.\n우리는 "애정"이라는 말을 알았고 "그리움"이라는 말도 알았다.' },
    { id: 10, author: '이금이', authorEng: 'Lee Geum-yi', title: '알로하, 나의 엄마들', publisher: '창비', year: 2020, quotes: "지 결론이 뭔지 압니꺼? 사람은 다 똑같다는 기라예.\n'내 딸은 좋은 시상에서 내보다 나은 삶을 살아야 한다.'\n함께 조선을 떠나온 자신들은 아프게, 기쁘게, 뜨겁게 파도를 넘어서며 살아갈 것이다.\n세상에 멋진 싸움이라는 거이 없다.\n하와이에 산다면 이런 비쯤 아무렇지 않게 맞아야 한다." },
    { id: 11, author: '이제니', authorEng: 'Lee Jenny', title: '그리하여 흘려 쓴 것들', publisher: '문학과지성사', year: 2019, quotes: '남겨진 이후에\n너는 말할 수 없는 말을 내뱉고 읽히지 않는 문장이 되었다.\n\n지금 우리가 언어로 말하는 여러 가지 이야기들\n꾸며낸 이야기가 가본 적 없는 거리의 풍경을 불러들인다.\n\n밤에 의한 불\n너의 얼굴은 두 번 다시 볼 수 없다는 점에서 아름답고.\n\n나무 공에 의지하여\n너와 나 외에 모든 것이 흐르고 있는 들판이 있다.\n\n발화 연습 문장\n―이미 찢겼지만 다시 찢겨야만 한다\n-보이지 않는 글자를 아무도 모르는 발음으로 읽어 내려갔다.' },
    { id: 12, author: '황여정', authorEng: 'Hwang Yeo Jung', title: '숨과 입자', publisher: '창비', year: 2024, quotes: '내 안에서 움트고 작동되는 마음이라고 해서 그것의 본질을 다 알 수는 없는 일이다. 의식은 언제나 마음보다 늦다.\n모든 일에는 순서가 있는 법이고, 제삼자의 궁금증 해소가 당자의 애도보다 앞서는 일일 수는 없었다.\n본래 나의 것이 아니었던 것들의 철수.\n나는 살아 있는 사람이 아니라 살아남은 사람이다.\n다가가보는 수밖에 없지 않겠어? 그걸 원한다면.' },
    { id: 13, author: '강지영', authorEng: 'Kang Ji-young', title: '심여사는 킬러', publisher: '네오픽션', year: 2023, quotes: '이제 나는 보통의 아줌마가 아니다. 킬러다.\n부러진 칼끝이 가슴 어딘가를 건드리는 모양이었다.\n사람은 미치지 않기 위해 어떤 일이든 파고들게 되어 있다.\n스마일입니다.\n우리는 칼이 부딪히는 소리에 발을 맞춰 밀림 같은 세상을 향해 어깨를 늘어뜨리고 걸어 나가야 했다.' },
    { id: 14, author: '이설야', authorEng: 'Lee Sul Ya', title: '내 얼굴이 도착하지 않았다', publisher: '창비', year: 2022, quotes: '백색 그림자\n오후를 미리 끌고가는 백색 그림자들\n\n봄여름가을겨울\n오늘은 오늘의 마음을 다 쓰겠습니다\n\n저수지\n다 쓰지도 버리지도 못한 어제의 얼굴들\n\n마트료시카\n죽은 지 더 오래된 얼굴들은 더 안쪽 깊은 곳에 있다\n\n물고기 극장\n은어다리를 건너가던 별들이 물고기 극장 위에 떠있다' },
    { id: 15, author: '우다영', authorEng: 'Woo Dayoung', title: '그러나 누군가는 더 검은 밤을 원한다', publisher: '문학과지성사', year: 2023, quotes: '우리 사이에 칼이 있었네\n우리가 더없이 불완전하고 불확실한 존재라는 것.\n\n태초의 선함에 따르면\n왜 우리는 무언가를 애호하고 무언가를 혐오할까요?\n\n긴 예지\n항상 내가 있는 쪽이 미래야. 나를 선택하면 돼.\n\n기도는 기적의 일부\n지금 미래를 무너뜨리고 있는 건 누구죠?\n\n그러나 누군가는 더 검은 밤을 원한다\n우리는 멋진 이야기 하나를 알게 될 때 우리가 가지고 있던 어설프고 모호한 이야기의 가능성들을 모두 잃어버립니다.' },
    { id: 16, author: '심보선', authorEng: 'Shim Bo-Seon', title: '네가 봄에 써야지 속으로 생각했던', publisher: '아침달', year: 2025, quotes: '오해\n내 심장은 생을 더듬거리며 엇박자로 달린다\n\n몽상가\n나는 또 다른 꿈을 꾸려고 잠에서 깨나 봐요\n\n그리고\n온갖 형태로 우리를 감쌀 그 환한 고리를\n\n스물\n인생은 스무 번의 낙담 뒤엔 그냥 살아지는 거지\n\n문학 공동체\n여기서부터는 당신이 소설가이건 시인이건 상관없다' },
    { id: 17, author: '최진영', authorEng: 'Choi Jin young', title: '단 한 사람', publisher: '한겨레출판', year: 2023, quotes: '뛰어난 작품은 일단 사람들을 불편하게 한다는 사실을 모르십니까?\n저렇게 많은 사람이 죽는데 어째서 나는 살아 있지?\n기적이란 그 사람이 어떻게 살아왔느냐를 따지지 않고 룰렛처럼 무작위로 일어났다.\n사랑하는 사람이 생긴다는 건 신에게 구걸할 일이 늘어난다는 것.\n나 또한 한 번뿐인 삶을 사는 단 한 명임을 기억하라고.' },
    { id: 18, author: '이훤', authorEng: 'Hwon Lee', title: '눈에 덜 띄는', publisher: '마음산책', year: 2024, quotes: '눈에 덜 띄는 것들은 비밀을 품고 있다.\n근데 언어가 원래 조금은 수고스러워야 하는 거 아닌가?\n과거의 텍스트와 이미지 안에서 나는 어떤 식으로든 오해될 거다.\n사랑이 좌표를 옮기며 어떤 면들은 남겨지고 어떤 낯들은 버려진다.\n누구도 영원히 눈에 띌 수는 없다.' },
    { id: 19, author: '김수우', authorEng: 'Kim Soo Woo', title: '뿌리주의자', publisher: '창비', year: 2021, quotes: '내 방 밖 또 하나의 방이 있다\n하늘 아래 누군가 시를 쓰고 있었다\n최초의 얼굴이 도착했다 가난을 업고 온 커다란 고요\n돌기 푸른 목소리를 냈다 삶은 방향일 뿐이야 무게도 길이도 아니야\n나는 또 어느 우주로 돌아갈 것인가' },
    { id: 20, author: '옌롄커', authorEng: 'Yan Lianke', authorChi: '阎连科', title: '해가 죽던 날', publisher: '글항아리', year: 2024, quotes: '이제 제 이야기를 시작하겠습니다.\n사람들은 꿈을 믿으면서 현실은 믿지 않았습니다.\n그가 책을 쓰는 것은 사람들이 모두 그 책 속에서 살게 하기 위함이었습니다.\n어두운 낮의 검은색은 어제의 어두운 밤이 넘친 것이었습니다.\n몽유 외부의 깨어 있는 방향을 향해 뛰어가는 것 같았습니다.' },
    { id: 21, author: '김주혜', authorEng: 'Juhea Kim', title: '밤새들의 도시', publisher: '다산책방', year: 2025, quotes: '그런데 돌이켜 보면, 내가 가장 사랑했던 사람들은 내 약점을 강점으로 바꿔준 이들이었어요.\n인간은 사랑하는 것을 기꺼이 파괴할 수 있으며, 이를 욕망하기까지 한다.\n뭔가를 남겨둘 것인지, 아니면 자신의 모든 것과 자신 그 자체를 예술에 바칠 것인지 예술이 묻는다.\n네가 선택하고, 느낄 수 있다는 걸 느끼고, 네가 할 수 있는 방식대로 사랑하고, 그 결과를 받아들이면 돼. 그게 인생의 전부니까.\n결국 인생이란 모든 게 실수다. 그렇지만 동시에, 그 어느 것도 실수가 아니다.' },
    { id: 22, author: '마테오 B. 비앙키', authorEng: 'Matteo B. Bianchi', title: '남겨진 자들의 삶', publisher: '문예출판사', year: 2024, quotes: '나는 그들과는 다른 곳에 있다.\n왜 사람들은 남겨진 자들의 고통을 외면하는 것일까?\n그럼에도, 이런 일을 겪고도 살아남은 생존자들.\n고통은 영혼 한구석에 감추어놓은 비밀이었다.\n이별은 수많은 겹으로 이루어진, 끝없는 작별 인사였다.' },
    { id: 23, author: '아드리앵 파를랑주', authorEng: 'Adrien Parlange', title: '봄은 또 오고', publisher: '봄볕', year: 2024, quotes: '아홉 살의 봄, 마음 맞는 친구와 종일 신나게 놀아.\n열여섯의 봄, 우리는 사랑에 빠져.\n스물넷의 봄, 긴 여행을 해.\n스물여섯의 봄, 더 이상 외롭게 지내지 않아.\n서른둘의 봄, 바다에서 딸에게 첫걸음마를 가르쳐.' },
    { id: 24, author: '패트릭 드윗', authorEng: 'Patrick deWitt', title: '시스터스 브라더스', publisher: '문학동네', year: 2019, quotes: '한 집안의 이야기가 얼마나 정신 나가고 비뚤어질 수 있는지.\n인생의 많은 것이 그렇듯 이번에도 어쩔 수 없는 거야, 형제.\n모든 종이 소리를 내듯이 모든 마음도 소리를 내지.\n슬픔과 걱정에서 완전히 벗어날 수 있는 사람은 없어.\n사람은 운이라는 막연한 느낌을 갈망한다.' },
    { id: 25, author: '엘비라 나바로', authorEng: 'Elvira Navarro', title: '토끼들의 섬', publisher: '비채', year: 2024, quotes: '스트리크닌\n모든 일이 너무나 빠르게 벌어지고 있다.\n\n역행\n어떻게 그 일을 잊을 수 있었을까?\n\n파리 근교\n내가 서 있는 곳에서 남쪽을 바라봐도 끝이 보이지 않는다.\n\n지옥의 건축학을 위한 기록\n망상이나 착란이 그려내는 세계는 단지 상상의 평면에서만 일어나는 것이 아니었다.\n\n꼭대기 방\n여자는 창문에서 도시 전체를 내려다볼 수 있다는 점에서 작더라도 꼭대기 층에 있는 방을 택했다.' },
    { id: 26, author: '후즈키 유미', authorEng: 'Yumi Fuzuki', authorJap: '文月悠光', title: '적절한 세계의 적절할 수밖에 없는 나', publisher: '', year: 0, quotes: '바람을 가르고, 구름을 향해 달려 오르는 나.\n흰 구름 꼭대기를 손으로 짚고,\n가만히 웅크려 앉았다.\n어느 날, 붓에 휩쓸려\n거리로 휙 떨어진다면,\n바람에 부풀어 오른 스커트처럼\n나는 활짝 피어줄 테다.' },
    { id: 27, author: '요나스 하센 케미리', authorEng: 'Jonas Hassen Khemiri', title: '몬테코어', publisher: '민음사', year: 2024, quotes: '때로 진실의 복잡함이 그가 거짓말을 하게 만든 거였다.\n최상의 초상화는 가장 잘 아는 사람에 의해서 창조된다.\n왜 우리 인간들은 이렇게 작은 삶의 부분들에 대해서는 만족하지 못하는 걸까?\n비극은 종종 스테레오로 한꺼번에 몰려온다.\n무슨 일이 일어나고 있지만 그게 무엇인지 확실히 모른다.' },
    { id: 28, author: '세라 핀스커', authorEng: 'Sarah Pinsker', title: '언젠가 모든 것은 바다로 떨어진다', publisher: '창비', year: 2025, quotes: '그리고 우리는 어둠 속에 남겨졌다\n우리가 모두 같은 걸 보고 있기는 한 걸까?\n\n기억살이 날\n좋은 기억들도 아픈 거 아닐까요.\n\n언젠가 모든 것은 바다로 떨어진다\n맞아요. 여기서도 여전히 음악이 필요하잖아요, 맞죠?\n\n뒤에 놓인 심연을 알면서도 기쁘게\n그런 우연한 일들로 삶이 만들어졌다.\n\n바람은 방랑하리\n언젠가는 모든 걸 다시 지워야 할지도 몰라요.' },
    { id: 29, author: '빅토리아 마스', authorEng: 'Victoria Mas', title: '미친 여자들의 무도회', publisher: '문학동네', year: 2023, quotes: '달리 말해서 그녀가 원하는 삶은 그런 삶이 아닌 다른 모든 삶이다.\n아마도 남자들은 여자들을 업신여긴다기보다 오히려 두려워하는 것 같다.\n삶은 이미 충분히 형벌 같은데, 죽은 뒤에도 이 형벌이 지속된다는 말이 터무니없고 부당하게 여겨졌다.\n남자들은 타인에게 광기를 부리지만, 여자들의 광기는 자기 자신을 향한다.\n이 책은······ 내가 미치지 않았다는 사실을 일깨워줬어요.' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
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
                    <h1 className="text-5xl font-light text-gray-900 mb-2 tracking-wide">
            보이는 것보다 선명한
        </h1>
          <p className="text-lg text-gray-600 font-light">
            디지털 편지지에 마음을 담아보세요
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
                {/* 편지지 배경 */}
                <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
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
                  
                                    

                  {/* 편지지 헤더 */}
                  <div className="relative z-10 p-8 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* 홀로그램 인디케이터 */}
                        <motion.div 
                          animate={{ 
                            boxShadow: [
                              '0 0 10px rgba(59, 130, 246, 0.3)',
                              '0 0 20px rgba(139, 92, 246, 0.4)',
                              '0 0 10px rgba(59, 130, 246, 0.3)'
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                        />
                        <div>
                          <h2 className="text-2xl font-light text-gray-900">디지털 편지지</h2>
                          <p className="text-sm text-gray-500 mt-1">당신의 마음을 자유롭게 표현해보세요</p>
                        </div>
                      </div>
                      
                      {/* 편지 보내기 버튼 */}
                      <div className="flex items-center gap-4">
                        {/* 연결 상태 */}
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-xs text-gray-500">
                            {isConnected ? '연결됨' : '연결 끊김'}
                          </span>
                        </div>
                        
            <button
              onClick={saveDrawing}
              disabled={!isConnected}
                          className="px-6 py-3 rounded-xl shadow-lg border-2 bg-gray-900 text-white border-gray-700 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-medium"
            >
                          <span className="text-lg">📤</span>
                          <span className="text-sm">편지 보내기</span>
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
                        penColor={isEraserMode ? '#FFFFFF' : brushColor}
                        canvasProps={{
                          className: 'w-full h-full border-0 rounded-lg',
                          style: { 
                            minHeight: 'calc(100vh - 300px)',
                            background: 'transparent',
                            touchAction: 'none',
                            cursor: isEraserMode ? 'crosshair' : 'crosshair'
                          }
                        }}
                        minWidth={isEraserMode ? eraserSize * 0.8 : brushSize * 0.3}
                        maxWidth={isEraserMode ? eraserSize * 1.2 : brushSize * 2}
                        velocityFilterWeight={0.8}
                        throttle={8}
                        dotSize={isEraserMode ? eraserSize * 0.3 : brushSize * 0.1}
                        backgroundColor="rgba(255,255,255,0)"
                        onBegin={() => {
                          if (sigCanvasRef.current) {
                            const canvas = sigCanvasRef.current.getCanvas();
                            const ctx = canvas.getContext('2d');
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
                        }}
                        onEnd={() => {
                          if (sigCanvasRef.current && isEraserMode) {
                            const canvas = sigCanvasRef.current.getCanvas();
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.restore();
                            }
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