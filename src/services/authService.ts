import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
  deleteUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

export const signUp = async (email: string, password: string, displayName: string): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const userData: User = {
    uid: user.uid,
    email: user.email!,
    displayName,
    createdAt: new Date(),
    status: 'active',
    blockList: [],
    lastLoginAt: new Date(),
  };

  await setDoc(doc(db, 'users', user.uid), {
    ...userData,
    createdAt: new Date().toISOString(),
    lastLoginAt: Timestamp.now(),
  });

  return userData;
};

export const signIn = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const userData = userDoc.data() as User;

  await setDoc(
    doc(db, 'users', user.uid),
    { lastLoginAt: Timestamp.now() },
    { merge: true }
  );

  return {
    ...userData,
    createdAt: new Date(userData.createdAt),
  };
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};
