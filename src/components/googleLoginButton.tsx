'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      // NextAuth의 signIn 함수 사용
      await signIn('google', { callbackUrl: '/main' });
    } catch (error) {
      alert('로그인 중 오류 발생!');
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="bg-white py-2 px-4 rounded shadow hover:bg-gray-100 transition text-sm font-bold opacity-70 hover:opacity-100 transition"
      disabled={loading}
    >
      {loading ? '로그인 중...' : 'Google로 시작하기'}
    </button>
  );
}
