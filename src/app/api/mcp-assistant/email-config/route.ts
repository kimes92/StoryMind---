import { NextRequest, NextResponse } from 'next/server';

// 임시 메모리 저장소
const mockEmailConfigs: { [userId: string]: any } = {};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || 'test@example.com';
    
    const config = mockEmailConfigs[userEmail] || {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromName: '',
      fromEmail: ''
    };
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('이메일 설정 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userEmail, ...config } = await request.json();
    
    if (!userEmail) {
      return NextResponse.json({ error: '사용자 이메일이 필요합니다.' }, { status: 400 });
    }
    
    mockEmailConfigs[userEmail] = config;
    
    return NextResponse.json({ 
      success: true, 
      message: '이메일 설정이 저장되었습니다.' 
    });
  } catch (error) {
    console.error('이메일 설정 저장 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 