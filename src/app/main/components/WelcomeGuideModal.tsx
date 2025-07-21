'use client';

import { useEffect, useState } from 'react';

export default function WelcomeGuideModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('welcome_shown');
    if (!seen) {
      setShow(true);
      localStorage.setItem('welcome_shown', 'true');
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm text-center space-y-4 animate-fade-in">
        <h2 className="text-2xl font-bold text-purple-600">Welcome to AI Fan Pick Maker!</h2>
        <ul className="text-left text-gray-700 space-y-2 text-sm">
          <li>1. <strong>My Ultimate Bias</strong>로 나의 연예인을 등록</li>
          <li>2. <strong>New Story</strong>로 여러분의 이야기를 시작해요.</li>
          <li>3. <strong>Community</strong>에서 공유해봐요.</li>
        </ul>
        <button
          onClick={() => setShow(false)}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
        >
          시작하기
        </button>
      </div>
    </div>
  );
}
