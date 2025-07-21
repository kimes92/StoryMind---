import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface UserCheckResult {
  characterCreated: boolean;
  userData?: any;
}

export async function checkOrCreateUser(user: User): Promise<UserCheckResult> {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        characterCreated: !!userData.characterCreated,
        userData
      };
    } else {
      // 새 사용자 생성
      const newUserData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        characterCreated: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      
      await setDoc(userRef, newUserData);
      
      return {
        characterCreated: false,
        userData: newUserData
      };
    }
  } catch (error) {
    console.error('Error checking/creating user:', error);
    return {
      characterCreated: false
    };
  }
} 