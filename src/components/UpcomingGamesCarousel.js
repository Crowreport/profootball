'use client';
import React, { useState, useEffect } from 'react';

// Get the correct NFL season year to display
function getNflSeasonYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  // NFL season year is the year the season STARTS (Sep–Feb)
  // Jan–Feb are still part of the previous season.
  if (month <= 1) return year - 1;

  return year;
}

// Team logo mapping using CBS Sports logos (same as teams page)
const teamLogos = {
  "Buffalo Bills": "https://sports.cbsimg.net/fly/images/team-logos/407.svg",
  "Miami Dolphins": "https://sports.cbsimg.net/fly/images/team-logos/418.svg",
  "New York Jets": "https://sports.cbsimg.net/fly/images/team-logos/423.svg",
  "New England Patriots": "https://sports.cbsimg.net/fly/images/team-logos/420.svg",
  "Baltimore Ravens": "https://sports.cbsimg.net/fly/images/team-logos/406.svg",
  "Cincinnati Bengals": "https://sports.cbsimg.net/fly/images/team-logos/410.svg",
  "Cleveland Browns": "https://sports.cbsimg.net/fly/images/team-logos/434.svg",
  "Pittsburgh Steelers": "https://sports.cbsimg.net/fly/images/team-logos/426.svg",
  "Houston Texans": "https://sports.cbsimg.net/fly/images/team-logos/247415.svg",
  "Indianapolis Colts": "https://sports.cbsimg.net/fly/images/team-logos/415.svg",
  "Jacksonville Jaguars": "https://sports.cbsimg.net/fly/images/team-logos/416.svg",
  "Tennessee Titans": "https://sports.cbsimg.net/fly/images/team-logos/432.svg",
  "Denver Broncos": "https://sports.cbsimg.net/fly/images/team-logos/412.svg",
  "Kansas City Chiefs": "https://sports.cbsimg.net/fly/images/team-logos/417.svg",
  "Las Vegas Raiders": "https://sports.cbsimg.net/fly/images/team-logos/424.svg",
  "Los Angeles Chargers": "https://sports.cbsimg.net/fly/images/team-logos/428.svg",
  "Dallas Cowboys": "https://sports.cbsimg.net/fly/images/team-logos/411.svg",
  "New York Giants": "https://sports.cbsimg.net/fly/images/team-logos/422.svg",
  "Philadelphia Eagles": "https://sports.cbsimg.net/fly/images/team-logos/425.svg",
  "Washington Commanders": "https://sports.cbsimg.net/fly/images/team-logos/433.svg",
  "Chicago Bears": "https://sports.cbsimg.net/fly/images/team-logos/409.svg",
  "Detroit Lions": "https://sports.cbsimg.net/fly/images/team-logos/413.svg",
  "Green Bay Packers": "https://sports.cbsimg.net/fly/images/team-logos/414.svg",
  "Minnesota Vikings": "https://sports.cbsimg.net/fly/images/team-logos/419.svg",
  "Atlanta Falcons": "https://sports.cbsimg.net/fly/images/team-logos/405.svg",
  "Carolina Panthers": "https://sports.cbsimg.net/fly/images/team-logos/408.svg",
  "New Orleans Saints": "https://sports.cbsimg.net/fly/images/team-logos/421.svg",
  "Tampa Bay Buccaneers": "https://sports.cbsimg.net/fly/images/team-logos/431.svg",
  "Arizona Cardinals": "https://sports.cbsimg.net/fly/images/team-logos/404.svg",
  "Los Angeles Rams": "https://sports.cbsimg.net/fly/images/team-logos/427.svg",
  "San Francisco 49ers": "https://sports.cbsimg.net/fly/images/team-logos/429.svg",
  "Seattle Seahawks": "https://sports.cbsimg.net/fly/images/team-logos/430.svg"
};

// Function to get team logo
function getTeamLogo(teamName) {
  return teamLogos[teamName] || null;
}

