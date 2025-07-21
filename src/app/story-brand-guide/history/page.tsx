'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { StoryStorageService } from '../utils/storyStorage';
import { SavedStory, StoryNetwork } from '../types';
import { NetworkVisualization } from '../components/NetworkVisualization';
import { 
  BookOpen, 
  Calendar, 
  Tag, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  Network,
  ArrowLeft,
  Clock,
  Star
} from 'lucide-react';

export default function StoryHistoryPage() {
  const { data: session, status } = useSession();
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [filteredStories, setFilteredStories] = useState<SavedStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [storyNetwork, setStoryNetwork] = useState<StoryNetwork | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'network'>('grid');
  const router = useRouter();

  // 인증 체크
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }
  }, [session, status, router]);

  // 스토리 로드
  useEffect(() => {
    if (session?.user?.email) {
      loadStories();
    }
  }, [session]);

  // 검색 및 필터링
  useEffect(() => {
    let filtered = stories;

    if (searchTerm) {
      filtered = filtered.filter(story => 
        story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.keywords.some(keyword => 
          keyword.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(story => story.category === selectedCategory);
    }

    setFilteredStories(filtered);
  }, [stories, searchTerm, selectedCategory]);

  const loadStories = async () => {
    if (!session?.user?.email) return;
    
    try {
      setIsLoading(true);
      const storageService = StoryStorageService.getInstance();
      const userStories = await storageService.getUserStories(session.user.email);
      setStories(userStories);
      
      // 네트워크 데이터도 로드
      const network = await storageService.getStoryNetwork(session.user.email);
      setStoryNetwork(network);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm('이 스토리를 정말 삭제하시겠습니까?')) return;
    
    try {
      const storageService = StoryStorageService.getInstance();
      await storageService.deleteStory(storyId);
      await loadStories(); // 목록 새로고침
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('스토리 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleViewStory = (story: SavedStory) => {
    // 스토리 상세 보기 페이지로 이동
    router.push(`/story-brand-guide/story/${story.id}`);
  };

  const getConnectionStrength = (storyId: string) => {
    const story = stories.find(s => s.id === storyId);
    if (!story) return 0;
    
    const totalConnections = story.connections.length;
    const averageStrength = story.connections.reduce((sum, conn) => sum + conn.connectionStrength, 0) / totalConnections;
    
    return totalConnections > 0 ? averageStrength : 0;
  };

  const categories = [
    { id: 'all', name: '전체' },
    { id: 'business', name: '비즈니스' },
    { id: 'study', name: '학습' },
    { id: 'relationship', name: '관계' },
    { id: 'career', name: '커리어' },
    { id: 'personal', name: '개인' },
    { id: 'creative', name: '창작' }
  ];

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-700 mb-2">로그인이 필요합니다</h1>
          <p className="text-gray-500 mb-6">스토리 히스토리를 보려면 로그인해주세요.</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>돌아가기</span>
              </button>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-800">나의 스토리 히스토리</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-l-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  그리드
                </button>
                <button
                  onClick={() => setViewMode('network')}
                  className={`px-4 py-2 rounded-r-lg transition-colors ${
                    viewMode === 'network' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  네트워크
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="스토리 제목이나 키워드 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 스토리</p>
                <p className="text-2xl font-bold text-gray-800">{stories.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 키워드</p>
                <p className="text-2xl font-bold text-gray-800">
                  {storyNetwork ? storyNetwork.keywords.length : 0}
                </p>
              </div>
              <Tag className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">연결된 스토리</p>
                <p className="text-2xl font-bold text-gray-800">
                  {storyNetwork ? storyNetwork.connections.length : 0}
                </p>
              </div>
              <Network className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">최근 활동</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stories.length > 0 ? Math.floor((Date.now() - new Date(stories[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}일 전
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* 스토리 목록/네트워크 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">스토리를 불러오는 중...</div>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm || selectedCategory !== 'all' ? '검색 결과가 없습니다' : '아직 저장된 스토리가 없습니다'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCategory !== 'all' 
                ? '다른 키워드로 검색하거나 필터를 변경해보세요.' 
                : '첫 번째 스토리를 만들어보세요!'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                스토리 만들기
              </button>
            )}
          </div>
        ) : viewMode === 'network' ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <NetworkVisualization
              stories={filteredStories}
              connections={storyNetwork?.connections || []}
              onNodeClick={handleViewStory}
              width={1200}
              height={800}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <div key={story.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
                      {story.title}
                    </h3>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${
                            i < Math.floor(getConnectionStrength(story.id) * 5) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Tag className="w-4 h-4" />
                      <span>{story.category}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">키워드:</p>
                    <div className="flex flex-wrap gap-1">
                      {story.keywords.slice(0, 6).map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                      {story.keywords.length > 6 && (
                        <span className="text-xs text-gray-500">+{story.keywords.length - 6}개</span>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">연결된 스토리: {story.connections.length}개</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getConnectionStrength(story.id) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
                  <button
                    onClick={() => handleViewStory(story)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>보기</span>
                  </button>
                  <button
                    onClick={() => handleDeleteStory(story.id)}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>삭제</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 