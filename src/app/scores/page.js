'use client';
import React, { useState, useEffect } from 'react';
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { TopBannerAd, SidebarAd } from "@/components/AdBanner";

// Team logo mapping using CBS Sports logos
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
  if (!teamName || typeof teamName !== "string") {
    console.warn("⚠️ getTeamLogo called with invalid teamName:", teamName);
    return null; // or a default logo
  }
  console.log(`🔍 Looking for logo for team: "${teamName}"`);
  
  // First try exact match
  if (teamLogos[teamName]) {
    console.log(`✅ Found exact match for "${teamName}"`);
    return teamLogos[teamName];
  }
  
  // Try to find partial matches or common variations
  const normalizedName = teamName.toLowerCase().trim();
  
  for (const [key, value] of Object.entries(teamLogos)) {
    const normalizedKey = key.toLowerCase();
    
    // Check if the team name contains the key or vice versa
    if (normalizedName.includes(normalizedKey) || normalizedKey.includes(normalizedName)) {
      console.log(`✅ Found partial match: "${teamName}" matches "${key}"`);
      return value;
    }
    
    // Check for common abbreviations
    const abbreviations = {
      'bills': 'buffalo bills',
      'dolphins': 'miami dolphins',
      'jets': 'new york jets',
      'patriots': 'new england patriots',
      'ravens': 'baltimore ravens',
      'bengals': 'cincinnati bengals',
      'browns': 'cleveland browns',
      'steelers': 'pittsburgh steelers',
      'texans': 'houston texans',
      'colts': 'indianapolis colts',
      'jaguars': 'jacksonville jaguars',
      'titans': 'tennessee titans',
      'broncos': 'denver broncos',
      'chiefs': 'kansas city chiefs',
      'raiders': 'las vegas raiders',
      'chargers': 'los angeles chargers',
      'cowboys': 'dallas cowboys',
      'giants': 'new york giants',
      'eagles': 'philadelphia eagles',
      'commanders': 'washington commanders',
      'bears': 'chicago bears',
      'lions': 'detroit lions',
      'packers': 'green bay packers',
      'vikings': 'minnesota vikings',
      'falcons': 'atlanta falcons',
      'panthers': 'carolina panthers',
      'saints': 'new orleans saints',
      'buccaneers': 'tampa bay buccaneers',
      'cardinals': 'arizona cardinals',
      'rams': 'los angeles rams',
      '49ers': 'san francisco 49ers',
      'seahawks': 'seattle seahawks'
    };
    
    if (abbreviations[normalizedName]) {
      const fullName = abbreviations[normalizedName];
      if (teamLogos[fullName]) {
        console.log(`✅ Found abbreviation match: "${teamName}" -> "${fullName}"`);
        return teamLogos[fullName];
      }
    }
  }
  
  console.log(`❌ No logo found for "${teamName}"`);
  return null;
}

// Function to format game time
function formatGameTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

// Function to format game date
function formatGameDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

// Function to get game status
function getGameStatus(game) {
  const status = game.status;
  
  if (!status || !status.type) {
    return formatGameTime(game.date);
  }
  
  switch (status.type.state) {
    case 'pre':
      return 'Upcoming';
    case 'in':
      if (status.period && status.displayClock) {
        return `${status.period}Q ${status.displayClock}`;
      } else if (status.period) {
        return `${status.period}Q`;
      } else {
        return 'Live';
      }
    case 'post':
      if (status.type.completed) {
        return 'Final';
      } else {
        return 'Final';
      }
    case 'scheduled':
      return formatGameTime(game.date);
    case 'delayed':
      return 'Delayed';
    case 'cancelled':
      return 'Cancelled';
    case 'postponed':
      return 'Postponed';
    default:
      return formatGameTime(game.date);
  }
}

// Function to get current NFL week
function getCurrentNFLWeek() {
  const now = new Date();
  const seasonStart = new Date('2025-09-04'); // Approximate start of 2025 season
  const weekInMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  
  if (now < seasonStart) {
    return 1; // Pre-season
  }
  
  const weeksSinceStart = Math.floor((now - seasonStart) / weekInMs);
  return Math.min(Math.max(weeksSinceStart + 1, 1), 18); // NFL has 18 weeks
}

// Function to get NFL season year (same as standings page)
function getNflSeasonYear() {
  // For the 2025 NFL season, we want to return 2025
  // The NFL season typically starts in September, so we're currently in the 2025 season
  return 2025;
}

