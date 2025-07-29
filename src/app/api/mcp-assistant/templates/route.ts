import { NextRequest, NextResponse } from 'next/server';

// 임시 메모리 저장소
const mockTemplates: { [userId: string]: any[] } = {};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || 'test@example.com';
    
    const templates = mockTemplates[userEmail] || [];
    
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('템플릿 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userEmail, title, subject, content, category } = await request.json();
    
    if (!userEmail || !title || !subject || !content) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }
    
    if (!mockTemplates[userEmail]) {
      mockTemplates[userEmail] = [];
    }
    
    const newTemplate = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      subject,
      content,
      category: category || 'general',
      createdAt: new Date().toISOString()
    };
    
    mockTemplates[userEmail].push(newTemplate);
    
    return NextResponse.json({ 
      success: true, 
      id: newTemplate.id,
      message: '템플릿이 저장되었습니다.' 
    });
  } catch (error) {
    console.error('템플릿 저장 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || 'test@example.com';
    const templateId = searchParams.get('id');
    
    if (!templateId) {
      return NextResponse.json({ error: '템플릿 ID가 필요합니다.' }, { status: 400 });
    }
    
    if (mockTemplates[userEmail]) {
      const templateIndex = mockTemplates[userEmail].findIndex(template => template.id === templateId);
      if (templateIndex !== -1) {
        mockTemplates[userEmail].splice(templateIndex, 1);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '템플릿이 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('템플릿 삭제 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 