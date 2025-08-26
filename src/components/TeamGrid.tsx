import { memo } from 'react';
import { Team, SortOption } from '../lib/types';
import { TeamTile } from './TeamTile';

interface TeamGridProps {
  teams: Team[];
  sortBy: SortOption;
}

export const TeamGrid = memo<TeamGridProps>(({ teams, sortBy }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl mx-auto">
      {teams.map((team, idx) => (
        <TeamTile key={team.teamNum} team={team} position={idx} sortBy={sortBy} />
      ))}
    </div>
  );
});

TeamGrid.displayName = 'TeamGrid';
