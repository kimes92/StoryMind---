import { MindmapData, MindmapNode, MindmapConnection, MindmapFilter, MindmapStats } from '../types';

export class MindmapService {
  private static readonly STORAGE_KEY = 'mindmapData';

  // LocalStorage에서 데이터 가져오기
  private static getStorageData(): { mindmaps: MindmapData[] } {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Date 객체 복원
        parsed.mindmaps = parsed.mindmaps.map((mindmap: any) => ({
          ...mindmap,
          metadata: {
            ...mindmap.metadata,
            createdAt: new Date(mindmap.metadata.createdAt),
            updatedAt: new Date(mindmap.metadata.updatedAt)
          }
        }));
        return parsed;
      }
      return { mindmaps: [] };
    } catch (error) {
      console.error('LocalStorage 데이터 읽기 오류:', error);
      return { mindmaps: [] };
    }
  }

  // LocalStorage에 데이터 저장하기
  private static setStorageData(data: { mindmaps: MindmapData[] }): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('LocalStorage 데이터 저장 오류:', error);
      throw new Error('마인드맵 저장 중 오류가 발생했습니다.');
    }
  }

  // 고유 ID 생성
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // 마인드맵 저장
  static async saveMindmap(mindmap: Omit<MindmapData, 'id'>): Promise<string> {
    try {
      const storage = this.getStorageData();
      const id = this.generateId();
      
      const mindmapData: MindmapData = {
        ...mindmap,
        id,
        metadata: {
          ...mindmap.metadata,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      
      storage.mindmaps.push(mindmapData);
      this.setStorageData(storage);
      
      return id;
    } catch (error) {
      console.error('마인드맵 저장 실패:', error);
      throw error;
    }
  }

  // 마인드맵 업데이트
  static async updateMindmap(id: string, updates: Partial<MindmapData>): Promise<void> {
    try {
      const storage = this.getStorageData();
      const mindmapIndex = storage.mindmaps.findIndex(m => m.id === id);
      
      if (mindmapIndex === -1) {
        throw new Error('마인드맵을 찾을 수 없습니다.');
      }
      
      storage.mindmaps[mindmapIndex] = {
        ...storage.mindmaps[mindmapIndex],
        ...updates,
        metadata: {
          ...storage.mindmaps[mindmapIndex].metadata,
          ...updates.metadata,
          updatedAt: new Date(),
          version: (storage.mindmaps[mindmapIndex].metadata.version || 0) + 1
        }
      };
      
      this.setStorageData(storage);
    } catch (error) {
      console.error('마인드맵 업데이트 실패:', error);
      throw error;
    }
  }

  // 마인드맵 조회
  static async getMindmap(id: string): Promise<MindmapData | null> {
    try {
      const storage = this.getStorageData();
      return storage.mindmaps.find(m => m.id === id) || null;
    } catch (error) {
      console.error('마인드맵 조회 실패:', error);
      throw error;
    }
  }

  // 사용자의 마인드맵 목록 조회
  static async getUserMindmaps(userId: string, filter?: MindmapFilter): Promise<MindmapData[]> {
    try {
      const storage = this.getStorageData();
      let mindmaps = storage.mindmaps.filter(m => m.metadata.createdBy === userId);

      // 필터 적용
      if (filter?.category) {
        mindmaps = mindmaps.filter(m => m.metadata.category === filter.category);
      }

      // 검색어 필터링
      if (filter?.searchTerm) {
        const searchTerm = filter.searchTerm.toLowerCase();
        mindmaps = mindmaps.filter(m => 
          m.title.toLowerCase().includes(searchTerm) ||
          m.description?.toLowerCase().includes(searchTerm) ||
          m.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // 정렬 적용
      mindmaps.sort((a, b) => {
        if (filter?.sortBy) {
          const sortField = filter.sortBy;
          let aValue: any, bValue: any;
          
          if (sortField === 'created') {
            aValue = a.metadata.createdAt;
            bValue = b.metadata.createdAt;
          } else if (sortField === 'updated') {
            aValue = a.metadata.updatedAt;
            bValue = b.metadata.updatedAt;
          } else if (sortField === 'title') {
            aValue = a.title;
            bValue = b.title;
          } else if (sortField === 'category') {
            aValue = a.metadata.category;
            bValue = b.metadata.category;
          } else {
            aValue = a.metadata.updatedAt;
            bValue = b.metadata.updatedAt;
          }
          
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return filter.sortOrder === 'asc' ? 
              aValue.localeCompare(bValue) : 
              bValue.localeCompare(aValue);
          } else {
            return filter.sortOrder === 'asc' ? 
              aValue.getTime() - bValue.getTime() : 
              bValue.getTime() - aValue.getTime();
          }
        } else {
          // 기본 정렬: 업데이트 날짜 최신순
          return b.metadata.updatedAt.getTime() - a.metadata.updatedAt.getTime();
        }
      });

      return mindmaps;
    } catch (error) {
      console.error('마인드맵 목록 조회 실패:', error);
      throw error;
    }
  }

  // 마인드맵 삭제
  static async deleteMindmap(id: string): Promise<void> {
    try {
      const storage = this.getStorageData();
      storage.mindmaps = storage.mindmaps.filter(m => m.id !== id);
      this.setStorageData(storage);
    } catch (error) {
      console.error('마인드맵 삭제 실패:', error);
      throw error;
    }
  }

  // 마인드맵 통계 조회
  static async getMindmapStats(userId: string): Promise<MindmapStats> {
    try {
      const mindmaps = await this.getUserMindmaps(userId);
      
      const stats: MindmapStats = {
        totalMindmaps: mindmaps.length,
        totalNodes: mindmaps.reduce((sum, m) => sum + m.nodes.length, 0),
        totalConnections: mindmaps.reduce((sum, m) => sum + m.connections.length, 0),
        categories: {},
        topKeywords: [],
        recentActivity: []
      };

      // 카테고리별 통계
      mindmaps.forEach(mindmap => {
        const category = mindmap.metadata.category;
        stats.categories[category] = (stats.categories[category] || 0) + 1;
      });

      // 키워드 통계
      const keywordCount: { [key: string]: number } = {};
      mindmaps.forEach(mindmap => {
        mindmap.metadata.tags.forEach(tag => {
          keywordCount[tag] = (keywordCount[tag] || 0) + 1;
        });
      });

      stats.topKeywords = Object.entries(keywordCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([keyword, count]) => ({ keyword, count }));

      // 최근 활동
      stats.recentActivity = mindmaps
        .map(m => m.metadata.updatedAt)
        .sort((a, b) => b.getTime() - a.getTime())
        .slice(0, 30);

      return stats;
    } catch (error) {
      console.error('마인드맵 통계 조회 실패:', error);
      throw error;
    }
  }

  // 키워드로 마인드맵 검색
  static async searchMindmapsByKeyword(userId: string, keyword: string): Promise<MindmapData[]> {
    try {
      const mindmaps = await this.getUserMindmaps(userId);
      
      return mindmaps.filter(mindmap => 
        mindmap.title.toLowerCase().includes(keyword.toLowerCase()) ||
        mindmap.description?.toLowerCase().includes(keyword.toLowerCase()) ||
        mindmap.metadata.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase())) ||
        mindmap.nodes.some(node => node.label.toLowerCase().includes(keyword.toLowerCase()))
      );
    } catch (error) {
      console.error('마인드맵 검색 실패:', error);
      throw error;
    }
  }

  // 마인드맵 간 연결 찾기
  static async findConnectedMindmaps(userId: string, mindmapId: string): Promise<MindmapData[]> {
    try {
      const targetMindmap = await this.getMindmap(mindmapId);
      if (!targetMindmap) return [];

      const allMindmaps = await this.getUserMindmaps(userId);
      const connectedMindmaps: MindmapData[] = [];

      allMindmaps.forEach(mindmap => {
        if (mindmap.id === mindmapId) return;

        // 태그 기반 연결 찾기
        const sharedTags = mindmap.metadata.tags.filter(tag => 
          targetMindmap.metadata.tags.includes(tag)
        );

        // 노드 키워드 기반 연결 찾기
        const sharedKeywords = mindmap.nodes.some(node => 
          targetMindmap.nodes.some(targetNode => 
            node.label.toLowerCase().includes(targetNode.label.toLowerCase()) ||
            targetNode.label.toLowerCase().includes(node.label.toLowerCase())
          )
        );

        if (sharedTags.length > 0 || sharedKeywords) {
          connectedMindmaps.push(mindmap);
        }
      });

      return connectedMindmaps;
    } catch (error) {
      console.error('연결된 마인드맵 찾기 실패:', error);
      throw error;
    }
  }

  // 저장소 초기화 (개발/테스트용)
  static clearStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('저장소 초기화 오류:', error);
    }
  }

  // 데이터 백업
  static exportData(): string {
    try {
      const data = this.getStorageData();
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('데이터 내보내기 오류:', error);
      return '{}';
    }
  }

  // 데이터 복원
  static importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      this.setStorageData(data);
    } catch (error) {
      console.error('데이터 가져오기 오류:', error);
      throw new Error('올바르지 않은 데이터 형식입니다.');
    }
  }
} 