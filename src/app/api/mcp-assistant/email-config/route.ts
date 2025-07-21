import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/app/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { email, password, smtpHost, smtpPort } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호는 필수입니다.' }, { status: 400 });
    }

    // 사용자의 이메일 설정을 Firestore에 저장
    const userDocRef = doc(db, 'users', session.user.email);
    await setDoc(userDocRef, {
      emailConfig: {
        email,
        password, // 실제 운영에서는 암호화해야 함
        smtpHost,
        smtpPort,
        configuredAt: new Date().toISOString()
      }
    }, { merge: true });

    return NextResponse.json({ success: true, message: '이메일 설정이 저장되었습니다.' });
  } catch (error) {
    console.error('이메일 설정 저장 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const userDocRef = doc(db, 'users', session.user.email);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().emailConfig) {
      const config = userDoc.data().emailConfig;
      return NextResponse.json({
        email: config.email,
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        isConfigured: true
      });
    }

    return NextResponse.json({ isConfigured: false });
  } catch (error) {
    console.error('이메일 설정 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 