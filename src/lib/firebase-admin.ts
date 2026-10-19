import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../firebase-applet-config.json' assert { type: 'json' };

// Note: Firebase Admin usually needs a service account key or ADC.
// In AI Studio environments, if we don't have a service account file, 
// we might need to rely on the underlying GCP identity if available.
// Since we are in an AI Studio applet, we might need to pass project ID explicitly.
if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const adminAuth = getAuth();
