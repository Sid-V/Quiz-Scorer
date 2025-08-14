import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/authOptions';
const SHEET_RANGE = 'A1:I100';

// Import service account credentials (kept server-side only)
// Using require to avoid bundling JSON on client; this file runs only on server.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const credentials = require('../../../../credentials.json');

async function getSheetData(sheetId: string) {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/spreadsheets.readonly', 'https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/userinfo.email', 'openid', 'profile'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: SHEET_RANGE,
  });
  return res.data.values;
}

export async function GET(req: NextRequest) {
  // Ensure user is authenticated (still required to use the endpoint)
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sheetId = searchParams.get('sheetId');
  if (!sheetId) {
    return NextResponse.json({ error: 'Missing sheetId parameter' }, { status: 400 });
  }

  try {
    const data = await getSheetData(sheetId);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
