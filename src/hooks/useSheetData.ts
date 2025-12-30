import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Team, SortOption, ApiResponse } from '../lib/types';
import { parseSheetData, extractSheetId } from '../lib/sheetParser';
import { CONFIG } from '../lib/constants';

/**
 * Custom hook for managing sheet data and operations
 */
export function useSheetData() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && !!session;

  const [sheetId, setSheetId] = useState<string>("");
  const [sheetData, setSheetData] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState(false);
  const retryCount = useRef<number>(0);
  const maxRetries = 3;

  // Parse teams from sheet data
  const teams = useMemo(() => parseSheetData(sheetData), [sheetData]);

  // Enhanced fetch with better error handling
  const fetchSheetData = useCallback(async (urlOrId: string, isRetry: boolean = false) => {
    // Don't fetch if not authenticated
    if (!isAuthenticated) {
      setAuthError(true);
      setError('Authentication required. Please sign in to access the scorecard.');
      return;
    }

    const extractedId = extractSheetId(urlOrId);
    if (!extractedId) {
      setError("Invalid Google Sheets URL or ID");
      return;
    }
    
    setLoading(true);
    if (!isRetry) {
      setError("");
      setAuthError(false);
      retryCount.current = 0;
    }

    try {
      const res = await fetch(`/api/scores?sheetId=${encodeURIComponent(extractedId)}`);
      const json: ApiResponse = await res.json();

      if (!res.ok) {
        // Handle authentication errors specifically
        if (res.status === 401 || (json as any).code === 'AUTH_EXPIRED') {
          setAuthError(true);
          if ((json as any).code === 'AUTH_EXPIRED') {
            setError('Your session has expired. Please refresh the page or sign in again.');
          } else {
            setError('Authentication required. Please sign in to access the scorecard.');
          }
          return;
        }
        throw new Error(json.error || "Failed to fetch sheet data");
      }

      setSheetData(json.data || []);
      setSheetId(extractedId);
      retryCount.current = 0;
      setAuthError(false);

      // Update URL without triggering navigation
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('sheetId', extractedId);
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e: any) {
      // Implement exponential backoff for retries (only for non-auth errors)
      if (retryCount.current < maxRetries && !isRetry && !authError) {
        retryCount.current++;
        const delay = Math.pow(2, retryCount.current) * 1000; // 2s, 4s, 8s
        
        setTimeout(() => {
          fetchSheetData(urlOrId, true);
        }, delay);
        return;
      }
      
      setError(e.message || "Failed to fetch sheet data");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authError, maxRetries]);

  // Load sheet ID from URL on mount (only when authenticated)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isAuthenticated) return; // Don't auto-load if not authenticated
    
    const params = new URLSearchParams(window.location.search);
    const id = params.get('sheetId');
    if (id && !sheetData.length && !loading) {
      fetchSheetData(id);
    }
  }, [fetchSheetData, sheetData.length, loading, isAuthenticated]);

  // Poll for updates when sheet is loaded (with auth check)
  useEffect(() => {
    // Stop polling if not authenticated or if there's an auth error
    if (!sheetId || authError || !isAuthenticated) return;
    
    const interval = setInterval(() => {
      if (isAuthenticated && !authError) {
        fetchSheetData(sheetId);
      }
    }, CONFIG.POLLING_INTERVAL);
    
    return () => clearInterval(interval);
  }, [sheetId, fetchSheetData, authError, isAuthenticated]);

  // Clear auth error when user logs back in
  useEffect(() => {
    if (isAuthenticated && authError) {
      setAuthError(false);
      setError("");
    }
  }, [isAuthenticated, authError]);

  return {
    teams,
    loading,
    error,
    authError,
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