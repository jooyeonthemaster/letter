export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          미디어 아트 관리자 페이지
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">텍스트 메시지 관리</h2>
            <p className="text-gray-600 mb-4">
              디스플레이에 표시될 텍스트 메시지를 관리합니다.
            </p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              메시지 관리
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">그림 갤러리</h2>
            <p className="text-gray-600 mb-4">
              사용자들이 그린 작품들을 관리합니다.
            </p>
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              갤러리 관리
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">시스템 설정</h2>
            <p className="text-gray-600 mb-4">
              애니메이션 속도, 색상 등을 설정합니다.
            </p>
            <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              설정 관리
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}