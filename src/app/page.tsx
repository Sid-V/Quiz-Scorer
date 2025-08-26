"use client";

import { useState } from "react";
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

          {error && (
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
