"use client";

import Image from "next/image";
import { useState, useMemo, useEffect, useCallback } from "react";

// Color theme constants
const COLORS = {
  primary: '#542b31',
  secondary: '#2b544e', 
  accent: '#654046',
  neutral: '#876b6f',
  gold: '#FFD700',
  goldBorder: '#E6C200',
  silver: '#C4C4C4',
  silverBorder: '#A8A8A8',
  bronze: '#CE8946',
  bronzeBorder: '#B5763A',
} as const;

// Configuration constants
const POLLING_INTERVAL = 30000; // 30 seconds
const MIN_TEAMS = 4;
const MAX_TEAMS = 11;

// Types
interface Team {
  team: string;
  teamNum: number;
  scores: (number | null)[];
  points: number;
  questionRounds: string[];
}

// Parse sheet given new structure:
// Row 1: team names (aaa, bbb, ccc, ddd, eee, fff, ggg, hhh)
// Row 2: team numbers (starts from column B with #1, #2, #3, etc.)
// Following rows: Round headers ('Round 1', 'Round 2', etc.) and question rows (1, 2, 3, etc.)
// Final row: 'Final Score' with total points per team
function parseSheetData(data: string[][]): Team[] {
  if (!data || data.length < 4) return [];
  
  const [teamNamesRow, teamNumbersRow] = data;

  // Locate final score row (guaranteed by requirements)
  const finalScoreIdx = data.findIndex(row => 
    (row?.[0] || '').toLowerCase().includes('final score')
  );
  if (finalScoreIdx === -1) return []; // safeguard, though guaranteed

  // Determine team count: scan team names row starting from column B (index 1)
  let teamCount = 0;
  for (let c = 1; c < teamNamesRow.length && teamCount < MAX_TEAMS; c++) {
    const val = (teamNamesRow[c] || '').trim();
    if (!val && teamCount >= MIN_TEAMS) break; // allow trailing blanks after minimum teams
    if (!val && teamCount < MIN_TEAMS) {
      // If early blanks but we still haven't reached min 4, treat as placeholder team
      teamCount++;
      continue;
    }
    teamCount++;
  }
  // Fallback to reasonable defaults
  if (teamCount < MIN_TEAMS) {
    teamCount = Math.min(Math.max((teamNamesRow.length - 1) || 0, MIN_TEAMS), MAX_TEAMS);
  }

  // Collect question rows and track rounds
  const questionRows: string[][] = [];
  const questionRounds: string[] = []; // Track which round each question belongs to
  let currentRound = "1"; // Default to round 1
  
  for (let r = 2; r < finalScoreIdx; r++) {
    const row = data[r];
    if (!row?.length) continue;
    
    const first = (row[0] || '').trim();
    if (!first) continue;
    
    const firstLower = first.toLowerCase();
    if (firstLower.includes('round')) {
      // Extract round number from "Round X" format
      const roundMatch = first.match(/round\s*(\d+)/i);
      if (roundMatch) {
        currentRound = roundMatch[1];
      }
      continue; // skip round header
    }
    if (firstLower.includes('final score')) continue; // defensive
    
    questionRows.push(row);
    questionRounds.push(currentRound);
  }

  // Build team objects
  const teams: Team[] = Array.from({ length: teamCount }, (_, idx) => {
    const name = (teamNamesRow[idx + 1] || '').trim() || `Team ${idx + 1}`;
    const scores = questionRows.map(row => {
      const cell = row[idx + 1];
      // Preserve empty/undefined cells vs actual zeros
      if (cell === undefined || cell === null || cell === '') {
        return null; // Use null for empty cells
      }
      const num = Number(cell);
      return isNaN(num) ? null : num; // Use null for non-numeric values
    });
    
    const finalRow = data[finalScoreIdx] || [];
    const finalValRaw = finalRow[idx + 1];
    const finalValNum = Number(finalValRaw);
    const points = !isNaN(finalValNum) 
      ? finalValNum 
      : scores.reduce((a, b) => (a || 0) + (b || 0), 0) || 0;
    
    return {
      team: name,
      teamNum: idx + 1,
      scores,
      points,
      questionRounds, // Add round information
    };
  });
  
  return teams;
}

// Dynamically pick a font-size class for varying team name lengths so they fit in tiles & table.
function teamNameSizeClass(name: string): string {
  const len = name.length;
  if (len <= 10) return "text-3xl";      // very short
  if (len <= 14) return "text-2xl";
  if (len <= 20) return "text-xl";
  if (len <= 28) return "text-lg";
  if (len <= 36) return "text-base";
  return "text-sm"; // very long names
}

// Get podium styling for team position
function getPodiumStyle(position: number, sortBy: string) {
  if (sortBy !== "points") return {};
  
  switch (position) {
    case 0:
      return {
        backgroundColor: COLORS.gold,
        borderColor: COLORS.goldBorder,
        boxShadow: '0 25px 50px -12px rgba(255, 215, 0, 0.4)'
      };
    case 1:
      return {
        backgroundColor: COLORS.silver,
        borderColor: COLORS.silverBorder,
        boxShadow: '0 25px 50px -12px rgba(196, 196, 196, 0.4)'
      };
    case 2:
      return {
        backgroundColor: COLORS.bronze,
        borderColor: COLORS.bronzeBorder,
        boxShadow: '0 25px 50px -12px rgba(206, 137, 70, 0.4)'
      };
    default:
      return {};
  }
}

