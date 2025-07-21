'use client';
import { MindmapNode } from '../types';

interface NodePaletteProps {
  onAddNode: (type: MindmapNode['type'], position: { x: number; y: number }) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const nodeTypes = [
    {
      type: 'start' as const,
      label: '시작',
      color: '#10B981',
      icon: '▶️',
      description: '프로세스 시작점'
    },
    {
      type: 'process' as const,
      label: '프로세스',
      color: '#3B82F6',
      icon: '⚙️',
      description: '작업 단계'
    },
    {
      type: 'decision' as const,
      label: '결정',
      color: '#F59E0B',
      icon: '🤔',
      description: '조건 분기'
    },
    {
      type: 'wait' as const,
      label: '대기',
      color: '#F97316',
      icon: '⏳',
      description: '시간 대기'
    },
    {
      type: 'notification' as const,
      label: '알림',
      color: '#8B5CF6',
      icon: '🔔',
      description: '알림 발송'
    },
    {
      type: 'action' as const,
      label: '액션',
      color: '#06B6D4',
      icon: '🎯',
      description: '특정 작업 실행'
    },
    {
      type: 'end' as const,
      label: '종료',
      color: '#EF4444',
      icon: '🏁',
      description: '프로세스 종료'
    }
  ];

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, nodeType: MindmapNode['type']) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'node',
      nodeType
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleClick = (nodeType: MindmapNode['type']) => {
    // 캔버스 중앙에 노드 추가
    onAddNode(nodeType, { x: 400, y: 300 });
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">노드 팔레트</h3>
      <div className="space-y-3">
        {nodeTypes.map((nodeType) => (
          <div
            key={nodeType.type}
            draggable
            onDragStart={(e) => handleDragStart(e, nodeType.type)}
            onClick={() => handleClick(nodeType.type)}
            className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-move hover:bg-gray-100 transition-colors"
            style={{
              borderLeft: `4px solid ${nodeType.color}`
            }}
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-lg">
              {nodeType.icon}
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-gray-800">{nodeType.label}</h4>
              <p className="text-xs text-gray-600 mt-1">{nodeType.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-800 mb-2">사용 방법</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• 드래그하여 캔버스에 배치</li>
          <li>• 클릭하여 중앙에 추가</li>
          <li>• 노드 간 연결은 우클릭</li>
        </ul>
      </div>
    </div>
  );
} 