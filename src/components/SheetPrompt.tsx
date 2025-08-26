import { memo } from 'react';

interface SheetPromptProps {
  showPrompt: boolean;
  inputSheetId: string;
  onInputChange: (value: string) => void;
  onLoad: () => void;
  onClose: () => void;
  loading: boolean;
  canLoad: boolean;
}

export const SheetPrompt = memo<SheetPromptProps>(({
  showPrompt,
  inputSheetId,
  onInputChange,
  onLoad,
  onClose,
  loading,
  canLoad
}) => {
  if (!showPrompt) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-2 bg-white p-4 rounded shadow-lg border border-gray-300">
      <input
        type="text"
        className="px-3 py-2 rounded border border-gray-300 flex-1"
        placeholder="Paste your Google Sheets URL here"
        value={inputSheetId}
        onChange={(e) => onInputChange(e.target.value)}
        disabled={loading}
        autoFocus
      />
      <div className="flex gap-2">
        <button
          className="px-4 py-2 rounded bg-green-600 text-white font-bold hover:bg-green-800 transition"
          onClick={onLoad}
          disabled={!canLoad}
        >
          {loading ? "Loading..." : "Load"}
        </button>
        <button
          className="px-4 py-2 rounded bg-gray-300 text-gray-800 font-bold hover:bg-gray-400 transition"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
});

SheetPrompt.displayName = 'SheetPrompt';

interface SheetPromptButtonProps {
  onClick: () => void;
}

export const SheetPromptButton = memo<SheetPromptButtonProps>(({ onClick }) => {
  return (
    <button
      className="px-4 py-2 rounded text-white font-bold hover:opacity-80 transition shadow quiz-secondary"
      onClick={onClick}
    >
      Add Sheet URL
    </button>
  );
});

SheetPromptButton.displayName = 'SheetPromptButton';
