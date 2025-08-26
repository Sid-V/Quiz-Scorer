import { useState, useCallback } from 'react';
import { extractSheetId } from '../lib/sheetParser';

/**
 * Custom hook for managing the sheet ID input prompt
 */
export function useSheetPrompt(fetchSheetData: (urlOrId: string) => Promise<void>, loading: boolean): {
  showPrompt: boolean;
  inputSheetUrl: string;
  setInputSheetUrl: (value: string) => void;
  handlePromptClose: () => void;
  handleLoadSheet: () => void;
  openPrompt: () => void;
  canLoad: boolean;
} {
  const [showPrompt, setShowPrompt] = useState(false);
  const [inputSheetUrl, setInputSheetUrl] = useState<string>("");

  const handlePromptClose = useCallback(() => {
    setShowPrompt(false);
    setInputSheetUrl("");
  }, []);

  const handleLoadSheet = useCallback(() => {
    if (inputSheetUrl.trim()) {
      fetchSheetData(inputSheetUrl);
    }
  }, [inputSheetUrl, fetchSheetData]);

  const openPrompt = useCallback(() => {
    setShowPrompt(true);
  }, []);

  const canLoad = !loading && inputSheetUrl.trim().length > 0 && extractSheetId(inputSheetUrl) !== null;

  return {
    showPrompt,
    inputSheetUrl,
    setInputSheetUrl,
    handlePromptClose,
    handleLoadSheet,
    openPrompt,
    canLoad,
  };
}
