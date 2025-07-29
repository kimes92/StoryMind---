import { NextRequest, NextResponse } from 'next/server';

// 임시 메모리 저장소
const mockEmailAccounts: { [userId: string]: any[] } = {};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || 'test@example.com';
    
    const accounts = mockEmailAccounts[userEmail] || [];
    
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('이메일 계정 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userEmail, accountName, email, smtpHost, smtpPort, username, password } = await request.json();
    
    if (!userEmail || !accountName || !email) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }
    
    if (!mockEmailAccounts[userEmail]) {
      mockEmailAccounts[userEmail] = [];
    }
    
    const newAccount = {
      id: Math.random().toString(36).substr(2, 9),
      accountName,
      email,
      smtpHost,
      smtpPort,
      username,
      password,
      createdAt: new Date().toISOString()
    };
    
    mockEmailAccounts[userEmail].push(newAccount);
    
    return NextResponse.json({ 
      success: true, 
      id: newAccount.id,
      message: '이메일 계정이 추가되었습니다.' 
    });
  } catch (error) {
    console.error('이메일 계정 추가 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || 'test@example.com';
    const accountId = searchParams.get('id');
    
    if (!accountId) {
      return NextResponse.json({ error: '계정 ID가 필요합니다.' }, { status: 400 });
    }
    
    if (mockEmailAccounts[userEmail]) {
      const accountIndex = mockEmailAccounts[userEmail].findIndex(acc => acc.id === accountId);
      if (accountIndex !== -1) {
        mockEmailAccounts[userEmail].splice(accountIndex, 1);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '이메일 계정이 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('이메일 계정 삭제 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 