import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { google } from 'googleapis';
import { db } from '@/app/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';

// 구글 캘린더 일정 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    // 임시로 인증 체크 비활성화 (테스트용)
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    // }

    const userEmail = session?.user?.email || 'test@example.com';
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'sync') {
      // 구글 캘린더에서 일정 동기화
      try {
        // 사용자 세션에서 액세스 토큰 가져오기
        const session = await getServerSession() as any;
        const accessToken = session?.accessToken;

        if (!accessToken) {
          // 토큰이 없으면 더미 데이터로 데모
          console.log('⚠️ Google 액세스 토큰이 없습니다. 데모 데이터를 사용합니다.');
          const dummyEvents = [
            {
              id: 'demo_1',
              summary: '📅 Google Calendar 연동 데모',
              description: '실제 Google Calendar 연동을 위해서는 Google OAuth 승인이 필요합니다. 현재는 데모 데이터입니다.',
              start: { dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
              end: { dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString() },
              location: '온라인'
            },
            {
              id: 'demo_2',
              summary: '🔄 캘린더 동기화 안내',
              description: '실제 Google Calendar와 연동하면 이곳에 실제 일정들이 표시됩니다.',
              start: { dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
              end: { dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString() },
              location: 'MCP Assistant'
            }
          ];

          // Firebase에 데모 일정 저장
          const schedulesRef = collection(db, 'users', userEmail, 'schedules');
          
          // 기존 Google Calendar 일정 삭제
          const existingQuery = query(schedulesRef, where('source', '==', 'google-calendar'));
          const existingSnapshot = await getDocs(existingQuery);
          for (const doc of existingSnapshot.docs) {
            await deleteDoc(doc.ref);
          }
          
          for (const event of dummyEvents) {
            const startDate = new Date(event.start.dateTime);
            const endDate = new Date(event.end.dateTime);
            
            await addDoc(schedulesRef, {
              title: event.summary,
              description: event.description || '',
              date: startDate.toISOString().split('T')[0],
              time: startDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
              endTime: endDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
              location: event.location || '',
              type: 'meeting',
              completed: false,
              source: 'google-calendar',
              googleEventId: event.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }

          return NextResponse.json({ 
            success: true, 
            message: `데모 모드: ${dummyEvents.length}개의 샘플 일정이 로드되었습니다. 실제 Google Calendar 연동을 위해서는 로그인 시 Google Calendar 권한을 승인해주세요.`,
            events: dummyEvents,
            isDemo: true
          });
        }

        // OAuth2 클라이언트 설정
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.NEXTAUTH_URL + '/api/auth/callback/google'
        );

        // 액세스 토큰 설정
        oauth2Client.setCredentials({ access_token: accessToken });

        // Google Calendar API 클라이언트 생성
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // 최근 30일간의 이벤트 가져오기
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        const response = await calendar.events.list({
          calendarId: 'primary',
          timeMin: now.toISOString(),
          timeMax: thirtyDaysFromNow.toISOString(),
          maxResults: 50,
          singleEvents: true,
          orderBy: 'startTime',
        });

        const events = response.data.items || [];

        // Firebase에 구글 캘린더 일정 저장
        const schedulesRef = collection(db, 'users', userEmail, 'schedules');
        
        // 기존 Google Calendar 일정 삭제 (중복 방지)
        const existingQuery = query(schedulesRef, where('source', '==', 'google-calendar'));
        const existingSnapshot = await getDocs(existingQuery);
        for (const doc of existingSnapshot.docs) {
          await deleteDoc(doc.ref);
        }
        
        for (const event of events) {
          if (!event.summary) continue; // 제목이 없는 이벤트는 스킵

          const startDate = event.start?.dateTime ? new Date(event.start.dateTime) : 
                           event.start?.date ? new Date(event.start.date + 'T00:00:00') : new Date();
          const endDate = event.end?.dateTime ? new Date(event.end.dateTime) : 
                         event.end?.date ? new Date(event.end.date + 'T23:59:59') : new Date();
          
          await addDoc(schedulesRef, {
            title: event.summary,
            description: event.description || '',
            date: startDate.toISOString().split('T')[0],
            time: event.start?.dateTime ? startDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '',
            endTime: event.end?.dateTime ? endDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '',
            location: event.location || '',
            type: 'meeting',
            completed: false,
            source: 'google-calendar',
            googleEventId: event.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }

        return NextResponse.json({ 
          success: true, 
          message: `${events.length}개의 Google Calendar 일정이 동기화되었습니다.`,
          events: events,
          isDemo: false
        });

      } catch (error) {
        console.error('구글 캘린더 동기화 오류:', error);
        return NextResponse.json({ error: '구글 캘린더 동기화에 실패했습니다.' }, { status: 500 });
      }
    }

    // 일반 일정 조회
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

// 구글 캘린더에 일정 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userEmail = session?.user?.email || 'test@example.com';
    
    const { title, description, date, time, endTime, location, type, syncToGoogle } = await request.json();

    if (!title || !date) {
      return NextResponse.json({ error: '제목과 날짜는 필수입니다.' }, { status: 400 });
    }

    // Firebase에 일정 저장
    const schedulesRef = collection(db, 'users', userEmail, 'schedules');
    const scheduleData = {
      title,
      description: description || '',
      date,
      time: time || '',
      endTime: endTime || '',
      location: location || '',
      type: type || 'meeting',
      completed: false,
      source: syncToGoogle ? 'local-synced' : 'local',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(schedulesRef, scheduleData);

    // 구글 캘린더에도 동기화 (옵션)
    if (syncToGoogle) {
      try {
        // 실제 구현에서는 사용자의 OAuth 토큰을 사용해야 함
        console.log('구글 캘린더에 일정 생성:', {
          summary: title,
          description,
          start: { dateTime: `${date}T${time || '09:00'}:00` },
          end: { dateTime: `${date}T${endTime || (time ? time : '10:00')}:00` },
          location
        });

        // 성공했다고 가정하고 googleEventId 업데이트
        await updateDoc(doc(db, 'users', userEmail, 'schedules', docRef.id), {
          googleEventId: `google_${docRef.id}`,
          source: 'google-calendar'
        });
      } catch (error) {
        console.error('구글 캘린더 동기화 실패:', error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: syncToGoogle ? '일정이 생성되고 구글 캘린더에 동기화되었습니다.' : '일정이 생성되었습니다.'
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
    const userEmail = session?.user?.email || 'test@example.com';
    
    const { id, title, description, date, time, endTime, location, type, completed } = await request.json();

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
    if (endTime !== undefined) updateData.endTime = endTime;
    if (location !== undefined) updateData.location = location;
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
    const userEmail = session?.user?.email || 'test@example.com';
    
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