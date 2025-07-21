/**
 * 단계별 질문 컴포넌트
 * 각 단계별로 사용자에게 질문을 제시하고 답변을 받습니다.
 */

import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { STEPS } from '../constants';
import { StoryData } from '../types';

interface StepFormProps {
  currentStep: number;
  selectedCategory: string;
  storyData: StoryData;
  onStepDataChange: (stepKey: string, value: string) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
}

export const StepForm: React.FC<StepFormProps> = ({
  currentStep,
  selectedCategory,
  storyData,
  onStepDataChange,
  onNextStep,
  onPrevStep
}) => {
  // 현재 단계 데이터 가져오기
  const currentStepData = STEPS[currentStep - 1];
  const questions = currentStepData.questions[selectedCategory] || [];
  const stepKey = `step${currentStep}` as keyof StoryData;
  const currentValue = storyData[stepKey] as string;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* 단계 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">
              {currentStepData.title}
            </h1>
            <span className="text-sm text-gray-500">
              {currentStep}/7
            </span>
          </div>
          <h2 className="text-lg text-blue-600 font-medium mb-2">
            {currentStepData.subtitle}
          </h2>
          <p className="text-gray-600">
            {currentStepData.description}
          </p>
        </div>

        {/* 질문 섹션 */}
        <div className="mb-6">
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-700 mb-2">
              💭 생각해볼 질문들:
            </h3>
            <ul className="space-y-1">
              {questions.map((question, index) => (
                <li key={index} className="text-blue-600 text-sm">
                  • {question}
                </li>
              ))}
            </ul>
          </div>

          {/* 답변 입력 영역 */}
          <textarea
            value={currentValue || ''}
            onChange={(e) => onStepDataChange(stepKey, e.target.value)}
            placeholder="위의 질문들을 참고하여 자유롭게 작성해보세요..."
            className="w-full h-40 p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between">
          <button
            onClick={onPrevStep}
            disabled={currentStep === 1}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>이전</span>
          </button>

          <button
            onClick={onNextStep}
            disabled={!currentValue?.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-blue-700 rounded-lg transition-colors"
          >
            <span>{currentStep === 7 ? '완료' : '다음'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 진행률 표시 */}
        <div className="mt-6">
          <div className="bg-gray-100 rounded-full h-2">
            <div 
              className="bg-blue-300 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 7) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 