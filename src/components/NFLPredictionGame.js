'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/useUserStore';

// Fetch upcoming games from the API
async function fetchUpcomingGames() {
  console.log("🔍 Starting fetchUpcomingGames");

  try {
    const url = '/api/games?limit=16';
    console.log(`📍 Fetching from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit'
    });

    console.log(`📊 Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`API returned status ${response.status}:`, errorText);
      return { games: [], season: null, week: null };
    }

    const data = await response.json();
    console.log(`📡 API Response:`, JSON.stringify(data, null, 2));
    
    const games = data.games || [];
    const season = data.meta?.season ?? null;
    const week = data.meta?.week ?? null;

    console.log(`✅ Found ${games.length} games (season=${season}, week=${week})`);
    console.log(`📋 First game:`, games[0]);
    
    return { games, season, week };

  } catch (error) {
    console.error('💥 Error fetching games:', error);
    return { games: [], season: null, week: null };
  }
}

// Format game date for display
function formatGameDate(dateString) {
  try {
    const date = new Date(dateString);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return {
      dayName,
      date: `${month} ${day}`,
      time,
      fullDate: `${dayName} ${month} ${day}`
    };
  } catch (error) {
    return {
      dayName: 'TBD',
      date: 'TBD',
      time: 'TBD',
      fullDate: 'TBD'
    };
  }
}

