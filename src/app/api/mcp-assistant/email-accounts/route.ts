import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/app/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';

// 이메일 계정 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    // 임시로 인증 체크 비활성화 (테스트용)
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    // }

    const userEmail = session?.user?.email || 'test@example.com'; // 테스트용 기본값
    const accountsRef = collection(db, 'users', userEmail, 'emailAccounts');
    const snapshot = await getDocs(accountsRef);
    
    const accounts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('이메일 계정 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 새 이메일 계정 추가
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    // 임시로 인증 체크 비활성화 (테스트용)
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    // }

    const userEmail = session?.user?.email || 'test@example.com'; // 테스트용 기본값
    const { name, email, password, provider, smtpHost, smtpPort, isDefault } = await request.json();

    if (!name || !email || !password || !provider) {
      return NextResponse.json({ error: '모든 필드가 필요합니다.' }, { status: 400 });
    }

    // 이메일 계정 유효성 검사
    if (provider === 'gmail' && !email.endsWith('@gmail.com')) {
      return NextResponse.json({ error: 'Gmail 계정은 @gmail.com 이메일이어야 합니다.' }, { status: 400 });
    }
    
    if (provider === 'naver' && !email.endsWith('@naver.com')) {
      return NextResponse.json({ error: '네이버 계정은 @naver.com 이메일이어야 합니다.' }, { status: 400 });
    }

    // 기본 계정으로 설정하는 경우, 다른 계정들의 기본 설정 해제
    if (isDefault) {
      const accountsRef = collection(db, 'users', userEmail, 'emailAccounts');
      const snapshot = await getDocs(accountsRef);
      
      for (const docSnap of snapshot.docs) {
        if (docSnap.data().isDefault) {
          await updateDoc(doc(db, 'users', userEmail, 'emailAccounts', docSnap.id), {
            isDefault: false
          });
        }
      }
    }

    const accountsRef = collection(db, 'users', userEmail, 'emailAccounts');
    const docRef = await addDoc(accountsRef, {
      name,
      email,
      password, // 실제 운영에서는 암호화해야 함
      provider,
      smtpHost,
      smtpPort,
      isDefault: isDefault || false,
      isConfigured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: '이메일 계정이 추가되었습니다.' 
    });
  } catch (error) {
    console.error('이메일 계정 추가 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 이메일 계정 수정
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    // 임시로 인증 체크 비활성화 (테스트용)
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    // }

    const userEmail = session?.user?.email || 'test@example.com'; // 테스트용 기본값
    const { id, name, email, password, provider, smtpHost, smtpPort, isDefault } = await request.json();

    if (!id || !name || !email || !password || !provider) {
      return NextResponse.json({ error: '모든 필드가 필요합니다.' }, { status: 400 });
    }

    // 기본 계정으로 설정하는 경우, 다른 계정들의 기본 설정 해제
    if (isDefault) {
      const accountsRef = collection(db, 'users', userEmail, 'emailAccounts');
      const snapshot = await getDocs(accountsRef);
      
      for (const docSnap of snapshot.docs) {
        if (docSnap.data().isDefault && docSnap.id !== id) {
          await updateDoc(doc(db, 'users', userEmail, 'emailAccounts', docSnap.id), {
            isDefault: false
          });
        }
      }
    }

    const accountRef = doc(db, 'users', userEmail, 'emailAccounts', id);
    await updateDoc(accountRef, {
      name,
      email,
      password,
      provider,
      smtpHost,
      smtpPort,
      isDefault: isDefault || false,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      message: '이메일 계정이 수정되었습니다.' 
    });
  } catch (error) {
    console.error('이메일 계정 수정 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 이메일 계정 삭제
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    // 임시로 인증 체크 비활성화 (테스트용)
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    // }

    const userEmail = session?.user?.email || 'test@example.com'; // 테스트용 기본값
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '계정 ID가 필요합니다.' }, { status: 400 });
    }

    const accountRef = doc(db, 'users', userEmail, 'emailAccounts', id);
    await deleteDoc(accountRef);

    return NextResponse.json({ 
      success: true, 
      message: '이메일 계정이 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('이메일 계정 삭제 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 