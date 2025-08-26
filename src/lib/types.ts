// TypeScript interfaces and types for the quiz scorer application

export interface Team {
  team: string;
  teamNum: number;
  scores: (number | null)[];
  points: number;
  questionRounds: string[];
}

export interface ApiResponse {
  data?: string[][];
  error?: string;
}

export type SortOption = "points" | "teamNum";

export interface ParseSheetOptions {
  minTeams?: number;
  maxTeams?: number;
}


