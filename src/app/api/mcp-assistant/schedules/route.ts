import { NextRequest, NextResponse } from 'next/server';

// 임시 메모리 저장소
const mockSchedules: { [userId: string]: any[] } = {};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || 'test@example.com';
    
    const schedules = mockSchedules[userEmail] || [];
    
    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('일정 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userEmail, title, date, time, description } = await request.json();
    
    if (!userEmail || !title || !date) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }
    
    if (!mockSchedules[userEmail]) {
      mockSchedules[userEmail] = [];
    }
    
    const newSchedule = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      date,
      time,
      description,
      createdAt: new Date().toISOString()
    };
    
    mockSchedules[userEmail].push(newSchedule);
    
    return NextResponse.json({ 
      success: true, 
      id: newSchedule.id,
      message: '일정이 추가되었습니다.' 
    });
  } catch (error) {
    console.error('일정 추가 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || 'test@example.com';
    const scheduleId = searchParams.get('id');
    
    if (!scheduleId) {
      return NextResponse.json({ error: '일정 ID가 필요합니다.' }, { status: 400 });
    }
    
    if (mockSchedules[userEmail]) {
      const scheduleIndex = mockSchedules[userEmail].findIndex(schedule => schedule.id === scheduleId);
      if (scheduleIndex !== -1) {
        mockSchedules[userEmail].splice(scheduleIndex, 1);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '일정이 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('일정 삭제 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 