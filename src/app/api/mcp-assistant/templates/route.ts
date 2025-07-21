import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/app/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// 템플릿 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    // 임시로 인증 체크 비활성화 (테스트용)
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    // }

    const userEmail = session?.user?.email || 'test@example.com'; // 테스트용 기본값
    const templatesRef = collection(db, 'users', userEmail, 'emailTemplates');
    const snapshot = await getDocs(templatesRef);
    
    const templates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('템플릿 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 새 템플릿 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    // 임시로 인증 체크 비활성화 (테스트용)
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    // }

    const userEmail = session?.user?.email || 'test@example.com'; // 테스트용 기본값
    const { name, subject, content, type } = await request.json();

    if (!name || !subject || !content || !type) {
      return NextResponse.json({ error: '모든 필드가 필요합니다.' }, { status: 400 });
    }

    const templatesRef = collection(db, 'users', userEmail, 'emailTemplates');
    const docRef = await addDoc(templatesRef, {
      name,
      subject,
      content,
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: '템플릿이 생성되었습니다.' 
    });
  } catch (error) {
    console.error('템플릿 생성 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 템플릿 수정
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    // 임시로 인증 체크 비활성화 (테스트용)
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    // }

    const userEmail = session?.user?.email || 'test@example.com'; // 테스트용 기본값
    const { id, name, subject, content, type } = await request.json();

    if (!id || !name || !subject || !content || !type) {
      return NextResponse.json({ error: '모든 필드가 필요합니다.' }, { status: 400 });
    }

    const templateRef = doc(db, 'users', userEmail, 'emailTemplates', id);
    await updateDoc(templateRef, {
      name,
      subject,
      content,
      type,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      message: '템플릿이 수정되었습니다.' 
    });
  } catch (error) {
    console.error('템플릿 수정 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 템플릿 삭제
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
      return NextResponse.json({ error: '템플릿 ID가 필요합니다.' }, { status: 400 });
    }

    const templateRef = doc(db, 'users', userEmail, 'emailTemplates', id);
    await deleteDoc(templateRef);

    return NextResponse.json({ 
      success: true, 
      message: '템플릿이 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('템플릿 삭제 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 