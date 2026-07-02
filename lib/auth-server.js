import { adminAuth } from './firebase-admin';

export async function getAuth(request) {
  try {
    let token = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1];
    } else {
      const url = new URL(request.url);
      token = url.searchParams.get('token');
    }

    if (!token) return { userId: null };

    const decodedToken = await adminAuth.verifyIdToken(token);
    return { userId: decodedToken.uid, email: decodedToken.email };
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return { userId: null };
  }
}
