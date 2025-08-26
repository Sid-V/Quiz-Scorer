import { memo } from 'react';
import { SortOption } from '../lib/types';

interface SortControlsProps {
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
  viewByQuestion: boolean;
  onViewChange: (viewByQuestion: boolean) => void;
}

export const SortControls = memo<SortControlsProps>(({
  sortBy,
  onSortChange,
  viewByQuestion,
  onViewChange
}) => {
  return (
    <div className="flex flex-wrap gap-6 mb-10 justify-center w-full max-w-5xl">
      <button
        className={`quiz-button ${sortBy === "points" ? "quiz-button-active" : "quiz-button-inactive"}`}
        onClick={() => onSortChange("points")}
      >
        Order by Points
      </button>

      <button
        className={`quiz-button ${sortBy === "teamNum" ? "quiz-button-active" : "quiz-button-inactive"}`}
        onClick={() => onSortChange("teamNum")}
      >
        Order by Team Number
      </button>

      <button
        className={`quiz-button ${viewByQuestion ? "quiz-button-secondary-active" : "quiz-button-inactive"}`}
        onClick={() => onViewChange(!viewByQuestion)}
      >
        {viewByQuestion ? "Hide View by Question" : "View by Question"}
      </button>
    </div>
  );
});

SortControls.displayName = 'SortControls';