// Function to fetch games for a specific week
async function fetchGamesForWeek(week) {
  try {
    console.log(`📡 Fetching games for Week ${week}`);
    const showYear = getNflSeasonYear();
    console.log(`📡 Using season year: ${showYear}`);
    
    let games = [];
    
    // Try the primary API endpoint first (same as standings)
    console.log("📡 Trying primary API: site.api.espn.com");
    let response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=3&week=${week}&year=${showYear}`);
    console.log("📡 Primary API response status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("📡 Primary API response data:", data);
      console.log("📡 Primary API events:", data.events);
      console.log("📡 Primary API events length:", data.events?.length);
      console.log("📡 Primary API season info:", data.season);
      
      // Check if the API returned the correct season year
      if (data.season && data.season.year !== showYear) {
        console.log(`⚠️ API returned season ${data.season.year} instead of requested ${showYear}`);
        
        // If we're requesting 2025 but getting 2024, try without the year parameter
        if (showYear === 2025 && data.season.year === 2024) {
          console.log("🔄 Trying without year parameter to get current season");
          const currentResponse = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?week=${week}`);
          
          if (currentResponse.ok) {
            const currentData = await currentResponse.json();
            console.log("📡 Current season API response:", currentData);
            console.log("📡 Current season info:", currentData.season);
            
            if (currentData.events && currentData.events.length > 0) {
              games = currentData.events.map(event => {
                const homeTeam = event.competitions?.[0]?.competitors?.find(comp => comp.homeAway === 'home');
                const awayTeam = event.competitions?.[0]?.competitors?.find(comp => comp.homeAway === 'away');
                
                if (homeTeam && awayTeam) {
                  return {
                    id: event.id,
                    date: event.date,
                    status: event.status,
                    week: week,
                    homeTeam: {
                      name: homeTeam.team?.name || 'Unknown Team',
                      score: homeTeam.score || 0,
                      logo: getTeamLogo(homeTeam.team?.name),
                      record: homeTeam.records?.[0]?.summary || '0-0',
                      id: homeTeam.team?.id || 'unknown'
                    },
                    awayTeam: {
                      name: awayTeam.team?.name || 'Unknown Team',
                      score: awayTeam.score || 0,
                      logo: getTeamLogo(awayTeam.team?.name),
                      record: awayTeam.records?.[0]?.summary || '0-0',
                      id: awayTeam.team?.id || 'unknown'
                    },
                    venue: event.competitions?.[0]?.venue?.fullName || 'TBD',
                    broadcast: event.competitions?.[0]?.broadcasts?.[0]?.media?.shortName || 'TBD'
                  };
                }
                return null;
              }).filter(game => game !== null);
              
              console.log(`✅ Current season API found ${games.length} games`);
            }
          }
        }
      } else if (data.events && data.events.length > 0) {
        games = data.events.map(event => {
          const homeTeam = event.competitions?.[0]?.competitors?.find(comp => comp.homeAway === 'home');
          const awayTeam = event.competitions?.[0]?.competitors?.find(comp => comp.homeAway === 'away');
          
          if (homeTeam && awayTeam) {
            return {
              id: event.id,
              date: event.date,
              status: event.status,
              week: week,
              homeTeam: {
                name: homeTeam.team?.name || 'Unknown Team',
                score: homeTeam.score || 0,
                logo: getTeamLogo(homeTeam.team?.name),
                record: homeTeam.records?.[0]?.summary || '0-0',
                id: homeTeam.team?.id || 'unknown'
              },
              awayTeam: {
                name: awayTeam.team?.name || 'Unknown Team',
                score: awayTeam.score || 0,
                logo: getTeamLogo(awayTeam.team?.name),
                record: awayTeam.records?.[0]?.summary || '0-0',
                id: awayTeam.team?.id || 'unknown'
              },
              venue: event.competitions?.[0]?.venue?.fullName || 'TBD',
              broadcast: event.competitions?.[0]?.broadcasts?.[0]?.media?.shortName || 'TBD'
            };
          }
          return null;
        }).filter(game => game !== null);
        
        console.log(`✅ Primary API found ${games.length} games`);
      }
    } else {
      console.log("❌ Primary API failed with status:", response.status);
    }
    
    // If no data from primary API, try CDN endpoint
    if (games.length === 0) {
      console.log("🔄 No data from primary API, trying CDN endpoint");
      
      response = await fetch(`https://cdn.espn.com/core/nfl/scoreboard?xhr=1&week=${week}&year=${showYear}`);
      console.log("📡 CDN API response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("📡 CDN API response data:", data);
        console.log("📡 CDN API content.sbData:", data.content?.sbData);
        console.log("📡 CDN API content.sbData.events:", data.content?.sbData?.events);
        
        if (data.content?.sbData?.events) {
          games = data.content.sbData.events.map(event => {
            const homeTeam = event.competitions?.[0]?.competitors?.find(comp => comp.homeAway === 'home');
            const awayTeam = event.competitions?.[0]?.competitors?.find(comp => comp.homeAway === 'away');
            
            if (homeTeam && awayTeam) {
              return {
                id: event.id,
                date: event.date,
                status: event.status,
                week: week,
                homeTeam: {
                  name: homeTeam.team?.name || 'Unknown Team',
                  score: homeTeam.score || 0,
                  logo: getTeamLogo(homeTeam.team?.name),
                  record: homeTeam.records?.[0]?.summary || '0-0',
                  id: homeTeam.team?.id || 'unknown'
                },
                awayTeam: {
                  name: awayTeam.team?.name || 'Unknown Team',
                  score: awayTeam.score || 0,
                  logo: getTeamLogo(awayTeam.team?.name),
                  record: awayTeam.records?.[0]?.summary || '0-0',
                  id: awayTeam.team?.id || 'unknown'
                },
                venue: event.competitions?.[0]?.venue?.fullName || 'TBD',
                broadcast: event.competitions?.[0]?.broadcasts?.[0]?.media?.shortName || 'TBD'
              };
            }
            return null;
          }).filter(game => game !== null);
          
          console.log(`✅ CDN API found ${games.length} games`);
        }
      } else {
        console.log("❌ CDN API failed with status:", response.status);
      }
    }
    
    // If still no data, try v2 API as last resort
    if (games.length === 0) {
      console.log("🔄 No data from CDN API, trying v2 API");
      
      response = await fetch(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${showYear}/types/2/events?week=${week}`);
      console.log("📡 v2 API response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("📡 v2 API response data:", data);
        console.log("📡 v2 API items:", data.items);
        console.log("📡 v2 API items length:", data.items?.length);
        
        if (data.items && data.items.length > 0) {
          // Process each event reference
          for (const eventRef of data.items) {
            try {
              const eventResponse = await fetch(eventRef.$ref);
              if (eventResponse.ok) {
                const eventData = await eventResponse.json();
                
                // Get competition details
                if (eventData.competitions?.[0]) {
                  const competition = eventData.competitions[0];
                  const homeTeam = competition.competitors?.find(comp => comp.homeAway === 'home');
                  const awayTeam = competition.competitors?.find(comp => comp.homeAway === 'away');
                  
                  if (homeTeam && awayTeam) {
                    games.push({
                      id: eventData.id,
                      date: toText(eventData.date, ""),
                      status: competition.status?.type?.description || eventData.status?.type?.description || "Scheduled",
                      week: week,
                      homeTeam: {
                        name: homeTeam.team?.name || 'Unknown Team',
                        score: homeTeam.score || 0,
                        logo: getTeamLogo(homeTeam.team?.name),
                        record: toText(homeTeam.records?.[0]?.summary, "0-0"),
                        id: homeTeam.team?.id || 'unknown'
                      },
                      awayTeam: {
                        name: awayTeam.team?.name || 'Unknown Team',
                        score: awayTeam.score || 0,
                        logo: getTeamLogo(awayTeam.team?.name),
record: toText(awayTeam.records?.[0]?.summary, "0-0"),
                        id: awayTeam.team?.id || 'unknown'
                      },
                      venue: toText(competition.venue, "TBD"),
                      broadcast: toText(competition.broadcasts?.[0]?.media, "TBD")
                    });
                  }
                }
              }
            } catch (error) {
              console.log(`⚠️ Failed to fetch event data: ${error.message}`);
            }
          }
          
          console.log(`✅ v2 API found ${games.length} games`);
        }
      } else {
        console.log("❌ v2 API failed with status:", response.status);
      }
    }
    
    // Sort games by date
    games.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log(`📊 Final result: ${games.length} games for Week ${week}`);
    return games;
    
  } catch (error) {
    console.error('Error fetching games:', error);
    return [];
  }
}

export default function ScoresPage() {
  const [selectedWeek, setSelectedWeek] = useState(getCurrentNFLWeek());
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadGames = async () => {
      setLoading(true);
      setError(null);
      
      try {
        function toText(value, fallback = "TBD") {
  if (value == null) return fallback;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "object") {
    if (typeof value.$ref === "string") return fallback; // avoid rendering ref objects
    if (typeof value.fullName === "string") return value.fullName;
    if (typeof value.name === "string") return value.name;
    if (typeof value.shortName === "string") return value.shortName;
    if (typeof value.description === "string") return value.description;
    if (typeof value.summary === "string") return value.summary;
  }
  return fallback;
}

        const weekGames = await fetchGamesForWeek(selectedWeek);
    
        setGames(weekGames);
      } catch (err) {
        setError('Failed to load games');
        console.error('Error loading games:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, [selectedWeek]);

  const weeks = Array.from({ length: 18 }, (_, i) => i + 1);

    return (
    <div className="bg-[#ECCE8B] min-h-screen">
      <Nav />
      
      <div className="max-w-7xl mx-auto px-4 py-10">


        {/* Week Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-['DM Sans'] font-semibold text-gray-900 mb-1">
                Week Selection
              </h2>
              <p className="text-sm text-gray-600">Choose a week to view games</p>
            </div>
            
            <div className="flex items-center gap-4">
              <label htmlFor="week-select" className="text-sm font-medium text-gray-700">
                Week:
              </label>
              <select
                id="week-select"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
              >
                {weeks.map(week => (
                  <option key={week} value={week}>
                    Week {week}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Games Section */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 font-medium">Loading games...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-red-600 mb-6 text-lg font-medium">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        ) : games.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg font-medium mb-4">No games found for Week {selectedWeek}</p>
            <p className="text-sm text-gray-500 mb-6">This could be because:</p>
            <ul className="text-sm text-gray-500 space-y-1 mb-6">
              <li>• The season hasn&apos;t started yet</li>
              <li>• Games haven&apos;t been scheduled for this week</li>
              <li>• The API data is not available</li>
            </ul>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> Real game data will appear here when the NFL season begins and the ESPN API provides live data.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <div key={game.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                {/* Game Header */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="text-white">
                      <div className="text-sm font-['DM Sans'] font-semibold">
                        {formatGameDate(game.date)}
                      </div>
                      <div className="text-xs text-gray-300">
                        {formatGameTime(game.date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-['DM Sans'] font-semibold text-white">
                        {getGameStatus(game)}
                      </div>
                      <div className="text-xs text-gray-300">
                        {game.venue}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Teams and Scores */}
                <div className="p-4">
                  {/* Away Team */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const logoUrl = getTeamLogo(game.awayTeam.name);
                        console.log(`🎨 Away team "${game.awayTeam.name}" logo:`, logoUrl);
                        return logoUrl ? (
                          <div className="w-10 h-10 relative">
                            <img 
                              src={logoUrl} 
                              alt={`${game.awayTeam.name} logo`}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                console.log(`❌ Failed to load logo for ${game.awayTeam.name}:`, e.target.src);
                                e.target.style.display = 'none';
                              }}
                              onLoad={() => console.log(`✅ Successfully loaded logo for ${game.awayTeam.name}`)}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs text-gray-500 font-bold">
                              {game.awayTeam.name.split(' ').map(word => word[0]).join('')}
                            </span>
                          </div>
                        );
                      })()}
                      <div>
                        <div className="text-sm font-['DM Sans'] font-bold text-gray-900">
                          {game.awayTeam.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {game.awayTeam.record}
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-['DM Sans'] font-bold text-gray-800">
                      {game.awayTeam.score}
                    </div>
                  </div>

                  {/* VS Divider */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="text-lg font-bold text-gray-400">VS</div>
                  </div>

                  {/* Home Team */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const logoUrl = getTeamLogo(game.homeTeam.name);
                        console.log(`🎨 Home team "${game.homeTeam.name}" logo:`, logoUrl);
                        return logoUrl ? (
                          <div className="w-10 h-10 relative">
                            <img 
                              src={logoUrl} 
                              alt={`${game.homeTeam.name} logo`}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                console.log(`❌ Failed to load logo for ${game.homeTeam.name}:`, e.target.src);
                                e.target.style.display = 'none';
                              }}
                              onLoad={() => console.log(`✅ Successfully loaded logo for ${game.homeTeam.name}`)}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs text-gray-500 font-bold">
                              {game.homeTeam.name.split(' ').map(word => word[0]).join('')}
                            </span>
                          </div>
                        );
                      })()}
                      <div>
                        <div className="text-sm font-['DM Sans'] font-bold text-gray-900">
                          {game.homeTeam.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {game.homeTeam.record}
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-['DM Sans'] font-bold text-gray-800">
                      {game.homeTeam.score}
                    </div>
                  </div>

                  {/* Game Status Badge */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {(() => {
                          // For the 2024-2025 NFL season, explicitly show "24/25"
                          // Since we're currently in 2024 and the NFL season runs from 2024-2025
                          return "24/25";
                        })()}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        getGameStatus(game) === 'Final' 
                          ? 'bg-gray-100 text-gray-700'
                          : getGameStatus(game) === 'Live' || getGameStatus(game).includes('Q')
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {getGameStatus(game)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
