'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Send, FileText, Calendar, Mail, Layout, User, Settings, ArrowLeft, Construction } from 'lucide-react';

export default function MCPAssistant() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 인증 체크
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center mb-4">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold mb-2">MCP Assistant</h1>
                <p className="text-blue-100">Model Context Protocol을 활용한 AI 어시스턴트</p>
              </div>
            </div>
          </div>

          {/* 준비 중 메시지 */}
          <div className="p-12 text-center">
            <div className="mb-8">
              <Construction className="w-24 h-24 text-yellow-500 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-800 mb-4">준비 중입니다</h2>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                MCP Assistant 기능은 현재 개발 중입니다. 
                더 나은 사용자 경험을 위해 로컬 저장소 기반으로 재구성하고 있습니다.
              </p>
            </div>

            {/* 예정 기능들 */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">곧 출시될 기능들</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 text-left">
                  <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-700">콘텐츠 생성기</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <Calendar className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">일정 관리</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <Layout className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span className="text-gray-700">템플릿 관리</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <Mail className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-gray-700">이메일 도구</span>
                </div>
              </div>
            </div>

            {/* 현재 이용 가능한 기능들 안내 */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-blue-800 mb-4">지금 이용 가능한 기능들</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => router.push('/story-brand-guide')}
                  className="flex items-center space-x-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow text-left"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    📖
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">스토리브랜드 가이드</div>
                    <div className="text-sm text-gray-600">7단계 스토리 작성 도구</div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/mindmap')}
                  className="flex items-center space-x-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow text-left"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    🧠
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">마인드맵 도구</div>
                    <div className="text-sm text-gray-600">워크플로우 시각화</div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/main')}
                  className="flex items-center space-x-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow text-left"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    💬
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">AI 채팅</div>
                    <div className="text-sm text-gray-600">질문과 답변</div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/story-brand-guide/history')}
                  className="flex items-center space-x-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow text-left"
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    📚
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">스토리 히스토리</div>
                    <div className="text-sm text-gray-600">저장된 스토리 관리</div>
                  </div>
                </button>
              </div>
            </div>

            {/* 홈으로 돌아가기 버튼 */}
            <div className="mt-8">
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                홈으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 