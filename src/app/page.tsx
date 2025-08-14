"use client";

import Image from "next/image";
import { useState, useMemo, useEffect } from "react";

function parseSheetData(data: string[][]) {
  if (!data || data.length < 2) return [];
  const header = data[0];
  const teamNamesRow = data[1];

  const finalScoreIdx = data.findIndex(row => (row[0] || '').toLowerCase().includes('final score'));
  const lastRowIdx = finalScoreIdx !== -1 ? finalScoreIdx : data.length;
  const questionRows = data
    .slice(2, lastRowIdx)
    .filter(row => row[0] && !row[0].toLowerCase().includes('round'));

  const numTeams = (header?.length || 1) - 1;
  if (numTeams <= 0) return [];

  const teams = Array.from({ length: numTeams }).map((_, idx) => {
    const rawName = teamNamesRow?.[idx + 1]?.trim();
    const teamName = rawName || `Team ${idx + 1}`;
    const scores = questionRows.map(row => Number(row[idx + 1]) || 0);
    const points = finalScoreIdx !== -1
      ? Number(data[finalScoreIdx][idx + 1]) || 0
      : scores.reduce((a, b) => a + b, 0);
    return {
      team: teamName,
      teamNum: idx + 1,
      scores,
      points,
    };
  });
  return teams;
}

export default function Home() {
  const [sheetId, setSheetId] = useState<string>("");
  const [inputSheetId, setInputSheetId] = useState<string>("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [sortBy, setSortBy] = useState<"points" | "teamNum">("points");
  const [viewByQuestion, setViewByQuestion] = useState(false);
  const [sheetData, setSheetData] = useState<any[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Derived teams & sorted list
  const teams = useMemo(() => parseSheetData(sheetData), [sheetData]);
  const sortedTeams = useMemo(() => {
    const copy = [...teams];
    if (sortBy === "points") return copy.sort((a, b) => b.points - a.points || a.teamNum - b.teamNum);
    return copy.sort((a, b) => a.teamNum - b.teamNum);
  }, [teams, sortBy]);

  async function fetchSheetData(id: string) {
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
  }

  // On initial mount, auto-load sheetId from URL if present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('sheetId');
    if (id && !sheetData.length && !loading) {
      fetchSheetData(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll every 20 seconds for updated sheet data (if a sheet is loaded)
  useEffect(() => {
    if (!sheetId) return; // nothing to poll yet
    const interval = setInterval(() => {
      fetchSheetData(sheetId);
    }, 20000); // 20s
    return () => clearInterval(interval);
  }, [sheetId]);

  return (
    <div className="font-sans min-h-screen p-0 m-0 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-400 text-black flex flex-col min-h-screen justify-between">
      <div>
        <header className="w-full flex flex-col items-center bg-blue-700 text-white shadow-lg py-6">
            <div className="w-full flex flex-row items-center justify-between px-12 py-2">
            <div className="flex flex-col">
              <span className="text-4xl font-extrabold tracking-widest">The Curiosity Quotient</span>
              <span className="text-lg font-bold tracking-widest mt-2">SCORECARD</span>
            </div>
            <Image src="/tcq_logo.png" alt="TCQ Logo" className="h-32 w-auto" width={128} height={128}/>
            </div>
        </header>
        <main className="flex flex-col items-center w-full px-4 py-12">
          <h1 className="text-5xl font-extrabold mb-10 text-blue-900 drop-shadow">Scorecard</h1>
          {error && <div className="text-red-600 mb-4">{error}</div>}
          {teams.length > 0 && (
            <>
              <div className="flex flex-wrap gap-6 mb-10 justify-center w-full max-w-5xl">
                <button
                  className={`px-6 py-3 rounded-xl text-xl font-bold shadow transition-colors duration-200 ${sortBy === "points" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-900 hover:bg-blue-200"}`}
                  onClick={() => setSortBy("points")}
                >
                  Order by Points
                </button>
                <button
                  className={`px-6 py-3 rounded-xl text-xl font-bold shadow transition-colors duration-200 ${sortBy === "teamNum" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-900 hover:bg-blue-200"}`}
                  onClick={() => setSortBy("teamNum")}
                >
                  Order by Team Number
                </button>
                <button
                  className={`px-6 py-3 rounded-xl text-xl font-bold shadow transition-colors duration-200 ${viewByQuestion ? "bg-green-600 text-white" : "bg-green-100 text-green-900 hover:bg-green-200"}`}
                  onClick={() => setViewByQuestion((v) => !v)}
                >
                  {viewByQuestion ? "Hide View by Question" : "View by Question"}
                </button>
              </div>
              {/* Tiles view for teams */}
              {!viewByQuestion ? (
                <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-center">
                  {sortedTeams.map((team, i) => {
                    // Only color top 3 if ordering by points
                    let tileColor = "bg-white";
                    let textColor = "text-black";
                    if (sortBy === "points") {
                      if (i === 0) {
                        tileColor = "bg-yellow-300 border-yellow-500 shadow-yellow-400"; // Gold
                      } else if (i === 1) {
                        tileColor = "bg-gray-200 border-gray-400 shadow-gray-300"; // Silver
                      } else if (i === 2) {
                        tileColor = "bg-amber-700 border-amber-900 shadow-amber-400 text-white"; // Bronze
                        textColor = "text-white";
                      }
                    }
                    return (
                      <div
                        key={team.teamNum}
                        className={`relative rounded-2xl border-4 p-8 flex flex-col items-center shadow-xl transition-all duration-200 ${tileColor} ${textColor}`}
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
                        <div className="text-2xl sm:text-3xl font-extrabold mb-2 break-words text-center max-w-xs w-full" style={{wordBreak:'break-word'}}>{team.team}</div>
                        <div className="text-lg font-semibold mb-2">Team #{team.teamNum}</div>
                        <div className="text-5xl font-black mt-2">{team.points}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <table className="w-full max-w-5xl text-2xl border border-blue-300 rounded-2xl overflow-hidden shadow-2xl bg-white">
                  <thead>
                    <tr className="bg-blue-200">
                      <th className="px-6 py-4 text-blue-900">Team</th>
                      {teams[0]?.scores.map((_, qIdx) => (
                        <th key={qIdx} className="px-4 py-4 text-blue-900">
                          Q{qIdx + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTeams.map((team, i) => (
                      <tr key={team.teamNum} className={i % 2 ? "bg-blue-50" : "bg-white"}>
                        <td className="px-6 py-4 font-bold">{team.team} (#{team.teamNum})</td>
                        {team.scores.map((score: number, qIdx: number) => (
                          <td key={qIdx} className="px-4 py-4 text-center font-bold">
                            {score}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </main>
      </div>
      {/* Bottom-right Add Sheet ID button & prompt positioned left of auth buttons */}
  <div className="fixed bottom-8 left-8 flex flex-col items-start z-40">
        {!showPrompt && (
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-800 transition shadow"
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
              onChange={e => setInputSheetId(e.target.value)}
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
                onClick={() => { setShowPrompt(false); setInputSheetId(""); }}
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
