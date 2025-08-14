"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SessionProviderWrapper from "./SessionProviderWrapper";

export default function EventsPageWrapper() {
  const router = useRouter();
  return (
    <SessionProviderWrapper>
      <div className="absolute top-4 left-8 z-50">
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-800 transition"
          onClick={() => router.push("/")}
        >
          Back to Scoreboard
        </button>
      </div>
      <EventsPage />
    </SessionProviderWrapper>
  );
}

function EventsPage() {
  const { status } = useSession();
  const [sheetId, setSheetId] = useState<string>("");
  const [inputSheetId, setInputSheetId] = useState<string>("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [error, setError] = useState("");
  const [sheetData, setSheetData] = useState<any[][]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchSheetData(id: string) {
    setLoading(true);
    setError("");
    try {
      // Replace with your actual Google Sheets API call
      const res = await fetch(`/api/scores?sheetId=${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSheetData(data.data || []);
      setSheetId(id);
      setShowPrompt(false);
    } catch (e: any) {
      setError(e.message || "Failed to fetch sheet data");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") return <div>Loading...</div>;
  if (status !== "authenticated") return <div className="p-8">Please sign in to add a sheet.</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Google Sheet Scoreboard</h1>
      <button
        className="px-4 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-800 transition mb-6"
        onClick={() => setShowPrompt(true)}
      >
        Add Sheet ID
      </button>
      {showPrompt && (
        <div className="mb-6 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            className="px-3 py-2 rounded border border-gray-300 flex-1"
            placeholder="Paste your Google Sheet ID here"
            value={inputSheetId}
            onChange={e => setInputSheetId(e.target.value)}
            disabled={loading}
          />
          <button
            className="px-4 py-2 rounded bg-green-600 text-white font-bold hover:bg-green-800 transition"
            onClick={() => fetchSheetData(inputSheetId)}
            disabled={loading || !inputSheetId.trim()}
          >
            {loading ? "Loading..." : "Load Sheet"}
          </button>
        </div>
      )}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {sheetData.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded">
            <tbody>
              {sheetData.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border px-2 py-1 text-sm">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
