import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_RANGE = process.env.GOOGLE_SHEET_RANGE || 'A1:I100';

async function getSheetData() {
  const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
  });
  return res.data.values;
}

export async function GET(req: NextRequest) {
  try {
    const data = await getSheetData();
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
