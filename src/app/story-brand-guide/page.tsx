/**
 * 스토리브랜드 라이프 가이드 메인 페이지
 * 사용자가 스토리브랜드 7단계를 통해 인생의 해답을 찾을 수 있도록 돕는 도구입니다.
 */

'use client';

import React, { useState } from 'react';
import { CategorySelector } from './components/CategorySelector';
import { StepForm } from './components/StepForm';
import { ResultPage } from './components/ResultPage';
import { StoryData } from './types';

const StoryBrandLifeGuide = () => {
  // 현재 단계 상태 (0: 카테고리 선택, 1-7: 단계별 질문, 8: 완료)
  const [currentStep, setCurrentStep] = useState(0);
  
  // 선택된 카테고리 상태
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // 스토리 데이터 상태
  const [storyData, setStoryData] = useState<StoryData>({
    category: '',
    step1: '', // 나의 진정한 욕구
    step2: '', // 직면한 문제
    step3: '', // 가이드 찾기
    step4: '', // 행동 계획
    step5: '', // 행동 동기
    step6: '', // 실패 방지
    step7: ''  // 성공한 모습
  });

  /**
   * 카테고리 선택 핸들러
   * @param categoryId 선택된 카테고리 ID
   */
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setStoryData(prev => ({ ...prev, category: categoryId }));
    setCurrentStep(1);
  };

  /**
   * 단계별 데이터 변경 핸들러
   * @param stepKey 단계 키
   * @param value 입력값
   */
  const handleStepDataChange = (stepKey: string, value: string) => {
    setStoryData(prev => ({ ...prev, [stepKey]: value }));
  };

  /**
   * 다음 단계로 이동
   */
  const handleNextStep = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    } else {
      // 마지막 단계에서는 완료 페이지로 이동
      setCurrentStep(8);
    }
  };

  /**
   * 이전 단계로 이동
   */
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * 가이드 초기화
   */
  const handleResetGuide = () => {
    setCurrentStep(0);
    setSelectedCategory('');
    setStoryData({
      category: '',
      step1: '',
      step2: '',
      step3: '',
      step4: '',
      step5: '',
      step6: '',
      step7: ''
    });
  };

  // 현재 단계에 따라 적절한 컴포넌트 렌더링
  if (currentStep === 0) {
    // 카테고리 선택 화면
    return (
      <CategorySelector onCategorySelect={handleCategorySelect} />
    );
  } else if (currentStep >= 1 && currentStep <= 7) {
    // 단계별 질문 화면
    return (
      <StepForm
        currentStep={currentStep}
        selectedCategory={selectedCategory}
        storyData={storyData}
        onStepDataChange={handleStepDataChange}
        onNextStep={handleNextStep}
        onPrevStep={handlePrevStep}
      />
    );
  } else {
    // 완료 화면
    return (
      <ResultPage
        storyData={storyData}
        selectedCategory={selectedCategory}
        onResetGuide={handleResetGuide}
      />
    );
  }
};

export default StoryBrandLifeGuide;