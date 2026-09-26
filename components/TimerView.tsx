
import React from 'react';
import { AppState, ScheduledMatch } from '../types';
import { formatTime } from '../utils/formatTime';
import { PlayIcon, PauseIcon, SkipNextIcon, ResetIcon, PadelIcon, StopIcon } from './icons';

interface TimerViewProps {
  appState: AppState;
  timeLeft: number; // in seconds
  currentRoundNumber: number;
  totalMatchesInSchedule: number; 
  currentRoundMatches: ScheduledMatch[]; 
  isPaused: boolean;
  onPauseResume: () => void;
  onSkip: () => void;
  onReset: () => void;
  onEndTournamentEarly: () => void;
  tournamentWarning?: string | null;
}

const ControlButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string, title: string, size?: 'small' | 'large' }> = 
    ({ onClick, children, className, title, size = 'large' }) => {
    const sizeClasses = size === 'large' ? 'p-4' : 'p-3';
    const iconSizeClasses = size === 'large' ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-6 h-6';
    
    return (
        <button
            onClick={onClick}
            title={title}
            aria-label={title}
            className={`rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-60 ${sizeClasses} ${className}`}
        >
            {React.isValidElement(children) ? React.cloneElement(children as React.ReactElement<{ className?: string }>, { className: iconSizeClasses }) : children}
        </button>
    );
};


export const TimerView: React.FC<TimerViewProps> = ({
  appState,
  timeLeft,
  currentRoundNumber,
  totalMatchesInSchedule,
  currentRoundMatches,
  isPaused,
  onPauseResume,
  onSkip,
  onReset,
  onEndTournamentEarly,
  tournamentWarning,
}) => {
  let statusText = '';
  // Consistent dark background for the timer view
  const bgColor = appState === AppState.PLAYING_MATCH || appState === AppState.SCORE_ENTRY ? 'bg-purple-950' : 'bg-indigo-950';
  // Status text color adjusted for better contrast on dark purple
  const headerTextColor = appState === AppState.PLAYING_MATCH || appState === AppState.SCORE_ENTRY ? 'text-indigo-200' : 'text-pink-400';
  
  if (appState === AppState.PLAYING_MATCH) {
    const firstMatchNum = currentRoundMatches[0]?.matchNumber || 0;
    const lastMatchNum = currentRoundMatches[currentRoundMatches.length - 1]?.matchNumber || 0;
    if (currentRoundMatches.length > 1) {
        statusText = `Round ${currentRoundNumber} (Matches ${firstMatchNum}-${lastMatchNum} of ${totalMatchesInSchedule})`;
    } else if (currentRoundMatches.length === 1) {
         statusText = `Round ${currentRoundNumber} (Match ${firstMatchNum} of ${totalMatchesInSchedule})`;
    } else {
        statusText = `Round ${currentRoundNumber}`; 
    }
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 text-indigo-100 transition-colors duration-500 ${bgColor}`}>
      <header className="w-full flex justify-between items-center">
        <PadelIcon className="w-10 h-10 text-indigo-100 opacity-60" />
        <div className="flex space-x-3">
            <ControlButton 
                onClick={onEndTournamentEarly}
                className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
                title="End Tournament Early"
                size="small"
            >
                <StopIcon />
            </ControlButton>
            <ControlButton 
                onClick={onReset} 
                className="bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500"
                title="Reset Tournament"
                size="small"
            >
              <ResetIcon />
            </ControlButton>
        </div>
      </header>

      <main className="flex flex-col items-center w-full flex-grow justify-center">
        {tournamentWarning && (
            <div className="mb-4 p-3 bg-yellow-600 text-white rounded-md text-sm max-w-xl text-center" role="alert">
                 {tournamentWarning}
            </div>
        )}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className={`text-2xl sm:text-3xl font-semibold ${headerTextColor} mb-2`}>{statusText}</h2>
          {isPaused && appState !== AppState.FINISHED && (
            <p className="text-xl text-yellow-400 animate-pulse font-medium">PAUSED</p>
          )}
        </div>

        <div className="relative w-60 h-60 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full flex items-center justify-center border-8 border-pink-500 border-opacity-70 shadow-2xl mb-8 sm:mb-10 bg-black bg-opacity-30">
          <div className={`text-6xl sm:text-7xl font-mono font-bold ${isPaused ? 'text-pink-700' : 'text-pink-400'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
        
        <div className="w-full max-w-4xl px-2 mb-8">
          <h3 className="text-xl text-indigo-200 mb-4 text-center font-medium">Ongoing Matches</h3>
          <div className={`grid grid-cols-1 ${currentRoundMatches.length > 1 ? 'md:grid-cols-2' : ''} gap-4 max-h-[30vh] overflow-y-auto p-1 rounded-lg`}>
            {currentRoundMatches.map((match, index) => (
              <div 
                key={match.matchNumber} 
                className="bg-indigo-800 bg-opacity-75 backdrop-blur-lg p-4 rounded-xl shadow-xl border border-pink-500 border-opacity-25"
              >
                <p className="text-lg font-semibold text-pink-400 mb-2">Court {index + 1} 
                  <span className="text-xs text-indigo-400 ml-1">(Match {match.matchNumber})</span>
                </p>
                <div className="space-y-1">
                    <p className="text-sm sm:text-base text-indigo-100 truncate">
                    {match.team1[0].name} &amp; {match.team1[1].name}
                    </p>
                    <p className="text-sm text-indigo-300 font-bold my-1 text-center">vs</p>
                    <p className="text-sm sm:text-base text-indigo-100 truncate">
                    {match.team2[0].name} &amp; {match.team2[1].name}
                    </p>
                </div>
              </div>
            ))}
             {currentRoundMatches.length === 0 && (
                <p className="text-center text-indigo-400 col-span-full">No matches currently active for this round.</p>
            )}
          </div>
        </div>
        
        <div className="flex space-x-6 sm:space-x-8 items-center">
          <ControlButton 
              onClick={onPauseResume}
              className={`${isPaused ? 'bg-green-500 hover:bg-green-600 focus:ring-green-400' : 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400'} text-white shadow-xl`}
              title={isPaused ? "Resume Timer" : "Pause Timer"}
              >
            {isPaused ? <PlayIcon /> : <PauseIcon />}
          </ControlButton>
          
          <ControlButton 
              onClick={onSkip} 
              className="bg-rose-500 hover:bg-rose-600 text-white shadow-xl focus:ring-rose-400"
              title="Skip Current Round" 
              >
            <SkipNextIcon />
          </ControlButton>
        </div>
      </main>
       <footer className="text-center text-indigo-500 mt-8 text-sm opacity-70 pb-2">
        Padel Americano Timer
      </footer>
    </div>
  );
};
