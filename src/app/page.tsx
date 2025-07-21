/**
 * 스토리브랜드 라이프 가이드 메인 페이지
 * 사용자가 스토리브랜드 7단계를 통해 인생의 해답을 찾을 수 있도록 돕는 도구입니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CategorySelector } from './story-brand-guide/components/CategorySelector';
import { StepForm } from './story-brand-guide/components/StepForm';
import { ResultPage } from './story-brand-guide/components/ResultPage';
import { StoryData } from './story-brand-guide/types';
import HamburgerMenu from '../components/HamburgerMenu';

const StoryBrandLifeGuide = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
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

  // 로그인 상태 확인
  useEffect(() => {
    if (status === 'loading') return; // 로딩 중일 때는 아무것도 하지 않음
    
    if (!session) {
      // 로그인하지 않은 사용자는 로그인 페이지로 리디렉션
      router.push('/auth/login?callbackUrl=/');
      return;
    }
  }, [session, status, router]);

  // 로딩 중이거나 로그인하지 않은 경우 로딩 화면 표시
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2">로딩 중...</span>
      </div>
    );
  }

  if (!session) {
    return null; // 리디렉션 중이므로 아무것도 렌더링하지 않음
  }

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
   * 스토리 데이터 업데이트 핸들러 (결과 페이지에서 편집 시)
   * @param updatedData 업데이트된 스토리 데이터
   */
  const handleUpdateStoryData = (updatedData: StoryData) => {
    setStoryData(updatedData);
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
      <>
        <HamburgerMenu />
        <CategorySelector onCategorySelect={handleCategorySelect} />
      </>
    );
  } else if (currentStep >= 1 && currentStep <= 7) {
    // 단계별 질문 화면
    return (
      <>
        <HamburgerMenu />
        <StepForm
          currentStep={currentStep}
          selectedCategory={selectedCategory}
          storyData={storyData}
          onStepDataChange={handleStepDataChange}
          onNextStep={handleNextStep}
          onPrevStep={handlePrevStep}
        />
      </>
    );
  } else {
    // 완료 화면
    return (
      <>
        <HamburgerMenu />
        <ResultPage
          storyData={storyData}
          selectedCategory={selectedCategory}
          onResetGuide={handleResetGuide}
          onUpdateStoryData={handleUpdateStoryData}
        />
      </>
    );
  }
};

export default StoryBrandLifeGuide;
