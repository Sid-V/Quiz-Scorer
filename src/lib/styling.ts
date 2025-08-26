import { SortOption } from "./types";

export function isPodiumPosition(position: number, sortBy: SortOption): boolean {
  return sortBy === "points" && position >= 0 && position < 3;
}
