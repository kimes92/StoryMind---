import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

interface ContentRequest {
  type: 'blog' | 'thread' | 'reels';
  topic: string;
  previousContent?: string;
  style?: string;
  targetAudience?: string;
  length?: 'short' | 'medium' | 'long';
  keywords?: string[];
}

interface ContentHistory {
  id: string;
  type: 'blog' | 'thread' | 'reels';
  topic: string;
  content: string;
  previousContent?: string;
  createdAt: string;
  userId: string;
}

// 임시 메모리 저장소 (실제 프로덕션에서는 데이터베이스 사용)
const mockHistory: ContentHistory[] = [];

// 컨텐츠 생성 히스토리 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userEmail = session?.user?.email || 'test@example.com';
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const topic = searchParams.get('topic');

    let filteredHistory = mockHistory.filter(item => item.userId === userEmail);

    if (type) {
      filteredHistory = filteredHistory.filter(item => item.type === type);
    }

    if (topic) {
      filteredHistory = filteredHistory.filter(item => item.topic === topic);
    }

    // 최신순으로 정렬
    filteredHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ history: filteredHistory });
  } catch (error) {
    console.error('컨텐츠 히스토리 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 새 컨텐츠 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userEmail = session?.user?.email || 'test@example.com';
    
    const {
      type,
      topic,
      previousContent,
      style,
      targetAudience,
      length,
      keywords
    }: ContentRequest = await request.json();

    if (!type || !topic) {
      return NextResponse.json({ error: '컨텐츠 타입과 주제가 필요합니다.' }, { status: 400 });
    }

    // 기존 컨텐츠 조회 (연속성 위해)
    let contextualContent = '';
    if (previousContent) {
      contextualContent = previousContent;
    } else {
      // 같은 주제의 최근 컨텐츠 조회
      const recentContent = mockHistory
        .filter(item => item.userId === userEmail && item.topic === topic)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      if (recentContent) {
        contextualContent = recentContent.content;
      }
    }

    // 컨텐츠 생성 로직
    const generatedContent = await generateContent({
      type,
      topic,
      previousContent: contextualContent,
      style,
      targetAudience,
      length,
      keywords
    });

    // 생성된 컨텐츠를 메모리에 저장
    const newContent: ContentHistory = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      topic,
      content: generatedContent,
      previousContent: contextualContent,
      createdAt: new Date().toISOString(),
      userId: userEmail
    };

    mockHistory.push(newContent);

    return NextResponse.json({
      success: true,
      id: newContent.id,
      content: generatedContent,
      message: '컨텐츠가 생성되었습니다.'
    });
  } catch (error) {
    console.error('컨텐츠 생성 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 컨텐츠 수정
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userEmail = session?.user?.email || 'test@example.com';
    
    const { id, content, feedback } = await request.json();

    if (!id || !content) {
      return NextResponse.json({ error: 'ID와 컨텐츠가 필요합니다.' }, { status: 400 });
    }

    const contentIndex = mockHistory.findIndex(item => item.id === id && item.userId === userEmail);
    
    if (contentIndex === -1) {
      return NextResponse.json({ error: '컨텐츠를 찾을 수 없습니다.' }, { status: 404 });
    }

    mockHistory[contentIndex].content = content;
    (mockHistory[contentIndex] as any).feedback = feedback;
    (mockHistory[contentIndex] as any).updatedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: '컨텐츠가 수정되었습니다.'
    });
  } catch (error) {
    console.error('컨텐츠 수정 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 컨텐츠 삭제
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userEmail = session?.user?.email || 'test@example.com';
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '컨텐츠 ID가 필요합니다.' }, { status: 400 });
    }

    const contentIndex = mockHistory.findIndex(item => item.id === id && item.userId === userEmail);
    
    if (contentIndex === -1) {
      return NextResponse.json({ error: '컨텐츠를 찾을 수 없습니다.' }, { status: 404 });
    }

    mockHistory.splice(contentIndex, 1);

    return NextResponse.json({
      success: true,
      message: '컨텐츠가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('컨텐츠 삭제 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 컨텐츠 생성 함수
async function generateContent(params: ContentRequest): Promise<string> {
  const { type, topic, previousContent, style, targetAudience, length, keywords } = params;

  const prompts = {
    blog: generateBlogPrompt(topic, previousContent, style, targetAudience, length, keywords),
    thread: generateThreadPrompt(topic, previousContent, style, targetAudience, length, keywords),
    reels: generateReelsPrompt(topic, previousContent, style, targetAudience, keywords)
  };

  const prompt = prompts[type];

  try {
    // OpenAI API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 전문 컨텐츠 작가입니다. 사용자의 요청에 따라 고품질의 컨텐츠를 생성해주세요. 항상 한국어로 답변하며, 요청된 형식과 스타일을 정확히 따라주세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: type === 'reels' ? 1000 : (length === 'long' ? 3000 : length === 'short' ? 800 : 1500),
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI API 호출 실패:', error);
    // OpenAI API 실패시 폴백으로 모의 컨텐츠 생성
    return generateMockContent(type, topic, prompt);
  }
}

function generateBlogPrompt(topic: string, previousContent?: string, style?: string, targetAudience?: string, length?: string, keywords?: string[]): string {
  return `
블로그 글을 작성해주세요.

주제: ${topic}
${previousContent ? `이전 글 내용: ${previousContent.substring(0, 200)}...` : ''}
스타일: ${style || '정보전달형'}
타겟 독자: ${targetAudience || '일반인'}
길이: ${length || 'medium'}
키워드: ${keywords?.join(', ') || ''}

${previousContent ? '이전 글의 내용을 이어받아서 연속성 있는 글을 작성해주세요.' : '새로운 관점에서 흥미롭게 작성해주세요.'}

블로그 글의 구조:
1. 눈길을 끄는 제목
2. 흥미로운 서론
3. 체계적인 본문 (소제목 포함)
4. 실용적인 결론
5. 독자 참여를 유도하는 마무리
`;
}

function generateThreadPrompt(topic: string, previousContent?: string, style?: string, targetAudience?: string, length?: string, keywords?: string[]): string {
  return `
소셜미디어 스레드를 작성해주세요.

주제: ${topic}
${previousContent ? `이전 스레드 내용: ${previousContent.substring(0, 200)}...` : ''}
스타일: ${style || '친근한 톤'}
타겟 독자: ${targetAudience || '일반인'}
길이: ${length === 'short' ? '5-7개 트윗' : length === 'long' ? '15-20개 트윗' : '10-12개 트윗'}
키워드: ${keywords?.join(', ') || ''}

${previousContent ? '이전 스레드의 내용을 이어받아서 연속성 있는 스레드를 작성해주세요.' : '새로운 관점에서 흥미롭게 작성해주세요.'}

스레드 작성 가이드:
1. 첫 트윗은 관심을 끌 수 있도록 작성
2. 각 트윗은 280자 이내
3. 스레드 번호 표시 (1/n, 2/n...)
4. 중간중간 독자의 관심을 유지하는 질문이나 팁
5. 마지막 트윗은 참여를 유도하는 내용
`;
}

function generateReelsPrompt(topic: string, previousContent?: string, style?: string, targetAudience?: string, keywords?: string[]): string {
  return `
소라AI용 릴스 영상 프롬프트를 작성해주세요. (반복 루프 영상용)

주제: ${topic}
${previousContent ? `이전 영상 컨셉: ${previousContent.substring(0, 200)}...` : ''}
스타일: ${style || '모던하고 감각적인'}
타겟 독자: ${targetAudience || '젊은 층'}
키워드: ${keywords?.join(', ') || ''}

${previousContent ? '이전 영상의 컨셉을 발전시켜서 시리즈 형태로 만들어주세요.' : '새로운 컨셉으로 중독성 있는 영상을 만들어주세요.'}

릴스 영상 프롬프트 구성:
1. 시각적 컨셉 (색상, 분위기, 스타일)
2. 모션 그래픽 요소 (움직임, 효과)
3. 루프 포인트 (완벽한 반복을 위한)
4. 텍스트 오버레이 (있다면)
5. 음향 효과 제안
6. 길이: 3-15초 루프

멍때리며 계속 보게 만드는 요소를 포함해주세요.
`;
}

function generateMockContent(type: string, topic: string, prompt: string): string {
  // 임시 모의 컨텐츠 (실제로는 OpenAI API 응답)
  const mockContents = {
    blog: `# ${topic}에 대한 새로운 관점

안녕하세요! 오늘은 ${topic}에 대해 깊이 있게 다뤄보겠습니다.

## 왜 이 주제가 중요한가?

${topic}는 현재 많은 사람들이 관심을 가지는 분야입니다. 특히...

## 핵심 포인트

1. **첫 번째 포인트**: 중요한 개념 설명
2. **두 번째 포인트**: 실제 적용 방법
3. **세 번째 포인트**: 미래 전망

## 결론

${topic}에 대해 알아보니 정말 흥미로운 분야라는 것을 알 수 있었습니다. 

여러분은 이 주제에 대해 어떻게 생각하시나요? 댓글로 의견을 남겨주세요!`,

    thread: `1/8 🧵 ${topic}에 대해 알아야 할 8가지 

오늘은 ${topic}의 핵심을 파헤쳐보겠습니다. 

준비되셨나요? 👇

2/8 첫 번째로 알아야 할 것은...

이 부분이 가장 기본이면서도 중요합니다. 

많은 사람들이 놓치는 부분이기도 해요.

3/8 두 번째는...

실제로 이것을 적용해보면 놀라운 결과를 얻을 수 있습니다.

4/8 세 번째...

[계속해서 8개의 트윗으로 구성]

8/8 마지막으로...

이 스레드가 도움이 되셨다면 리트윗과 좋아요 부탁드려요! 

다음엔 어떤 주제를 다뤘으면 좋을까요? 댓글로 알려주세요 💬`,

    reels: `🎬 소라AI 릴스 영상 프롬프트: "${topic}"

**시각적 컨셉:**
- 배경: 부드러운 그라데이션 (보라-핑크-오렌지)
- 스타일: 미니멀하고 모던한 디자인
- 조명: 따뜻하고 부드러운 앰비언트 라이팅

**모션 그래픽:**
- 주요 오브젝트: ${topic} 관련 아이콘들이 부드럽게 회전
- 파티클 효과: 반짝이는 작은 점들이 화면을 가로지름
- 텍스트 애니메이션: 타이핑 효과로 키워드 등장

**루프 포인트:**
- 시작: 오브젝트들이 중앙으로 모이기 시작
- 중간: 완전히 형성된 후 천천히 회전
- 끝: 다시 분산되면서 시작점으로 복귀

**텍스트 오버레이:**
"${topic}의 비밀" (3초 후 등장)

**음향 효과:**
- 앰비언트 신스 패드
- 부드러운 클릭 사운드 (오브젝트 변화시)

**길이:** 8초 완벽 루프

이 프롬프트는 계속 바라보게 만드는 최면적 효과를 노린 디자인입니다.`
  };

  return mockContents[type as keyof typeof mockContents] || `${type} 컨텐츠에 대한 ${topic} 내용이 생성되었습니다.`;
} 