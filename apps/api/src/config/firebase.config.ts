import * as admin from 'firebase-admin';
import { env } from './env.config';

let firebaseApp: admin.app.App;

export const initFirebase = () => {
  if (!admin.apps.length) {
    let credential;
    
    if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
        credential = admin.credential.cert(serviceAccount);
      } catch (error) {
        console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON, falling back to default application credentials.');
        credential = admin.credential.applicationDefault();
      }
    } else {
      credential = admin.credential.applicationDefault();
    }

    firebaseApp = admin.initializeApp({
      credential,
    });
  } else {
    firebaseApp = admin.app();
  }
  return firebaseApp;
};

// Initialize early
initFirebase();

export const auth = admin.auth();
export const db = admin.firestore();
