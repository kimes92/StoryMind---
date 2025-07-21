'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { MindmapData } from '../types';
import { MindmapService } from '../services/MindmapService';
import { ConnectionService } from '../services/ConnectionService';
import { WorkflowCanvas } from '../components/WorkflowCanvas';
import { NetworkVisualization } from '../components/NetworkVisualization';
import HamburgerMenu from '../../../components/HamburgerMenu';

export default function MindmapDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const mindmapId = params.id as string;

  const [mindmap, setMindmap] = useState<MindmapData | null>(null);
  const [connectedMindmaps, setConnectedMindmaps] = useState<MindmapData[]>([]);
  const [allMindmaps, setAllMindmaps] = useState<MindmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'workflow' | 'network'>('workflow');
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
    if (session?.user?.email && mindmapId) {
      loadMindmapData();
    }
  }, [session, mindmapId]);

  const loadMindmapData = async () => {
    try {
      setLoading(true);
      
      // 현재 마인드맵 로드
      const currentMindmap = await MindmapService.getMindmap(mindmapId);
      if (!currentMindmap) {
        router.push('/mindmap');
        return;
      }
      setMindmap(currentMindmap);

      // 사용자의 모든 마인드맵 로드
      const userMindmaps = await MindmapService.getUserMindmaps(session!.user!.email!);
      setAllMindmaps(userMindmaps);

      // 연결된 마인드맵들 찾기
      const connected = await MindmapService.findConnectedMindmaps(session!.user!.email!, mindmapId);
      setConnectedMindmaps(connected);

    } catch (error) {
      console.error('마인드맵 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/mindmap/${mindmapId}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 마인드맵을 삭제하시겠습니까?')) return;
    
    try {
      await MindmapService.deleteMindmap(mindmapId);
      router.push('/mindmap');
    } catch (error) {
      console.error('마인드맵 삭제 실패:', error);
    }
  };

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

  if (!mindmap) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l6 3 6-3v13l-6 3-6-3z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">마인드맵을 찾을 수 없습니다</h3>
          <p className="text-gray-600 mb-4">요청한 마인드맵이 존재하지 않거나 접근 권한이 없습니다.</p>
          <button
            onClick={() => router.push('/mindmap')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            마인드맵 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HamburgerMenu />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-3xl font-bold text-gray-900">{mindmap.title}</h1>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {mindmap.nodes.length} 노드
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {mindmap.connections.length} 연결
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {mindmap.metadata.updatedAt.toLocaleDateString()}
              </span>
            </div>

            {mindmap.description && (
              <p className="text-gray-600 mb-4">{mindmap.description}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {mindmap.metadata.category}
              </span>
              {mindmap.metadata.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex space-x-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('workflow')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'workflow' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                워크플로우
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
            
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              편집
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              삭제
            </button>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="bg-white rounded-lg shadow-sm">
          {viewMode === 'workflow' ? (
            <div className="h-[600px]">
              <WorkflowCanvas
                nodes={mindmap.nodes}
                connections={mindmap.connections}
                selectedNode={null}
                selectedConnection={null}
                connecting={null}
                onNodeSelect={() => {}}
                onConnectionSelect={() => {}}
                onNodeMove={() => {}}
                onAddConnection={() => {}}
                onStartConnection={() => {}}
                onEndConnection={() => {}}
                onAddNode={() => {}}
              />
            </div>
          ) : (
            <div className="h-[600px]">
              <NetworkVisualization
                mindmaps={[mindmap, ...connectedMindmaps]}
                selectedMindmap={mindmap}
                onMindmapSelect={(selectedMindmap) => {
                  if (selectedMindmap.id !== mindmap.id) {
                    router.push(`/mindmap/${selectedMindmap.id}`);
                  }
                }}
                connectionTypes={connectionTypes}
              />
            </div>
          )}
        </div>

        {/* 연결된 마인드맵들 */}
        {connectedMindmaps.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">연결된 마인드맵</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectedMindmaps.map((connectedMindmap) => (
                <div key={connectedMindmap.id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">{connectedMindmap.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{connectedMindmap.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span>{connectedMindmap.nodes.length} 노드</span>
                      <span>{connectedMindmap.connections.length} 연결</span>
                    </div>
                    <button
                      onClick={() => router.push(`/mindmap/${connectedMindmap.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      보기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 