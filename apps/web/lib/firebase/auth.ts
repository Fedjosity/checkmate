import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUpWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const signInWithGoogle = () =>
  signInWithPopup(auth, googleProvider);

export const signOut = () => fbSignOut(auth);

export const resetPassword = (email: string) =>
  sendPasswordResetEmail(auth, email);

export const sendVerificationEmail = () => {
  if (auth.currentUser) {
    return sendEmailVerification(auth.currentUser);
  }
  return Promise.reject(new Error("No user signed in"));
};

export const getFirebaseToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
};

export const onAuthStateChange = (
  callback: (user: FirebaseUser | null) => void
) => onAuthStateChanged(auth, callback);