const showYear = getNflSeasonYear();
console.log("🏈 showYear:", showYear);


// Function to fetch upcoming games from ESPN API
async function fetchUpcomingGames() {
  console.log("🔍 Starting fetchUpcomingGames");
  
  try {
    // Go directly to 2025 season since that's where the future games are
    console.log("📡 Fetching season events");
    
    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const seasonResponse = await fetch(
  `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${showYear}/types/2/events?limit=50`,
  {
    signal: controller.signal,
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0",
      Origin: "https://pro-football.netlify.app",
      Referer: "https://pro-football.netlify.app/",
    },
    mode: "cors",
    credentials: "omit",
  }
);

    
    clearTimeout(timeoutId);
    
    if (!seasonResponse.ok) {
      throw new Error(`2025 season API failed with status: ${seasonResponse.status}`);
    }
    
    const seasonData = await seasonResponse.json();
    console.log("📦 seasonData.items length:", seasonData?.items?.length);
    console.log(`📡 Found ${seasonData.items?.length || 0} events in 2025 season`);
    
    if (!seasonData.items || seasonData.items.length === 0) {
      throw new Error('No events found in 2025 season');
    }
    
    const futureGames = [];
    
    // Process first 8 events (should all be future games)
    for (let i = 0; i < Math.min(8, seasonData.items.length); i++) {
      try {
        const eventRef = seasonData.items[i];
        console.log(`📡 Processing event ${i + 1}/8`);
        
        // Add timeout for individual event requests
        const eventController = new AbortController();
        const eventTimeoutId = setTimeout(() => eventController.abort(), 8000); // 8 second timeout
        
        // Convert HTTP URLs to HTTPS to avoid mixed content errors
        let eventUrl = eventRef.$ref;
        if (eventUrl.startsWith('http://')) {
          eventUrl = eventUrl.replace('http://', 'https://');
        } else if (!eventUrl.startsWith('https://')) {
          eventUrl = `https://${eventUrl}`;
        }
        console.log(`🔗 Fetching event URL: ${eventUrl}`);
        const eventResponse = await fetch(eventUrl, {
          signal: eventController.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://pro-football.netlify.app',
            'Referer': 'https://pro-football.netlify.app/'
          },
          mode: 'cors',
          credentials: 'omit'
        });
        
        clearTimeout(eventTimeoutId);
        
        if (!eventResponse.ok) {
          console.log(`❌ Event ${i + 1} failed with status: ${eventResponse.status} for URL: ${eventUrl}`);
          continue;
        }
        
        const eventData = await eventResponse.json();
        const fixedDateStr = (eventData?.date || "").replace(/Z$/, ":00Z");
        const gameDate = new Date(fixedDateStr);

        const now = new Date();
        
        // Extract team names from event name (always add the next scheduled games)
const eventName = eventData.name || '';
let awayTeamName = 'Unknown';
let homeTeamName = 'Unknown';

if (eventName.includes(' at ')) {
  const parts = eventName.split(' at ');
  if (parts.length === 2) {
    awayTeamName = parts[0].trim();
    homeTeamName = parts[1].trim();
  }
}

const game = {
  id: eventData.id,
  homeTeam: {
    name: homeTeamName,
    logo: getTeamLogo(homeTeamName),
    record: '0-0'
  },
  awayTeam: {
    name: awayTeamName,
    logo: getTeamLogo(awayTeamName),
    record: '0-0'
  },
  date: eventData.date,
  week: `Week ${eventData.week?.number || 'TBD'}`
};

futureGames.push(game);
console.log(`✅ Added game ${i + 1}: ${game.awayTeam.name} @ ${game.homeTeam.name}`);

      } catch (error) {
        console.error(`❌ Error processing event ${i + 1}:`, error);
        continue;
      }
    }
    
    if (futureGames.length > 0) {
      console.log(`✅ Found ${futureGames.length} upcoming games`);
      return futureGames;
    } else {
      console.log('⚠️ No future games found, this is expected during off-season');
      return []; // Return empty array instead of throwing error
    }
    
  } catch (error) {
    console.error('💥 Error in fetchUpcomingGames:', error);
    throw error;
  }
}

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
      fullDate: `${dayName} ${month} ${day}` // e.g., "Sun Jan 14"
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