// Fetch leaderboard data from API
async function fetchLeaderboard(season, week = null) {
  try {
    const url = `/api/leaderboard?season=${season}${week ? `&week=${week}` : ''}&limit=100`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.entries || [];
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

// Load the current user's saved picks from the API
async function loadUserPicks(season, week = null) {
  try {
    const url = `/api/picks?season=${season}${week ? `&week=${week}` : ''}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) return {};
    const data = await response.json();
    // Convert array to { gameKey: pick_side } map
    const map = {};
    for (const p of data.picks || []) {
      map[p.gameKey] = p.pick;
    }
    return map;
  } catch (err) {
    console.error('Error loading user picks:', err);
    return {};
  }
}

const NFLPredictionGame = () => {
  const { profile } = useUserStore();
  const router = useRouter();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [picks, setPicks] = useState({}); // { gameKey: 'home' | 'away' }
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [activeSeason, setActiveSeason] = useState(null); // detected from API
  const [selectedYear, setSelectedYear] = useState(null); // year dropdown
  const [viewMode, setViewMode] = useState('predictions'); // 'predictions' or 'leaderboard'
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [submitState, setSubmitState] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error' | 'locked'

  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        setError(null);
        const { games: gamesData, season, week } = await fetchUpcomingGames();
        const detectedSeason = season ?? new Date().getFullYear();
        setActiveSeason(detectedSeason);
        setSelectedYear(prev => prev ?? detectedSeason); // only set on first load
        if (week) setSelectedWeek(week);
        const savedPicks = await loadUserPicks(detectedSeason);
        setGames(gamesData ?? []);
        setPicks(prev => ({ ...savedPicks, ...prev }));
      } catch (err) {
        console.error('Error loading games:', err);
        setError('Failed to load games. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadGames();
    const interval = setInterval(loadGames, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePick = async (gameKey, teamType) => {
    const currentPick = picks[gameKey];
    const isToggleOff = currentPick === teamType;

    // Optimistic update
    setPicks(prev => ({
      ...prev,
      [gameKey]: isToggleOff ? null : teamType,
    }));

    if (!isToggleOff) {
      // New pick / change pick — show confetti and advance
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      if (selectedGameIndex < games.length - 1) {
        setSelectedGameIndex(selectedGameIndex + 1);
      }
      // Persist to backend (non-blocking)
      fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gameKey, pick: teamType }),
      }).catch(err => console.error('Failed to submit pick:', err));
    } else {
      // Toggle off — delete from backend
      fetch(`/api/picks?gameKey=${encodeURIComponent(gameKey)}`, {
        method: 'DELETE',
        credentials: 'include',
      }).catch(err => console.error('Failed to delete pick:', err));
    }
  };

  const clearPick = (gameKey) => {
    setPicks(prev => {
      const newPicks = { ...prev };
      delete newPicks[gameKey];
      return newPicks;
    });
    fetch(`/api/picks?gameKey=${encodeURIComponent(gameKey)}`, {
      method: 'DELETE',
      credentials: 'include',
    }).catch(err => console.error('Failed to delete pick:', err));
  };

  const handleSubmit = async () => {
    if (!gamePick || submitState === 'saving') return;
    setSubmitState('saving');
    try {
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gameKey: selectedGame.gameKey, pick: gamePick }),
      });
      if (res.status === 401) {
        setSubmitState('error');
        setTimeout(() => setSubmitState('idle'), 3000);
        return;
      }
      if (res.status === 409) {
        setSubmitState('locked');
        setTimeout(() => setSubmitState('idle'), 3000);
        return;
      }
      if (!res.ok) throw new Error('save failed');
      setSubmitState('saved');
      setTimeout(() => setSubmitState('idle'), 2500);
    } catch (err) {
      console.error('Submit error:', err);
      setSubmitState('error');
      setTimeout(() => setSubmitState('idle'), 3000);
    }
  };

  const handleYearChange = async (year) => {
    setSelectedYear(year);
    setActiveSeason(year);
    setLoading(true);
    try {
      const res = await fetch(`/api/games?season=${year}&limit=16`);
      const data = await res.json();
      const gamesData = data.games || [];
      setGames(gamesData);
      setSelectedWeek(data.meta?.week ?? 1);
      setSelectedGameIndex(0);
      const savedPicks = await loadUserPicks(year);
      setPicks(savedPicks);
      if (viewMode === 'leaderboard') {
        setLeaderboardLoading(true);
        const lb = await fetchLeaderboard(year, null);
        setLeaderboardData(lb);
        setLeaderboardLoading(false);
      }
    } catch (err) {
      console.error('Error changing year:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLeaderboard = async () => {
    if (viewMode === 'predictions') {
      setLeaderboardLoading(true);
      const season = activeSeason ?? new Date().getFullYear();
      const data = await fetchLeaderboard(season, null);
      setLeaderboardData(data);
      setLeaderboardLoading(false);
      setViewMode('leaderboard');
    } else {
      // Switch back to predictions
      setViewMode('predictions');
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-lg mb-8 min-h-96">
        <div className="text-center py-16">
          <div className="text-2xl font-bold mb-2">🏈 NFL Prediction Game</div>
          <div className="text-gray-300 animate-pulse">Loading games...</div>
        </div>
      </div>
    );
  }

  if (error || !games || games.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-lg mb-8">
        <div className="text-center py-16">
          <div className="text-2xl font-bold mb-2">🏈 NFL Prediction Game</div>
          <div className="text-gray-300">{error || 'No upcoming games found'}</div>
        </div>
      </div>
    );
  }

  const selectedGame = games[selectedGameIndex];
  const gameDate = formatGameDate(selectedGame.date);
  const gamePick = picks[selectedGame.gameKey];
  const pickCount = Object.keys(picks).filter(k => picks[k]).length;

  return (
    <div className="w-full">
      {/* Confetti Animation */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={150}
        />
      )}

      {/* Main Container Box */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-lg border border-slate-600 shadow-2xl overflow-hidden mb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 text-white px-6 py-4 border-b border-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-4xl select-none" aria-hidden="true">🏈</span>
            <div>
              <h2 className="text-2xl font-black mb-1" style={{ fontFamily: 'Inter', fontWeight: 700 }}>
                Predictions
              </h2>
              <p className="text-gray-300 text-sm" style={{ fontFamily: 'Inter', fontWeight: 600 }}>
                Pick the winners and climb the leaderboard!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <select
              value={selectedYear ?? activeSeason ?? new Date().getFullYear()}
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
              className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg px-3 py-2 border border-slate-500 cursor-pointer focus:outline-none focus:border-blue-400"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          <motion.button
            onClick={() => router.push(`/leaderboard?season=${activeSeason ?? new Date().getFullYear()}`)}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="View Full Leaderboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </motion.button>
          </div>
        </div>

        {/* Leaderboard View */}
        {viewMode === 'leaderboard' ? (
          <div className="p-6 h-[520px] flex flex-col">
            {leaderboardLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-white animate-pulse">Loading leaderboard...</div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-white text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-slate-500 bg-slate-800">
                      <th className="px-3 py-3 text-left w-14">Rank</th>
                      <th className="px-3 py-3 text-left">Player</th>
                      <th className="px-1 py-3 w-24"></th>
                      <th className="px-3 py-3 text-center w-24">Record</th>
                      <th className="px-3 py-3 text-center w-32">Prizes</th>
                      <th className="px-3 py-3 text-center w-20">Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 100 }, (_, i) => {
                      const entry = leaderboardData[i];
                      const rankBadge =
                        i === 0 ? '🥇' :
                        i === 1 ? '🥈' :
                        i === 2 ? '🥉' :
                        `#${i + 1}`;
                      const prizeBadge =
                        i === 0 ? { label: '🏆 Champion', cls: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' } :
                        i === 1 ? { label: '🥈 Runner-up', cls: 'bg-gray-400/20 text-gray-300 border border-gray-400/40' } :
                        i === 2 ? { label: '🥉 3rd Place', cls: 'bg-orange-600/20 text-orange-300 border border-orange-600/40' } :
                        i < 10  ? { label: entry ? `⭐ ${entry.points} pts` : '—', cls: 'bg-slate-600/30 text-slate-300 border border-slate-500/40' } :
                                  { label: entry ? `${entry.points} pts` : '—', cls: 'text-gray-500' };
                      const streak = entry?.streak;
                      const streakLabel = streak ? `${streak.type}${streak.count}` : '—';
                      const streakColor = !streak ? 'text-gray-600' :
                        streak.type === 'W' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold';
                      return (
                        <tr
                          key={i}
                          className={`border-b border-slate-700/50 transition-colors ${
                            entry
                              ? i === 0 ? 'bg-yellow-500/10 hover:bg-yellow-500/20' :
                                i === 1 ? 'bg-gray-400/10 hover:bg-gray-400/20' :
                                i === 2 ? 'bg-orange-600/10 hover:bg-orange-600/20' :
                                'hover:bg-slate-700/30'
                              : 'opacity-30'
                          }`}
                        >
                          <td className="px-3 py-2.5 font-bold text-base">{rankBadge}</td>
                          <td className="px-3 py-2.5 font-semibold">
                            {entry ? entry.user.displayName : <span className="text-gray-600 text-xs italic">Open slot</span>}
                          </td>
                          <td className="px-1 py-2.5 text-right">
                            {entry && entry.user.id === profile?.id && (
                              <button
                                onClick={() => setViewMode('predictions')}
                                className="text-xs text-blue-400 underline cursor-pointer hover:text-blue-300 transition-colors whitespace-nowrap"
                              >
                                View Picks
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {entry ? (
                              <span className="whitespace-nowrap"><span className="text-green-300">{entry.correct}</span><span className="text-gray-500">-</span><span className="text-red-300">{entry.incorrect}</span></span>
                            ) : <span className="text-gray-600">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${prizeBadge.cls}`}>
                              {prizeBadge.label}
                            </span>
                          </td>
                          <td className={`px-3 py-2.5 text-center font-mono text-sm ${streakColor}`}>{streakLabel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          // Predictions View
          <>
        
        <div className="flex gap-6 p-6 h-[520px]">
        {/* Right Side - Game Carousel (30%) */}
        <div className="w-[30%] flex flex-col gap-4 order-2 h-full">
          {/* Header - Week Dropdown */}
          <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-4 py-3 rounded-lg border border-slate-500 flex items-center gap-3">
            <label htmlFor="week-select" className="text-sm font-bold text-gray-300">Week:</label>
            <select
              id="week-select"
              value={selectedWeek}
              onChange={(e) => {
                setSelectedWeek(parseInt(e.target.value));
                setSelectedGameIndex(0);
              }}
              className="flex-1 px-3 py-1 bg-slate-700 text-white border border-slate-500 rounded text-sm font-semibold focus:outline-none focus:border-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((week) => (
                <option key={week} value={week}>
                  Week {week}
                </option>
              ))}
            </select>
          </div>

          {/* Scrollable Carousel */}
          <div className="rounded-lg border border-slate-500 overflow-y-auto bg-slate-700 flex flex-col max-h-[360px]">
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence>
                {games.filter(game => game.week === selectedWeek).map((game, index) => {
                  const isSelected = index === selectedGameIndex;
                  const gamePickStatus = picks[game.gameKey];
                  const carouselDate = formatGameDate(game.date);
                  const isLocked = ['final', 'live', 'postponed', 'cancelled'].includes((game.status || '').toLowerCase());

                  return (
                    <motion.button
                      key={game.id}
                      onClick={() => setSelectedGameIndex(index)}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`w-full p-3 border-b border-slate-700 text-left transition-all relative ${
                        gamePickStatus
                          ? 'bg-green-600/40 border-l-4 border-l-green-500'
                          : isSelected
                          ? 'bg-blue-600/30 border-l-4 border-l-blue-500'
                          : 'hover:bg-slate-700/50'
                      } ${isLocked ? 'opacity-60' : ''}`}
                    >
                      {/* Game Info */}
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-xs text-gray-400 font-semibold uppercase">
                          {carouselDate.dayName} {carouselDate.time}
                        </div>
                        {isLocked && (
                          <span className="text-xs text-red-400 font-bold">
                            {game.status === 'live' ? '🔴 Live' : '🔒 Final'}
                          </span>
                        )}
                      </div>

                      {/* Team Logos and Names */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1 flex-1">
                          <img
                            src={game.awayTeam.logo}
                            alt={game.awayTeam.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjNjM3NTkxIi8+Cjwvc3ZnPg==';
                            }}
                          />
                          <span className="text-xs font-semibold text-gray-200 truncate">
                            {game.awayTeam.name.split(' ').pop()}
                          </span>
                        </div>

                        <div className="text-xs text-gray-500">@</div>

                        <div className="flex items-center gap-1 flex-1 justify-end">
                          <span className="text-xs font-semibold text-gray-200 truncate">
                            {game.homeTeam.name.split(' ').pop()}
                          </span>
                          <img
                            src={game.homeTeam.logo}
                            alt={game.homeTeam.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjNjM3NTkxIi8+Cjwvc3ZnPg==';
                            }}
                          />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
              {games.filter(game => game.week === selectedWeek).length === 0 && (
                <div className="flex items-center justify-center h-[360px] text-center p-4">
                  <div>
                    <div className="text-gray-400 text-sm font-semibold mb-2">No games available</div>
                    <div className="text-gray-500 text-xs">Check back for Week {selectedWeek} games</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button Below Carousel */}
          <motion.button
            onClick={handleSubmit}
            disabled={!gamePick || submitState === 'saving' || submitState === 'saved'}
            className={`px-10 py-3 text-white text-base font-extrabold rounded transition-all shadow-lg w-full mt-auto ${
              submitState === 'saved'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 cursor-default'
                : submitState === 'error'
                ? 'bg-gradient-to-r from-red-600 to-red-700 cursor-pointer'
                : submitState === 'locked'
                ? 'bg-gradient-to-r from-yellow-700 to-yellow-800 cursor-pointer'
                : gamePick
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-xl cursor-pointer'
                : 'bg-gradient-to-r from-gray-600 to-gray-700 opacity-50 cursor-not-allowed'
            }`}
            whileHover={gamePick && submitState === 'idle' ? { scale: 1.05 } : {}}
            whileTap={gamePick && submitState === 'idle' ? { scale: 0.95 } : {}}
          >
            {submitState === 'saving' && 'Saving...'}
            {submitState === 'saved' && '✓ Pick Saved!'}
            {submitState === 'error' && 'Login to Save'}
            {submitState === 'locked' && '🔒 Game Has Ended'}
            {submitState === 'idle' && 'Submit Pick'}
          </motion.button>
        </div>

        {/* Left Side - Featured Matchup (70%) */}
        {games.filter(game => game.week === selectedWeek).length > 0 ? (
        <motion.div
          key={selectedGame.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg overflow-hidden border border-slate-500 shadow-lg relative h-full flex flex-col"
        >
          {/* Background Ghosted Logos */}
          <div className="absolute -left-24 top-[55%] -translate-y-1/2 opacity-10 pointer-events-none z-0">
            <img
              src={selectedGame.awayTeam.logo}
              alt=""
              className="w-80 h-80 object-contain"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgdmlld0JveD0iMCAwIDMyMCAzMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMzIwIiBmaWxsPSIjNjM3NTkxIi8+Cjwvc3ZnPg==';
              }}
            />
          </div>
          <div className="absolute -right-24 top-[55%] -translate-y-1/2 opacity-10 pointer-events-none z-0">
            <img
              src={selectedGame.homeTeam.logo}
              alt=""
              className="w-80 h-80 object-contain"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgdmlld0JveD0iMCAwIDMyMCAzMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMzIwIiBmaWxsPSIjNjM3NTkxIi8+Cjwvc3ZnPg==';
              }}
            />
          </div>
          {/* Game Header */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 border-b border-slate-600 relative z-10">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="text-xs text-gray-200 font-semibold uppercase">
                {gameDate.fullDate} • {gameDate.time}
              </div>
              <div className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded whitespace-nowrap">
                Week {selectedGame.week}
              </div>
            </div>
            <div className="text-sm text-gray-100">
              {selectedGame.venue} • {selectedGame.broadcast}
            </div>
          </div>

          {/* Matchup Display */}
          <div className="p-4 relative z-10 flex-1 flex flex-col">
            {/* Teams in Large Display */}
            <div className="mb-4 flex-1 flex flex-col">
              {/* Away Team */}
              <motion.button
                onClick={() => handlePick(selectedGame.gameKey, 'away')}
                className={`flex-1 w-full mb-2 p-4 rounded-lg transition-all border-2 flex items-center justify-between ${
                  gamePick === 'away'
                    ? 'border-blue-500 bg-blue-600/20 shadow-lg shadow-blue-500/20'
                    : 'border-slate-600 bg-slate-700/90 hover:bg-slate-700 hover:border-slate-500'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={selectedGame.awayTeam.logo}
                    alt={selectedGame.awayTeam.name}
                    className="w-20 h-20 object-contain"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjNjM3NTkxIi8+Cjwvc3ZnPg==';
                    }}
                  />
                  <div className="flex-1 text-left">
                    <div className="font-bold text-xl text-white">{selectedGame.awayTeam.name}</div>
                    <div className="text-sm text-gray-100 mt-1">{selectedGame.awayTeam.record}</div>
                  </div>
                </div>
                {gamePick === 'away' && (
                  <motion.div
                    onClick={(e) => {
                      e.stopPropagation();
                      clearPick(selectedGame.gameKey);
                    }}
                    className="ml-4 px-3 py-2 bg-red-600/30 hover:bg-red-600/40 text-red-300 text-base font-bold rounded transition-colors cursor-pointer whitespace-nowrap"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✕
                  </motion.div>
                )}
              </motion.button>

              {/* VS Divider */}
              <div className="flex items-center gap-4 mb-2 justify-center">
                <div className="flex-1 h-px bg-slate-400 max-w-xs"></div>
                <div className="text-lg text-gray-100 font-bold">VS</div>
                <div className="flex-1 h-px bg-slate-400 max-w-xs"></div>
              </div>

              {/* Home Team */}
              <motion.button
                onClick={() => handlePick(selectedGame.gameKey, 'home')}
                className={`flex-1 w-full p-4 rounded-lg transition-all border-2 flex items-center justify-between ${
                  gamePick === 'home'
                    ? 'border-green-500 bg-green-600/20 shadow-lg shadow-green-500/20'
                    : 'border-slate-600 bg-slate-700/90 hover:bg-slate-700 hover:border-slate-500'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={selectedGame.homeTeam.logo}
                    alt={selectedGame.homeTeam.name}
                    className="w-20 h-20 object-contain"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjNjM3NTkxIi8+Cjwvc3ZnPg==';
                    }}
                  />
                  <div className="flex-1 text-left">
                    <div className="font-bold text-xl text-white">{selectedGame.homeTeam.name}</div>
                    <div className="text-sm text-gray-100 mt-1">{selectedGame.homeTeam.record}</div>
                  </div>
                </div>
                {gamePick === 'home' && (
                  <motion.div
                    onClick={(e) => {
                      e.stopPropagation();
                      clearPick(selectedGame.gameKey);
                    }}
                    className="ml-4 px-3 py-2 bg-red-600/30 hover:bg-red-600/40 text-red-300 text-base font-bold rounded transition-colors cursor-pointer whitespace-nowrap"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✕
                  </motion.div>
                )}
              </motion.button>
            </div>

            {/* Odds Display */}
            <div className="mt-2 p-3 bg-slate-600/30 rounded-lg flex gap-4 text-xs">
              <div>
                <span className="text-gray-200">Spread: </span>
                <span className="text-white font-bold">{selectedGame.spread || '--'}</span>
              </div>
              <div>
                <span className="text-gray-200">O/U: </span>
                <span className="text-white font-bold">{selectedGame.overUnder || '--'}</span>
              </div>
            </div>


          </div>
        </motion.div>
        ) : (
          <div className="flex-1 bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg overflow-hidden border border-slate-500 shadow-lg relative h-full flex flex-col">
            {/* Game Header */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 border-b border-slate-600 relative z-10">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="text-xs text-gray-200 font-semibold uppercase">
                  TBA • TBA
                </div>
                <div className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded whitespace-nowrap">
                  Week {selectedWeek}
                </div>
              </div>
              <div className="text-sm text-gray-100">
                TBA • TBA
              </div>
            </div>

            {/* Matchup Display */}
            <div className="p-6 relative z-10 flex-1 flex flex-col opacity-50">
              {/* Teams in Large Display */}
              <div className="mb-4">
                {/* Away Team */}
                <button disabled className={`w-full mb-2 p-4 rounded-lg transition-all border-2 border-slate-600 bg-slate-700/70 cursor-not-allowed`}>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-slate-600 rounded object-contain"></div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-xl text-white">TBA</div>
                      <div className="text-sm text-gray-100 mt-1">--</div>
                    </div>
                  </div>
                </button>

                {/* VS Divider */}
                <div className="flex items-center gap-4 mb-2 justify-center">
                  <div className="flex-1 h-px bg-slate-400 max-w-xs"></div>
                  <div className="text-lg text-gray-100 font-bold">VS</div>
                  <div className="flex-1 h-px bg-slate-400 max-w-xs"></div>
                </div>

                {/* Home Team */}
                <button disabled className={`w-full p-4 rounded-lg transition-all border-2 border-slate-600 bg-slate-700/70 cursor-not-allowed`}>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-slate-600 rounded object-contain"></div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-xl text-white">TBA</div>
                      <div className="text-sm text-gray-100 mt-1">--</div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-2 p-3 bg-slate-600/30 rounded-lg flex gap-4 text-xs">
                <div>
                  <span className="text-gray-200">Spread: </span>
                  <span className="text-white font-bold">--</span>
                </div>
                <div>
                  <span className="text-gray-200">O/U: </span>
                  <span className="text-white font-bold">--</span>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default NFLPredictionGame;
