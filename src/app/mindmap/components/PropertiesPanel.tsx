'use client';
import { MindmapNode, MindmapConnection } from '../types';
import { useState } from 'react';

interface PropertiesPanelProps {
  selectedNode: MindmapNode | null;
  selectedConnection: MindmapConnection | null;
  onUpdateNode: (nodeId: string, updates: Partial<MindmapNode>) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteConnection: (connectionId: string) => void;
}

export function PropertiesPanel({ 
  selectedNode, 
  selectedConnection, 
  onUpdateNode, 
  onDeleteNode, 
  onDeleteConnection 
}: PropertiesPanelProps) {
  const [nodeLabel, setNodeLabel] = useState(selectedNode?.label || '');
  const [nodeDescription, setNodeDescription] = useState(selectedNode?.description || '');
  const [nodeColor, setNodeColor] = useState(selectedNode?.color || '#3B82F6');

  const handleNodeLabelChange = (newLabel: string) => {
    setNodeLabel(newLabel);
    if (selectedNode) {
      onUpdateNode(selectedNode.id, { label: newLabel });
    }
  };

  const handleNodeDescriptionChange = (newDescription: string) => {
    setNodeDescription(newDescription);
    if (selectedNode) {
      onUpdateNode(selectedNode.id, { description: newDescription });
    }
  };

  const handleNodeColorChange = (newColor: string) => {
    setNodeColor(newColor);
    if (selectedNode) {
      onUpdateNode(selectedNode.id, { color: newColor });
    }
  };

  const handleNodeDelete = () => {
    if (selectedNode && confirm('이 노드를 삭제하시겠습니까?')) {
      onDeleteNode(selectedNode.id);
    }
  };

  const handleConnectionDelete = () => {
    if (selectedConnection && confirm('이 연결을 삭제하시겠습니까?')) {
      onDeleteConnection(selectedConnection.id);
    }
  };

  if (!selectedNode && !selectedConnection) {
    return null;
  }

  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">속성</h3>
      
      {selectedNode && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              노드 유형
            </label>
            <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
              {selectedNode.type}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              레이블
            </label>
            <input
              type="text"
              value={nodeLabel}
              onChange={(e) => handleNodeLabelChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="노드 레이블을 입력하세요"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명
            </label>
            <textarea
              value={nodeDescription}
              onChange={(e) => handleNodeDescriptionChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="노드 설명을 입력하세요"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              색상
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={nodeColor}
                onChange={(e) => handleNodeColorChange(e.target.value)}
                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={nodeColor}
                onChange={(e) => handleNodeColorChange(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#3B82F6"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              위치
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">X</label>
                <input
                  type="number"
                  value={Math.round(selectedNode.position.x)}
                  onChange={(e) => onUpdateNode(selectedNode.id, {
                    position: { ...selectedNode.position, x: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Y</label>
                <input
                  type="number"
                  value={Math.round(selectedNode.position.y)}
                  onChange={(e) => onUpdateNode(selectedNode.id, {
                    position: { ...selectedNode.position, y: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              크기
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">너비</label>
                <input
                  type="number"
                  value={selectedNode.size.width}
                  onChange={(e) => onUpdateNode(selectedNode.id, {
                    size: { ...selectedNode.size, width: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">높이</label>
                <input
                  type="number"
                  value={selectedNode.size.height}
                  onChange={(e) => onUpdateNode(selectedNode.id, {
                    size: { ...selectedNode.size, height: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleNodeDelete}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              노드 삭제
            </button>
          </div>
        </div>
      )}
      
      {selectedConnection && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              연결 유형
            </label>
            <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
              {selectedConnection.type}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              연결 강도
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={selectedConnection.strength || 1}
              className="w-full"
            />
            <div className="text-xs text-gray-600 mt-1">
              {((selectedConnection.strength || 1) * 100).toFixed(0)}%
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              레이블
            </label>
            <input
              type="text"
              value={selectedConnection.label || ''}
              placeholder="연결 레이블을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleConnectionDelete}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              연결 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 