import { MindmapData, MindmapNode, MindmapConnection } from '../types';

export class ConnectionService {
  // 키워드 기반 연결 분석
  static analyzeKeywordConnections(mindmaps: MindmapData[]): MindmapConnection[] {
    const connections: MindmapConnection[] = [];
    
    for (let i = 0; i < mindmaps.length; i++) {
      for (let j = i + 1; j < mindmaps.length; j++) {
        const mindmap1 = mindmaps[i];
        const mindmap2 = mindmaps[j];
        
        // 태그 기반 연결 분석
        const sharedTags = mindmap1.metadata.tags.filter(tag => 
          mindmap2.metadata.tags.includes(tag)
        );
        
        // 노드 레이블 기반 연결 분석
        const sharedKeywords = this.findSharedKeywords(mindmap1.nodes, mindmap2.nodes);
        
        if (sharedTags.length > 0 || sharedKeywords.length > 0) {
          const strength = this.calculateConnectionStrength(
            sharedTags,
            sharedKeywords,
            mindmap1.nodes,
            mindmap2.nodes
          );
          
          connections.push({
            id: `keyword-${mindmap1.id}-${mindmap2.id}`,
            source: mindmap1.id,
            target: mindmap2.id,
            type: 'keyword',
            strength,
            label: sharedTags.length > 0 ? sharedTags[0] : sharedKeywords[0],
            style: {
              color: '#8B5CF6',
              width: Math.max(1, strength * 4),
              dashArray: '5,5',
              animated: strength > 0.7
            }
          });
        }
      }
    }
    
    return connections;
  }
  
  // 단계별 연결 분석 (순서 기반)
  static analyzeStepConnections(mindmaps: MindmapData[]): MindmapConnection[] {
    const connections: MindmapConnection[] = [];
    
    // 생성 시간 기준으로 정렬
    const sortedMindmaps = [...mindmaps].sort((a, b) => 
      a.metadata.createdAt.getTime() - b.metadata.createdAt.getTime()
    );
    
    for (let i = 0; i < sortedMindmaps.length - 1; i++) {
      const current = sortedMindmaps[i];
      const next = sortedMindmaps[i + 1];
      
      // 시간 차이 계산 (시간)
      const timeDiff = (next.metadata.createdAt.getTime() - current.metadata.createdAt.getTime()) / (1000 * 60 * 60);
      
      // 시간 차이가 24시간 이내인 경우 단계별 연결로 간주
      if (timeDiff <= 24) {
        connections.push({
          id: `step-${current.id}-${next.id}`,
          source: current.id,
          target: next.id,
          type: 'temporal',
          strength: Math.max(0.3, 1 - (timeDiff / 24)),
          label: `${Math.round(timeDiff)}h`,
          style: {
            color: '#10B981',
            width: 3,
            animated: true
          }
        });
      }
    }
    
    return connections;
  }
  
  // 카테고리 기반 연결 분석
  static analyzeCategoryConnections(mindmaps: MindmapData[]): MindmapConnection[] {
    const connections: MindmapConnection[] = [];
    const categoryGroups: { [key: string]: MindmapData[] } = {};
    
    // 카테고리별로 그룹화
    mindmaps.forEach(mindmap => {
      const category = mindmap.metadata.category;
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(mindmap);
    });
    
    // 각 카테고리 내에서 연결 생성
    Object.entries(categoryGroups).forEach(([category, maps]) => {
      if (maps.length > 1) {
        for (let i = 0; i < maps.length; i++) {
          for (let j = i + 1; j < maps.length; j++) {
            const mindmap1 = maps[i];
            const mindmap2 = maps[j];
            
            connections.push({
              id: `category-${mindmap1.id}-${mindmap2.id}`,
              source: mindmap1.id,
              target: mindmap2.id,
              type: 'category',
              strength: 0.6,
              label: category,
              style: {
                color: '#F59E0B',
                width: 2,
                dashArray: '10,5'
              }
            });
          }
        }
      }
    });
    
    return connections;
  }
  