// Get button styling
function getButtonStyle(isActive: boolean, variant: 'primary' | 'secondary' = 'primary') {
  const baseStyle = {
    backgroundColor: isActive 
      ? (variant === 'primary' ? COLORS.accent : COLORS.secondary)
      : COLORS.neutral,
    color: isActive ? 'white' : COLORS.primary
  };
  return baseStyle;
}

export default function Home() {
  const [sheetId, setSheetId] = useState<string>("");
  const [inputSheetId, setInputSheetId] = useState<string>("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [sortBy, setSortBy] = useState<"points" | "teamNum">("points");
  const [viewByQuestion, setViewByQuestion] = useState(false);
  const [sheetData, setSheetData] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Derived teams & sorted list
  const teams = useMemo(() => parseSheetData(sheetData), [sheetData]);
  const sortedTeams = useMemo(() => {
    const copy = [...teams];
    if (sortBy === "points") {
      return copy.sort((a, b) => (b.points || 0) - (a.points || 0) || a.teamNum - b.teamNum);
    }
    return copy.sort((a, b) => a.teamNum - b.teamNum);
  }, [teams, sortBy]);

  const fetchSheetData = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/scores?sheetId=${encodeURIComponent(id)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch sheet data");
      setSheetData(json.data || []);
      setSheetId(id);
      setShowPrompt(false);
      // Persist in URL (shareable & reload-safe without server storage)
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('sheetId', id);
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e: any) {
      setError(e.message || "Failed to fetch sheet data");
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePromptClose = useCallback(() => {
    setShowPrompt(false);
    setInputSheetId("");
  }, []);

  // On initial mount, auto-load sheetId from URL if present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('sheetId');
    if (id && !sheetData.length && !loading) {
      fetchSheetData(id);
    }
  }, [fetchSheetData, sheetData.length, loading]);

  // Poll every 30 seconds for updated sheet data (if a sheet is loaded)
  useEffect(() => {
    if (!sheetId) return; // nothing to poll yet
    const interval = setInterval(() => {
      fetchSheetData(sheetId);
    }, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [sheetId, fetchSheetData]);

  return (
    <div 
      className="font-sans min-h-screen p-0 m-0 text-black flex flex-col justify-between" 
      style={{background: 'linear-gradient(to bottom right, #f0f0f0, #e0e0e0, #d0d0d0)'}}
    >
      <div>
        <header 
          className="w-full flex flex-col items-center text-white shadow-lg py-6" 
          style={{backgroundColor: COLORS.primary}}
        >
          <div className="w-full flex flex-row items-center justify-between px-12 py-2">
            <div className="flex flex-col">
              <span className="text-5xl font-extrabold tracking-widest">The Curiosity Quotient</span>
            </div>
            <Image 
              src="/tcq_logo.png" 
              alt="TCQ Logo" 
              className="h-48 w-auto max-w-lg" 
              width={512} 
              height={512}
            />
          </div>
        </header>
        <main className="flex flex-col items-center w-full px-4 py-12">
          <h1 className="text-5xl font-extrabold mb-10 drop-shadow" style={{color: COLORS.secondary}}>
            Scorecard
          </h1>
          {error && <div className="text-red-600 mb-4">{error}</div>}
          {teams.length > 0 && (
            <>
              <div className="flex flex-wrap gap-6 mb-10 justify-center w-full max-w-5xl">
                <button
                  className="px-6 py-3 rounded-xl text-xl font-bold shadow transition-colors duration-200 hover:opacity-80"
                  style={getButtonStyle(sortBy === "points")}
                  onClick={() => setSortBy("points")}
                >
                  Order by Points
                </button>
                <button
                  className="px-6 py-3 rounded-xl text-xl font-bold shadow transition-colors duration-200 hover:opacity-80"
                  style={getButtonStyle(sortBy === "teamNum")}
                  onClick={() => setSortBy("teamNum")}
                >
                  Order by Team Number
                </button>
                <button
                  className="px-6 py-3 rounded-xl text-xl font-bold shadow transition-colors duration-200 hover:opacity-80"
                  style={getButtonStyle(viewByQuestion, 'secondary')}
                  onClick={() => setViewByQuestion((v) => !v)}
                >
                  {viewByQuestion ? "Hide View by Question" : "View by Question"}
                </button>
              </div>
              {/* Tiles view for teams */}
              {!viewByQuestion ? (
                <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-center">
                  {sortedTeams.map((team, i) => {
                    // Only apply podium colors when ordering by points
                    const podiumStyle = getPodiumStyle(i, sortBy);
                    const isTopThree = sortBy === "points" && i < 3;
                    const textColorClass = (sortBy === "points" && i === 2) ? "text-white" : "text-black";
                    
                    return (
                      <div
                        key={team.teamNum}
                        className={`relative rounded-2xl border-4 p-8 flex flex-col items-center shadow-xl transition-all duration-200 ${isTopThree ? textColorClass : "bg-white text-black"}`}
                        style={podiumStyle}
                      >
                        {/* Crown icon for leader when ordered by points */}
                        {sortBy === "points" && i === 0 && (
                          <span
                            className="absolute -top-8 -left-8 text-[3.5rem] sm:text-[4.5rem] select-none pointer-events-none"
                            title="Leader"
                            style={{ transform: 'rotate(-25deg)' }}
                          >
                            👑
                          </span>
                        )}
                        <div
                          className={`${teamNameSizeClass(team.team)} font-extrabold mb-2 break-words text-center max-w-xs w-full leading-tight`}
                          style={{ wordBreak: 'break-word', hyphens: 'auto' }}
                          title={team.team}
                        >
                          {team.team}
                        </div>
                        <div className="text-lg font-semibold mb-2">Team #{team.teamNum}</div>
                        <div className="text-5xl font-black mt-2">{team.points}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <table 
                  className="w-full max-w-7xl text-2xl rounded-2xl overflow-hidden shadow-2xl bg-white" 
                  style={{border: `1px solid ${COLORS.neutral}`}}
                >
                  <thead>
                    <tr style={{backgroundColor: COLORS.neutral}}>
                      <th className="px-3 py-4 text-white w-16 min-w-16">Question</th>
                      {teams.map((team, idx) => (
                        <th 
                          key={idx} 
                          className="px-2 py-4 text-white text-center min-w-32 max-w-48 border-l border-opacity-30" 
                          style={{borderLeftColor: COLORS.primary}}
                        >
                          <div className="flex flex-col">
                            <span 
                              className="font-bold leading-tight break-words"
                              style={{
                                fontSize: `clamp(0.8rem, ${Math.max(1.0, 16 / Math.max(team.team.length, 6)).toFixed(2)}rem, 1.25rem)`,
                                wordBreak: 'break-word',
                                hyphens: 'auto'
                              }}
                              title={team.team}
                            >
                              {team.team}
                            </span>
                            <span className="text-xs opacity-75 mt-1">#{team.teamNum}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teams[0]?.scores.map((_, qIdx) => {
                      const roundNum = teams[0]?.questionRounds?.[qIdx] || "1";
                      const questionsInRound = teams[0]?.questionRounds?.filter((r, i) => r === roundNum && i <= qIdx).length || 1;
                      return (
                        <tr 
                          key={qIdx} 
                          className={qIdx % 2 ? "" : "bg-white"} 
                          style={{backgroundColor: qIdx % 2 ? '#f8f8f8' : 'white'}}
                        >
                          <td 
                            className="px-3 py-3 font-bold text-center w-16" 
                            style={{color: COLORS.primary}}
                          >
                            {roundNum}.{questionsInRound}
                          </td>
                          {teams.map((team, teamIdx) => (
                            <td 
                              key={teamIdx} 
                              className="px-2 py-3 text-center font-bold border-l border-opacity-30" 
                              style={{borderLeftColor: COLORS.neutral}}
                            >
                              {team.scores[qIdx] !== null && team.scores[qIdx] !== undefined ? team.scores[qIdx] : ''}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                    {/* Final Score Row */}
                    <tr 
                      className="border-t-2" 
                      style={{backgroundColor: COLORS.accent, borderTopColor: COLORS.primary}}
                    >
                      <td className="px-3 py-3 font-bold text-white text-center w-16">
                        Final Score
                      </td>
                      {teams.map((team, teamIdx) => (
                        <td 
                          key={teamIdx} 
                          className="px-2 py-3 text-center font-bold text-white border-l border-opacity-30" 
                          style={{borderLeftColor: COLORS.primary}}
                        >
                          {team.points}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              )}
            </>
          )}
        </main>
      </div>
      {/* Bottom-left Add Sheet ID button & prompt */}
      <div className="fixed bottom-8 left-8 flex flex-col items-start z-40">
        {!showPrompt && (
          <button
            className="px-4 py-2 rounded text-white font-bold hover:opacity-80 transition shadow"
            style={{backgroundColor: COLORS.secondary}}
            onClick={() => setShowPrompt(true)}
          >
            Add Sheet ID
          </button>
        )}
        {showPrompt && (
          <div className="flex flex-col sm:flex-row gap-2 bg-white p-4 rounded shadow-lg border border-gray-300">
            <input
              type="text"
              className="px-3 py-2 rounded border border-gray-300 flex-1"
              placeholder="Paste your Google Sheet ID here"
              value={inputSheetId}
              onChange={(e) => setInputSheetId(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded bg-green-600 text-white font-bold hover:bg-green-800 transition"
                onClick={() => fetchSheetData(inputSheetId)}
                disabled={loading || !inputSheetId.trim()}
              >
                {loading ? "Loading..." : "Load"}
              </button>
              <button
                className="px-4 py-2 rounded bg-gray-300 text-gray-800 font-bold hover:bg-gray-400 transition"
                onClick={handlePromptClose}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
