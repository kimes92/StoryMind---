'use client';
import { forwardRef, useRef, useEffect, useState, useCallback } from 'react';
import { MindmapNode, MindmapConnection } from '../types';

interface WorkflowCanvasProps {
  nodes: MindmapNode[];
  connections: MindmapConnection[];
  selectedNode: MindmapNode | null;
  selectedConnection: MindmapConnection | null;
  connecting: { from: string; to?: string } | null;
  onNodeSelect: (node: MindmapNode | null) => void;
  onConnectionSelect: (connection: MindmapConnection | null) => void;
  onNodeMove: (nodeId: string, updates: Partial<MindmapNode>) => void;
  onAddConnection: (source: string, target: string, type?: MindmapConnection['type']) => void;
  onStartConnection: (connecting: { from: string; to?: string } | null) => void;
  onEndConnection: () => void;
  onAddNode: (type: MindmapNode['type'], position: { x: number; y: number }) => void;
}

// 노드 타입 정의
const nodeTypes = [
  { type: 'start' as const, label: '시작', color: '#10B981', icon: '▶️', description: '프로세스 시작점' },
  { type: 'process' as const, label: '프로세스', color: '#3B82F6', icon: '⚙️', description: '작업 단계' },
  { type: 'decision' as const, label: '결정', color: '#F59E0B', icon: '🤔', description: '조건 분기' },
  { type: 'wait' as const, label: '대기', color: '#F97316', icon: '⏳', description: '시간 대기' },
  { type: 'notification' as const, label: '알림', color: '#8B5CF6', icon: '🔔', description: '알림 발송' },
  { type: 'action' as const, label: '액션', color: '#06B6D4', icon: '🎯', description: '특정 작업 실행' },
  { type: 'end' as const, label: '종료', color: '#EF4444', icon: '🏁', description: '프로세스 종료' }
];

