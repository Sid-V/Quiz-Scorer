"use client";

import Image from "next/image";
import useSWR from "swr";
import { useState } from "react";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function parseSheetData(data: string[][]) {
  if (!data || data.length < 3) return [];
  const header = data[0]; // Team Number, #1, #2, ...
  const teamNamesRow = data[1]; // Team Names, ...

  // Find the row with 'Final Score' (case-insensitive)
  const finalScoreIdx = data.findIndex(row => (row[0] || '').toLowerCase().includes('final score'));
  // All question rows are between teamNamesRow and finalScoreRow (or end of data)
  const lastRowIdx = finalScoreIdx !== -1 ? finalScoreIdx : data.length;
  // Question rows: skip round headers (rows where col 0 includes 'round')
  const questionRows = data.slice(2, lastRowIdx).filter(row => row[0] && !row[0].toLowerCase().includes('round'));
  // Number of teams = number of columns after first col in header
  const numTeams = header.length - 1;
  // Number of questions = questionRows.length

  // Get team names from teamNamesRow (B onwards)
  const teams = teamNamesRow.slice(1).map((teamName, idx) => {
    if (!teamName) return undefined;
    // For each team, collect their scores for each question
    const scores = questionRows.map(row => Number(row[idx + 1]) || 0);
    // If Final Score row exists, use it, else sum scores
    let points = 0;
    if (finalScoreIdx !== -1) {
      points = Number(data[finalScoreIdx][idx + 1]) || 0;
    } else {
      points = scores.reduce((a, b) => a + b, 0);
    }
    return {
      team: teamName,
      teamNum: idx + 1,
      scores,
      points,
    };
  }).filter((t): t is { team: string; teamNum: number; scores: number[]; points: number } => !!t);
  return teams;
}

export default function Home() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR("/api/scores", fetcher, {
    refreshInterval: 15000,
  });
  const [sortBy, setSortBy] = useState<"points" | "teamNum">("points");
  const [viewByQuestion, setViewByQuestion] = useState(false);

  if (error) {
    if (error.error === 'No active sheet selected') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-xl mb-4 text-blue-900 font-bold">No event selected</div>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-800 transition"
            onClick={() => router.push("/events")}
          >
            Go to Events to Create or Select a Sheet
          </button>
        </div>
      );
    }
    return <div className="text-red-600">Failed to load scores: {error.error || error.toString()}</div>;
  }
  if (isLoading || !data) return <div>Loading...</div>;

  const teams = parseSheetData(data.data || []);
  const sortedTeams = [...teams].sort((a, b) =>
    sortBy === "points" ? b.points - a.points : a.teamNum - b.teamNum
  );

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
        </main>
      </div>
      {/* Bottom bar for Manage Events and Google Sign In */}
      <div className="w-full flex flex-col items-center gap-4 pb-8 pt-4">
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-800 transition"
          onClick={() => router.push("/events")}
        >
          Manage Events
        </button>
        {/* Google Sign In/Out button placeholder - replace with your actual sign in/out logic if needed */}
        <div id="google-signin-placeholder" className="mt-2">
          {/* Place your Google Sign In/Out button here */}
        </div>
      </div>
    </div>
  );
}
