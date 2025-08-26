import { memo } from 'react';
import { Team, SortOption } from '../lib/types';
import { getTeamNameSizeClass } from '../lib/sheetParser';
import { isPodiumPosition } from '../lib/styling';

interface TeamTileProps {
  team: Team;
  position: number;
  sortBy: SortOption;
}

export const TeamTile = memo<TeamTileProps>(({ team, position, sortBy }) => {
  const isTopThree = isPodiumPosition(position, sortBy);

  const getPodiumClass = () => {
    if (!isTopThree) return "bg-white text-black border-4";
    switch (position) {
      case 0: return "podium-gold text-white";
      case 1: return "podium-silver text-white";
      case 2: return "podium-bronze text-white";
      default: return "bg-white text-black border-4";
    }
  };

  return (
    <div
      className={`relative rounded-2xl border-4 p-8 flex flex-col items-center shadow-xl transition-all duration-200 ${getPodiumClass()}`}
    >
      {/* Crown icon for leader when ordered by points */}
      {sortBy === "points" && position === 0 && (
        <span
          className="absolute -top-28 -left-28 text-[8.5rem] sm:text-[8.5rem] select-none pointer-events-none"
          title="Leader"
          style={{ transform: 'rotate(-45deg)' }}
        >
          👑
        </span>
      )}

      <div
        className={`${getTeamNameSizeClass(team.team)} font-extrabold mb-2 break-words text-center max-w-xs w-full leading-tight`}
        style={{ wordBreak: 'break-word', hyphens: 'auto' }}
        title={team.team}
      >
        {team.team}
      </div>

      <div className="text-lg font-semibold mb-2">Team #{team.teamNum}</div>
      <div className="text-5xl font-black mt-2">{team.points}</div>
    </div>
  );
});

TeamTile.displayName = 'TeamTile';