export const WorkflowCanvas = forwardRef<HTMLDivElement, WorkflowCanvasProps>(
  ({ 
    nodes, 
    connections, 
    selectedNode, 
    selectedConnection, 
    connecting,
    onNodeSelect, 
    onConnectionSelect, 
    onNodeMove, 
    onAddConnection, 
    onStartConnection, 
    onEndConnection,
    onAddNode 
  }, ref) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<{ nodeId: string; offset: { x: number; y: number } } | null>(null);
    const [panning, setPanning] = useState<{ isDragging: boolean; start: { x: number; y: number } } | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; position: { x: number; y: number } } | null>(null);
    const [recentNodeTypes, setRecentNodeTypes] = useState<string[]>(['process', 'start', 'end']);
    const [ctrlPressed, setCtrlPressed] = useState(false);

    // 키보드 이벤트 리스너
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Control') {
          setCtrlPressed(true);
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'Control') {
          setCtrlPressed(false);
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
      };
    }, []);

    // 최근 사용한 노드 타입 업데이트
    const updateRecentNodeType = useCallback((nodeType: string) => {
      setRecentNodeTypes(prev => {
        const filtered = prev.filter(t => t !== nodeType);
        return [nodeType, ...filtered].slice(0, 3);
      });
    }, []);

    // 노드 렌더링 함수
    const renderNode = (node: MindmapNode) => {
      const isSelected = selectedNode?.id === node.id;
      const isConnecting = connecting?.from === node.id;
      
      const nodeStyle = {
        left: `${node.position.x + pan.x}px`,
        top: `${node.position.y + pan.y}px`,
        width: `${node.size.width}px`,
        height: `${node.size.height}px`,
        backgroundColor: node.color,
        border: isSelected ? '3px solid #3B82F6' : isConnecting ? '3px solid #10B981' : '2px solid #E5E7EB',
        borderRadius: node.type === 'decision' ? '50%' : '8px',
        cursor: dragging?.nodeId === node.id ? 'grabbing' : 'grab',
        zIndex: isSelected ? 10 : 1,
        transform: `scale(${zoom})`,
        transformOrigin: 'center',
        boxShadow: isSelected ? '0 8px 25px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)'
      };

      const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (connecting) {
          if (connecting.from !== node.id) {
            onAddConnection(connecting.from, node.id);
            onEndConnection();
          }
          return;
        }
        
        onNodeSelect(node);
        
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        setDragging({
          nodeId: node.id,
          offset: {
            x: e.clientX - rect.left - node.position.x - pan.x,
            y: e.clientY - rect.top - node.position.y - pan.y
          }
        });
      };

      const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (connecting) {
          onStartConnection({ from: node.id });
        }
      };

      return (
        <div
          key={node.id}
          className="absolute flex items-center justify-center text-white font-medium text-sm select-none transition-all duration-200"
          style={nodeStyle}
          onMouseDown={handleMouseDown}
          onContextMenu={handleContextMenu}
          title={node.description || `${node.label} 노드`}
        >
          <div className="flex flex-col items-center">
            <span className="text-lg mb-1">{nodeTypes.find(t => t.type === node.type)?.icon}</span>
            <span className="text-xs">{node.label}</span>
          </div>
        </div>
      );
    };

    // 연결선 렌더링 함수
    const renderConnection = (connection: MindmapConnection) => {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      
      if (!sourceNode || !targetNode) return null;
      
      const sourceCenter = {
        x: sourceNode.position.x + sourceNode.size.width / 2 + pan.x,
        y: sourceNode.position.y + sourceNode.size.height / 2 + pan.y
      };
      
      const targetCenter = {
        x: targetNode.position.x + targetNode.size.width / 2 + pan.x,
        y: targetNode.position.y + targetNode.size.height / 2 + pan.y
      };
      
      const isSelected = selectedConnection?.id === connection.id;
      const strokeColor = connection.style?.color || '#6B7280';
      const strokeWidth = connection.style?.width || (isSelected ? 3 : 2);
      
      return (
        <g key={connection.id}>
          <line
            x1={sourceCenter.x}
            y1={sourceCenter.y}
            x2={targetCenter.x}
            y2={targetCenter.y}
            stroke={isSelected ? '#3B82F6' : strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={connection.style?.dashArray}
            className="cursor-pointer"
            onClick={() => onConnectionSelect(connection)}
          />
          
          <defs>
            <marker
              id={`arrow-${connection.id}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="3"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path
                d="M0,0 L0,6 L9,3 z"
                fill={isSelected ? '#3B82F6' : strokeColor}
              />
            </marker>
          </defs>
          
          <line
            x1={sourceCenter.x}
            y1={sourceCenter.y}
            x2={targetCenter.x}
            y2={targetCenter.y}
            stroke={isSelected ? '#3B82F6' : strokeColor}
            strokeWidth={strokeWidth}
            markerEnd={`url(#arrow-${connection.id})`}
          />
          
          {connection.label && (
            <text
              x={(sourceCenter.x + targetCenter.x) / 2}
              y={(sourceCenter.y + targetCenter.y) / 2 - 5}
              textAnchor="middle"
              className="text-xs fill-gray-600 pointer-events-none"
            >
              {connection.label}
            </text>
          )}
        </g>
      );
    };

    // 드래그 중 마우스 이동
    const handleMouseMove = useCallback((e: MouseEvent) => {
      if (dragging && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const newPosition = {
          x: e.clientX - rect.left - dragging.offset.x - pan.x,
          y: e.clientY - rect.top - dragging.offset.y - pan.y
        };
        
        onNodeMove(dragging.nodeId, { position: newPosition });
      } else if (panning && canvasRef.current) {
        const deltaX = e.clientX - panning.start.x;
        const deltaY = e.clientY - panning.start.y;
        
        setPan(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
        
        setPanning(prev => prev ? { ...prev, start: { x: e.clientX, y: e.clientY } } : null);
      }
    }, [dragging, panning, pan, onNodeMove]);

    // 드래그 종료
    const handleMouseUp = useCallback(() => {
      setDragging(null);
      setPanning(null);
    }, []);

    // 캔버스 클릭 이벤트
    const handleCanvasClick = (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
        onNodeSelect(null);
        onConnectionSelect(null);
        setContextMenu(null);
        
        if (connecting) {
          onEndConnection();
        }
        
        // Ctrl+클릭으로 프로세스 노드 추가
        if (ctrlPressed) {
          const rect = canvasRef.current.getBoundingClientRect();
          const position = {
            x: e.clientX - rect.left - pan.x - 70,
            y: e.clientY - rect.top - pan.y - 40
          };
          
          onAddNode('process', position);
          updateRecentNodeType('process');
        }
      }
    };

    // 캔버스 더블클릭 이벤트
    const handleCanvasDoubleClick = (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const position = {
          x: e.clientX - rect.left - pan.x - 70,
          y: e.clientY - rect.top - pan.y - 40
        };
        
        onAddNode('process', position);
        updateRecentNodeType('process');
      }
    };

    // 캔버스 우클릭 이벤트 (노드 추가 메뉴)
    const handleCanvasContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      
      if (e.target === canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const canvasPosition = {
          x: e.clientX - rect.left - pan.x,
          y: e.clientY - rect.top - pan.y
        };
        
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          position: canvasPosition
        });
      }
    };

    // 캔버스 마우스 다운 이벤트 (팬 시작)
    const handleCanvasMouseDown = (e: React.MouseEvent) => {
      if (e.target === canvasRef.current && e.button === 0) {
        setPanning({
          isDragging: true,
          start: { x: e.clientX, y: e.clientY }
        });
      }
    };

    // 컨텍스트 메뉴에서 노드 추가
    const handleAddNodeFromMenu = (nodeType: MindmapNode['type']) => {
      if (contextMenu) {
        onAddNode(nodeType, {
          x: contextMenu.position.x - 60,
          y: contextMenu.position.y - 30
        });
        updateRecentNodeType(nodeType);
        setContextMenu(null);
      }
    };

    // 드래그 앤 드롭 핸들러
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data.type === 'node') {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          
          const position = {
            x: e.clientX - rect.left - pan.x - 70,
            y: e.clientY - rect.top - pan.y - 40
          };
          
          onAddNode(data.nodeType, position);
          updateRecentNodeType(data.nodeType);
        }
      } catch (error) {
        console.error('드롭 데이터 파싱 실패:', error);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    };

    // 이벤트 리스너 등록
    useEffect(() => {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [handleMouseMove, handleMouseUp]);

    // 컨텍스트 메뉴 외부 클릭 시 닫기
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (contextMenu) {
          setContextMenu(null);
        }
      };

      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }, [contextMenu]);

    // 최근 사용한 노드 타입 기준으로 정렬
    const sortedNodeTypes = [...nodeTypes].sort((a, b) => {
      const aIndex = recentNodeTypes.indexOf(a.type);
      const bIndex = recentNodeTypes.indexOf(b.type);
      
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return 0;
    });

    return (
      <div className="relative w-full h-full overflow-hidden bg-gray-50">
        {/* 캔버스 */}
        <div
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-move"
          style={{
            backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            cursor: panning ? 'grabbing' : 'grab'
          }}
          onClick={handleCanvasClick}
          onDoubleClick={handleCanvasDoubleClick}
          onContextMenu={handleCanvasContextMenu}
          onMouseDown={handleCanvasMouseDown}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {/* 연결선 레이어 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            {connections.map(renderConnection)}
          </svg>

          {/* 노드 레이어 */}
          <div className="absolute inset-0" style={{ zIndex: 2 }}>
            {nodes.map(renderNode)}
          </div>

          {/* 연결 모드 안내 */}
          {connecting && (
            <div className="absolute top-4 left-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-lg z-10">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">연결할 노드를 클릭하세요</span>
              </div>
            </div>
          )}

          {/* 빈 캔버스 안내 */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
              <div className="text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold mb-2">마인드맵을 시작해보세요</h3>
                <p className="text-sm">• 왼쪽 팔레트에서 노드 드래그</p>
                <p className="text-sm">• 빈 공간 우클릭으로 노드 추가</p>
                <p className="text-sm">• 더블클릭으로 프로세스 노드 추가</p>
                <p className="text-sm">• Ctrl+클릭으로 빠른 노드 추가</p>
              </div>
            </div>
          )}

          {/* 컨트롤 안내 */}
          {ctrlPressed && (
            <div className="absolute bottom-4 left-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-lg z-10">
              <span className="text-sm font-medium">Ctrl+클릭으로 프로세스 노드 추가</span>
            </div>
          )}
        </div>

        {/* 노드 추가 컨텍스트 메뉴 */}
        {contextMenu && (
          <div 
            className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-[200px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              transform: 'translate(-50%, -10px)'
            }}
          >
            <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
              노드 추가
            </div>
            
            {/* 최근 사용한 노드 타입 */}
            {recentNodeTypes.length > 0 && (
              <>
                <div className="px-3 py-1 text-xs text-blue-600 bg-blue-50">
                  최근 사용
                </div>
                {sortedNodeTypes.slice(0, 3).map((nodeType) => (
                  <button
                    key={`recent-${nodeType.type}`}
                    onClick={() => handleAddNodeFromMenu(nodeType.type)}
                    className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-lg mr-3">{nodeType.icon}</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-800">{nodeType.label}</span>
                      <p className="text-xs text-gray-500">{nodeType.description}</p>
                    </div>
                    <div 
                      className="w-3 h-3 rounded-full ml-2"
                      style={{ backgroundColor: nodeType.color }}
                    ></div>
                  </button>
                ))}
                <div className="border-t border-gray-100 my-1"></div>
              </>
            )}
            
            {/* 모든 노드 타입 */}
            <div className="px-3 py-1 text-xs text-gray-500">
              모든 노드
            </div>
            {nodeTypes.map((nodeType) => (
              <button
                key={nodeType.type}
                onClick={() => handleAddNodeFromMenu(nodeType.type)}
                className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg mr-3">{nodeType.icon}</span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-800">{nodeType.label}</span>
                  <p className="text-xs text-gray-500">{nodeType.description}</p>
                </div>
                <div 
                  className="w-3 h-3 rounded-full ml-2"
                  style={{ backgroundColor: nodeType.color }}
                ></div>
              </button>
            ))}
          </div>
        )}

        {/* 줌 컨트롤 */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-10">
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
            className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors shadow-md"
          >
            <span className="text-lg">+</span>
          </button>
          <button
            onClick={() => setZoom(1)}
            className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors text-xs shadow-md"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
            className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors shadow-md"
          >
            <span className="text-lg">-</span>
          </button>
          <button
            onClick={() => setPan({ x: 0, y: 0 })}
            className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors text-xs shadow-md"
            title="화면 중앙으로"
          >
            🎯
          </button>
        </div>
      </div>
    );
  }
);

WorkflowCanvas.displayName = 'WorkflowCanvas';
