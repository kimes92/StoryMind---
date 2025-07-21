'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/app/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function RegisterNicknamePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/');
        return;
      }

      const userDoc = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDoc);
      if (userSnap.exists()) {
        const existing = userSnap.data().nickname;
        if (existing) setNickname(existing); // ✅ 기존 닉네임 있으면 입력칸에 표시
      }
      setLoading(false);
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return;

    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        email: user.email,
        nickname,
        createdAt: serverTimestamp(),
      },
      { merge: true } // ✅ 기존 필드 유지
    );

    alert('닉네임이 저장되었습니다!');
    router.push('/main');
  };

  if (loading) return <p className="text-center py-10">불러오는 중...</p>;

  return (
    <main className="min-h-screen flex items-center justify-center bg-pink-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-6 rounded-lg shadow space-y-4"
      >
        <h1 className="text-2xl font-bold text-center text-pink-500">
          닉네임 {nickname ? '변경' : '설정'}
        </h1>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="예: 팬픽왕123"
          className="w-full px-4 py-2 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-pink-500 text-white py-2 rounded font-bold hover:bg-pink-600 transition"
        >
          저장하기
        </button>
      </form>
    </main>
  );
}
