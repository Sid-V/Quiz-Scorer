import { Team, ParseSheetOptions } from './types';
import { CONFIG } from './constants';

/**
 * Extract Google Sheets ID from URL
 */
export function extractSheetId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  
  // If it's already just an ID (no slashes), return as-is
  if (!urlOrId.includes('/')) {
    return urlOrId.trim();
  }
  
  // Extract from full Google Sheets URL
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Get font-size class based on team name length
 */
export function getTeamNameSizeClass(name: string): string {
  const len = name.length;
  if (len <= 10) return "text-3xl";
  if (len <= 14) return "text-2xl";
  if (len <= 20) return "text-xl";
  if (len <= 28) return "text-lg";
  if (len <= 36) return "text-base";
  return "text-sm";
}

/**
 * Parse sheet data from Google Sheets into Team objects
 */
export function parseSheetData(data: string[][], options: ParseSheetOptions = {}): Team[] {
  const { minTeams = CONFIG.MIN_TEAMS, maxTeams = CONFIG.MAX_TEAMS } = options;

  if (!data || data.length < 4) return [];

  const teamNamesRow = data[0];
  const teamNumbersRow = data[1];

  if (!teamNamesRow || !teamNumbersRow) return [];

  // Find final score row
  const finalScoreIdx = data.findIndex(row =>
    (row?.[0] || '').toLowerCase().includes('final score')
  );
  if (finalScoreIdx === -1) return [];

  // Count teams by checking team names
  let teamCount = 0;
  for (let c = 1; c < teamNamesRow.length && teamCount < maxTeams; c++) {
    const teamName = (teamNamesRow[c] || '').trim();
    if (!teamName && teamCount >= minTeams) break;
    teamCount++;
  }

  // Ensure minimum team count
  if (teamCount < minTeams) {
    teamCount = Math.min(Math.max(teamNamesRow.length - 1, minTeams), maxTeams);
  }

  // Extract questions and track rounds
  const questionRows: string[][] = [];
  const questionRounds: string[] = [];
  let currentRound = "1";

  for (let r = CONFIG.HEADER_ROW_COUNT; r < finalScoreIdx; r++) {
    const row = data[r];
    if (!row?.length) continue;

    const firstCell = (row[0] || '').trim();
    if (!firstCell) continue;

    if (firstCell.toLowerCase().includes('round')) {
      const roundMatch = firstCell.match(/round\s*(\d+)/i);
      if (roundMatch) {
        currentRound = roundMatch[1];
      }
      continue;
    }

    questionRows.push(row);
    questionRounds.push(currentRound);
  }

  // Build teams
  const teams: Team[] = [];
  const finalRow = data[finalScoreIdx] || [];

  for (let idx = 0; idx < teamCount; idx++) {
    const teamName = (teamNamesRow[idx + 1] || "").trim() || `Team ${idx + 1}`;
    
    const scores = questionRows.map(row => {
      const cell = row[idx + 1];
      if (cell === undefined || cell === null || cell === '') return null;
      const num = Number(cell);
      return isNaN(num) ? null : num;
    });

    const finalScore = Number(finalRow[idx + 1]);
    const points = !isNaN(finalScore) 
      ? finalScore 
      : scores.reduce((sum, score) => (sum || 0) + (score || 0), 0) || 0;

    teams.push({
      team: teamName,
      teamNum: idx + 1,
      scores,
      points,
      questionRounds,
    });
  }

  return teams;
}


