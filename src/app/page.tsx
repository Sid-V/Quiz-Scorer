"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSheetData, useTeamSorting } from "../hooks/useSheetData";
import { useSheetPrompt } from "../hooks/useSheetPrompt";
import { Header } from "../components/Header";
import { SortControls } from "../components/SortControls";
import { TeamGrid } from "../components/TeamGrid";
import { ScoreTable } from "../components/ScoreTable";
import { SheetPromptContainer } from "../components/SheetPromptContainer";
import { ErrorDisplay } from "../components/ErrorDisplay";

export default function Home() {
  const [viewByQuestion, setViewByQuestion] = useState(false);

  // Custom hooks for data management
  const {
    teams,
    loading,
    error,
    authError,
    fetchSheetData,
    setError,
  } = useSheetData();

  const {
    sortBy,
    setSortBy,
    sortedTeams,
  } = useTeamSorting(teams);

  const {
    showPrompt,
    inputSheetUrl,
    setInputSheetUrl,
    handlePromptClose,
    handleLoadSheet,
    openPrompt,
    canLoad,
  } = useSheetPrompt(fetchSheetData, loading);

  return (
    <div className="font-sans min-h-screen p-0 m-0 text-black flex flex-col justify-between quiz-gradient">
      <div>
        <Header />
        <main className="flex flex-col items-center w-full px-4 py-12">
          <h1 className="text-5xl font-extrabold mb-10 drop-shadow quiz-text-secondary">
            Scorecard
          </h1>

          {authError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 max-w-md mx-auto text-center">
              <div className="text-red-600 font-semibold mb-2">Authentication Required</div>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => signIn('google')}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Sign In Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          ) : error && (
            <ErrorDisplay
              error={error}
              onRetry={() => {
                if (teams.length > 0) {
                  setError("");
                }
              }}
              showRetry={teams.length > 0}
            />
          )}

          {teams.length > 0 && (
            <>
              <SortControls
                sortBy={sortBy}
                onSortChange={setSortBy}
                viewByQuestion={viewByQuestion}
                onViewChange={setViewByQuestion}
              />

              {!viewByQuestion ? (
                <TeamGrid teams={sortedTeams} sortBy={sortBy} />
              ) : (
                <ScoreTable teams={teams} />
              )}
            </>
          )}
        </main>
      </div>

      <SheetPromptContainer
        showPrompt={showPrompt}
        inputSheetId={inputSheetUrl}
        onInputChange={setInputSheetUrl}
        onLoad={handleLoadSheet}
        onClose={handlePromptClose}
        onOpen={openPrompt}
        loading={loading}
        canLoad={canLoad}
      />
    </div>
  );
}
