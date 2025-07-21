'use client';
import { useEffect, useRef, useState } from 'react';
import { MindmapData, MindmapConnection } from '../types';
import { ConnectionService } from '../services/ConnectionService';

interface NetworkVisualizationProps {
  mindmaps: MindmapData[];
  selectedMindmap?: MindmapData | null;
  onMindmapSelect?: (mindmap: MindmapData) => void;
  connectionTypes?: {
    keyword: boolean;
    step: boolean;
    category: boolean;
  };
}

export function NetworkVisualization({ 
  mindmaps, 
  selectedMindmap, 
  onMindmapSelect,
  connectionTypes = { keyword: true, step: true, category: true }
}: NetworkVisualizationProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<{
    keyword: MindmapConnection[];
    step: MindmapConnection[];
    category: MindmapConnection[];
  }>({ keyword: [], step: [], category: [] });
  const [nodePositions, setNodePositions] = useState<{ [id: string]: { x: number; y: number } }>({});
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // 연결 분석 및 계산
  useEffect(() => {
    if (mindmaps.length === 0) return;

    const analysisResult = ConnectionService.analyzeAllConnections(mindmaps);
    
    setConnections({
      keyword: ConnectionService.filterConnections(analysisResult.keywordConnections),
      step: ConnectionService.filterConnections(analysisResult.stepConnections),
      category: ConnectionService.filterConnections(analysisResult.categoryConnections)
    });
  }, [mindmaps]);

  // 노드 위치 계산 (원형 레이아웃)
  useEffect(() => {
    if (mindmaps.length === 0) return;

    const positions: { [id: string]: { x: number; y: number } } = {};
    const centerX = 400;
    const centerY = 300;
    const radius = Math.min(300, 50 + mindmaps.length * 30);

    mindmaps.forEach((mindmap, index) => {
      const angle = (index * 2 * Math.PI) / mindmaps.length;
      positions[mindmap.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });

    setNodePositions(positions);
  }, [mindmaps]);

  // 노드 렌더링
  const renderNode = (mindmap: MindmapData) => {
    const position = nodePositions[mindmap.id];
    if (!position) return null;

    const isSelected = selectedMindmap?.id === mindmap.id;
    const isHovered = hoveredNode === mindmap.id;
    
    const nodeSize = Math.max(60, Math.min(120, 60 + mindmap.nodes.length * 5));
    const categoryColors: { [key: string]: string } = {
      business: '#3B82F6',
      personal: '#10B981',
      project: '#F59E0B',
      workflow: '#8B5CF6',
      process: '#EF4444',
      other: '#6B7280'
    };

    return (
      <div
        key={mindmap.id}
        className={`absolute cursor-pointer transition-all duration-200 ${
          isSelected ? 'ring-4 ring-blue-500 ring-opacity-50' : ''
        } ${isHovered ? 'scale-110' : ''}`}
        style={{
          left: `${position.x - nodeSize / 2}px`,
          top: `${position.y - nodeSize / 2}px`,
          width: `${nodeSize}px`,
          height: `${nodeSize}px`,
          backgroundColor: categoryColors[mindmap.metadata.category] || '#6B7280',
          borderRadius: '50%',
          zIndex: isSelected || isHovered ? 10 : 5
        }}
        onClick={() => onMindmapSelect?.(mindmap)}
        onMouseEnter={() => setHoveredNode(mindmap.id)}
        onMouseLeave={() => setHoveredNode(null)}
      >
        <div className="h-full flex flex-col items-center justify-center text-white p-2">
          <div className="text-xs font-medium text-center mb-1 line-clamp-2">
            {mindmap.title}
          </div>
          <div className="text-xs opacity-75">
            {mindmap.nodes.length} 노드
          </div>
        </div>
        
        {/* 호버 시 추가 정보 */}
        {isHovered && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-lg p-3 text-sm text-gray-800 z-20 min-w-48">
            <div className="font-medium mb-1">{mindmap.title}</div>
            <div className="text-xs text-gray-600 mb-2">{mindmap.description}</div>
            <div className="flex flex-wrap gap-1">
              {mindmap.metadata.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 연결선 렌더링
  const renderConnection = (connection: MindmapConnection, type: string) => {
    const sourcePos = nodePositions[connection.source];
    const targetPos = nodePositions[connection.target];
    
    if (!sourcePos || !targetPos) return null;

    const isHighlighted = selectedMindmap && 
      (selectedMindmap.id === connection.source || selectedMindmap.id === connection.target);

    return (
      <g key={`${type}-${connection.id}`}>
        <line
          x1={sourcePos.x}
          y1={sourcePos.y}
          x2={targetPos.x}
          y2={targetPos.y}
          stroke={isHighlighted ? '#3B82F6' : connection.style?.color || '#6B7280'}
          strokeWidth={(connection.style?.width || 2) * (isHighlighted ? 1.5 : 1)}
          strokeDasharray={connection.style?.dashArray}
          opacity={isHighlighted ? 0.8 : 0.4}
          className="transition-all duration-200"
        />
        
        {/* 연결 레이블 */}
        {connection.label && (
          <text
            x={(sourcePos.x + targetPos.x) / 2}
            y={(sourcePos.y + targetPos.y) / 2 - 5}
            textAnchor="middle"
            className="text-xs fill-gray-600 font-medium"
            opacity={isHighlighted ? 1 : 0.6}
          >
            {connection.label}
          </text>
        )}
        
        {/* 화살표 */}
        <defs>
          <marker
            id={`arrow-${type}-${connection.id}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="3"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path
              d="M0,0 L0,6 L9,3 z"
              fill={isHighlighted ? '#3B82F6' : connection.style?.color || '#6B7280'}
              opacity={isHighlighted ? 0.8 : 0.4}
            />
          </marker>
        </defs>
      </g>
    );
  };

  return (
    <div className="w-full h-full bg-gray-50 relative overflow-hidden">
      {/* 연결 타입 필터 */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-20">
        <h3 className="text-sm font-medium mb-2">연결 타입</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={connectionTypes.keyword}
              onChange={(e) => {
                // 부모 컴포넌트에서 관리되어야 함
              }}
              className="mr-2"
            />
            <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
            <span className="text-sm">키워드</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={connectionTypes.step}
              onChange={(e) => {
                // 부모 컴포넌트에서 관리되어야 함
              }}
              className="mr-2"
            />
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span className="text-sm">단계</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={connectionTypes.category}
              onChange={(e) => {
                // 부모 컴포넌트에서 관리되어야 함
              }}
              className="mr-2"
            />
            <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
            <span className="text-sm">카테고리</span>
          </label>
        </div>
      </div>

      {/* 범례 */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-20">
        <h3 className="text-sm font-medium mb-2">범례</h3>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            <span>비즈니스</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
            <span>개인</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
            <span>프로젝트</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-500 rounded-full mr-2"></div>
            <span>워크플로우</span>
          </div>
        </div>
      </div>

      {/* SVG 연결선 */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
        {connectionTypes.keyword && connections.keyword.map(conn => renderConnection(conn, 'keyword'))}
        {connectionTypes.step && connections.step.map(conn => renderConnection(conn, 'step'))}
        {connectionTypes.category && connections.category.map(conn => renderConnection(conn, 'category'))}
      </svg>

      {/* 노드들 */}
      <div ref={canvasRef} className="absolute inset-0" style={{ zIndex: 2 }}>
        {mindmaps.map(renderNode)}
      </div>

      {/* 통계 정보 */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-20">
        <div className="text-sm space-y-1">
          <div>마인드맵: {mindmaps.length}개</div>
          <div>키워드 연결: {connections.keyword.length}개</div>
          <div>단계 연결: {connections.step.length}개</div>
          <div>카테고리 연결: {connections.category.length}개</div>
        </div>
      </div>
    </div>
  );
} 