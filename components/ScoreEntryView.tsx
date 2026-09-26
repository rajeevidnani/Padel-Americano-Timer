
import React, { useState } from 'react';
import { ScheduledMatch } from '../types';
import { PadelIcon, DocumentTextIcon, CheckCircleIcon, ResetIcon } from './icons';

interface ScoreEntryViewProps {
  scheduledMatch: ScheduledMatch;
  overallMatchNumber: number;
  totalMatchesInSchedule: number;
  currentMatchInRoundDisplay: string;
  onSubmitScore: (team1Score: number, team2Score: number) => void;
  onResetTournament: () => void;
  nextActionLabel: string;
}

const ScoreButton: React.FC<{
  value: number;
  onClick: (value: number) => void;
  isSelected: boolean;
  className?: string;
}> = ({ value, onClick, isSelected, className }) => (
  <button
    type="button"
    onClick={() => onClick(value)}
    className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg text-xl sm:text-2xl font-bold transition-all duration-150 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-opacity-60
                ${isSelected
                  ? 'bg-pink-500 text-white shadow-lg scale-105 ring-pink-300'
                  : 'bg-indigo-700 text-indigo-200 hover:bg-indigo-600 focus:bg-indigo-600 ring-indigo-500'
                } ${className}`}
    aria-pressed={isSelected}
  >
    {value}
  </button>
);

export const ScoreEntryView: React.FC<ScoreEntryViewProps> = ({
  scheduledMatch,
  overallMatchNumber,
  totalMatchesInSchedule,
  currentMatchInRoundDisplay,
  onSubmitScore,
  onResetTournament,
  nextActionLabel,
}) => {
  const [team1Score, setTeam1Score] = useState<number | null>(null);
  const [team2Score, setTeam2Score] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (team1Score === null || team2Score === null) {
      setError('Please select scores for both teams.');
      return;
    }
    // Negative scores are not possible with button interface
    onSubmitScore(team1Score, team2Score);
  };

  const { team1, team2 } = scheduledMatch;
  const scoreOptions = Array.from({ length: 10 }, (_, i) => i); // 0-9

  const renderScoreSelector = (
    teamName: string,
    currentScore: number | null,
    setScore: (score: number) => void,
    playerNames: string
  ) => (
    <div className="p-3 sm:p-4 bg-indigo-800 rounded-lg w-full">
      <h3 className="text-lg sm:text-xl font-semibold text-indigo-100 mb-1">{teamName}</h3>
      <p className="text-xs sm:text-sm text-indigo-300 mb-2 truncate">{playerNames}</p>
      <div className="text-5xl sm:text-6xl font-bold text-pink-400 mb-3 h-16 sm:h-20 flex items-center justify-center bg-indigo-950 rounded-md">
        {currentScore !== null ? currentScore : '-'}
      </div>
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {scoreOptions.map((scoreVal) => (
          <ScoreButton
            key={`${teamName}-score-${scoreVal}`}
            value={scoreVal}
            onClick={setScore}
            isSelected={currentScore === scoreVal}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-indigo-950 flex flex-col items-center justify-center p-4 text-indigo-100">
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6">
        <PadelIcon className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-100 opacity-50" />
      </div>
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6">
        <button
            onClick={onResetTournament}
            title="Reset Tournament"
            className="p-2 sm:p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50"
            aria-label="Reset Tournament"
        >
          <ResetIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      <div className="w-full max-w-3xl bg-indigo-900 p-5 sm:p-8 rounded-xl shadow-2xl text-center">
        <DocumentTextIcon className="w-12 h-12 sm:w-16 sm:h-16 text-pink-500 mx-auto mb-3 sm:mb-4" />
        <h1 className="text-2xl sm:text-3xl font-bold text-pink-500 mb-1">
          Enter Match Scores
        </h1>
        <p className="text-indigo-300 mb-1 text-xs sm:text-sm">Overall Match {overallMatchNumber} / {totalMatchesInSchedule}</p>
        <p className="text-indigo-300 mb-4 font-semibold text-xs sm:text-sm">{currentMatchInRoundDisplay}</p>

        {error && <p className="text-red-400 bg-red-900 p-2 rounded-md mb-3 text-sm">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 mb-6">
            {renderScoreSelector(
              "Team 1 Score",
              team1Score,
              setTeam1Score,
              `${team1[0].name} & ${team1[1].name}`
            )}
            
            <div className="text-2xl font-bold text-indigo-200 flex items-center justify-center md:my-0 py-0">VS</div>

            {renderScoreSelector(
              "Team 2 Score",
              team2Score,
              setTeam2Score,
              `${team2[0].name} & ${team2[1].name}`
            )}
          </div>
          
          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 flex items-center justify-center text-lg sm:text-xl"
            aria-label={nextActionLabel}
          >
            <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
            {nextActionLabel}
          </button>
        </form>
      </div>
       <footer className="text-center text-indigo-500 mt-8 sm:mt-12 text-xs sm:text-sm opacity-70">
        Padel Americano Timer
      </footer>
    </div>
  );
};