const UpcomingGamesCarousel = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        setError(null);
        const gamesData = await fetchUpcomingGames();
        setGames(gamesData);
      } catch (err) {
        console.error('💥 Error loading games:', err);
        console.error('💥 Error stack:', err.stack);
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

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white mb-4 relative overflow-hidden">
        <div className="flex items-center px-4 py-2 bg-red-600">
          <span className="text-sm font-bold tracking-wide">UPCOMING GAMES</span>
          <div className="ml-auto text-xs opacity-75">LOADING...</div>
        </div>
        <div className="h-16 flex items-center justify-center">
          <div className="text-gray-300 text-sm">Loading upcoming games...</div>
        </div>
      </div>
    );
  }

  if (error || games.length === 0) {
    return (
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white mb-4 relative overflow-hidden">
        <div className="flex items-center px-4 py-2 bg-red-600">
          <span className="text-sm font-bold tracking-wide">UPCOMING GAMES</span>
          <div className="ml-auto text-xs opacity-75">NO GAMES</div>
        </div>
        <div className="h-16 flex items-center justify-center">
          <div className="text-gray-300 text-sm">No upcoming games found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white mb-4 relative overflow-hidden">
      {/* Sports Ticker Header */}
      <div className="flex items-center px-4 py-2 bg-red-600">
        <span className="text-sm font-bold tracking-wide">UPCOMING GAMES</span>
        <div className="ml-auto text-xs opacity-75">LIVE SCHEDULE</div>
      </div>
      
      {/* Scrolling Ticker */}
      <div className="relative overflow-hidden h-16">
        <div className="absolute inset-0 flex items-center">
          <div className="flex whitespace-nowrap ticker-scroll">
            {/* Double the games array for seamless scrolling */}
            {[...games, ...games].map((game, index) => {
              const gameDate = formatGameDate(game.date);
              
              return (
                <div key={`${game.id}-${index}`} className="flex items-center mx-8 flex-shrink-0 min-w-[300px]">
                  {/* Away Team */}
                  <div className="flex items-center mr-3">
                    <img 
                      src={game.awayTeam.logo}
                      alt={game.awayTeam.name}
                      className="w-8 h-8 mr-2"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2Mzc1OTEiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+';
                      }}
                    />
                    <div className="text-right">
                      <div className="text-sm font-semibold leading-none">
                        {game.awayTeam.name.split(' ').slice(-1)[0].toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-300 leading-none mt-0.5">
                        {game.awayTeam.record}
                      </div>
                    </div>
                  </div>
                  
                  {/* VS indicator */}
                  <div className="mx-2 text-xs text-gray-400 font-bold">@</div>
                  
                  {/* Home Team */}
                  <div className="flex items-center mr-4">
                    <img 
                      src={game.homeTeam.logo}
                      alt={game.homeTeam.name}
                      className="w-8 h-8 mr-2"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2Mzc1OTEiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+';
                      }}
                    />
                    <div>
                      <div className="text-sm font-semibold leading-none">
                        {game.homeTeam.name.split(' ').slice(-1)[0].toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-300 leading-none mt-0.5">
                        {game.homeTeam.record}
                      </div>
                    </div>
                  </div>
                  
                  {/* Game Time */}
                  <div className="text-right mr-6">
                    <div className="text-xs font-semibold text-yellow-400 leading-none">
                      {gameDate.fullDate} {gameDate.time}
                    </div>
                  </div>
                  
                  {/* Separator */}
                  <div className="w-px h-8 bg-gray-600 mr-8"></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingGamesCarousel; 