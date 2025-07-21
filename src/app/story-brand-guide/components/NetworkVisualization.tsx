import React, { useEffect, useRef, useState } from 'react';
import { SavedStory, NetworkConnection } from '../types';
import { CATEGORIES } from '../constants';

interface NetworkNode {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  createdAt: string;
  x: number;
  y: number;
  connections: number;
  size: number;
}

interface NetworkVisualizationProps {
  stories: SavedStory[];
  connections: NetworkConnection[];
  onNodeClick?: (story: SavedStory) => void;
  width?: number;
  height?: number;
}

export const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({
  stories,
  connections,
  onNodeClick,
  width = 800,
  height = 600
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'force' | 'timeline' | 'category'>('force');

  useEffect(() => {
    if (stories.length > 0) {
      const processedNodes = processStories(stories);
      setNodes(processedNodes);
    }
  }, [stories, viewMode]);

  const processStories = (storyList: SavedStory[]): NetworkNode[] => {
    return storyList.map((story, index) => {
      const category = CATEGORIES.find(c => c.id === story.category);
      const connectionCount = story.connections.length;
      
      let x, y;
      
      switch (viewMode) {
        case 'timeline':
          // 시간순 배치
          x = (index / storyList.length) * (width - 100) + 50;
          y = height / 2 + (Math.sin(index * 0.3) * 100);
          break;
        case 'category':
          // 카테고리별 배치
          const categoryIndex = CATEGORIES.findIndex(c => c.id === story.category);
          x = ((categoryIndex + 1) / (CATEGORIES.length + 1)) * width;
          y = height / 2 + (Math.sin(index * 0.5) * 150);
          break;
        default:
          // 포스 기반 배치
          x = Math.random() * (width - 100) + 50;
          y = Math.random() * (height - 100) + 50;
      }

      return {
        id: story.id,
        title: story.title,
        category: story.category,
        keywords: story.keywords,
        createdAt: story.createdAt,
        x,
        y,
        connections: connectionCount,
        size: Math.max(20, Math.min(40, 20 + connectionCount * 3))
      };
    });
  };

  const getNodeColor = (category: string): string => {
    const categoryData = CATEGORIES.find(c => c.id === category);
    return categoryData?.color || '#3B82F6';
  };

  const getConnectionOpacity = (connection: NetworkConnection): number => {
    return Math.max(0.2, connection.strength);
  };

  const handleNodeClick = (node: NetworkNode) => {
    setSelectedNode(node.id);
    const story = stories.find(s => s.id === node.id);
    if (story && onNodeClick) {
      onNodeClick(story);
    }
  };

  const handleNodeHover = (nodeId: string | null) => {
    setHoveredNode(nodeId);
  };

  const getConnectedNodes = (nodeId: string): string[] => {
    return connections
      .filter(conn => conn.from === nodeId || conn.to === nodeId)
      .map(conn => conn.from === nodeId ? conn.to : conn.from);
  };

  const isNodeHighlighted = (nodeId: string): boolean => {
    if (!hoveredNode && !selectedNode) return false;
    const targetNode = hoveredNode || selectedNode;
    if (nodeId === targetNode) return true;
    return getConnectedNodes(targetNode!).includes(nodeId);
  };

  const isConnectionHighlighted = (connection: NetworkConnection): boolean => {
    if (!hoveredNode && !selectedNode) return false;
    const targetNode = hoveredNode || selectedNode;
    return connection.from === targetNode || connection.to === targetNode;
  };

  return (
    <div className="w-full bg-gray-900 rounded-lg overflow-hidden">
      {/* 컨트롤 패널 */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-white text-sm font-medium">View Mode:</span>
          <div className="flex bg-gray-700 rounded-lg">
            <button
              onClick={() => setViewMode('force')}
              className={`px-3 py-1 rounded-l-lg text-sm transition-colors ${
                viewMode === 'force' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-600'
              }`}
            >
              Force
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 text-sm transition-colors ${
                viewMode === 'timeline' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-600'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('category')}
              className={`px-3 py-1 rounded-r-lg text-sm transition-colors ${
                viewMode === 'category' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-600'
              }`}
            >
              Category
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-400 text-sm">
          <span>{stories.length} stories</span>
          <span>•</span>
          <span>{connections.length} connections</span>
        </div>
      </div>

      {/* SVG 네트워크 */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="bg-gray-900"
        style={{ cursor: 'grab' }}
      >
        {/* 배경 그리드 */}
        <defs>
          <pattern
            id="grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="#374151"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* 연결선 */}
        <g>
          {connections.map((connection, index) => {
            const fromNode = nodes.find(n => n.id === connection.from);
            const toNode = nodes.find(n => n.id === connection.to);
            
            if (!fromNode || !toNode) return null;
            
            const isHighlighted = isConnectionHighlighted(connection);
            const opacity = isHighlighted ? 0.8 : getConnectionOpacity(connection);
            const strokeWidth = isHighlighted ? 2 : 1;
            
            return (
              <line
                key={index}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke="#6B7280"
                strokeWidth={strokeWidth}
                opacity={opacity}
                strokeDasharray={connection.strength < 0.5 ? "5,5" : "none"}
              />
            );
          })}
        </g>

        {/* 노드 */}
        <g>
          {nodes.map((node) => {
            const isHighlighted = isNodeHighlighted(node.id);
            const isSelected = selectedNode === node.id;
            const isHovered = hoveredNode === node.id;
            
            return (
              <g key={node.id}>
                {/* 노드 후광 (선택/호버 시) */}
                {(isSelected || isHovered) && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size + 10}
                    fill={getNodeColor(node.category)}
                    opacity="0.2"
                  />
                )}
                
                {/* 메인 노드 */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.size}
                  fill={getNodeColor(node.category)}
                  stroke={isHighlighted ? '#FFFFFF' : '#374151'}
                  strokeWidth={isHighlighted ? 3 : 1}
                  opacity={isHighlighted ? 1 : (hoveredNode && !isHighlighted ? 0.3 : 0.8)}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleNodeClick(node)}
                  onMouseEnter={() => handleNodeHover(node.id)}
                  onMouseLeave={() => handleNodeHover(null)}
                />
                
                {/* 노드 레이블 */}
                <text
                  x={node.x}
                  y={node.y + node.size + 15}
                  textAnchor="middle"
                  fill="#F3F4F6"
                  fontSize="12"
                  fontWeight={isHighlighted ? 'bold' : 'normal'}
                  opacity={isHighlighted ? 1 : (hoveredNode && !isHighlighted ? 0.5 : 0.8)}
                  style={{ cursor: 'pointer', pointerEvents: 'none' }}
                >
                  {node.title.length > 15 ? node.title.substring(0, 15) + '...' : node.title}
                </text>
                
                {/* 연결 수 표시 */}
                {node.connections > 0 && (
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    {node.connections}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* 범례 */}
      <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-white text-sm font-medium">Categories:</span>
          {CATEGORIES.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-gray-300 text-sm">{category.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 선택된 노드 정보 */}
      {selectedNode && (
        <div className="absolute top-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 max-w-xs">
          {(() => {
            const story = stories.find(s => s.id === selectedNode);
            if (!story) return null;
            
            return (
              <div>
                <h3 className="text-white font-semibold mb-2 line-clamp-2">
                  {story.title}
                </h3>
                <div className="text-gray-400 text-sm space-y-1">
                  <p>Category: {CATEGORIES.find(c => c.id === story.category)?.name}</p>
                  <p>Keywords: {story.keywords.length}</p>
                  <p>Connections: {story.connections.length}</p>
                  <p>Created: {new Date(story.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="mt-3">
                  <p className="text-gray-400 text-xs mb-1">Top Keywords:</p>
                  <div className="flex flex-wrap gap-1">
                    {story.keywords.slice(0, 4).map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}; 