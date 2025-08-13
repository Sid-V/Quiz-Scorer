"use client";

import Image from "next/image";
import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function parseSheetData(data: string[][]) {
  if (!data || data.length < 3) return [];
  const header = data[0]; // Team Number, #1, #2, ...
  const teamNamesRow = data[1]; // Team Names, Abcd, xyz, ...
  // Find the row with 'Final Score' (case-insensitive)
  const finalScoreIdx = data.findIndex(row => (row[0] || '').toLowerCase().includes('final score'));
  if (finalScoreIdx === -1) return [];
  // All question rows are between teamNamesRow and finalScoreRow
  const questionRows = data.slice(2, finalScoreIdx).filter(row => row[0] && !row[0].toLowerCase().includes('round'));
  const finalScoreRow = data[finalScoreIdx];

  // Get team names from teamNamesRow (B-I)
  const teams = teamNamesRow.slice(1).map((teamName, idx) => {
    if (!teamName) return undefined;
    return {
      team: teamName,
      teamNum: idx + 1,
      scores: questionRows.map(row => Number(row[idx + 1]) || 0),
      points: Number(finalScoreRow[idx + 1]) || 0,
    };
  }).filter((t): t is { team: string; teamNum: number; scores: number[]; points: number } => !!t);
  return teams;
}

export default function Home() {
  const { data, error, isLoading } = useSWR("/api/scores", fetcher, {
    refreshInterval: 15000,
  });
  const [sortBy, setSortBy] = useState<"points" | "teamNum">("points");
  const [viewByQuestion, setViewByQuestion] = useState(false);

  if (error) return <div className="text-red-600">Failed to load scores</div>;
  if (isLoading || !data) return <div>Loading...</div>;

  const teams = parseSheetData(data.data || []);
  const sortedTeams = [...teams].sort((a, b) =>
    sortBy === "points" ? b.points - a.points : a.teamNum - b.teamNum
  );

  return (
    <div className="font-sans min-h-screen p-0 m-0 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-400 text-black">
      <header className="w-full flex flex-col items-center bg-blue-700 text-white shadow-lg py-6">
        <div className="w-full flex flex-row items-center justify-between px-12 py-2">
          <div className="flex flex-col">
            <span className="text-4xl font-extrabold tracking-widest">The Curiosity Quotient</span>
            <span className="text-lg font-bold tracking-widest mt-2">SCORECARD</span>
          </div>
          <img src="/tcq_logo.png" alt="TCQ Logo" className="h-32 w-auto" />
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
        <div className="w-full flex justify-center overflow-x-auto">
          {!viewByQuestion ? (
            <table className="w-full max-w-4xl text-2xl border border-blue-300 rounded-2xl overflow-hidden shadow-2xl bg-white">
              <thead>
                <tr className="bg-blue-200">
                  <th className="px-6 py-4 text-blue-900">Team</th>
                  <th className="px-6 py-4 text-blue-900">Score</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((team, i) => (
                  <tr key={team.teamNum} className={i % 2 ? "bg-blue-50" : "bg-white"}>
                    <td className="px-6 py-4 font-bold">{team.team} (#{team.teamNum})</td>
                    <td className="px-6 py-4 text-center font-bold">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        </div>
      </main>
    </div>
  );
}
