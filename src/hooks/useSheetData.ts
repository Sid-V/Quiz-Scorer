import { useState, useCallback, useEffect, useMemo } from 'react';
import { Team, SortOption, ApiResponse } from '../lib/types';
import { parseSheetData, extractSheetId } from '../lib/sheetParser';
import { CONFIG } from '../lib/constants';

/**
 * Custom hook for managing sheet data and operations
 */
export function useSheetData() {
  const [sheetId, setSheetId] = useState<string>("");
  const [sheetData, setSheetData] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Parse teams from sheet data
  const teams = useMemo(() => parseSheetData(sheetData), [sheetData]);

  // Fetch sheet data from API
  const fetchSheetData = useCallback(async (urlOrId: string) => {
    const extractedId = extractSheetId(urlOrId);
    if (!extractedId) {
      setError("Invalid Google Sheets URL or ID");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/scores?sheetId=${encodeURIComponent(extractedId)}`);
      const json: ApiResponse = await res.json();

      if (!res.ok) throw new Error(json.error || "Failed to fetch sheet data");

      setSheetData(json.data || []);
      setSheetId(extractedId);

      // Update URL without triggering navigation
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('sheetId', extractedId);
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e: any) {
      setError(e.message || "Failed to fetch sheet data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load sheet ID from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('sheetId');
    if (id && !sheetData.length && !loading) {
      fetchSheetData(id);
    }
  }, [fetchSheetData, sheetData.length, loading]);

  // Poll for updates when sheet is loaded
  useEffect(() => {
    if (!sheetId) return;
    const interval = setInterval(() => {
      fetchSheetData(sheetId);
    }, CONFIG.POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [sheetId, fetchSheetData]);

  return {
    teams,
    loading,
    error,
    fetchSheetData,
    setError,
  };
}

/**
 * Custom hook for managing team sorting
 */
export function useTeamSorting(teams: Team[]) {
  const [sortBy, setSortBy] = useState<SortOption>("points");

  const sortedTeams = useMemo(() => {
    if (teams.length === 0) return [];

    const copy = [...teams];
    if (sortBy === "points") {
      return copy.sort((a, b) => (b.points || 0) - (a.points || 0) || a.teamNum - b.teamNum);
    }
    return copy.sort((a, b) => a.teamNum - b.teamNum);
  }, [teams, sortBy]);

  return {
    sortBy,
    setSortBy,
    sortedTeams,
  };
}
