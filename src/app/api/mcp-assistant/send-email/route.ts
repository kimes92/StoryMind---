import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/app/lib/firebase';
import { doc, getDoc, collection, addDoc, getDocs } from 'firebase/firestore';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const userEmail = session.user.email;

    const { templateId, recipients, customSubject, customContent, accountId } = await request.json();

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: '받는 사람이 필요합니다.' }, { status: 400 });
    }

    // 사용자의 이메일 계정 조회
    let emailAccount;
    if (accountId) {
      // 특정 계정 사용
      const accountDocRef = doc(db, 'users', userEmail, 'emailAccounts', accountId);
      const accountDoc = await getDoc(accountDocRef);
      if (!accountDoc.exists()) {
        return NextResponse.json({ error: '지정된 이메일 계정을 찾을 수 없습니다.' }, { status: 400 });
      }
      emailAccount = accountDoc.data();
    } else {
      // 기본 계정 사용
      const accountsRef = collection(db, 'users', userEmail, 'emailAccounts');
      const snapshot = await getDocs(accountsRef);
      
      const defaultAccount = snapshot.docs.find(doc => doc.data().isDefault);
      if (defaultAccount) {
        emailAccount = defaultAccount.data();
      } else if (snapshot.docs.length > 0) {
        emailAccount = snapshot.docs[0].data(); // 첫 번째 계정 사용
      } else {
        return NextResponse.json({ error: '등록된 이메일 계정이 없습니다.' }, { status: 400 });
      }
    }

    // 이메일 템플릿 조회 (템플릿 ID가 있는 경우)
    let emailContent = {
      subject: customSubject || '알림',
      content: customContent || '내용이 없습니다.'
    };

    if (templateId) {
      const templateDocRef = doc(db, 'users', userEmail, 'emailTemplates', templateId);
      const templateDoc = await getDoc(templateDocRef);
      
      if (templateDoc.exists()) {
        const template = templateDoc.data();
        emailContent = {
          subject: template.subject,
          content: template.content
        };
      }
    }

    // Nodemailer 설정
    const transporter = nodemailer.createTransport({
      host: emailAccount.smtpHost,
      port: emailAccount.smtpPort,
      secure: emailAccount.smtpPort === 465,
      auth: {
        user: emailAccount.email,
        pass: emailAccount.password
      }
    });

    // 이메일 전송
    const sendPromises = recipients.map(async (recipient: string) => {
      try {
        await transporter.sendMail({
          from: emailAccount.email,
          to: recipient.trim(),
          subject: emailContent.subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h2 style="color: #333; margin-bottom: 20px;">${emailContent.subject}</h2>
                <div style="background-color: white; padding: 20px; border-radius: 4px; line-height: 1.6;">
                  ${emailContent.content.replace(/\n/g, '<br>')}
                </div>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
                  <p>이 메일은 MCP 개인 비서에서 발송되었습니다.</p>
                  <p>발송일: ${new Date().toLocaleString('ko-KR')}</p>
                </div>
              </div>
            </div>
          `
        });

        // 전송 로그 저장
        await addDoc(collection(db, 'users', userEmail, 'emailLogs'), {
          recipient,
          subject: emailContent.subject,
          content: emailContent.content,
          sentAt: new Date().toISOString(),
          status: 'sent'
        });

        return { recipient, status: 'success' };
      } catch (error) {
        console.error(`이메일 전송 실패 (${recipient}):`, error);
        
        // 실패 로그 저장
        await addDoc(collection(db, 'users', userEmail, 'emailLogs'), {
          recipient,
          subject: emailContent.subject,
          content: emailContent.content,
          sentAt: new Date().toISOString(),
          status: 'failed',
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });

        return { recipient, status: 'failed', error: error instanceof Error ? error.message : '알 수 없는 오류' };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'failed').length;

    return NextResponse.json({
      success: true,
      message: `이메일 전송 완료: 성공 ${successCount}건, 실패 ${failCount}건`,
      results
    });

  } catch (error) {
    console.error('이메일 전송 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 