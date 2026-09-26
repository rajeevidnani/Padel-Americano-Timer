
export enum AppState {
  SETUP = 'SETUP',
  PLAYER_NAME_ENTRY = 'PLAYER_NAME_ENTRY', // New state for entering player names
  PLAYING_MATCH = 'PLAYING_MATCH',
  SCORE_ENTRY = 'SCORE_ENTRY',
  FINISHED = 'FINISHED',
}

export interface Settings {
  matchDuration: number; // in minutes
  numPlayers: number; 
  numCourts: number;
  courtBookingDuration: number; // in minutes
  totalMatches: number; // Retained: This will be CALCULATED in SetupForm
}

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface ScheduledMatch {
  matchNumber: number; // Overall match number in the tournament
  team1: [Player, Player];
  team2: [Player, Player];
}

export interface MatchResult {
  matchNumber: number;
  scheduledMatch: ScheduledMatch;
  team1Score: number;
  team2Score: number;
}