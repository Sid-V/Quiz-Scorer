import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

const ACTIVE_FILE = 'active_sheet.json';
const SHEET_RANGE = process.env.GOOGLE_SHEET_RANGE || 'A1:I100';

async function getSheetData(sheetId: string) {
  const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
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
  // Get user session
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Get active sheet for user
  let activeSheetId: string | null = null;
  if (fs.existsSync(ACTIVE_FILE)) {
    const active = JSON.parse(fs.readFileSync(ACTIVE_FILE, 'utf8'));
    activeSheetId = active[session.user.email] || null;
  }
  if (!activeSheetId) {
    return NextResponse.json({ error: 'No active sheet selected' }, { status: 400 });
  }
  try {
    const data = await getSheetData(activeSheetId);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
