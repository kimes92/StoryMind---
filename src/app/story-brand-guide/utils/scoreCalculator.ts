/**
 * 스토리 점수 계산 및 피드백 생성 유틸리티
 * 입력 내용의 길이, 키워드 분석, 6하원칙 체계성을 평가합니다.
 */

export interface ScoreResult {
  score: number; // 1-5점
  feedback: string;
  suggestions: string[];
}

// 6하원칙 키워드 패턴
const WHO_PATTERNS = ['누가', '사람', '고객', '나', '우리', '팀', '회사', '개인', '파트너'];
const WHAT_PATTERNS = ['무엇', '제품', '서비스', '목표', '결과', '성과', '가치', '혜택'];
const WHERE_PATTERNS = ['어디', '장소', '시장', '온라인', '오프라인', '현장', '지역', '국가'];
const WHEN_PATTERNS = ['언제', '시간', '기간', '일정', '마감', '단계', '순서', '타이밍'];
const WHY_PATTERNS = ['왜', '이유', '목적', '동기', '필요', '원인', '배경', '가치'];
const HOW_PATTERNS = ['어떻게', '방법', '과정', '절차', '단계', '방식', '수단', '도구'];

// 품질 키워드 (긍정적 표현)
const QUALITY_KEYWORDS = [
  '구체적', '명확한', '체계적', '전략적', '계획적', '실행 가능한', '측정 가능한',
  '목표', '성과', '결과', '효과', '가치', '혜택', '해결', '개선', '발전', '성장'
];

// 부정적 키워드 (모호한 표현)
const VAGUE_KEYWORDS = [
  '좀', '뭔가', '그냥', '아무튼', '대충', '적당히', '그럭저럭', '어쩌면', '아마도'
];

/**
 * 텍스트에서 특정 패턴들의 포함 여부를 확인
 */
function countPatterns(text: string, patterns: string[]): number {
  const lowerText = text.toLowerCase();
  return patterns.reduce((count, pattern) => {
    return lowerText.includes(pattern) ? count + 1 : count;
  }, 0);
}

/**
 * 입력 내용의 길이 점수 계산 (1-5점)
 */
function calculateLengthScore(text: string): number {
  const length = text.trim().length;
  if (length < 20) return 1;
  if (length < 50) return 2;
  if (length < 100) return 3;
  if (length < 200) return 4;
  return 5;
}

/**
 * 키워드 품질 점수 계산 (1-5점)
 */
function calculateQualityScore(text: string): number {
  const qualityCount = countPatterns(text, QUALITY_KEYWORDS);
  const vagueCount = countPatterns(text, VAGUE_KEYWORDS);
  
  let score = 3; // 기본 점수
  
  // 품질 키워드 가산점
  score += Math.min(qualityCount * 0.5, 2);
  
  // 모호한 키워드 감점
  score -= Math.min(vagueCount * 0.5, 2);
  
  return Math.max(1, Math.min(5, Math.round(score)));
}

/**
 * 6하원칙 체계성 점수 계산 (1-5점)
 */
function calculateSystematicScore(text: string): number {
  const whoCount = countPatterns(text, WHO_PATTERNS);
  const whatCount = countPatterns(text, WHAT_PATTERNS);
  const whereCount = countPatterns(text, WHERE_PATTERNS);
  const whenCount = countPatterns(text, WHEN_PATTERNS);
  const whyCount = countPatterns(text, WHY_PATTERNS);
  const howCount = countPatterns(text, HOW_PATTERNS);
  
  const totalAspects = [whoCount, whatCount, whereCount, whenCount, whyCount, howCount]
    .filter(count => count > 0).length;
  
  if (totalAspects >= 5) return 5;
  if (totalAspects >= 4) return 4;
  if (totalAspects >= 3) return 3;
  if (totalAspects >= 2) return 2;
  return 1;
}

/**
 * 단계별 스토리 점수 계산
 */
