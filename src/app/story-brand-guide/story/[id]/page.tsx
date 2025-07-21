'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { StoryStorageService } from '../../utils/storyStorage';
import { SavedStory } from '../../types';
import { CATEGORIES, STEP_FEEDBACK } from '../../constants';
import { 
  BookOpen, 
  Calendar, 
  Tag, 
  ArrowLeft, 
  Star, 
  Link2,
  Edit,
  Trash2,
  Download,
  Network,
  User
} from 'lucide-react';

export default function StoryDetailPage() {
  const { data: session, status } = useSession();
  const [story, setStory] = useState<SavedStory | null>(null);
  const [connectedStories, setConnectedStories] = useState<SavedStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const storyId = params.id as string;

  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user?.email && storyId) {
      loadStory();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [session, status, storyId]);

  const loadStory = async () => {
    try {
      setIsLoading(true);
      const storageService = StoryStorageService.getInstance();
      const storyData = await storageService.getStory(storyId);
      
      if (storyData) {
        // 현재 로그인한 사용자의 스토리인지 확인
        if (storyData.userId !== session?.user?.email) {
          console.warn('Unauthorized access attempt to story:', storyId);
          setStory(null);
          setIsLoading(false);
          return;
        }
        
        setStory(storyData);
        
        // 연결된 스토리들 로드
        const connected = await Promise.all(
          storyData.connections.map(async (connection) => {
            const connectedStory = await storageService.getStory(connection.connectedStoryId);
            return connectedStory;
          })
        );
        
        setConnectedStories(connected.filter(Boolean) as SavedStory[]);
      }
    } catch (error) {
      console.error('스토리 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStory = async () => {
    if (!story || !confirm('이 스토리를 정말 삭제하시겠습니까?')) return;
    
    try {
      const storageService = StoryStorageService.getInstance();
      await storageService.deleteStory(story.id);
      router.push('/story-brand-guide/history');
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('스토리 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleViewConnectedStory = (connectedStory: SavedStory) => {
    router.push(`/story-brand-guide/story/${connectedStory.id}`);
  };

  const getSharedKeywords = (connectionId: string) => {
    if (!story) return [];
    const connection = story.connections.find(c => c.connectedStoryId === connectionId);
    return connection?.sharedKeywords || [];
  };

  const getConnectionStrength = (connectionId: string) => {
    if (!story) return 0;
    const connection = story.connections.find(c => c.connectedStoryId === connectionId);
    return connection?.connectionStrength || 0;
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-700 mb-2">로그인이 필요합니다</h1>
          <p className="text-gray-500 mb-6">스토리를 보려면 로그인해주세요.</p>
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

  if (!story) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-700 mb-2">스토리를 찾을 수 없습니다</h1>
          <p className="text-gray-500 mb-6">요청한 스토리가 존재하지 않거나 삭제되었습니다.</p>
          <button
            onClick={() => router.push('/story-brand-guide/history')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            히스토리로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const category = CATEGORIES.find(c => c.id === story.category);
  const stepData = STEP_FEEDBACK.map((step, index) => ({
    ...step,
    content: story.storyData[`step${index + 1}` as keyof typeof story.storyData] as string
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/story-brand-guide/history')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>히스토리로 돌아가기</span>
              </button>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-800 truncate max-w-md">
                {story.title}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleDeleteStory}
                className="flex items-center space-x-2 text-red-600 hover:text-red-800 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span>삭제</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2">
            {/* 스토리 정보 */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{story.title}</h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Tag className="w-4 h-4" />
                        <span>{category?.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
              </div>

              {/* 키워드 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">키워드</h3>
                <div className="flex flex-wrap gap-2">
                  {story.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 스토리 단계들 */}
            <div className="space-y-6">
              {stepData.map((step, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">
                      {index + 1}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {step.title}
                    </h3>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {step.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 사이드바 */}
          <div className="lg:col-span-1">
            {/* 연결된 스토리들 */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex items-center mb-4">
                <Link2 className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">
                  연결된 스토리 ({connectedStories.length})
                </h3>
              </div>
              
              {connectedStories.length === 0 ? (
                <p className="text-gray-500 text-sm">연결된 스토리가 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {connectedStories.map((connectedStory) => (
                    <div
                      key={connectedStory.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewConnectedStory(connectedStory)}
                    >
                      <h4 className="font-medium text-gray-800 mb-2 line-clamp-2">
                        {connectedStory.title}
                      </h4>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <span>{new Date(connectedStory.createdAt).toLocaleDateString()}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {CATEGORIES.find(c => c.id === connectedStory.category)?.name}
                        </span>
                      </div>
                      
                      {/* 공유 키워드 */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-600 mb-1">공유 키워드:</p>
                        <div className="flex flex-wrap gap-1">
                          {getSharedKeywords(connectedStory.id).slice(0, 3).map((keyword, index) => (
                            <span
                              key={index}
                              className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* 연결 강도 */}
                      <div>
                        <p className="text-xs text-gray-600 mb-1">연결 강도:</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getConnectionStrength(connectedStory.id) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 통계 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">통계</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">총 키워드</span>
                  <span className="font-semibold">{story.keywords.length}개</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">연결된 스토리</span>
                  <span className="font-semibold">{connectedStories.length}개</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">카테고리</span>
                  <span className="font-semibold">{category?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">생성일</span>
                  <span className="font-semibold">
                    {new Date(story.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 