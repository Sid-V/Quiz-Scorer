
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/authOptions';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, addDoc } from 'firebase/firestore';
import { google } from 'googleapis';


// Firebase config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userEmail = session.user.email.trim().toLowerCase();

  // Get events for user from Firestore
  const q = query(collection(db, "events"), where("user", "==", userEmail));
  const snapshot = await getDocs(q);
  const events: any[] = [];
  snapshot.forEach(doc => {
    events.push(doc.data());
  });

  // Get active sheet for user from Firestore
  const activeQ = query(collection(db, "activeSheets"), where("user", "==", userEmail));
  const activeSnap = await getDocs(activeQ);
  let activeSheetId: string | null = null;
  if (!activeSnap.empty) {
    activeSheetId = activeSnap.docs[0].data().sheetId;
  }

  if (!activeSheetId) {
    return NextResponse.json({ events, activeSheetId: null });
  }

  return NextResponse.json({ events, activeSheetId });
}

export async function POST(req: NextRequest) {
  // This POST is for selecting the active sheet
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { sheetId } = await req.json();
  // Store active sheet for user in Firestore
  const userEmail = session.user.email.trim().toLowerCase();
  const activeQ = query(collection(db, "activeSheets"), where("user", "==", userEmail));
  const activeSnap = await getDocs(activeQ);
  // If an active sheet exists, update it; else, add new
  if (!activeSnap.empty) {
    await updateDoc(activeSnap.docs[0].ref, { sheetId });
  } else {
    await addDoc(collection(db, "activeSheets"), {
      user: userEmail,
      sheetId,
    });
  }
  return NextResponse.json({ ok: true });
}
