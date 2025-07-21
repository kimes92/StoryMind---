/**
 * 카테고리 선택 컴포넌트
 * 사용자가 스토리브랜드 가이드를 진행할 영역을 선택합니다.
 */

import React from 'react';
import { BookOpen } from 'lucide-react';
import { CATEGORIES } from '../constants';

interface CategorySelectorProps {
  onCategorySelect: (categoryId: string) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({ onCategorySelect }) => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* 헤더 섹션 */}
      <div className="text-center mb-8">
        <BookOpen className="mx-auto w-16 h-16 text-gray-400 mb-4" />
        <h1 className="text-3xl font-bold text-gray-700 mb-2">
          내 이야기로 찾는 해답
        </h1>
        <p className="text-gray-500 text-lg">
          스토리브랜드 7단계로 인생의 해답을 찾아보세요
        </p>
      </div>

      {/* 카테고리 선택 카드 */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-center">
          어떤 영역의 이야기를 만들어보시겠어요?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className={`${category.color} hover:bg-opacity-80 p-6 rounded-lg transition-all duration-200 hover:scale-105 flex flex-col items-center space-y-2`}
                title={category.description}
              >
                <Icon className="w-8 h-8" />
                <span className="font-medium">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 가이드 설명 섹션 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-3">
          💡 이 도구는 어떻게 작동하나요?
        </h3>
        <div className="space-y-3 text-gray-700">
          <p>• Donald Miller의 스토리브랜드 7단계 구조를 개인의 삶에 적용</p>
          <p>• 각 단계별로 맞춤 질문을 통해 상황을 체계적으로 분석</p>
          <p>• 완성된 스토리를 통해 명확한 행동 계획 도출</p>
          <p>• 사업, 학업, 인간관계 등 다양한 영역에서 활용 가능</p>
        </div>
      </div>
    </div>
  );
}; 