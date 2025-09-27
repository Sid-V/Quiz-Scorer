import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/authOptions';

const SHEET_RANGE = 'A1:I100';

async function getSheetData(sheetId: string, accessToken: string) {
  const oauth2 = new google.auth.OAuth2();
  oauth2.setCredentials({ access_token: accessToken });
  const sheets = google.sheets({ version: 'v4', auth: oauth2 });
  const res = await sheets.spreadsheets.values.get({ 
    spreadsheetId: sheetId, 
    range: SHEET_RANGE 
  });
  return res.data.values;
}

function isTokenExpiredError(error: any): boolean {
  return (
    error?.code === 401 ||
    error?.message?.includes('Invalid Credentials') ||
    error?.message?.includes('Request had invalid authentication credentials') ||
    error?.message?.includes('Access blocked')
  );
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No active session' }, { status: 401 });
  }

  if (!(session as any).accessToken) {
    return NextResponse.json({ error: 'No access token available' }, { status: 401 });
  }

  // Check if there's a token refresh error
  if ((session as any).error === 'RefreshAccessTokenError') {
    return NextResponse.json({ 
      error: 'Authentication expired. Please sign in again.',
      code: 'AUTH_EXPIRED'
    }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sheetId = searchParams.get('sheetId');
  if (!sheetId) {
    return NextResponse.json({ error: 'Missing sheetId parameter' }, { status: 400 });
  }

  try {
    const data = await getSheetData(sheetId, (session as any).accessToken as string);
    return NextResponse.json({ data });
  } catch (error) {
    // Handle token expiration gracefully
    if (isTokenExpiredError(error)) {
      return NextResponse.json({ 
        error: 'Authentication expired. Please refresh the page or sign in again.',
        code: 'AUTH_EXPIRED'
      }, { status: 401 });
    }
    
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
