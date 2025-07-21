// lib/firebaseUtils.ts
import { db } from './firebase';
import { getDocs, collection, query, where } from 'firebase/firestore';

export const fetchCharacterByUID = async (uid: string) => {
  const q = query(collection(db, 'characters'), where('uid', '==', uid));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data();
  }
  return null;
};
