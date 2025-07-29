import { NextRequest, NextResponse } from 'next/server';

// 임시 메모리 저장소
const mockCalendarEvents: { [userId: string]: any[] } = {};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || 'test@example.com';
    
    const events = mockCalendarEvents[userEmail] || [];
    
    return NextResponse.json({ events });
  } catch (error) {
    console.error('캘린더 이벤트 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userEmail, title, startDate, endDate, description } = await request.json();
    
    if (!userEmail || !title || !startDate) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }
    
    if (!mockCalendarEvents[userEmail]) {
      mockCalendarEvents[userEmail] = [];
    }
    
    const newEvent = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      startDate,
      endDate: endDate || startDate,
      description: description || '',
      createdAt: new Date().toISOString()
    };
    
    mockCalendarEvents[userEmail].push(newEvent);
    
    return NextResponse.json({ 
      success: true, 
      id: newEvent.id,
      message: '캘린더 이벤트가 생성되었습니다.' 
    });
  } catch (error) {
    console.error('캘린더 이벤트 생성 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || 'test@example.com';
    const eventId = searchParams.get('id');
    
    if (!eventId) {
      return NextResponse.json({ error: '이벤트 ID가 필요합니다.' }, { status: 400 });
    }
    
    if (mockCalendarEvents[userEmail]) {
      const eventIndex = mockCalendarEvents[userEmail].findIndex(event => event.id === eventId);
      if (eventIndex !== -1) {
        mockCalendarEvents[userEmail].splice(eventIndex, 1);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '캘린더 이벤트가 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('캘린더 이벤트 삭제 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 