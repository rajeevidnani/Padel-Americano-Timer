
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SetupForm } from './components/SetupForm';
import { TimerView } from './components/TimerView';
import { ScoreEntryView } from './components/ScoreEntryView';
import { PlayerNameEntryForm } from './components/PlayerNameEntryForm'; // New Import
import { AppState, Settings, Player, ScheduledMatch, MatchResult } from './types';
import { generateMatchSchedule } from './utils/tournamentUtils';
import { PadelIcon, ResetIcon } from './components/icons';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matchSchedule, setMatchSchedule] = useState<ScheduledMatch[]>([]);
  
  const [overallCurrentMatchIndex, setOverallCurrentMatchIndex] = useState(0); 
  const [currentScoreEntryMatchOffset, setCurrentScoreEntryMatchOffset] = useState(0); 
  
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isPaused, setIsPaused] = useState(true);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [tournamentWarning, setTournamentWarning] = useState<string | null>(null);


  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playNotificationSound = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!audioContextRef.current && (window.AudioContext || (window as any).webkitAudioContext)) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        try {
          if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().catch(e => console.warn("Audio context resume failed:", e));
          }
          const oscillator = audioContextRef.current.createOscillator();
          const gainNode = audioContextRef.current.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContextRef.current.destination);
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime); 
          gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime); 
          oscillator.start();
          oscillator.stop(audioContextRef.current.currentTime + 0.3);
        } catch (error) {
            console.error("Error playing sound:", error);
        }
    }
  }, []);

  useEffect(() => {
    if (appState !== AppState.PLAYING_MATCH || isPaused || timeLeft <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(prevTime => Math.max(0, prevTime - 1));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [appState, isPaused, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && appState === AppState.PLAYING_MATCH && !isPaused && settings) {
      playNotificationSound();
      setAppState(AppState.SCORE_ENTRY);
      setCurrentScoreEntryMatchOffset(0); 
      setIsPaused(true); 
    }
  }, [timeLeft, appState, settings, isPaused, playNotificationSound]);


  const handleSettingsConfirmed = (newSettings: Settings) => {
    setSetupError(null);
    setTournamentWarning(null);
    setSettings(newSettings); 
    
    const initialPlayers: Player[] = Array.from({ length: newSettings.numPlayers }, (_, i) => ({
      id: `player-${i + 1}`,
      name: `Player ${i + 1}`, // Default names
      score: 0,
    }));
    setPlayers(initialPlayers);
    setMatchResults([]);
    setOverallCurrentMatchIndex(0);
    setCurrentScoreEntryMatchOffset(0);
    setAppState(AppState.PLAYER_NAME_ENTRY); 
  };

  const handlePlayerNamesAndStartTournament = (updatedPlayers: Player[]) => {
    setPlayers(updatedPlayers);
    setSetupError(null); // Clear previous errors before generating schedule
    setTournamentWarning(null);

    if (!settings) {
      setSetupError("Critical error: Settings not found. Please restart setup.");
      setAppState(AppState.SETUP);
      return;
    }

    const { schedule, maxUniqueMatches } = generateMatchSchedule(updatedPlayers, settings.totalMatches);
    
    let currentTotalMatches = settings.totalMatches;
    if (settings.totalMatches > maxUniqueMatches && maxUniqueMatches > 0) {
      setTournamentWarning(`Note: Requested ${settings.totalMatches} matches (based on booking time), but only ${maxUniqueMatches} unique matches are possible with ${settings.numPlayers} players. The tournament will run with ${maxUniqueMatches} matches.`);
      currentTotalMatches = maxUniqueMatches;
      setSettings(prev => prev ? {...prev, totalMatches: maxUniqueMatches} : {...settings, totalMatches: maxUniqueMatches}); // Update settings
    } else if (schedule.length === 0 && settings.totalMatches > 0) {
       setSetupError(`Could not generate any matches, though ${settings.totalMatches} were expected. This usually means an issue with player count (need at least 4) or other settings. Please review your settings.`);
       setAppState(AppState.SETUP); // Go back to setup
       return; 
    } else if (schedule.length === 0 && settings.totalMatches === 0) { // This case should ideally be caught in SetupForm
        setSetupError(`Based on your settings (booking duration, match time), no matches could be scheduled. Please adjust your settings.`);
        setAppState(AppState.SETUP); // Go back to setup
        return;
    }
    
    setMatchSchedule(schedule); 
    setTimeLeft(settings.matchDuration * 60);
    setAppState(AppState.PLAYING_MATCH);
    setIsPaused(false);
  };


  const handlePauseResume = () => {
    setIsPaused(prev => !prev);
     if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(e => console.error("Error resuming audio context:", e));
    }
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setAppState(AppState.SETUP);
    // Keep settings so user doesn't have to re-enter everything
    // setSettings(null); 
    setPlayers([]);
    setMatchSchedule([]);
    setOverallCurrentMatchIndex(0);
    setCurrentScoreEntryMatchOffset(0);
    setTimeLeft(0);
    setIsPaused(true);
    setMatchResults([]);
    setSetupError(null);
    setTournamentWarning(null);
  };
  
  const handleBackToSettings = () => {
    setAppState(AppState.SETUP);
    // errors/warnings will persist if relevant
  };

  const handleSkipRound = () => {
    if (!settings || matchSchedule.length === 0 || appState !== AppState.PLAYING_MATCH) return;
    
    playNotificationSound();
    setAppState(AppState.SCORE_ENTRY);
    setCurrentScoreEntryMatchOffset(0); 
    setTimeLeft(0); 
    setIsPaused(true); 
  };

  const handleEndTournamentEarly = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    playNotificationSound();
    setAppState(AppState.FINISHED);
    setIsPaused(true);
  };
  
  const currentRoundMatches = settings ? matchSchedule.slice(overallCurrentMatchIndex, overallCurrentMatchIndex + settings.numCourts) : [];
  const currentMatchForScoreEntry = currentRoundMatches[currentScoreEntryMatchOffset];


  const handleScoreSubmitted = (team1Score: number, team2Score: number) => {
    if (!settings || !currentMatchForScoreEntry) return;

    const matchToRecord = currentMatchForScoreEntry;
    setMatchResults(prev => [...prev, { 
      matchNumber: matchToRecord.matchNumber,
      scheduledMatch: matchToRecord,
      team1Score, 
      team2Score 
    }]);

    setPlayers(prevPlayers => 
      prevPlayers.map(player => {
        let newScore = player.score;
        if (player.id === matchToRecord.team1[0].id || player.id === matchToRecord.team1[1].id) {
          newScore += team1Score;
        } else if (player.id === matchToRecord.team2[0].id || player.id === matchToRecord.team2[1].id) {
          newScore += team2Score;
        }
        return { ...player, score: newScore };
      })
    );
    
    const nextScoreEntryOffset = currentScoreEntryMatchOffset + 1;
    if (nextScoreEntryOffset < currentRoundMatches.length) {
      setCurrentScoreEntryMatchOffset(nextScoreEntryOffset);
    } else {
      const newOverallMatchIndex = overallCurrentMatchIndex + currentRoundMatches.length;
      if (newOverallMatchIndex < matchSchedule.length) {
        setOverallCurrentMatchIndex(newOverallMatchIndex);
        setCurrentScoreEntryMatchOffset(0); 
        setAppState(AppState.PLAYING_MATCH);
        setTimeLeft(settings.matchDuration * 60);
        setIsPaused(false);
      } else {
        setAppState(AppState.FINISHED);
      }
    }
  };
  
  if (appState === AppState.SETUP) {
    return <SetupForm onStart={handleSettingsConfirmed} errorMessage={setupError || tournamentWarning} initialSettings={settings || undefined} />;
  }

  if (appState === AppState.PLAYER_NAME_ENTRY) {
    return <PlayerNameEntryForm 
             initialPlayers={players} 
             onConfirm={handlePlayerNamesAndStartTournament}
             onBackToSettings={handleBackToSettings}
             tournamentWarning={tournamentWarning}
            />;
  }
  
  if (appState === AppState.SCORE_ENTRY && settings && currentMatchForScoreEntry) {
    const numMatchesInCurrentRound = currentRoundMatches.length;
    const isLastScoreInRound = currentScoreEntryMatchOffset === numMatchesInCurrentRound - 1;
    const isLastMatchOfTournament = overallCurrentMatchIndex + numMatchesInCurrentRound >= matchSchedule.length;

    let nextActionLabel = "Confirm Score";
    if (isLastScoreInRound) {
      if (isLastMatchOfTournament) {
        nextActionLabel = "Confirm & View Leaderboard";
      } else {
        nextActionLabel = "Confirm & Start Next Round";
      }
    } else {
      nextActionLabel = `Confirm & Score Next Match (${currentScoreEntryMatchOffset + 2}/${numMatchesInCurrentRound})`;
    }
    
    const currentMatchInRoundDisplay = `Score for match ${currentScoreEntryMatchOffset + 1} of ${numMatchesInCurrentRound} in this round.`;

    return (
      <ScoreEntryView
        scheduledMatch={currentMatchForScoreEntry}
        overallMatchNumber={currentMatchForScoreEntry.matchNumber}
        totalMatchesInSchedule={matchSchedule.length} 
        currentMatchInRoundDisplay={currentMatchInRoundDisplay}
        onSubmitScore={handleScoreSubmitted}
        onResetTournament={handleReset} // This reset takes user to Setup
        nextActionLabel={nextActionLabel}
      />
    );
  }
  
  if (appState === AppState.FINISHED) {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winners = sortedPlayers.filter(p => p.score === sortedPlayers[0]?.score && sortedPlayers[0]?.score > 0);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-950 text-indigo-100 p-6">
        <PadelIcon className="w-24 h-24 text-pink-500 mb-6" />
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-pink-500">Tournament Finished!</h1>
        
        {tournamentWarning && (
          <p className="text-lg text-yellow-300 mb-4 p-3 bg-yellow-700 bg-opacity-50 rounded-md">Note: {tournamentWarning}</p>
        )}

        {winners.length > 0 && (
          <p className="text-2xl text-pink-400 mb-6"> {/* Changed to pink for winners */}
            Winner{winners.length > 1 ? 's' : ''}: {winners.map(w => w.name).join(', ')} with {winners[0].score} points!
          </p>
        )}
        {(winners.length === 0 && players.length > 0 && sortedPlayers[0]?.score === 0) && (
            <p className="text-xl text-indigo-300 mb-6">All players ended with 0 points.</p>
        )}
         {(winners.length === 0 && players.length > 0 && sortedPlayers[0]?.score > 0 && !(winners.length > 0)) && ( 
            <p className="text-xl text-indigo-300 mb-6">Scores tallied. See leaderboard below.</p>
        )}

        <div className="w-full max-w-lg bg-indigo-900 p-6 rounded-xl shadow-xl mb-8">
          <h2 className="text-3xl font-semibold text-pink-400 mb-4 text-center">Leaderboard</h2>
          {sortedPlayers.length > 0 ? (
            <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {sortedPlayers.map((player, index) => (
                <li 
                  key={player.id} 
                  className={`p-3 rounded-lg flex justify-between items-center text-lg ${winners.some(w => w.id === player.id) ? 'bg-pink-500 text-white font-semibold' : 'bg-indigo-800 text-indigo-100'}`} // Winner highlight changed to pink
                >
                  <span>{index + 1}. {player.name}</span>
                  <span className="font-bold">{player.score} pts</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-indigo-400">No player data available.</p>
          )}
        </div>

        {matchResults.length > 0 && (
          <div className="w-full max-w-lg bg-indigo-900 p-6 rounded-xl shadow-xl mb-8">
            <h2 className="text-2xl font-semibold text-pink-400 mb-3 text-center">Match Results</h2>
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 text-sm">
              {matchResults.map(result => (
                <li key={result.matchNumber + Math.random()} className="p-2 bg-indigo-800 rounded text-indigo-200">
                  <span className="font-semibold text-indigo-100">Match {result.scheduledMatch.matchNumber}:</span> {' '}
                  {result.scheduledMatch.team1[0].name} & {result.scheduledMatch.team1[1].name} ({result.team1Score})
                  {' '}vs{' '} 
                  {result.scheduledMatch.team2[0].name} & {result.scheduledMatch.team2[1].name} ({result.team2Score})
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleReset}
          aria-label="Start a new tournament"
          className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-xl hover:shadow-2xl transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 flex items-center"
        >
          <ResetIcon className="w-6 h-6 mr-2"/> Start New Tournament
        </button>
         <footer className="text-center text-indigo-500 mt-12 text-sm opacity-70">
            Padel Americano Timer
        </footer>
      </div>
    );
  }

  if (appState === AppState.PLAYING_MATCH && settings && currentRoundMatches.length > 0) {
    const currentRoundNumber = Math.floor(overallCurrentMatchIndex / settings.numCourts) + 1;
    return (
      <TimerView
        appState={appState}
        timeLeft={timeLeft}
        currentRoundNumber={currentRoundNumber}
        totalMatchesInSchedule={matchSchedule.length} 
        currentRoundMatches={currentRoundMatches}
        isPaused={isPaused}
        onPauseResume={handlePauseResume}
        onSkip={handleSkipRound} 
        onReset={handleReset}
        onEndTournamentEarly={handleEndTournamentEarly}
        tournamentWarning={tournamentWarning} // Pass warning
      />
    );
  }

  // Fallback / Loading or Error state before specific app states are met
  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-950 text-indigo-100 p-4">
          <PadelIcon className="w-16 h-16 text-pink-500 mb-4 animate-pulse" />
          <p className="text-xl mb-4 text-indigo-200">
            {setupError ? "Error:" : (settings && settings.totalMatches === 0 && !setupError && !tournamentWarning ? "No matches could be scheduled. Adjust settings." : "Loading...")}
          </p>
          {(setupError || tournamentWarning) && (
            <div className={`mb-4 p-3 ${setupError ? 'bg-red-600' : 'bg-yellow-600'} text-white rounded-md text-sm`}>
                {setupError || tournamentWarning}
            </div>
          )}
          <button 
            onClick={handleReset} 
            className="mt-4 p-3 bg-pink-500 hover:bg-pink-600 rounded-lg text-white font-semibold flex items-center focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50"
            aria-label="Return to setup screen"
          >
              <ResetIcon className="w-5 h-5 mr-2"/> Go to Setup
          </button>
           <footer className="text-center text-indigo-500 mt-12 text-sm opacity-70">
            Padel Americano Timer
            </footer>
      </div>
  );
};

export default App;
