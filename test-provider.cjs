import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp } from 'firebase-admin/app';
require('dotenv').config({ path: '.env.local' });

if (!getApps().length) {
  initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
}

async function test() {
  const usersResult = await getAuth().listUsers(1);
  const user = usersResult.users[0];
  console.log("providerData:", user.providerData);
}
test();
