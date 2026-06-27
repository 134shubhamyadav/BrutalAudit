import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  // For verifying ID tokens, providing just the projectId is sufficient.
  // If you need to write to Firestore or mint custom tokens from the backend later,
  // you will need to add a service account JSON here.
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const adminAuth = getAuth();

export { adminAuth };
