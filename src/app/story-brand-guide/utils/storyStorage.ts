import { SavedStory, StoryData, KeywordData, StoryNetwork } from '../types';

export class StoryStorageService {
  private static instance: StoryStorageService;
  private readonly STORAGE_KEY = 'storyBrandGuide';
  
  public static getInstance(): StoryStorageService {
    if (!StoryStorageService.instance) {
      StoryStorageService.instance = new StoryStorageService();
    }
    return StoryStorageService.instance;
  }

  // LocalStorage에서 데이터 가져오기
  private getStorageData(): { stories: SavedStory[], keywords: KeywordData[] } {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return { stories: [], keywords: [] };
    } catch (error) {
      console.error('LocalStorage 데이터 읽기 오류:', error);
      return { stories: [], keywords: [] };
    }
  }

  // LocalStorage에 데이터 저장하기
  private setStorageData(data: { stories: SavedStory[], keywords: KeywordData[] }): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('LocalStorage 데이터 저장 오류:', error);
      throw new Error('스토리 저장 중 오류가 발생했습니다.');
    }
  }

  // 고유 ID 생성
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // 스토리 저장
  async saveStory(
    userId: string, 
    title: string, 
    category: string, 
    storyData: StoryData
  ): Promise<string> {
    try {
      const storage = this.getStorageData();
      const keywords = await this.extractKeywords(storyData);
      const storyId = this.generateId();
      
      const newStory: SavedStory = {
        id: storyId,
        userId,
        title,
        category,
        storyData,
        keywords,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        connections: []
      };

      // 스토리 추가
      storage.stories.push(newStory);
      
      // 키워드 업데이트
      await this.updateKeywords(storage, userId, keywords, storyId);
      
      // 다른 스토리들과의 연결 계산
      await this.calculateConnections(storage, storyId, userId);
      
      // 저장
      this.setStorageData(storage);
      
      return storyId;
    } catch (error) {
      console.error('스토리 저장 오류:', error);
      throw error;
    }
  }

  // 사용자의 모든 스토리 조회
  async getUserStories(userId: string): Promise<SavedStory[]> {
    try {
      const storage = this.getStorageData();
      return storage.stories
        .filter(story => story.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('사용자 스토리 조회 오류:', error);
      throw error;
    }
  }

  // 특정 스토리 조회
  async getStory(storyId: string): Promise<SavedStory | null> {
    try {
      const storage = this.getStorageData();
      return storage.stories.find(story => story.id === storyId) || null;
    } catch (error) {
      console.error('스토리 조회 오류:', error);
      throw error;
    }
  }

  // 스토리 업데이트
  async updateStory(storyId: string, updates: Partial<SavedStory>): Promise<void> {
    try {
      const storage = this.getStorageData();
      const storyIndex = storage.stories.findIndex(story => story.id === storyId);
      
      if (storyIndex === -1) {
        throw new Error('스토리를 찾을 수 없습니다.');
      }
      
      storage.stories[storyIndex] = {
        ...storage.stories[storyIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      this.setStorageData(storage);
    } catch (error) {
      console.error('스토리 업데이트 오류:', error);
      throw error;
    }
  }

  // 스토리 삭제
  async deleteStory(storyId: string): Promise<void> {
    try {
      const storage = this.getStorageData();
      storage.stories = storage.stories.filter(story => story.id !== storyId);
      
      // 관련 키워드에서도 이 스토리 제거
      storage.keywords = storage.keywords.map(keyword => ({
        ...keyword,
        stories: keyword.stories.filter(id => id !== storyId)
      })).filter(keyword => keyword.stories.length > 0);
      
      this.setStorageData(storage);
    } catch (error) {
      console.error('스토리 삭제 오류:', error);
      throw error;
    }
  }

  // 키워드 추출 (기본 한국어 NLP)
  private async extractKeywords(storyData: StoryData): Promise<string[]> {
    const allText = Object.values(storyData).join(' ');
    
    // 기본적인 한국어 키워드 추출
    const keywords = new Set<string>();
    
    // 명사 패턴 매칭 (간단한 휴리스틱)
    const nounPatterns = [
      /(\w{2,}기업|\w{2,}회사)/g,
      /(\w{2,}사업|\w{2,}업무)/g,
      /(\w{2,}제품|\w{2,}서비스)/g,
      /(\w{2,}고객|\w{2,}사용자)/g,
      /(\w{2,}목표|\w{2,}계획)/g,
      /(\w{2,}문제|\w{2,}해결)/g,
      /(\w{2,}성장|\w{2,}발전)/g,
      /(\w{2,}마케팅|\w{2,}홍보)/g,
      /(\w{2,}창업|\w{2,}기업)/g,
      /(\w{2,}교육|\w{2,}학습)/g,
      /(\w{2,}관계|\w{2,}소통)/g,
      /(\w{2,}건강|\w{2,}운동)/g,
      /(\w{2,}취업|\w{2,}직업)/g,
      /(\w{2,}투자|\w{2,}금융)/g,
      /(\w{2,}기술|\w{2,}개발)/g
    ];
    
    nounPatterns.forEach(pattern => {
      const matches = allText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (match.length >= 2) {
            keywords.add(match);
          }
        });
      }
    });
    
    // 일반 명사 추출 (2글자 이상)
    const words = allText.match(/[\w]{2,}/g) || [];
    const commonWords = ['것이', '때문', '그것', '이것', '저것', '무엇', '어떤', '그런', '이런', '저런'];
    
    words.forEach(word => {
      if (word.length >= 2 && !commonWords.includes(word)) {
        keywords.add(word);
      }
    });
    
    return Array.from(keywords).slice(0, 20); // 최대 20개 키워드
  }

  // 키워드 데이터베이스 업데이트
  private async updateKeywords(
    storage: { stories: SavedStory[], keywords: KeywordData[] },
    userId: string, 
    keywords: string[], 
    storyId: string
  ): Promise<void> {
    try {
      for (const keyword of keywords) {
        const existingKeywordIndex = storage.keywords.findIndex(
          k => k.keyword === keyword && k.userId === userId
        );
        
        if (existingKeywordIndex !== -1) {
          const existingKeyword = storage.keywords[existingKeywordIndex];
          storage.keywords[existingKeywordIndex] = {
            ...existingKeyword,
            frequency: existingKeyword.frequency + 1,
            stories: [...existingKeyword.stories, storyId],
            importance: Math.min(existingKeyword.importance + 0.1, 1)
          };
        } else {
          const newKeywordData: KeywordData = {
            keyword,
            frequency: 1,
            stories: [storyId],
            category: 'general',
            importance: 0.5,
            userId
          };
          storage.keywords.push(newKeywordData);
        }
      }
    } catch (error) {
      console.error('키워드 업데이트 오류:', error);
    }
  }

  // 스토리 간 연결 계산
  private async calculateConnections(
    storage: { stories: SavedStory[], keywords: KeywordData[] },
    newStoryId: string, 
    userId: string
  ): Promise<void> {
    try {
      const userStories = storage.stories.filter(s => s.userId === userId);
      const newStory = userStories.find(s => s.id === newStoryId);
      
      if (!newStory) return;
      
      for (const existingStory of userStories) {
        if (existingStory.id === newStoryId) continue;
        
        const sharedKeywords = newStory.keywords.filter(k => 
          existingStory.keywords.includes(k)
        );
        
        if (sharedKeywords.length > 0) {
          const connectionStrength = sharedKeywords.length / 
            Math.max(newStory.keywords.length, existingStory.keywords.length);
          
          // 새 스토리에 연결 추가
          const newStoryIndex = storage.stories.findIndex(s => s.id === newStoryId);
          if (newStoryIndex !== -1) {
            storage.stories[newStoryIndex].connections.push({
              connectedStoryId: existingStory.id,
              sharedKeywords,
              connectionStrength
            });
          }
          
          // 기존 스토리에도 연결 추가
          const existingStoryIndex = storage.stories.findIndex(s => s.id === existingStory.id);
          if (existingStoryIndex !== -1) {
            storage.stories[existingStoryIndex].connections.push({
              connectedStoryId: newStoryId,
              sharedKeywords,
              connectionStrength
            });
          }
        }
      }
    } catch (error) {
      console.error('연결 계산 오류:', error);
    }
  }

  // 사용자의 스토리 네트워크 조회
  async getStoryNetwork(userId: string): Promise<StoryNetwork> {
    try {
      const storage = this.getStorageData();
      const stories = storage.stories.filter(s => s.userId === userId);
      const connections = this.buildNetworkConnections(stories);
      const keywords = storage.keywords.filter(k => k.userId === userId);
      
      return {
        stories,
        connections,
        keywords
      };
    } catch (error) {
      console.error('스토리 네트워크 조회 오류:', error);
      throw error;
    }
  }

  // 네트워크 연결 구축
  private buildNetworkConnections(stories: SavedStory[]) {
    const connections: any[] = [];
    
    stories.forEach(story => {
      story.connections.forEach(connection => {
        connections.push({
          from: story.id,
          to: connection.connectedStoryId,
          strength: connection.connectionStrength,
          sharedKeywords: connection.sharedKeywords
        });
      });
    });
    
    return connections;
  }

  // 사용자 키워드 조회
  private async getUserKeywords(userId: string): Promise<KeywordData[]> {
    try {
      const storage = this.getStorageData();
      return storage.keywords
        .filter(k => k.userId === userId)
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 100);
    } catch (error) {
      console.error('사용자 키워드 조회 오류:', error);
      return [];
    }
  }

  // 저장소 초기화 (개발/테스트용)
  clearStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('저장소 초기화 오류:', error);
    }
  }

  // 저장소 백업 (JSON 형태로 다운로드)
  exportData(): string {
    try {
      const data = this.getStorageData();
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('데이터 내보내기 오류:', error);
      return '{}';
    }
  }

  // 저장소 복원 (JSON 데이터로부터)
  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      this.setStorageData(data);
    } catch (error) {
      console.error('데이터 가져오기 오류:', error);
      throw new Error('올바르지 않은 데이터 형식입니다.');
    }
  }
} 