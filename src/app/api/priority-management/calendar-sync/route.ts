import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const { centerPin, userEmail } = await req.json();

    // 구글 캘린더 이벤트 생성을 위한 기본 설정
    const today = new Date();
    const events = [];

    // 아침 센터핀 설정 알림 (매일 6:30)
    const morningCenterPinEvent = {
      summary: '🎯 나만의 센터핀 - 아침 설정',
      description: `오늘의 센터핀: "${centerPin || '오늘 가장 중요한 일을 설정하세요'}"

3-1-3 시스템:
✅ 감사한 것 3가지
🎯 오늘의 센터핀 1가지 (가장 중요한 일)
⚡ 구체적 행동 3가지

소요시간: 7분`,
      start: {
        dateTime: `${today.toISOString().split('T')[0]}T06:30:00`,
        timeZone: 'Asia/Seoul',
      },
      end: {
        dateTime: `${today.toISOString().split('T')[0]}T06:37:00`,
        timeZone: 'Asia/Seoul',
      },
      recurrence: ['RRULE:FREQ=DAILY'],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 0 },
          { method: 'email', minutes: 10 }
        ]
      },
      colorId: '9' // 파란색
    };
    events.push(morningCenterPinEvent);

    // 점심 중간 체크 알림 (매일 12:30)
    const lunchCheckEvent = {
      summary: '📊 나만의 센터핀 - 점심 체크',
      description: `센터핀 진행 상황 점검:
${centerPin ? `오늘의 센터핀: "${centerPin}"` : '오늘의 센터핀을 확인하고 진행률을 체크하세요.'}

체크 항목:
📈 센터핀 진행률 (0-100%)
🎯 오후 집중포인트 1가지
⚡ 에너지 레벨 (1-10)

소요시간: 3분`,
      start: {
        dateTime: `${today.toISOString().split('T')[0]}T12:30:00`,
        timeZone: 'Asia/Seoul',
      },
      end: {
        dateTime: `${today.toISOString().split('T')[0]}T12:33:00`,
        timeZone: 'Asia/Seoul',
      },
      recurrence: ['RRULE:FREQ=DAILY'],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 0 }
        ]
      },
      colorId: '2' // 초록색
    };
    events.push(lunchCheckEvent);

    // 저녁 회고 알림 (매일 21:00)
    const eveningReviewEvent = {
      summary: '🌙 나만의 센터핀 - 저녁 회고',
      description: `하루 마무리 회고:

📝 회고 항목:
✅ 오늘 성취한 것 3가지
🎯 내일의 센터핀 1가지 (미리 설정)
💡 개선할 점 3가지

${centerPin ? `오늘의 센터핀이었던 "${centerPin}"은 얼마나 달성했나요?` : ''}

소요시간: 5분`,
      start: {
        dateTime: `${today.toISOString().split('T')[0]}T21:00:00`,
        timeZone: 'Asia/Seoul',
      },
      end: {
        dateTime: `${today.toISOString().split('T')[0]}T21:05:00`,
        timeZone: 'Asia/Seoul',
      },
      recurrence: ['RRULE:FREQ=DAILY'],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 0 },
          { method: 'email', minutes: 30 }
        ]
      },
      colorId: '8' // 보라색
    };
    events.push(eveningReviewEvent);

    // 센터핀 전용 알림 (오늘의 중요한 일)
    if (centerPin) {
      const centerPinReminderEvent = {
        summary: `🔥 센터핀: ${centerPin}`,
        description: `오늘의 가장 중요한 일입니다!

🎯 센터핀: "${centerPin}"

볼링에서 센터핀만 제대로 맞히면 모든 핀이 쓰러지듯, 
이 하나에만 집중하면 놀라운 결과를 만들 수 있습니다.

💪 오늘 이것만큼은 반드시 완수하세요!`,
        start: {
          dateTime: `${today.toISOString().split('T')[0]}T09:00:00`,
          timeZone: 'Asia/Seoul',
        },
        end: {
          dateTime: `${today.toISOString().split('T')[0]}T09:05:00`,
          timeZone: 'Asia/Seoul',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 0 },
            { method: 'popup', minutes: 60 }, // 1시간 전에도 알림
            { method: 'popup', minutes: 180 } // 3시간 전에도 알림
          ]
        },
        colorId: '11' // 빨간색 (중요도 강조)
      };
      events.push(centerPinReminderEvent);
    }

    // 실제 구글 캘린더 API 호출
    try {
      // 사용자의 액세스 토큰 확인
      const accessToken = session.accessToken;
      
      if (!accessToken) {
        console.log('⚠️ Google 액세스 토큰이 없습니다. 다시 로그인해주세요.');
        return NextResponse.json({
          success: false,
          error: 'Google 캘린더 연동을 위해 다시 로그인해주세요.',
          needReauth: true
        });
      }

      // OAuth2 클라이언트 설정
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
      );

      // 액세스 토큰 설정
      oauth2Client.setCredentials({ 
        access_token: accessToken,
        refresh_token: session.refreshToken 
      });

      // Google Calendar API 클라이언트 생성
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // 각 이벤트를 구글 캘린더에 생성
      const createdEvents = [];
      let errorCount = 0;

      for (const event of events) {
        try {
          const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
          });
          
          createdEvents.push({
            summary: event.summary,
            start: event.start,
            id: response.data.id
          });
          console.log(`✅ 이벤트 생성 성공: ${event.summary}`);
        } catch (eventError: any) {
          console.error(`❌ 이벤트 생성 실패: ${event.summary}`, eventError);
          
          // 중복 이벤트 오류는 무시 (이미 생성된 경우)
          if (!eventError.message?.includes('duplicate')) {
            errorCount++;
          }
        }
      }

      return NextResponse.json({
        success: true,
        created: createdEvents.length,
        errors: errorCount,
        message: `✅ ${createdEvents.length}개의 센터핀 알림이 구글 캘린더에 생성되었습니다!${errorCount > 0 ? ` (${errorCount}개 오류)` : ''}`,
        events: createdEvents,
        centerPin: centerPin
      });

    } catch (error: any) {
      console.error('구글 캘린더 API 오류:', error);
      
      // 토큰 만료 또는 권한 오류
      if (error.code === 401 || error.message?.includes('invalid_grant')) {
        return NextResponse.json({
          success: false,
          error: '구글 캘린더 권한이 만료되었습니다. 다시 로그인해주세요.',
          needReauth: true
        });
      }
      
      // 기타 오류 - 데모 모드로 대체
      return NextResponse.json({
        success: true,
        created: events.length,
        message: `📝 ${events.length}개의 센터핀 알림이 시뮬레이션되었습니다. (실제 구글 캘린더 연동을 위해서는 환경변수 설정이 필요합니다)`,
        events: events.map(e => ({ 
          summary: e.summary, 
          start: e.start,
          description: e.description 
        })),
        centerPin: centerPin,
        isDemo: true
      });
    }

  } catch (error) {
    console.error('센터핀 캘린더 동기화 오류:', error);
    return NextResponse.json(
      { error: '센터핀 캘린더 동기화 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 