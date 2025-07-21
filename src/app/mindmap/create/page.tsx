'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MindmapNode, MindmapConnection, MindmapData } from '../types';
import { MindmapService } from '../services/MindmapService';
import HamburgerMenu from '../../../components/HamburgerMenu';
import { WorkflowCanvas } from '../components/WorkflowCanvas';
import { NodePalette } from '../components/NodePalette';
import { PropertiesPanel } from '../components/PropertiesPanel';

export default function CreateMindmapPage() {
  const { data: session, status } = useSession();
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('business');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [nodes, setNodes] = useState<MindmapNode[]>([]);
  const [connections, setConnections] = useState<MindmapConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<MindmapNode | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<MindmapConnection | null>(null);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState<{ from: string; to?: string } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // 새 노드 추가
  const addNode = useCallback((type: MindmapNode['type'], position: { x: number; y: number }) => {
    const nodeTypeConfig = {
      start: { label: '시작', color: '#10B981', width: 120, height: 60 },
      process: { label: '프로세스', color: '#3B82F6', width: 140, height: 80 },
      decision: { label: '결정', color: '#F59E0B', width: 120, height: 120 },
      end: { label: '종료', color: '#EF4444', width: 120, height: 60 },
      notification: { label: '알림', color: '#8B5CF6', width: 130, height: 70 },
      wait: { label: '대기', color: '#F97316', width: 110, height: 70 },
      action: { label: '액션', color: '#06B6D4', width: 130, height: 80 }
    };

    const config = nodeTypeConfig[type];
    const newNode: MindmapNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: config.label,
      type,
      position,
      size: { width: config.width, height: config.height },
      color: config.color,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        priority: 'medium'
      }
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNode(newNode);
  }, []);

  // 노드 업데이트
  const updateNode = useCallback((nodeId: string, updates: Partial<MindmapNode>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { 
            ...node, 
            ...updates, 
            metadata: { 
              createdAt: node.metadata?.createdAt || new Date(),
              updatedAt: new Date(),
              category: node.metadata?.category,
              priority: node.metadata?.priority || 'medium',
              ...updates.metadata
            } 
          }
        : node
    ));
  }, []);

  // 노드 삭제
  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => conn.source !== nodeId && conn.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  // 연결 추가
  const addConnection = useCallback((source: string, target: string, type: MindmapConnection['type'] = 'direct') => {
    // 이미 연결이 있는지 확인
    const existingConnection = connections.find(conn => 
      conn.source === source && conn.target === target
    );
    
    if (existingConnection) return;

    const newConnection: MindmapConnection = {
      id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source,
      target,
      type,
      strength: 1,
      style: {
        color: '#6B7280',
        width: 2,
        animated: false
      }
    };

    setConnections(prev => [...prev, newConnection]);
  }, [connections]);

  // 연결 삭제
  const deleteConnection = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    if (selectedConnection?.id === connectionId) {
      setSelectedConnection(null);
    }
  }, [selectedConnection]);

  // 태그 추가
  const addTag = useCallback(() => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  // 태그 삭제
  const removeTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  // 마인드맵 저장
  const saveMindmap = async () => {
    if (!session?.user?.email) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (nodes.length === 0) {
      alert('최소 하나의 노드를 추가해주세요.');
      return;
    }

    setSaving(true);
    try {
      const mindmapData: Omit<MindmapData, 'id'> = {
        title: title.trim(),
        description: description.trim(),
        nodes,
        connections,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: session.user.email,
          category,
          tags,
          version: 1
        },
        settings: {
          layout: 'force',
          theme: 'light',
          autoLayout: false,
          showLabels: true,
          showConnections: true
        }
      };

      const mindmapId = await MindmapService.saveMindmap(mindmapData);
      router.push(`/mindmap/${mindmapId}`);
    } catch (error) {
      console.error('마인드맵 저장 실패:', error);
      alert('마인드맵 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HamburgerMenu />
      
      <div className="flex h-screen">
        {/* 왼쪽 도구 패널 */}
        <div className="w-80 bg-white shadow-lg flex flex-col">
          {/* 헤더 */}
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">워크플로우 생성</h1>
            <p className="text-sm text-gray-600 mt-1">드래그하여 노드를 추가하세요</p>
          </div>

          {/* 기본 정보 */}
          <div className="p-4 border-b border-gray-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="마인드맵 제목을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="마인드맵 설명을 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="business">비즈니스</option>
                  <option value="personal">개인</option>
                  <option value="project">프로젝트</option>
                  <option value="workflow">워크플로우</option>
                  <option value="process">프로세스</option>
                  <option value="other">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">태그</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="태그 입력"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    추가
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 노드 팔레트 */}
          <div className="flex-1 overflow-auto">
            <NodePalette onAddNode={addNode} />
          </div>

          {/* 속성 패널 */}
          {(selectedNode || selectedConnection) && (
            <div className="border-t border-gray-200">
              <PropertiesPanel
                selectedNode={selectedNode}
                selectedConnection={selectedConnection}
                onUpdateNode={updateNode}
                onDeleteNode={deleteNode}
                onDeleteConnection={deleteConnection}
              />
            </div>
          )}
        </div>

        {/* 메인 캔버스 */}
        <div className="flex-1 flex flex-col">
          {/* 캔버스 툴바 */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                노드: {nodes.length} | 연결: {connections.length}
              </div>
              {connecting && (
                <div className="text-sm text-blue-600">
                  연결 모드: 대상 노드를 클릭하세요
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setNodes([]);
                  setConnections([]);
                  setSelectedNode(null);
                  setSelectedConnection(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                전체 삭제
              </button>
              <button
                onClick={saveMindmap}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>

          {/* 워크플로우 캔버스 */}
          <div className="flex-1 overflow-hidden">
            <WorkflowCanvas
              ref={canvasRef}
              nodes={nodes}
              connections={connections}
              selectedNode={selectedNode}
              selectedConnection={selectedConnection}
              connecting={connecting}
              onNodeSelect={setSelectedNode}
              onConnectionSelect={setSelectedConnection}
              onNodeMove={updateNode}
              onAddConnection={addConnection}
              onStartConnection={setConnecting}
              onEndConnection={() => setConnecting(null)}
              onAddNode={addNode}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 