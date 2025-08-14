import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/authOptions';
import { google } from 'googleapis';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';


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

export async function POST(req: NextRequest) {
  // Get user session
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    // Parse request body for sheetName
    const { sheetName } = await req.json();
    if (!sheetName) {
      return NextResponse.json({ error: "Missing sheetName" }, { status: 400 });
    }
    // Get access token from session
    const accessToken = (session as Record<string, any>).accessToken || (session.user as Record<string, any>).accessToken;
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token found in session' }, { status: 401 });
    }
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // 1. Create the new sheet
    const createRes = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: sheetName },
        sheets: [
          {
            properties: { title: 'Scorecard' },
          },
        ],
      },
    });
    const sheetId = createRes.data.spreadsheetId;
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

    // 2. Prepare the values for the structure
    const values: (string | number)[][] = [
      [
        'Team Number', '# 1', '# 2', '# 3', '# 4', '# 5', '# 6', '# 7', '# 8'
      ],
      ['Team Names'],
      ['Round 1'],
      ['1'],
      ['2'],
      ['3'],
      ['4'],
      ['5'],
      ['6'],
      ['7'],
      ['8'],
      ['Round 2'],
      ['1'],
      ['2'],
      ['3'],
      ['4'],
      ['5'],
      ['6'],
      ['7'],
      ['8'],
      [],
      [
        'Final Score',
        '=SUM(B4:B20)',
        '=SUM(C4:C20)',
        '=SUM(D4:D20)',
        '=SUM(E4:E20)',
        '=SUM(F4:F20)',
        '=SUM(G4:G20)',
        '=SUM(H4:H20)',
        '=SUM(I4:I20)'
      ],
    ];

    // 3. Write the values to the sheet (formulas will be interpreted by Sheets)
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId!,
      range: 'Scorecard!A1:I22',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    // 4. Add permission: anyone with the link can view
    try {
      await drive.permissions.create({
        fileId: sheetId!,
        requestBody: {
          type: 'anyone',
          role: 'reader',
        },
      });
    } catch (err: unknown) {
      console.error('Failed to set public permission on sheet:', err);
    }

    // 5. Store event for user in Firestore
    const userEmail = session.user.email.trim().toLowerCase();
    await addDoc(collection(db, "events"), {
      user: userEmail,
      sheetId,
      sheetUrl,
      name: sheetName,
      created: new Date().toISOString(),
    });
    return NextResponse.json({ sheetId, sheetUrl });
  } catch (err: unknown) {
    console.error('Error creating sheet:', err);
    return NextResponse.json({ error: (err as Error)?.message || 'Failed to create event' }, { status: 500 });
  }
}
