
import { Player, ScheduledMatch } from '../types';

// Helper function to generate combinations C(n, k)
export function getCombinations<T>(array: T[], k: number): T[][] {
  const result: T[][] = [];
  const n = array.length;

  function backtrack(start: number, currentCombination: T[]) {
    if (currentCombination.length === k) {
      result.push([...currentCombination]);
      return;
    }
    if (start === n) {
      return;
    }
    // Include array[start]
    currentCombination.push(array[start]);
    backtrack(start + 1, currentCombination);
    currentCombination.pop();
    // Exclude array[start]
    backtrack(start + 1, currentCombination);
  }

  backtrack(0, []);
  return result;
}

export const generateMatchSchedule = (
  players: Player[],
  numTotalMatchesToSchedule: number
): { schedule: ScheduledMatch[], maxUniqueMatches: number } => {
  const n = players.length;
  if (n < 4) {
    return { schedule: [], maxUniqueMatches: 0 };
  }

  const allPossibleMatches: ScheduledMatch[] = [];

  // Get all combinations of 4 players
  const playerCombinationsOf4 = getCombinations(players, 4);

  let matchCounter = 1;
  for (const fourPlayers of playerCombinationsOf4) {
    // For each combination of 4, there are 3 ways to form two teams
    // P1, P2, P3, P4
    // Match 1: (P1,P2) vs (P3,P4)
    allPossibleMatches.push({
      matchNumber: 0, // Will be re-assigned later
      team1: [fourPlayers[0], fourPlayers[1]],
      team2: [fourPlayers[2], fourPlayers[3]],
    });
    // Match 2: (P1,P3) vs (P2,P4)
    allPossibleMatches.push({
      matchNumber: 0,
      team1: [fourPlayers[0], fourPlayers[2]],
      team2: [fourPlayers[1], fourPlayers[3]],
    });
    // Match 3: (P1,P4) vs (P2,P3)
    allPossibleMatches.push({
      matchNumber: 0,
      team1: [fourPlayers[0], fourPlayers[3]],
      team2: [fourPlayers[1], fourPlayers[2]],
    });
  }

  // Shuffle the generated unique matches
  for (let i = allPossibleMatches.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPossibleMatches[i], allPossibleMatches[j]] = [allPossibleMatches[j], allPossibleMatches[i]];
  }
  
  const maxUniqueMatches = allPossibleMatches.length;
  const actualMatchesToSchedule = Math.min(numTotalMatchesToSchedule, maxUniqueMatches);
  
  const finalSchedule = allPossibleMatches.slice(0, actualMatchesToSchedule).map((match, index) => ({
    ...match,
    matchNumber: index + 1,
  }));

  return { schedule: finalSchedule, maxUniqueMatches };
};
