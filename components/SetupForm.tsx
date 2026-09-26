
import React, { useState } from 'react';
import { Settings } from '../types';
import { PadelIcon, SettingsIcon } from './icons';

interface SetupFormProps {
  onStart: (settings: Settings) => void;
  initialSettings?: Partial<Settings>;
  errorMessage?: string | null; // Can now also show tournamentWarning from App.tsx
}

const OptionButton: React.FC<{ value: string | number; label: string; selectedValue: string | number; onClick: (value: string | number) => void; }> = 
  ({ value, label, selectedValue, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(value)}
    className={`px-3 py-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors duration-150 ease-in-out
                ${selectedValue === value 
                  ? 'bg-pink-500 text-white shadow-md' 
                  : 'bg-indigo-700 text-indigo-200 hover:bg-indigo-600 focus:bg-indigo-600'
                } focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50`}
    aria-pressed={selectedValue === value}
  >
    {label}
  </button>
);


const FIXED_OVERHEAD_MINUTES = 15; // 5 min start, 5 min transitions total, 5 min end results

const courtBookingDurationOptions = [
  { value: 60, label: "60" },
  { value: 90, label: "90" },
  { value: 120, label: "120" },
];

const matchDurationOptions = [
  { value: 10, label: "10" },
  { value: 15, label: "15" },
  { value: 20, label: "20" },
  { value: 30, label: "30" },
];

const numCourtsOptions = [
  { value: 1, label: "1 Court" },
  { value: 2, label: "2 Courts" },
  { value: 3, label: "3 Courts" },
  { value: 4, label: "4 Courts" },
];

const numPlayerOptions = Array.from({ length: 17 }, (_, i) => (i + 4).toString()); // 4 to 20

