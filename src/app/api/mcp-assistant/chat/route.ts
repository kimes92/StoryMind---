import { NextRequest, NextResponse } from 'next/server';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatRequest {
  message: string;
  tool?: string | null;
  history?: Message[];
}

// MCP 도구별 처리 로직
const handleToolRequest = async (tool: string, message: string) => {
  switch (tool) {
    case 'content-generator':
      return `콘텐츠 생성기를 사용하여 "${message}"에 대한 콘텐츠를 생성하겠습니다. 어떤 종류의 콘텐츠를 원하시나요? (블로그 포스트, 소셜 미디어 글, 이메일 등)`;
    
    case 'email-accounts':
      return `이메일 계정 관리 도구를 사용합니다. 현재 등록된 계정 목록을 확인하거나 새로운 계정을 추가할 수 있습니다. 어떤 작업을 하시겠습니까?`;
    
    case 'schedules':
      return `일정 관리 도구를 사용합니다. 새로운 일정을 추가하거나 기존 일정을 확인/수정할 수 있습니다. "${message}"에 대한 일정을 어떻게 관리하시겠습니까?`;
    
    case 'templates':
      return `템플릿 관리 도구를 사용합니다. 이메일 템플릿, 문서 템플릿 등을 관리할 수 있습니다. 어떤 템플릿을 찾고 계신가요?`;
    
    case 'send-email':
      return `이메일 전송 도구를 사용합니다. 수신자, 제목, 내용을 확인한 후 이메일을 전송할 수 있습니다. 이메일 세부 정보를 알려주세요.`;
    
    case 'email-config':
      return `이메일 설정 도구를 사용합니다. SMTP 설정, 서명, 자동 응답 등을 구성할 수 있습니다. 어떤 설정을 변경하시겠습니까?`;
    
    default:
      return `"${tool}" 도구를 사용하여 "${message}"를 처리하겠습니다.`;
  }
};

// 일반적인 AI 응답 생성
const generateResponse = (message: string, history?: Message[]): string => {
  const lowerMessage = message.toLowerCase();
  
  // 인사 및 기본 응답
  if (lowerMessage.includes('안녕') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return '안녕하세요! MCP Assistant입니다. 다양한 도구를 사용하여 도움을 드릴 수 있습니다. 콘텐츠 생성, 이메일 관리, 일정 관리 등의 작업을 도와드릴 수 있어요. 어떤 도움이 필요하신가요?';
  }
  
  // 도구 관련 질문
  if (lowerMessage.includes('도구') || lowerMessage.includes('기능') || lowerMessage.includes('할 수 있는')) {
    return '다음과 같은 도구들을 사용할 수 있습니다:\n\n• 콘텐츠 생성기 - 블로그 포스트, 소셜 미디어 글 등 생성\n• 이메일 계정 관리 - 이메일 계정 설정 및 관리\n• 일정 관리 - 스케줄링 및 알림 설정\n• 템플릿 관리 - 다양한 템플릿 관리\n• 이메일 전송 - 이메일 작성 및 전송\n• 이메일 설정 - 이메일 구성 및 설정\n\n좌측의 도구를 선택하고 사용해보세요!';
  }
  
  // 콘텐츠 생성 관련
  if (lowerMessage.includes('콘텐츠') || lowerMessage.includes('글') || lowerMessage.includes('작성')) {
    return '콘텐츠 생성을 도와드리겠습니다! 좌측에서 "콘텐츠 생성기" 도구를 선택하시면 더 구체적인 도움을 받을 수 있습니다. 어떤 종류의 콘텐츠를 만들고 싶으신가요?';
  }
  
  // 이메일 관련
  if (lowerMessage.includes('이메일') || lowerMessage.includes('메일')) {
    return '이메일 관련 작업을 도와드리겠습니다! 이메일 계정 관리, 이메일 전송, 이메일 설정 등의 도구를 사용할 수 있습니다. 어떤 이메일 작업을 하시겠습니까?';
  }
  
  // 일정 관련
  if (lowerMessage.includes('일정') || lowerMessage.includes('스케줄') || lowerMessage.includes('약속')) {
    return '일정 관리를 도와드리겠습니다! 좌측에서 "일정 관리" 도구를 선택하시면 새로운 일정을 추가하거나 기존 일정을 관리할 수 있습니다.';
  }
  
  // 기본 응답
  return `"${message}"에 대해 도움을 드리겠습니다. 더 구체적인 도움을 받으려면 좌측의 도구 중 하나를 선택해주세요. 또는 어떤 작업을 하고 싶으신지 더 자세히 알려주시면 적절한 도구를 추천해드릴 수 있습니다.`;
};

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, tool, history } = body;
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      );
    }
    
    let response: string;
    
    if (tool) {
      // 특정 도구가 선택된 경우
      response = await handleToolRequest(tool, message);
    } else {
      // 일반적인 대화
      response = generateResponse(message, history);
    }
    
    return NextResponse.json({
      response,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 