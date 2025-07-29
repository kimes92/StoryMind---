import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body, fromAccount } = await request.json();
    
    if (!to || !subject || !body) {
      return NextResponse.json({ error: '받는 사람, 제목, 내용은 필수입니다.' }, { status: 400 });
    }
    
    // 시뮬레이션: 실제로는 이메일 전송 로직이 들어갑니다
    console.log('이메일 전송 시뮬레이션:', { to, subject, body, fromAccount });
    
    return NextResponse.json({ 
      success: true, 
      message: '이메일이 성공적으로 전송되었습니다.' 
    });
  } catch (error) {
    console.error('이메일 전송 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 