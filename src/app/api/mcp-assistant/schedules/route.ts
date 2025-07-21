import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/app/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

// 일정 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    // 임시로 인증 체크 비활성화 (테스트용)
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    // }

    const userEmail = session?.user?.email || 'test@example.com'; // 테스트용 기본값
    const schedulesRef = collection(db, 'users', userEmail, 'schedules');
    const q = query(schedulesRef, orderBy('date', 'asc'));
    const snapshot = await getDocs(q);
    
    const schedules = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('일정 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 새 일정 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const { title, description, date, time, type } = await request.json();

    if (!title || !date || !type) {
      return NextResponse.json({ error: '제목, 날짜, 타입은 필수입니다.' }, { status: 400 });
    }

    const schedulesRef = collection(db, 'users', userEmail, 'schedules');
    const docRef = await addDoc(schedulesRef, {
      title,
      description: description || '',
      date,
      time: time || '',
      type,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: '일정이 생성되었습니다.' 
    });
  } catch (error) {
    console.error('일정 생성 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 일정 수정
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const { id, title, description, date, time, type, completed } = await request.json();

    if (!id) {
      return NextResponse.json({ error: '일정 ID가 필요합니다.' }, { status: 400 });
    }

    const scheduleRef = doc(db, 'users', userEmail, 'schedules', id);
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    if (type !== undefined) updateData.type = type;
    if (completed !== undefined) updateData.completed = completed;

    await updateDoc(scheduleRef, updateData);

    return NextResponse.json({ 
      success: true, 
      message: '일정이 수정되었습니다.' 
    });
  } catch (error) {
    console.error('일정 수정 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 일정 삭제
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '일정 ID가 필요합니다.' }, { status: 400 });
    }

    const scheduleRef = doc(db, 'users', userEmail, 'schedules', id);
    await deleteDoc(scheduleRef);

    return NextResponse.json({ 
      success: true, 
      message: '일정이 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('일정 삭제 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 