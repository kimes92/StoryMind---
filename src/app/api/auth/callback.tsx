'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/app/lib/firebase';
import { checkOrCreateUser } from '@/app/lib/checkUserAndRedirect';

export default function AuthHandlerPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const { characterCreated } = await checkOrCreateUser(user);
        router.push(characterCreated ? '/main' : '/create');
      }
    });

    return () => unsubscribe();
  }, []);

  return <p className="text-white text-center mt-40">로그인 중입니다...</p>;
}
