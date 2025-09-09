export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">페이지를 찾을 수 없습니다</h2>
        <p className="text-gray-400 mb-8">요청하신 페이지가 존재하지 않습니다.</p>
        <a 
          href="/"
          className="inline-block px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors"
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  )
}