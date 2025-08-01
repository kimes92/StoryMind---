'use client';

import Image from 'next/image';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // 이미 로그인되어 있으면 리디렉션
  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        const callbackUrl = searchParams.get('callbackUrl') || '/';
        router.push(callbackUrl);
      }
    };
    checkSession();
  }, [router, searchParams]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const callbackUrl = searchParams.get('callbackUrl') || '/';
      
      const result = await signIn('google', { 
        callbackUrl,
        redirect: false 
      });
      
      if (result?.ok) {
        router.push(callbackUrl);
      } else {
        alert('로그인 중 오류가 발생했습니다.');
      }
    } catch (error) {
      alert('로그인 중 오류 발생!');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-8 p-8 bg-white rounded-xl shadow-md">
        <Image
          src="/logo.svg"
          alt="로고"
          width={120}
          height={40}
          unoptimized
          className="mb-2 drop-shadow"
        />
        <h1 className="text-3xl font-bold text-purple-700 mb-2">StoryMind</h1>
        <p className="text-gray-500 mb-4">구글 계정으로 로그인하여 서비스를 이용하세요.</p>
        
        <button
          onClick={handleLogin}
          className="bg-white py-3 px-6 rounded-lg shadow hover:bg-gray-100 transition text-sm font-bold border border-gray-300 flex items-center space-x-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span>로그인 중...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Google로 시작하기</span>
            </>
          )}
        </button>
      </div>
    </main>
  );
} 