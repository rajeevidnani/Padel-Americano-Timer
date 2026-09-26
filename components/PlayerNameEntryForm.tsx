
import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { PadelIcon, SettingsIcon, CheckCircleIcon } from './icons';

interface PlayerNameEntryFormProps {
  initialPlayers: Player[];
  onConfirm: (updatedPlayers: Player[]) => void;
  onBackToSettings: () => void;
  tournamentWarning?: string | null;
}

export const PlayerNameEntryForm: React.FC<PlayerNameEntryFormProps> = ({ 
  initialPlayers, 
  onConfirm, 
  onBackToSettings,
  tournamentWarning 
}) => {
  const [playerNames, setPlayerNames] = useState<string[]>([]);

  useEffect(() => {
    setPlayerNames(initialPlayers.map(p => p.name));
  }, [initialPlayers]);

  const handleNameChange = (index: number, newName: string) => {
    const updatedNames = [...playerNames];
    updatedNames[index] = newName;
    setPlayerNames(updatedNames);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPlayers = initialPlayers.map((player, index) => ({
      ...player,
      name: playerNames[index] || `Player ${index + 1}`, // Fallback if name is empty
    }));
    onConfirm(updatedPlayers);
  };

  return (
    <div className="min-h-screen bg-indigo-950 flex flex-col items-center justify-center p-4 text-indigo-100">
      <div className="w-full max-w-lg bg-indigo-900 p-8 rounded-xl shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <PadelIcon className="w-16 h-16 text-pink-500 mb-3" />
          <h1 className="text-3xl font-bold text-center text-pink-500">Enter Player Names</h1>
          <p className="text-indigo-300 text-center mt-2">Customize player names or use defaults.</p>
        </div>

        {tournamentWarning && (
          <div className="mb-4 p-3 bg-yellow-600 text-white rounded-md text-sm" role="alert">
            <strong>Warning:</strong> {tournamentWarning}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
          {initialPlayers.map((player, index) => (
            <div key={player.id} className="flex items-center">
              <label htmlFor={`player-name-${index}`} className="sr-only">
                {`Player ${index + 1} Name`}
              </label>
              <span className="text-indigo-300 mr-2 w-20 text-right">{`P.${index + 1}:`}</span>
              <input
                type="text"
                id={`player-name-${index}`}
                value={playerNames[index] || ''}
                onChange={(e) => handleNameChange(index, e.target.value)}
                placeholder={`Player ${index + 1}`}
                className="flex-grow px-4 py-2 bg-indigo-800 border border-indigo-700 rounded-md shadow-sm text-indigo-100 placeholder-indigo-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              />
            </div>
          ))}
        </form>
        
        <div className="mt-8 space-y-3">
            <button
                type="button" // Important: type="button" if it's not submitting the outer form directly
                onClick={handleSubmit}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 flex items-center justify-center text-lg"
                aria-label="Confirm player names and start tournament"
            >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Confirm Names & Start
            </button>
            <button
                type="button"
                onClick={onBackToSettings}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 flex items-center justify-center text-base"
                aria-label="Back to settings"
            >
                Back to Settings
            </button>
        </div>

      </div>
      <footer className="text-center text-indigo-500 mt-8 text-sm">
        Tournament setup step 2 of 2.
      </footer>
    </div>
  );
};
