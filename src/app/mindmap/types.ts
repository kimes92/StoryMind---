// 마인드맵 노드 타입
export interface MindmapNode {
  id: string;
  label: string;
  type: 'start' | 'process' | 'decision' | 'end' | 'notification' | 'wait' | 'action';
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  description?: string;
  data?: any;
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
  };
}

// 마인드맵 연결 타입
export interface MindmapConnection {
  id: string;
  source: string; // 시작 노드 ID
  target: string; // 끝 노드 ID
  type: 'direct' | 'conditional' | 'keyword' | 'temporal' | 'category';
  label?: string;
  strength?: number; // 연결 강도 (0-1)
  condition?: string; // 조건부 연결의 경우
  style?: {
    color?: string;
    width?: number;
    dashArray?: string;
    animated?: boolean;
  };
}

// 마인드맵 전체 데이터 타입
export interface MindmapData {
  id: string;
  title: string;
  description?: string;
  nodes: MindmapNode[];
  connections: MindmapConnection[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    category: string;
    tags: string[];
    version: number;
  };
  settings: {
    layout: 'force' | 'hierarchy' | 'circular' | 'timeline';
    theme: 'light' | 'dark';
    autoLayout: boolean;
    showLabels: boolean;
    showConnections: boolean;
  };
}

// 마인드맵 네트워크 (여러 마인드맵 간 연결)
export interface MindmapNetwork {
  id: string;
  mindmaps: string[]; // 마인드맵 ID 배열
  crossConnections: MindmapConnection[]; // 마인드맵 간 연결
  keywords: string[]; // 공통 키워드
  createdAt: Date;
  updatedAt: Date;
}

// 마인드맵 생성/편집 폼 데이터
export interface MindmapFormData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  initialNodes: Partial<MindmapNode>[];
}

// 마인드맵 필터 옵션
export interface MindmapFilter {
  category?: string;
  tags?: string[];
  searchTerm?: string; // 검색어 필터
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: 'created' | 'updated' | 'title' | 'category';
  sortOrder?: 'asc' | 'desc';
}

// 마인드맵 통계
export interface MindmapStats {
  totalMindmaps: number;
  totalNodes: number;
  totalConnections: number;
  categories: { [key: string]: number };
  topKeywords: { keyword: string; count: number }[];
  recentActivity: Date[];
} 