import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, push, onValue, remove, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDfz8fpSBZHQaLixdqI5qZ54xVbKdZsJVc",
  authDomain: "shoccholota-association.firebaseapp.com",
  databaseURL: "https://shoccholota-association-default-rtdb.firebaseio.com",
  projectId: "shoccholota-association",
  storageBucket: "shoccholota-association.firebasestorage.app",
  messagingSenderId: "693421586837",
  appId: "1:693421586837:web:2e2756fb591ece863a1e9c",
  measurementId: "G-3CJ9RTXWV1"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getDatabase(app);

export interface UserUploadRecord {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  originalImage: string;
  framedImage?: string;
  timestamp: number;
  formattedTime: string;
}

export interface AppSettings {
  brandIcon: string | null;
  frameBg: string | null;
  adminPin: string;
}

// Save a new user upload record
export async function saveUserUploadRecord(data: Omit<UserUploadRecord, 'id'>) {
  try {
    const uploadsRef = ref(db, 'uploads');
    const newRef = push(uploadsRef);
    await set(newRef, {
      ...data,
      id: newRef.key,
    });
    return newRef.key;
  } catch (error) {
    console.error('Error saving upload to Firebase Realtime Database:', error);
    return null;
  }
}

// Listen for live user uploads
export function listenToUserUploads(callback: (uploads: UserUploadRecord[]) => void) {
  const uploadsRef = ref(db, 'uploads');
  return onValue(
    uploadsRef,
    (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }
      const list: UserUploadRecord[] = Object.keys(data).map((key) => ({
        ...data[key],
        id: key,
      }));
      // Sort newest first
      list.sort((a, b) => b.timestamp - a.timestamp);
      callback(list);
    },
    (err) => {
      console.error('Error listening to user uploads:', err);
    }
  );
}

// Delete user upload record
export async function deleteUserUploadRecord(id: string) {
  try {
    const recordRef = ref(db, `uploads/${id}`);
    await remove(recordRef);
  } catch (error) {
    console.error('Error deleting upload record:', error);
  }
}

// Save App Branding & Settings
export async function saveAppSettingsToFirebase(settings: Partial<AppSettings>) {
  try {
    const settingsRef = ref(db, 'settings');
    const snapshot = await get(settingsRef);
    const existing = snapshot.exists() ? snapshot.val() : {};
    await set(settingsRef, {
      ...existing,
      ...settings,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error saving app settings to Firebase:', error);
  }
}

// Listen for App Branding & Settings
export function listenToAppSettings(callback: (settings: AppSettings | null) => void) {
  const settingsRef = ref(db, 'settings');
  return onValue(
    settingsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as AppSettings);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.error('Error listening to app settings:', err);
    }
  );
}
