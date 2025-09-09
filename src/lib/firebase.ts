// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, orderBy, limit, query } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBRRd197EOJWDOAEzFpbzGwPPDuyxKapJo",
  authDomain: "floor-b25f5.firebaseapp.com",
  projectId: "floor-b25f5",
  storageBucket: "floor-b25f5.firebasestorage.app",
  messagingSenderId: "1045162394185",
  appId: "1:1045162394185:web:b1c8eb0af454afa9c2b598",
  measurementId: "G-HPSDXW34S3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics (only in browser)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Firestore 컬렉션 참조
export const messagesCollection = collection(db, 'messages');
export const drawingsCollection = collection(db, 'drawings');

// Firestore 유틸리티 함수들
export const saveMessage = async (text: string) => {
  try {
    const docRef = await addDoc(messagesCollection, {
      text,
      timestamp: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('메시지 저장 실패:', error);
    throw error;
  }
};

export const saveDrawing = async (imageData: string, position?: { x: number; y: number; scale: number }) => {
  try {
    const docRef = await addDoc(drawingsCollection, {
      imageData,
      position: position || null,
      timestamp: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('그림 저장 실패:', error);
    throw error;
  }
};

export const getRecentMessages = async (limitCount: number = 50) => {
  try {
    const q = query(messagesCollection, orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      text: doc.data().text,
      timestamp: doc.data().timestamp.toISOString()
    }));
  } catch (error) {
    console.error('메시지 가져오기 실패:', error);
    return [];
  }
};

export const getRecentDrawings = async (limitCount: number = 50) => {
  try {
    const q = query(drawingsCollection, orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      imageData: doc.data().imageData,
      position: doc.data().position,
      timestamp: doc.data().timestamp.toISOString()
    }));
  } catch (error) {
    console.error('그림 가져오기 실패:', error);
    return [];
  }
};

export default app;
