import { memo } from 'react';
import { SheetPrompt, SheetPromptButton } from './SheetPrompt';

interface SheetPromptContainerProps {
  showPrompt: boolean;
  inputSheetId: string;
  onInputChange: (value: string) => void;
  onLoad: () => void;
  onClose: () => void;
  onOpen: () => void;
  loading: boolean;
  canLoad: boolean;
}

export const SheetPromptContainer = memo<SheetPromptContainerProps>(({
  showPrompt,
  inputSheetId,
  onInputChange,
  onLoad,
  onClose,
  onOpen,
  loading,
  canLoad
}) => {
  return (
    <div className="fixed bottom-8 left-8 flex flex-col items-start z-40">
      {!showPrompt && (
        <SheetPromptButton onClick={onOpen} />
      )}
      <SheetPrompt
        showPrompt={showPrompt}
        inputSheetId={inputSheetId}
        onInputChange={onInputChange}
        onLoad={onLoad}
        onClose={onClose}
        loading={loading}
        canLoad={canLoad}
      />
    </div>
  );
});

SheetPromptContainer.displayName = 'SheetPromptContainer';



