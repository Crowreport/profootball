'use client';
import React, { useState, useEffect } from 'react';
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
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-lg mb-8">
        <div className="text-center py-12">
          <div className="text-xl font-bold mb-2">🏈 NFL Prediction Game</div>
          <div className="text-gray-300 animate-pulse text-sm">Loading games...</div>
        </div>
      </div>
    );
  }

  if (error || !games || games.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-lg mb-8">
        <div className="text-center py-12">
          <div className="text-xl font-bold mb-2">🏈 NFL Prediction Game</div>
          <div className="text-gray-300 text-sm">{error || 'No upcoming games found'}</div>
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

      {/* Main Container Box - Vertical Layout */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-lg border border-slate-600 shadow-2xl overflow-hidden mb-8">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 text-white px-4 py-3 border-b border-slate-600">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img 
                src="/images/NFLlogo.png" 
                alt="NFL Logo" 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIGZpbGw9IiMwMDMzNjYiLz48dGV4dCB4PSIyNCIgeT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZvbnQtZmFtaWx5PSJBcmlhbCIsTWFyaWEsIHNhbnMtc2VyaWY+TkZMPC90ZXh0Pjwvc3ZnPg=='
                }}
              />
              <div>
                <h2 className="text-lg font-black" style={{ fontFamily: 'Inter', fontWeight: 700 }}>
                  {viewMode === 'predictions' ? 'Predictions' : 'Leaderboard'}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedYear ?? activeSeason ?? new Date().getFullYear()}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded px-2 py-1 border border-slate-500 cursor-pointer focus:outline-none focus:border-blue-400"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
              <motion.button
                onClick={handleToggleLeaderboard}
                className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors flex items-center justify-center cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={viewMode === 'predictions' ? 'View Leaderboard' : 'Back to Predictions'}
              >
                {viewMode === 'predictions' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                )}
              </motion.button>
            </div>
          </div>
          <p className="text-gray-300 text-xs" style={{ fontFamily: 'Inter', fontWeight: 600 }}>
            {viewMode === 'predictions' ? 'Pick winners & climb the board!' : `${activeSeason ?? ''} Season Rankings`}
          </p>
        </div>

        {/* Leaderboard View */}
        {viewMode === 'leaderboard' ? (
          <div className="p-4 max-h-[600px] flex flex-col">
            {leaderboardLoading ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="text-white animate-pulse text-sm">Loading leaderboard...</div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-white text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-800">
                    <tr className="border-b border-slate-500">
                      <th className="px-2 py-2 text-left w-10">Rank</th>
                      <th className="px-2 py-2 text-left">Player</th>
                      <th className="px-2 py-2 text-center w-16">Record</th>
                      <th className="px-2 py-2 text-center w-12">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 50 }, (_, i) => {
                      const entry = leaderboardData[i];
                      const rankBadge =
                        i === 0 ? '🥇' :
                        i === 1 ? '🥈' :
                        i === 2 ? '🥉' :
                        `#${i + 1}`;
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
                          <td className="px-2 py-2 font-bold text-sm">{rankBadge}</td>
                          <td className="px-2 py-2 font-semibold text-xs truncate">
                            {entry ? entry.user.displayName : <span className="text-gray-600 italic">Open</span>}
                          </td>
                          <td className="px-2 py-2 text-center text-xs">
                            {entry ? (
                              <span className="whitespace-nowrap">
                                <span className="text-green-300">{entry.correct}</span>
                                <span className="text-gray-500">-</span>
                                <span className="text-red-300">{entry.incorrect}</span>
                              </span>
                            ) : <span className="text-gray-600">—</span>}
                          </td>
                          <td className="px-2 py-2 text-center text-xs font-bold">
                            {entry ? entry.points : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          // Predictions View - Vertical Stack
          <div className="p-4">
            {/* Week Selector */}
            <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-3 py-2 rounded-lg border border-slate-500 flex items-center gap-2 mb-4">
              <label htmlFor="week-select" className="text-xs font-bold text-gray-300">Week:</label>
              <select
                id="week-select"
                value={selectedWeek}
                onChange={(e) => {
                  setSelectedWeek(parseInt(e.target.value));
                  setSelectedGameIndex(0);
                }}
                className="flex-1 px-2 py-1 bg-slate-700 text-white border border-slate-500 rounded text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((week) => (
                  <option key={week} value={week}>
                    Week {week}
                  </option>
                ))}
              </select>
            </div>

            {/* Featured Matchup - Vertical */}
            {games.filter(game => game.week === selectedWeek).length > 0 ? (
              <motion.div
                key={selectedGame.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg border border-slate-500 shadow-lg mb-4"
              >
                {/* Game Info Header */}
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-3 py-2 border-b border-slate-600">
                  <div className="flex items-center justify-between text-xs text-gray-200 font-semibold mb-1">
                    <span>{gameDate.fullDate} • {gameDate.time}</span>
                    <span className="bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded">Week {selectedGame.week}</span>
                  </div>
                  <div className="text-xs text-gray-100 truncate">
                    {selectedGame.venue} • {selectedGame.broadcast}
                  </div>
                </div>

                {/* Teams - Vertical Stack */}
                <div className="p-3">
                  {/* Away Team */}
                  <motion.button
                    onClick={() => handlePick(selectedGame.gameKey, 'away')}
                    className={`w-full mb-2 p-2 rounded-lg transition-all border-2 flex items-center justify-between ${
                      gamePick === 'away'
                        ? 'border-blue-500 bg-blue-600/20 shadow-lg shadow-blue-500/20'
                        : 'border-slate-600 bg-slate-700/90 hover:bg-slate-700 hover:border-slate-500'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <img
                        src={selectedGame.awayTeam.logo}
                        alt={selectedGame.awayTeam.name}
                        className="w-10 h-10 object-contain flex-shrink-0"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjNjM3NTkxIi8+Cjwvc3ZnPg==';
                        }}
                      />
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-bold text-sm text-white truncate">{selectedGame.awayTeam.name}</div>
                        <div className="text-xs text-gray-100">{selectedGame.awayTeam.record}</div>
                      </div>
                    </div>
                    {gamePick === 'away' && (
                      <motion.div
                        onClick={(e) => {
                          e.stopPropagation();
                          clearPick(selectedGame.gameKey);
                        }}
                        className="ml-2 px-2 py-1 bg-red-600/30 hover:bg-red-600/40 text-red-300 text-xs font-bold rounded transition-colors cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        ✕
                      </motion.div>
                    )}
                  </motion.button>

                  {/* VS Divider */}
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <div className="flex-1 h-px bg-slate-400"></div>
                    <div className="text-xs text-gray-100 font-bold">VS</div>
                    <div className="flex-1 h-px bg-slate-400"></div>
                  </div>

                  {/* Home Team */}
                  <motion.button
                    onClick={() => handlePick(selectedGame.gameKey, 'home')}
                    className={`w-full mb-2 p-2 rounded-lg transition-all border-2 flex items-center justify-between ${
                      gamePick === 'home'
                        ? 'border-green-500 bg-green-600/20 shadow-lg shadow-green-500/20'
                        : 'border-slate-600 bg-slate-700/90 hover:bg-slate-700 hover:border-slate-500'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <img
                        src={selectedGame.homeTeam.logo}
                        alt={selectedGame.homeTeam.name}
                        className="w-10 h-10 object-contain flex-shrink-0"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjNjM3NTkxIi8+Cjwvc3ZnPg==';
                        }}
                      />
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-bold text-sm text-white truncate">{selectedGame.homeTeam.name}</div>
                        <div className="text-xs text-gray-100">{selectedGame.homeTeam.record}</div>
                      </div>
                    </div>
                    {gamePick === 'home' && (
                      <motion.div
                        onClick={(e) => {
                          e.stopPropagation();
                          clearPick(selectedGame.gameKey);
                        }}
                        className="ml-2 px-2 py-1 bg-red-600/30 hover:bg-red-600/40 text-red-300 text-xs font-bold rounded transition-colors cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        ✕
                      </motion.div>
                    )}
                  </motion.button>

                  {/* Odds Display */}
                  <div className="p-2 bg-slate-600/30 rounded-lg flex gap-3 text-xs justify-center">
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
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg border border-slate-500 p-6 mb-4 text-center">
                <div className="text-gray-400 text-sm">No games available for Week {selectedWeek}</div>
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              onClick={handleSubmit}
              disabled={!gamePick || submitState === 'saving' || submitState === 'saved'}
              className={`px-6 py-2.5 text-white text-sm font-extrabold rounded transition-all shadow-lg w-full mb-4 ${
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
              whileHover={gamePick && submitState === 'idle' ? { scale: 1.02 } : {}}
              whileTap={gamePick && submitState === 'idle' ? { scale: 0.98 } : {}}
            >
              {submitState === 'saving' && 'Saving...'}
              {submitState === 'saved' && '✓ Pick Saved!'}
              {submitState === 'error' && 'Login to Save'}
              {submitState === 'locked' && '🔒 Game Has Ended'}
              {submitState === 'idle' && 'Submit Pick'}
            </motion.button>

            {/* Game List - Scrollable */}
            <div className="rounded-lg border border-slate-500 overflow-hidden bg-slate-700">
              <div className="bg-slate-600 px-3 py-2 border-b border-slate-500">
                <h3 className="text-xs font-bold text-gray-200">All Games - Week {selectedWeek}</h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
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
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`w-full p-2 border-b border-slate-700 text-left transition-all ${
                          gamePickStatus
                            ? 'bg-green-600/40 border-l-4 border-l-green-500'
                            : isSelected
                            ? 'bg-blue-600/30 border-l-4 border-l-blue-500'
                            : 'hover:bg-slate-700/50'
                        } ${isLocked ? 'opacity-60' : ''}`}
                      >
                        {/* Game Info */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-xs text-gray-400 font-semibold">
                            {carouselDate.dayName} {carouselDate.time}
                          </div>
                          {isLocked && (
                            <span className="text-xs text-red-400 font-bold">
                              {game.status === 'live' ? '🔴' : '🔒'}
                            </span>
                          )}
                        </div>

                        {/* Teams */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <img
                              src={game.awayTeam.logo}
                              alt={game.awayTeam.name}
                              className="w-5 h-5 object-contain flex-shrink-0"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjNjM3NTkxIi8+Cjwvc3ZnPg==';
                              }}
                            />
                            <span className="text-xs font-semibold text-gray-200 truncate">
                              {game.awayTeam.name.split(' ').pop()}
                            </span>
                          </div>

                          <div className="text-xs text-gray-500">@</div>

                          <div className="flex items-center gap-1 flex-1 justify-end min-w-0">
                            <span className="text-xs font-semibold text-gray-200 truncate">
                              {game.homeTeam.name.split(' ').pop()}
                            </span>
                            <img
                              src={game.homeTeam.logo}
                              alt={game.homeTeam.name}
                              className="w-5 h-5 object-contain flex-shrink-0"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjNjM3NTkxIi8+Cjwvc3ZnPg==';
                              }}
                            />
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
                {games.filter(game => game.week === selectedWeek).length === 0 && (
                  <div className="flex items-center justify-center py-8 text-center px-4">
                    <div>
                      <div className="text-gray-400 text-xs font-semibold mb-1">No games available</div>
                      <div className="text-gray-500 text-xs">Check back for Week {selectedWeek} games</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NFLPredictionGame;
