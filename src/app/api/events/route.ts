
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/authOptions';
import fs from 'fs';
import { google } from 'googleapis';

const EVENTS_FILE = 'events.json';
const ACTIVE_FILE = 'active_sheet.json';

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let events: Record<string, any[]> = {};
  if (fs.existsSync(EVENTS_FILE)) {
    events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
  }
  let activeSheetId: string | null = null;
  if (fs.existsSync(ACTIVE_FILE)) {
    const active = JSON.parse(fs.readFileSync(ACTIVE_FILE, 'utf8'));
    activeSheetId = active[session.user.email] || null;
  }

  // Filter out deleted/unavailable sheets
  const filteredEvents: any[] = [];
  if (events[session.user.email] && events[session.user.email].length > 0) {
    const { accessToken } = session;
    if (accessToken) {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: 'v3', auth });
      for (const event of events[session.user.email]) {
        try {
          await drive.files.get({ fileId: event.sheetId, fields: 'id' });
          filteredEvents.push(event);
        } catch (err: any) {
          // Sheet is deleted or inaccessible, skip
        }
      }
    }
  }

  return NextResponse.json({ events: filteredEvents, activeSheetId });
}

export async function POST(req: NextRequest) {
  // This POST is for selecting the active sheet
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { sheetId } = await req.json();
  let active: Record<string, string> = {};
  if (fs.existsSync(ACTIVE_FILE)) {
    active = JSON.parse(fs.readFileSync(ACTIVE_FILE, 'utf8'));
  }
  active[session.user.email] = sheetId;
  fs.writeFileSync(ACTIVE_FILE, JSON.stringify(active, null, 2));
  return NextResponse.json({ ok: true });
}
