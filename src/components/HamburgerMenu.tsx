'use client';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MindmapData } from '../app/mindmap/types';
import { MindmapService } from '../app/mindmap/services/MindmapService';

export default function HamburgerMenu() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mindmaps, setMindmaps] = useState<MindmapData[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // 마인드맵 데이터 로드
  useEffect(() => {
    if (isOpen && session?.user?.email) {
      loadMindmaps();
    }
  }, [isOpen, session]);

  const loadMindmaps = async () => {
    if (!session?.user?.email) return;
    
    setLoading(true);
    try {
      const userMindmaps = await MindmapService.getUserMindmaps(session.user.email);
      setMindmaps(userMindmaps);
    } catch (error) {
      console.error('마인드맵 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMindmapClick = (mindmapId: string) => {
    router.push(`/mindmap/${mindmapId}`);
    setIsOpen(false);
  };

  const handleMindLinkClick = () => {
    router.push('/mindmap?view=network');
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    setIsOpen(false);
    router.push('/');
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      {/* 햄버거 버튼 */}
      <button
        onClick={toggleMenu}
        className="bg-white shadow-lg rounded-lg p-3 hover:bg-gray-50 transition-colors relative z-60"
      >
        <div className="w-6 h-5 flex flex-col justify-between">
          <span className={`bg-gray-700 h-0.5 w-full transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`bg-gray-700 h-0.5 w-full transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`bg-gray-700 h-0.5 w-full transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </div>
      </button>

      {/* 모바일 전체 오버레이 (모바일에서만 표시) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* 사이드바 */}
      <div className={`fixed top-0 left-0 h-full bg-gray-100 shadow-xl transform transition-transform duration-300 ease-in-out 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        w-full max-w-sm md:w-80 md:max-w-none`}>
        
        {/* 헤더 */}
        <div className="p-4 md:p-6 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800">StoryMind</h2>
              <p className="text-xs md:text-sm text-gray-600 mt-1">마인드맵 관리</p>
            </div>
            {/* 모바일 닫기 버튼 */}
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 로그인/회원가입 섹션 */}
        <div className="p-4 md:p-6 border-b border-gray-200">
          {session ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {session.user?.name?.charAt(0) || session.user?.email?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {session.user?.name || '사용자'}
                  </p>
                  <p className="text-xs text-gray-600">{session.user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm">로그아웃</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                href="/auth/login"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium">로그인</span>
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span className="text-sm font-medium">회원가입</span>
              </Link>
            </div>
          )}
        </div>

        {/* 메뉴 리스트 */}
        <div className="flex-1 overflow-y-auto">
          {/* 메인 메뉴 */}
          <div className="p-3 md:p-4">
            <nav className="space-y-1 md:space-y-2">
              <Link 
                href="/" 
                className="flex items-center px-3 md:px-4 py-2 md:py-3 text-gray-700 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 1v6m8-6v6" />
                </svg>
                <span className="text-sm md:text-base">Dashboard</span>
              </Link>

              <Link 
                href="/mindmap" 
                className="flex items-center px-3 md:px-4 py-2 md:py-3 text-gray-700 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l6 3 6-3v13l-6 3-6-3z" />
                </svg>
                <span className="text-sm md:text-base">마인드맵</span>
              </Link>

              <Link 
                href="/mindmap/create" 
                className="flex items-center px-3 md:px-4 py-2 md:py-3 text-gray-700 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm md:text-base">새 마인드맵</span>
              </Link>

              <Link 
                href="/story-brand-guide/history" 
                className="flex items-center px-3 md:px-4 py-2 md:py-3 text-gray-700 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm md:text-base">스토리 히스토리</span>
              </Link>

              <Link 
                href="/priority-management" 
                className="flex items-center px-3 md:px-4 py-2 md:py-3 text-gray-700 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                  <circle cx="12" cy="12" r="5" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
                <span className="text-sm md:text-base">나만의 센터핀</span>
              </Link>
            </nav>
          </div>

          {/* 마인드맵 섹션 */}
          {session && (
            <div className="px-3 md:px-4 py-2">
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">MINDMAPS</h3>
                
                {/* 마인드 링크 */}
                <button 
                  onClick={handleMindLinkClick}
                  className="w-full flex items-center px-3 md:px-4 py-2 md:py-3 text-left text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all mb-2"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="font-medium text-sm md:text-base">마인드 링크</span>
                  <span className="ml-auto text-xs bg-blue-200 px-2 py-1 rounded-full">
                    {mindmaps.length}
                  </span>
                </button>

                {/* 마인드맵 리스트 */}
                <div className="space-y-1">
                  {loading ? (
                    <div className="px-3 md:px-4 py-2 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mx-auto"></div>
                      <p className="text-xs mt-2">로딩 중...</p>
                    </div>
                  ) : mindmaps.length === 0 ? (
                    <div className="px-3 md:px-4 py-6 md:py-8 text-center text-gray-500">
                      <svg className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l6 3 6-3v13l-6 3-6-3z" />
                      </svg>
                      <p className="text-xs">마인드맵이 없습니다</p>
                      <Link 
                        href="/mindmap/create"
                        className="text-blue-600 hover:text-blue-800 text-xs underline mt-1 block"
                        onClick={() => setIsOpen(false)}
                      >
                        첫 마인드맵 만들기
                      </Link>
                    </div>
                  ) : (
                    mindmaps.map((mindmap) => (
                      <button
                        key={mindmap.id}
                        onClick={() => handleMindmapClick(mindmap.id)}
                        className="w-full flex items-center px-3 md:px-4 py-2 md:py-3 text-left text-gray-700 rounded-lg hover:bg-white hover:shadow-sm transition-all group"
                      >
                        <div 
                          className="w-2 md:w-3 h-6 md:h-8 rounded-sm mr-3 flex-shrink-0"
                          style={{ backgroundColor: getCategoryColor(mindmap.metadata.category) }}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs md:text-sm truncate group-hover:text-blue-600 transition-colors">
                            {mindmap.title}
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <span className="flex items-center mr-3">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              {mindmap.nodes.length}
                            </span>
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              {mindmap.connections.length}
                            </span>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-3 h-3 md:w-4 md:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

{/* 하단 메뉴 임시 비활성화 - Firebase 의존성 기능들로 인해 */}
          {/* 
          <div className="px-3 md:px-4 py-2 border-t border-gray-200 mt-4">
            <div className="space-y-1">
              채팅 기능 임시 비활성화 - Firebase 의존성으로 인해
              <Link 
                href="/main" 
                className="flex items-center px-3 md:px-4 py-2 md:py-3 text-gray-700 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm md:text-base">채팅</span>
              </Link>

              MCP Assistant 임시 비활성화 - Firebase 의존성으로 인해
              <Link 
                href="/mcp-assistant" 
                className="flex items-center px-3 md:px-4 py-2 md:py-3 text-gray-700 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm md:text-base">어시스턴트</span>
              </Link>
            </div>
          </div>
          */}
        </div>
      </div>
    </div>
  );
}

// 카테고리별 색상 반환 함수
function getCategoryColor(category: string): string {
  const colors: { [key: string]: string } = {
    business: '#3B82F6',
    personal: '#10B981',
    project: '#F59E0B',
    workflow: '#8B5CF6',
    process: '#EF4444',
    other: '#6B7280'
  };
  return colors[category] || '#6B7280';
}
