'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">오류가 발생했습니다</h2>
        <p className="text-gray-400 mb-8">
          {error.message || '예기치 않은 오류가 발생했습니다.'}
        </p>
        <button
          onClick={reset}
          className="inline-block px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors mr-4"
        >
          다시 시도
        </button>
        <a 
          href="/"
          className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  )
}