  // 프로세스 플로우 연결 분석
  static analyzeProcessFlowConnections(mindmap: MindmapData): MindmapConnection[] {
    const connections: MindmapConnection[] = [];
    const nodes = mindmap.nodes;
    
    // 시작 노드 찾기
    const startNodes = nodes.filter(node => node.type === 'start');
    const endNodes = nodes.filter(node => node.type === 'end');
    
    // 자동 프로세스 플로우 연결 생성
    if (startNodes.length > 0 && endNodes.length > 0) {
      const processNodes = nodes.filter(node => 
        node.type === 'process' || node.type === 'decision' || node.type === 'action'
      );
      
      // 위치 기반으로 정렬 (왼쪽에서 오른쪽으로)
      const sortedNodes = [startNodes[0], ...processNodes, endNodes[0]]
        .sort((a, b) => a.position.x - b.position.x);
      
      for (let i = 0; i < sortedNodes.length - 1; i++) {
        const current = sortedNodes[i];
        const next = sortedNodes[i + 1];
        
        connections.push({
          id: `flow-${current.id}-${next.id}`,
          source: current.id,
          target: next.id,
          type: 'direct',
          strength: 0.8,
          style: {
            color: '#3B82F6',
            width: 3,
            animated: true
          }
        });
      }
    }
    
    return connections;
  }
  
  // 공유 키워드 찾기
  private static findSharedKeywords(nodes1: MindmapNode[], nodes2: MindmapNode[]): string[] {
    const keywords1 = this.extractKeywords(nodes1);
    const keywords2 = this.extractKeywords(nodes2);
    
    return keywords1.filter(keyword => keywords2.includes(keyword));
  }
  
  // 노드에서 키워드 추출
  private static extractKeywords(nodes: MindmapNode[]): string[] {
    const keywords: string[] = [];
    
    nodes.forEach(node => {
      // 레이블에서 키워드 추출
      const labelKeywords = node.label.toLowerCase().split(/\s+/);
      keywords.push(...labelKeywords);
      
      // 설명에서 키워드 추출
      if (node.description) {
        const descKeywords = node.description.toLowerCase().split(/\s+/);
        keywords.push(...descKeywords);
      }
    });
    
    // 중복 제거 및 짧은 단어 필터링
    return [...new Set(keywords)].filter(keyword => keyword.length > 2);
  }
  
  // 연결 강도 계산
  private static calculateConnectionStrength(
    sharedTags: string[],
    sharedKeywords: string[],
    nodes1: MindmapNode[],
    nodes2: MindmapNode[]
  ): number {
    const tagWeight = sharedTags.length * 0.3;
    const keywordWeight = sharedKeywords.length * 0.2;
    const nodeCountWeight = Math.min(nodes1.length, nodes2.length) * 0.1;
    
    return Math.min(1, tagWeight + keywordWeight + nodeCountWeight);
  }
  
  // 모든 연결 유형 통합 분석
  static analyzeAllConnections(mindmaps: MindmapData[]): {
    keywordConnections: MindmapConnection[];
    stepConnections: MindmapConnection[];
    categoryConnections: MindmapConnection[];
    processFlowConnections: { [mindmapId: string]: MindmapConnection[] };
  } {
    return {
      keywordConnections: this.analyzeKeywordConnections(mindmaps),
      stepConnections: this.analyzeStepConnections(mindmaps),
      categoryConnections: this.analyzeCategoryConnections(mindmaps),
      processFlowConnections: mindmaps.reduce((acc, mindmap) => {
        acc[mindmap.id] = this.analyzeProcessFlowConnections(mindmap);
        return acc;
      }, {} as { [mindmapId: string]: MindmapConnection[] })
    };
  }
  
  // 연결 필터링 및 우선순위 적용
  static filterConnections(
    connections: MindmapConnection[],
    minStrength: number = 0.3,
    maxConnections: number = 50
  ): MindmapConnection[] {
    return connections
      .filter(conn => (conn.strength || 0) >= minStrength)
      .sort((a, b) => (b.strength || 0) - (a.strength || 0))
      .slice(0, maxConnections);
  }
} 