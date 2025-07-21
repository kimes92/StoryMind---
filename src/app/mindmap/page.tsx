'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MindmapData, MindmapFilter, MindmapStats } from './types';
import { MindmapService } from './services/MindmapService';
import HamburgerMenu from '../../components/HamburgerMenu';
import { NetworkVisualization } from './components/NetworkVisualization';

function MindmapPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mindmaps, setMindmaps] = useState<MindmapData[]>([]);
  const [filteredMindmaps, setFilteredMindmaps] = useState<MindmapData[]>([]);
  const [stats, setStats] = useState<MindmapStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'network'>('grid');
  const [selectedMindmap, setSelectedMindmap] = useState<MindmapData | null>(null);
  const [connectionTypes, setConnectionTypes] = useState({
    keyword: true,
    step: true,
    category: true
  });

  // 인증 체크
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }
  }, [session, status, router]);

  // 마인드맵 데이터 로드
  useEffect(() => {
    if (session?.user?.email) {
      loadMindmaps();
    }
  }, [session]);

  // URL 파라미터에 따른 뷰 모드 설정
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'network') {
      setViewMode('network');
    }
  }, [searchParams]);

  // 검색 및 필터링
  useEffect(() => {
    let filtered = mindmaps;
    
    if (searchTerm) {
      filtered = filtered.filter(mindmap => 
        mindmap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mindmap.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mindmap.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(mindmap => mindmap.metadata.category === selectedCategory);
    }
    
    setFilteredMindmaps(filtered);
  }, [mindmaps, searchTerm, selectedCategory]);

  const loadMindmaps = async () => {
    try {
      setLoading(true);
      const userMindmaps = await MindmapService.getUserMindmaps(session!.user!.email!);
      const userStats = await MindmapService.getMindmapStats(session!.user!.email!);
      
      setMindmaps(userMindmaps);
      setStats(userStats);
    } catch (error) {
      console.error('마인드맵 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMindmap = async (id: string) => {
    if (!confirm('정말 이 마인드맵을 삭제하시겠습니까?')) return;
    
    try {
      await MindmapService.deleteMindmap(id);
      await loadMindmaps();
    } catch (error) {
      console.error('마인드맵 삭제 실패:', error);
    }
  };

  const categories = stats ? Object.keys(stats.categories) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">마인드맵을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HamburgerMenu />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">마인드맵 관리</h1>
            <p className="text-gray-600 mt-2">생성한 워크플로우 마인드맵을 관리하세요</p>
          </div>
          <Link 
            href="/mindmap/create"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>새 마인드맵</span>
          </Link>
        </div>

        {/* 통계 대시보드 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l6 3 6-3v13l-6 3-6-3z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">총 마인드맵</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalMindmaps}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">총 노드</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalNodes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">총 연결</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalConnections}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">인기 키워드</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.topKeywords.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 검색 및 필터 */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="마인드맵 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">모든 카테고리</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                그리드
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                리스트
              </button>
              <button
                onClick={() => setViewMode('network')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'network' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                네트워크
              </button>
            </div>
          </div>
        </div>

        {/* 마인드맵 목록 */}
        {filteredMindmaps.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l6 3 6-3v13l-6 3-6-3z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedCategory ? '검색 결과가 없습니다' : '마인드맵이 없습니다'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory ? '다른 검색어를 시도해보세요' : '첫 번째 마인드맵을 생성해보세요'}
            </p>
            <Link 
              href="/mindmap/create"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>새 마인드맵 생성</span>
            </Link>
          </div>
        ) : viewMode === 'network' ? (
          <div className="h-[600px] bg-white rounded-lg shadow-sm">
            <NetworkVisualization
              mindmaps={filteredMindmaps}
              selectedMindmap={selectedMindmap}
              onMindmapSelect={setSelectedMindmap}
              connectionTypes={connectionTypes}
            />
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredMindmaps.map((mindmap) => (
              <div key={mindmap.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{mindmap.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{mindmap.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          {mindmap.nodes.length} 노드
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          {mindmap.connections.length} 연결
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link 
                        href={`/mindmap/${mindmap.id}`}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      <Link 
                        href={`/mindmap/${mindmap.id}/edit`}
                        className="text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDeleteMindmap(mindmap.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {mindmap.metadata.category}
                    </span>
                    {mindmap.metadata.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                    {mindmap.metadata.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        +{mindmap.metadata.tags.length - 3}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>생성: {mindmap.metadata.createdAt.toLocaleDateString()}</span>
                    <span>수정: {mindmap.metadata.updatedAt.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MindmapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <MindmapPageContent />
    </Suspense>
  );
} 