export const SetupForm: React.FC<SetupFormProps> = ({ onStart, initialSettings, errorMessage }) => {
  const [numPlayers, setNumPlayers] = useState(initialSettings?.numPlayers?.toString() || '8');
  const [matchDuration, setMatchDuration] = useState<number>(initialSettings?.matchDuration || 15);
  const [numCourts, setNumCourts] = useState<number>(initialSettings?.numCourts || 1);
  const [courtBookingDuration, setCourtBookingDuration] = useState<number>(initialSettings?.courtBookingDuration || 120);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null); 

    const parsedNumPlayers = parseInt(numPlayers, 10);
    // matchDuration is now a number from state directly

    if (parsedNumPlayers < 4) {
      setLocalError("Number of players must be at least 4.");
      return;
    }
     if (parsedNumPlayers > 20) { // Max players
      setLocalError("Number of players cannot exceed 20.");
      return;
    }
    if (numCourts < 1 || numCourts > 4) { 
      setLocalError("Number of courts must be between 1 and 4.");
      return;
    }
    if (!courtBookingDurationOptions.some(opt => opt.value === courtBookingDuration)) {
        setLocalError("Please select a valid court booking duration.");
        return;
    }
    if (!matchDurationOptions.some(opt => opt.value === matchDuration)) {
        setLocalError("Please select a valid match duration.");
        return;
    }

    if (matchDuration <= 0) { // Should be caught by selection, but good to keep
      setLocalError("Match duration must be greater than 0 minutes.");
      return;
    }
    if (matchDuration > courtBookingDuration) {
      setLocalError("Match duration cannot exceed court booking duration.");
      return;
    }

    if (courtBookingDuration <= FIXED_OVERHEAD_MINUTES) {
      setLocalError(`Court booking duration must be greater than ${FIXED_OVERHEAD_MINUTES} minutes to account for setup, transitions, and results.`);
      return;
    }

    const netPlayableTime = courtBookingDuration - FIXED_OVERHEAD_MINUTES;
    if (netPlayableTime <= 0) {
        setLocalError("Not enough time for matches after accounting for overheads.");
        return;
    }

    const numPossibleRounds = Math.floor(netPlayableTime / matchDuration);

    if (numPossibleRounds <= 0) {
      setLocalError("Court booking duration is too short for even one round of matches with the specified match duration. Try increasing booking time or reducing match duration.");
      return;
    }

    const calculatedTotalMatches = numPossibleRounds * numCourts;
    if (calculatedTotalMatches <= 0) { // Should be caught by numPossibleRounds check already
        setLocalError("Cannot schedule any matches. Please check your settings.");
        return;
    }

    const settings: Settings = {
      matchDuration: matchDuration,
      totalMatches: calculatedTotalMatches,
      numPlayers: parsedNumPlayers,
      numCourts: numCourts,
      courtBookingDuration: courtBookingDuration,
    };
    
    onStart(settings);
  };

  return (
    <div className="min-h-screen bg-indigo-950 flex flex-col items-center justify-center p-4 text-indigo-100">
      <div className="w-full max-w-md bg-indigo-900 p-8 rounded-xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <PadelIcon className="w-16 h-16 text-pink-500 mb-3" />
          <h1 className="text-3xl font-bold text-center text-pink-500">Padel Americano Timer</h1>
          <p className="text-indigo-300 text-center mt-2">Configure your tournament settings.</p>
        </div>

        {(localError || errorMessage) && (
          <div className={`mb-4 p-3 ${localError ? 'bg-red-600' : 'bg-yellow-600'} text-white rounded-md text-sm`} role="alert">
            {localError || errorMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-indigo-300 mb-2">Court Booking Duration (minutes)</label>
            <div className="flex space-x-2 mt-1">
              {courtBookingDurationOptions.map(option => (
                 <OptionButton
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  selectedValue={courtBookingDuration}
                  onClick={(val) => setCourtBookingDuration(val as number)}
                />
              ))}
            </div>
            <p id="courtBookingDuration-hint" className="text-xs text-indigo-400 mt-1">Total time courts are available. {FIXED_OVERHEAD_MINUTES} mins reserved for setup, transitions & results.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-indigo-300 mb-2">Match Duration (minutes per round)</label>
            <div className="flex space-x-2 mt-1">
              {matchDurationOptions.map(option => (
                 <OptionButton
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  selectedValue={matchDuration}
                  onClick={(val) => setMatchDuration(val as number)}
                />
              ))}
            </div>
            <p id="matchDuration-hint" className="text-xs text-indigo-400 mt-1">Time for each round of matches.</p>
          </div>


          <div>
            <label htmlFor="numPlayers" className="block text-sm font-medium text-indigo-300 mb-2">Number of Players</label>
            <select
              id="numPlayers"
              value={numPlayers}
              onChange={(e) => setNumPlayers(e.target.value)}
              className="mt-1 block w-full px-4 py-3 bg-indigo-800 border border-indigo-700 rounded-md shadow-sm text-indigo-100 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              aria-describedby="numPlayers-hint"
            >
              {numPlayerOptions.map(optionValue => (
                <option key={optionValue} value={optionValue}>{optionValue}</option>
              ))}
            </select>
            <p id="numPlayers-hint" className="text-xs text-indigo-400 mt-1">Select 4 to 20 players.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-indigo-300 mb-2">Number of Courts</label>
            <div className="flex space-x-2 mt-1">
              {numCourtsOptions.map(option => (
                <OptionButton
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  selectedValue={numCourts}
                  onClick={(val) => setNumCourts(val as number)}
                />
              ))}
            </div>
            <p id="numCourts-hint" className="text-xs text-indigo-400 mt-1">Matches will run in parallel.</p>
          </div>
           
          <button
            type="submit"
            className="w-full mt-4 bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 flex items-center justify-center text-lg"
            aria-label="Proceed to Player Name Entry"
          >
            <SettingsIcon className="w-5 h-5 mr-2" />
            Next: Enter Player Names
          </button>
        </form>
      </div>
      <footer className="text-center text-indigo-500 mt-8 text-sm">
        Built for Padel enthusiasts.
      </footer>
    </div>
  );
};
