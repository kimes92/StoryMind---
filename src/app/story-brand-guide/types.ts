/**
 * 스토리브랜드 가이드 타입 정의
 */

import { LucideIcon } from 'lucide-react';

// 카테고리 타입
export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

// 단계별 질문 타입
export interface StepQuestion {
  [key: string]: string[];
}

// 단계 타입
export interface Step {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  questions: StepQuestion;
}

// 스토리 데이터 타입
export interface StoryData {
  category: string;
  step1: string; // 나의 진정한 욕구
  step2: string; // 직면한 문제
  step3: string; // 가이드 찾기
  step4: string; // 행동 계획
  step5: string; // 행동 동기
  step6: string; // 실패 방지
  step7: string; // 성공한 모습
}

// 단계 피드백 타입
export interface StepFeedback {
  title: string;
  content: string;
  color: string;
  feedback: string;
}

export interface MindmapConfig {
  width: number;
  height: number;
  canvasId: string;
}

// Firebase 저장을 위한 새로운 타입들
export interface SavedStory {
  id: string;
  userId: string;
  title: string;
  category: string;
  storyData: StoryData;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
  connections: StoryConnection[];
}

export interface StoryConnection {
  connectedStoryId: string;
  sharedKeywords: string[];
  connectionStrength: number; // 0-1 사이의 연결 강도
}

export interface KeywordData {
  keyword: string;
  frequency: number;
  stories: string[]; // 이 키워드가 포함된 스토리 ID들
  category: string;
  importance: number; // 0-1 사이의 중요도
  userId: string; // 키워드를 소유한 사용자 ID
}

export interface StoryNetwork {
  stories: SavedStory[];
  connections: NetworkConnection[];
  keywords: KeywordData[];
}

export interface NetworkConnection {
  from: string;
  to: string;
  strength: number;
  sharedKeywords: string[];
} 