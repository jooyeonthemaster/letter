// Firebase Admin SDK for server-side operations
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
const firebaseAdminConfig = {
  projectId: "floor-b25f5",
  // Note: In production, use environment variables for credentials
  // For now, we'll use the default credentials
};

// Initialize Firebase Admin (only if not already initialized)
const adminApp = getApps().length === 0 
  ? initializeApp(firebaseAdminConfig, 'admin')
  : getApps()[0];

// Get Firestore instance
export const adminDb = getFirestore(adminApp);

export default adminApp;

