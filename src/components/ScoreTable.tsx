import { memo, useMemo } from 'react';
import { Team } from '../lib/types';

interface ScoreTableProps {
  teams: Team[];
}

export const ScoreTable = memo<ScoreTableProps>(({ teams }) => {
  if (!teams.length) return null;

  // Memoize expensive computations
  const questionData = useMemo(() => {
    if (!teams[0]) return [];

    return teams[0].scores.map((_, qIdx) => {
      const roundNum = teams[0]?.questionRounds?.[qIdx] || "1";
      const questionsInRound = teams[0]?.questionRounds?.filter((r, i) => r === roundNum && i <= qIdx).length || 1;
      return { qIdx, roundNum, questionsInRound };
    });
  }, [teams]);

  return (
    <table className="w-full max-w-7xl text-2xl rounded-2xl overflow-hidden shadow-2xl bg-white border quiz-border-neutral">
      <thead>
        <tr className="quiz-neutral">
          <th className="px-3 py-4 text-white w-16 min-w-16">Question</th>
          {teams.map((team, idx) => (
            <th
              key={idx}
              className="px-2 py-4 text-white text-center min-w-32 max-w-48 border-l border-opacity-30 quiz-border-primary"
            >
              <div className="flex flex-col">
                <span
                  className="font-bold leading-tight break-words"
                  style={{
                    fontSize: `clamp(0.8rem, ${Math.max(1.0, 16 / Math.max(team.team.length, 6)).toFixed(2)}rem, 1.25rem)`,
                    wordBreak: 'break-word',
                    hyphens: 'auto'
                  }}
                  title={team.team}
                >
                  {team.team}
                </span>
                <span className="text-xs opacity-75 mt-1">#{team.teamNum}</span>
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {questionData.map(({ qIdx, roundNum, questionsInRound }) => (
          <tr
            key={qIdx}
            className={qIdx % 2 ? "bg-gray-50" : "bg-white"}
          >
            <td className="px-3 py-3 font-bold text-center w-16 quiz-text-primary">
              {roundNum}.{questionsInRound}
            </td>
            {teams.map((team, teamIdx) => (
              <td
                key={teamIdx}
                className="px-2 py-3 text-center font-bold border-l border-opacity-30 quiz-border-neutral"
              >
                {team.scores[qIdx] !== null && team.scores[qIdx] !== undefined ? team.scores[qIdx] : ''}
              </td>
            ))}
          </tr>
        ))}

        {/* Final Score Row */}
        <tr className="border-t-2 quiz-accent quiz-border-primary">
          <td className="px-3 py-3 font-bold text-white text-center w-16">
            Final Score
          </td>
          {teams.map((team, teamIdx) => (
            <td
              key={teamIdx}
              className="px-2 py-3 text-center font-bold text-white border-l border-opacity-30 quiz-border-primary"
            >
              {team.points}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
});

ScoreTable.displayName = 'ScoreTable';