export function calculateStoryScore(content: string, stepIndex: number): ScoreResult {
  if (!content || content.trim().length === 0) {
    return {
      score: 1,
      feedback: "아직 내용이 입력되지 않았습니다.",
      suggestions: ["이 단계의 내용을 입력해주세요."]
    };
  }

  const lengthScore = calculateLengthScore(content);
  const qualityScore = calculateQualityScore(content);
  const systematicScore = calculateSystematicScore(content);
  
  // 가중 평균 계산
  const finalScore = Math.round((lengthScore * 0.3 + qualityScore * 0.4 + systematicScore * 0.3));
  
  return {
    score: finalScore,
    feedback: generateFeedback(finalScore, lengthScore, qualityScore, systematicScore),
    suggestions: generateSuggestions(finalScore, lengthScore, qualityScore, systematicScore, stepIndex)
  };
}

/**
 * 점수별 피드백 생성
 */
function generateFeedback(score: number, lengthScore: number, qualityScore: number, systematicScore: number): string {
  const feedbacks = {
    5: [
      "완벽한 계획입니다! 🎉",
      "매우 체계적이고 구체적입니다! 👏",
      "훌륭한 분석과 계획입니다! ⭐",
      "정말 잘 정리되었습니다! 💪",
      "이보다 더 좋을 수 없습니다! 🚀"
    ],
    4: [
      "아주 좋은 계획입니다! 😊",
      "체계적으로 잘 작성되었습니다! 👍",
      "구체적이고 실용적입니다! 💡",
      "잘 정리된 계획입니다! 📝",
      "훌륭한 접근 방식입니다! ✨"
    ],
    3: [
      "괜찮은 계획입니다! 🙂",
      "기본적인 내용이 잘 정리되었습니다.",
      "적절한 수준의 계획입니다.",
      "좋은 시작입니다! 계속 발전시켜 보세요.",
      "균형 잡힌 접근입니다."
    ],
    2: [
      "좋은 시작입니다! 조금 더 구체적으로 해보세요.",
      "기본 틀은 있지만 더 발전시킬 수 있습니다.",
      "아이디어는 좋습니다. 더 자세히 설명해보세요.",
      "방향성은 맞습니다. 내용을 보완해보세요.",
      "좋은 기반입니다. 더 구체화해보세요."
    ],
    1: [
      "시작이 반입니다! 더 자세히 작성해보세요.",
      "좋은 아이디어입니다. 더 구체적으로 발전시켜보세요.",
      "기본 아이디어가 있습니다. 내용을 더 채워보세요.",
      "좋은 출발점입니다. 더 체계적으로 정리해보세요.",
      "잠재력이 보입니다. 더 자세히 계획해보세요."
    ]
  };
  
  const scoreMessages = feedbacks[score as keyof typeof feedbacks];
  return scoreMessages[Math.floor(Math.random() * scoreMessages.length)];
}

/**
 * 개선 제안 생성
 */
function generateSuggestions(score: number, lengthScore: number, qualityScore: number, systematicScore: number, stepIndex: number): string[] {
  const suggestions: string[] = [];
  
  // 길이 관련 제안
  if (lengthScore < 3) {
    suggestions.push("더 자세하고 구체적으로 작성해보세요.");
  }
  
  // 품질 관련 제안
  if (qualityScore < 3) {
    suggestions.push("구체적이고 측정 가능한 표현을 사용해보세요.");
    suggestions.push("모호한 표현 대신 명확한 언어를 사용해보세요.");
  }
  
  // 체계성 관련 제안
  if (systematicScore < 3) {
    suggestions.push("누가, 무엇을, 언제, 어디서, 왜, 어떻게 관점에서 체계적으로 작성해보세요.");
  }
  
  // 단계별 맞춤 제안
  const stepSpecificSuggestions = {
    0: ["진정으로 원하는 것이 무엇인지 구체적으로 표현해보세요."],
    1: ["직면한 문제를 명확히 정의하고 구체적인 예시를 들어보세요."],
    2: ["도움을 받을 수 있는 구체적인 가이드나 멘토를 찾아보세요."],
    3: ["실행 가능한 단계별 계획을 세워보세요."],
    4: ["행동을 시작하게 만드는 구체적인 동기를 찾아보세요."],
    5: ["실패를 방지하는 구체적인 방법들을 나열해보세요."],
    6: ["성공했을 때의 모습을 생생하게 그려보세요."]
  };
  
  if (score < 4) {
    suggestions.push(...(stepSpecificSuggestions[stepIndex as keyof typeof stepSpecificSuggestions] || []));
  }
  
  return suggestions.slice(0, 3); // 최대 3개의 제안
} 