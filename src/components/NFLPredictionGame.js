'use client';
import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';

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
      return [];
    }

    const data = await response.json();
    console.log(`📡 API Response:`, JSON.stringify(data, null, 2));
    
    const games = data.games || [];

    console.log(`✅ Found ${games.length} games`);
    console.log(`📋 First game:`, games[0]);
    
    return games;

  } catch (error) {
    console.error('💥 Error fetching games:', error);
    return [];
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

const NFLPredictionGame = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [picks, setPicks] = useState({}); // { gameId: 'home' | 'away' }
  const [selectedWeek, setSelectedWeek] = useState(1);

  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        setError(null);
        const gamesData = await fetchUpcomingGames();
        setGames(gamesData);
      } catch (err) {
        console.error('Error loading games:', err);
        setError('Failed to load games. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadGames();

    // Refresh games every 5 minutes
    const interval = setInterval(loadGames, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePick = (gameId, teamType) => {
    // Allow changing selection
    const isNewPick = !picks[gameId] || picks[gameId] !== teamType;
    
    setPicks(prev => ({
      ...prev,
      [gameId]: prev[gameId] === teamType ? null : teamType
    }));

    // Show confetti when picking
    if (isNewPick) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      
      // Move to next game automatically
      if (selectedGameIndex < games.length - 1) {
        setSelectedGameIndex(selectedGameIndex + 1);
      }
    }
  };

  const clearPick = (gameId) => {
    setPicks(prev => {
      const newPicks = { ...prev };
      delete newPicks[gameId];
      return newPicks;
    });
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

  if (error || games.length === 0) {
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
  const gamePick = picks[selectedGame.id];
  const pickCount = Object.keys(picks).length;

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
            <img 
              src="/images/NFLlogo.png" 
              alt="NFL Logo" 
              className="w-12 h-12 object-contain"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIGZpbGw9IiMwMDMzNjYiLz48dGV4dCB4PSIyNCIgeT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZvbnQtZmFtaWx5PSJBcmlhbCIsTWFyaWEsIHNhbnMtc2VyaWY+TkZMPC90ZXh0Pjwvc3ZnPg=='
              }}
            />
            <div>
              <h2 className="text-2xl font-black mb-1" style={{ fontFamily: 'Inter', fontWeight: 700 }}>Predictions</h2>
              <p className="text-gray-300 text-sm" style={{ fontFamily: 'Inter', fontWeight: 600 }}>Pick the winners and climb the leaderboard!</p>
            </div>
          </div>
          <motion.button
            className="ml-4 p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="View Leaderboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </motion.button>
        </div>

        {/* Main Layout - 70/30 Split */}
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
                  const gamePickStatus = picks[game.id];
                  const carouselDate = formatGameDate(game.date);

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
                      }`}
                    >
                      {/* Game Info */}
                      <div className="mb-2">
                        <div className="text-xs text-gray-400 font-semibold uppercase">
                          {carouselDate.dayName} {carouselDate.time}
                        </div>
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
            disabled={!gamePick}
            className={`px-10 py-3 text-white text-base font-extrabold rounded transition-all shadow-lg w-full mt-auto ${
              gamePick
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-xl cursor-pointer'
                : 'bg-gradient-to-r from-gray-600 to-gray-700 opacity-50 cursor-not-allowed'
            }`}
            whileHover={gamePick ? { scale: 1.05 } : {}}
            whileTap={gamePick ? { scale: 0.95 } : {}}
          >
            Submit
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
                {gameDate.dayName} • {gameDate.time}
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
                onClick={() => handlePick(selectedGame.id, 'away')}
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
                      clearPick(selectedGame.id);
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
                onClick={() => handlePick(selectedGame.id, 'home')}
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
                      clearPick(selectedGame.id);
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

              {/* Odds Display */}
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
      </div>
    </div>
  );
};

export default NFLPredictionGame;
