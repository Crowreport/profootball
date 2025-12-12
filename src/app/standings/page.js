"use client";
import { useState, useEffect } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

// Get the correct NFL season year to display
function getNflSeasonYear() {
  const now = new Date();
  // Find the first Thursday in September for the current year
  for (let day = 1; day <= 7; day++) {
    const d = new Date(now.getFullYear(), 8, day);
    if (d.getDay() === 4) return now < d ? now.getFullYear() - 1 : now.getFullYear();
  }
  return now.getFullYear();
}
const showYear = getNflSeasonYear();

const conferenceMap = {
  AFC: "American Football Conference",
  NFC: "National Football Conference",
};

const divisions = {
  AFC: ["AFC East", "AFC North", "AFC South", "AFC West"],
  NFC: ["NFC East", "NFC North", "NFC South", "NFC West"]
};

const conferences = ["AFC", "NFC"];

export default function StandingsPage() {
  const [standingsData, setStandingsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConference, setSelectedConference] = useState("all");

  useEffect(() => {
    fetchStandings();
  }, []);

  async function fetchStandings() {
    setLoading(true);
    setError(null);
    let organizedStandings = {
      AFC: {},
      NFC: {}
    };
    
    console.log(`🔍 Starting fetchStandings for year: ${showYear}`);
    
    try {
      // Try the working API endpoint first
      console.log("📡 Trying primary API: site.api.espn.com");
      let response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/standings?season=${showYear}`);
      console.log("📡 Primary API response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("📡 Primary API response data:", data);
        console.log("📡 Primary API data.children:", data.children);
        console.log("📡 Primary API data.children length:", data.children?.length);
        
        if (data.children && data.children.length > 0) {
          data.children.forEach((conference, confIndex) => {
            console.log(`📡 Processing conference ${confIndex}:`, conference.name);
            console.log(`📡 Conference groups:`, conference.groups);
            
            if (conference.groups) {
              conference.groups.forEach((division, divIndex) => {
                console.log(`📡 Processing division ${divIndex}:`, division.name);
                console.log(`📡 Division standings:`, division.standings);
                
                if (division.standings && division.standings.entries) {
                  const divisionName = division.name || "Unknown";
                  const conferenceName = conference.name || "Unknown";
                  
                  console.log(`📡 Found ${division.standings.entries.length} teams in ${divisionName}`);
                  
                  if (!organizedStandings[conferenceName]) {
                    organizedStandings[conferenceName] = {};
                  }
                  
                  organizedStandings[conferenceName][divisionName] = division.standings.entries.map(team => ({
                    ...team,
                    conference: conferenceName,
                    division: divisionName
                  }));
                }
              });
            }
          });
        }
      } else {
        console.log("❌ Primary API failed with status:", response.status);
      }
      
      console.log("📊 Organized standings after primary API:", organizedStandings);
      console.log("📊 AFC keys:", Object.keys(organizedStandings.AFC));
      console.log("📊 NFC keys:", Object.keys(organizedStandings.NFC));
      
      // If no data from API, try alternative endpoints
      if (!Object.keys(organizedStandings.AFC).length && !Object.keys(organizedStandings.NFC).length) {
        console.log("🔄 No data from primary API, trying CDN endpoint");
        
        // Try CDN endpoint
        response = await fetch(`https://cdn.espn.com/core/nfl/standings?xhr=1&year=${showYear}`);
        console.log("📡 CDN API response status:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("📡 CDN API response data:", data);
          console.log("📡 CDN API content.standings:", data.content?.standings);
          console.log("📡 CDN API content.standings.groups:", data.content?.standings?.groups);
          
          if (data.content && data.content.standings && data.content.standings.groups) {
            data.content.standings.groups.forEach((conference, confIndex) => {
              console.log(`📡 CDN Processing conference ${confIndex}:`, conference.name);
              console.log(`📡 CDN Conference groups:`, conference.groups);
              
              if (conference.groups) {
                conference.groups.forEach((division, divIndex) => {
                  console.log(`📡 CDN Processing division ${divIndex}:`, division.name);
                  console.log(`📡 CDN Division standings:`, division.standings);
                  
                  if (division.standings && division.standings.entries) {
                    const divisionName = division.name || "Unknown";
                    const conferenceName = conference.name || "Unknown";
                    
                    console.log(`📡 CDN Found ${division.standings.entries.length} teams in ${divisionName}`);
                    
                    if (!organizedStandings[conferenceName]) {
                      organizedStandings[conferenceName] = {};
                    }
                    
                    organizedStandings[conferenceName][divisionName] = division.standings.entries.map(team => ({
                      ...team,
                      conference: conferenceName,
                      division: divisionName
                    }));
                  }
                });
              }
            });
          }
        } else {
          console.log("❌ CDN API failed with status:", response.status);
        }
      }
      
      console.log("📊 Organized standings after CDN API:", organizedStandings);
      console.log("📊 All conference keys:", Object.keys(organizedStandings));
      
      // Check if we have any data in any conference
      const hasData = Object.keys(organizedStandings).some(confKey => 
        Object.keys(organizedStandings[confKey]).length > 0
      );
      
      console.log("📊 Has data:", hasData);
      
      // Try v2 API as last resort
      if (!hasData) {
        console.log("🔄 No data from CDN API, trying v2 API");
        
        response = await fetch(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${showYear}/types/2/standings`);
        console.log("📡 v2 API response status:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("📡 v2 API response data:", data);
          console.log("📡 v2 API entries:", data.entries);
          console.log("📡 v2 API entries length:", data.entries?.length);
          
          if (data.entries && data.entries.length > 0) {
            console.log("📡 v2 API: Organizing teams manually");
            
            // Organize teams manually for v2 API
            const teamDivisions = {
              "BUF": "AFC East", "MIA": "AFC East", "NE": "AFC East", "NYJ": "AFC East",
              "BAL": "AFC North", "CIN": "AFC North", "CLE": "AFC North", "PIT": "AFC North",
              "HOU": "AFC South", "IND": "AFC South", "JAX": "AFC South", "TEN": "AFC South",
              "DEN": "AFC West", "KC": "AFC West", "LV": "AFC West", "LAC": "AFC West",
              "DAL": "NFC East", "NYG": "NFC East", "PHI": "NFC East", "WAS": "NFC East",
              "CHI": "NFC North", "DET": "NFC North", "GB": "NFC North", "MIN": "NFC North",
              "ATL": "NFC South", "CAR": "NFC South", "NO": "NFC South", "TB": "NFC South",
              "ARI": "NFC West", "LAR": "NFC West", "SF": "NFC West", "SEA": "NFC West"
            };
            
            data.entries.forEach((team, index) => {
              const teamAbbr = team.team?.abbreviation || team.abbreviation;
              console.log(`📡 v2 API Team ${index}: ${teamAbbr} - ${team.team?.name || team.name}`);
              
              const division = teamDivisions[teamAbbr];
              if (division) {
                const conference = division.startsWith("AFC") ? "American Football Conference" : "National Football Conference";
                
                console.log(`📡 v2 API Organizing ${teamAbbr} into ${conference} - ${division}`);
                
                if (!organizedStandings[conference]) {
                  organizedStandings[conference] = {};
                }
                if (!organizedStandings[conference][division]) {
                  organizedStandings[conference][division] = [];
                }
                
                organizedStandings[conference][division].push({
                  ...team,
                  conference: conference,
                  division: division
                });
              } else {
                console.log(`❌ v2 API: No division mapping found for ${teamAbbr}`);
              }
            });
          }
        } else {
          console.log("❌ v2 API failed with status:", response.status);
        }
      }
      
      console.log("📊 Final organized standings:", organizedStandings);
      console.log("📊 Final AFC keys:", Object.keys(organizedStandings.AFC));
      console.log("📊 Final NFC keys:", Object.keys(organizedStandings.NFC));
      
      // Final check for any data
      const finalHasData = Object.keys(organizedStandings).some(confKey => 
        Object.keys(organizedStandings[confKey]).length > 0
      );
      
      console.log("📊 Final has data:", finalHasData);
      
      if (!finalHasData) {
        console.log("❌ No data found from any API endpoint");
        throw new Error("No standings data available from any API endpoint");
      }
      
      console.log("✅ Successfully organized standings data");
      setStandingsData(organizedStandings);
    } catch (err) {
      console.error("💥 Error in fetchStandings:", err);
      console.error("💥 Error stack:", err.stack);
      setError("Failed to load standings data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  

  // Stat extraction helper
  function getStat(stats, key, value, fallback = "-") {
    return stats.find(s => s[key] === value)?.displayValue || fallback;
  }

  // Table and card class names
  const tableHeader = "px-4 py-4 text-center text-gray-900 font-['DM Sans'] font-semibold";
  const tableCell = "px-4 py-4 text-center text-gray-700 font-['DM Sans']";

  // Render team row
  const renderTeamRow = (team, index) => {
    const stats = team.stats || [];
    const teamInfo = team.team || team;
    const teamName = teamInfo.name || teamInfo.displayName || "Unknown Team";
    const teamAbbr = teamInfo.abbreviation || teamInfo.shortName || "NFL";
    const teamId = teamInfo.id || index;
    const wins = getStat(stats, "name", "wins", 0);
    const losses = getStat(stats, "name", "losses", 0);
    const ties = getStat(stats, "name", "ties", 0);
    const pct = getStat(stats, "name", "winPercent", "0.000");
    const pointsFor = getStat(stats, "name", "pointsFor", 0);
    const pointsAgainst = getStat(stats, "name", "pointsAgainst", 0);
    const pointDiff = getStat(stats, "name", "differential", 0);
    const divRecord = getStat(stats, "shortDisplayName", "DIV", "0-0");
    const confRecord = getStat(stats, "shortDisplayName", "CONF", "0-0");
    const homeRecord = getStat(stats, "shortDisplayName", "HOME", "0-0");
    const awayRecord = getStat(stats, "shortDisplayName", "AWAY", "0-0");
    const streak = getStat(stats, "name", "streak", "N/A");
    const diffNum = typeof pointDiff === "string" ? parseInt(pointDiff.replace(/[^-\d]/g, "")) : pointDiff;
    
    return (
      <tr
        key={teamId}
        className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
          index % 2 === 0 ? "bg-white" : "bg-gray-50"
        }`}
      >
        <td className={tableCell + " font-semibold text-gray-700 text-left"}>{index + 1}</td>
        <td className={"px-4 py-4"}>
          <div className="flex items-center space-x-3">
            <img
              src={`https://a.espncdn.com/i/teamlogos/nfl/500/${teamAbbr.toLowerCase()}.png`}
              alt={teamName}
              className="w-8 h-8 rounded-full"
              onError={e => {
                e.target.src = "/images/PFRlogo.jpg";
              }}
            />
            <div>
              <div className="text-gray-900 font-['DM Sans'] font-semibold">{teamName}</div>
              <div className={`text-sm ${team.conference === conferenceMap.AFC ? "text-red-600" : "text-blue-600"}`}>
                {team.division || "Unknown Division"}
              </div>
            </div>
          </div>
        </td>
        <td className={tableCell}>{wins}</td>
        <td className={tableCell}>{losses}</td>
        <td className={tableCell}>{ties}</td>
        <td className={tableCell}>{pct}</td>
        <td className={tableCell}>{pointsFor}</td>
        <td className={tableCell}>{pointsAgainst}</td>
        <td className={tableCell + " font-semibold " + (diffNum > 0 ? "text-green-600" : diffNum < 0 ? "text-red-600" : "text-gray-700")}>
          {pointDiff}
        </td>
        <td className={tableCell}>{divRecord}</td>
        <td className={tableCell}>{confRecord}</td>
        <td className={tableCell}>{homeRecord}</td>
        <td className={tableCell}>{awayRecord}</td>
        <td className={tableCell}>{streak}</td>
      </tr>
    );
  };

  // Render division table
  const renderDivisionTable = (conference, division, teams) => {
    if (!teams || teams.length === 0) return null;
    
    return (
      <div key={`${conference}-${division}`} className="mb-8">
        <div className="bg-gray-100 px-6 py-3 rounded-t-lg">
          <h3 className="text-lg font-['DM Sans'] font-semibold text-gray-900">{division}</h3>
        </div>
        <div className="bg-white rounded-b-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className={tableHeader + " text-left"}>Rank</th>
                  <th className={tableHeader + " text-left"}>Team</th>
                  <th className={tableHeader}>W</th>
                  <th className={tableHeader}>L</th>
                  <th className={tableHeader}>T</th>
                  <th className={tableHeader}>PCT</th>
                  <th className={tableHeader}>PF</th>
                  <th className={tableHeader}>PA</th>
                  <th className={tableHeader}>DIFF</th>
                  <th className={tableHeader}>DIV</th>
                  <th className={tableHeader}>CONF</th>
                  <th className={tableHeader}>HOME</th>
                  <th className={tableHeader}>AWAY</th>
                  <th className={tableHeader}>STREAK</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, index) => renderTeamRow(team, index))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render conference section
  const renderConferenceSection = (conference) => {
    // Map short conference names to full names for data lookup
    const conferenceDataMap = {
      "AFC": standingsData["American Football Conference"] || standingsData.AFC,
      "NFC": standingsData["National Football Conference"] || standingsData.NFC
    };
    
    const conferenceData = conferenceDataMap[conference];
    if (!conferenceData) {
      console.log(`❌ No data found for conference: ${conference}`);
      console.log(`📊 Available conference keys:`, Object.keys(standingsData));
      return null;
    }
    
    console.log(`✅ Rendering conference: ${conference}`, conferenceData);
    
    return (
      <div key={conference} className="mb-12">
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4 rounded-lg mb-6">
          <div className="flex items-center justify-center space-x-4">
            {conference === "AFC" && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 relative">
                  <img
                    src="https://sports.cbsimg.net/fly/images/conference/225.svg"
                    alt="AFC Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h2 className="text-2xl font-['DM Sans'] font-bold text-white">
                  {conferenceMap[conference]}
                </h2>
              </div>
            )}
            {conference === "NFC" && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 relative">
                  <img
                    src="https://sports.cbsimg.net/fly/images/conference/226.svg"
                    alt="NFC Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h2 className="text-2xl font-['DM Sans'] font-bold text-white">
                  {conferenceMap[conference]}
                </h2>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-8">
          {divisions[conference].map(division => 
            renderDivisionTable(conference, division, conferenceData[division])
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <Nav />
        <div className="max-w-7xl mx-auto px-4 py-10 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-700 text-lg">Loading NFL standings...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Nav />
        <div className="max-w-7xl mx-auto px-4 py-10 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <button
              onClick={fetchStandings}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-[#ECCE8B] min-h-screen">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 py-10">


        {/* Conference Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setSelectedConference("all")}
            className={`px-6 py-3 rounded-lg font-['DM Sans'] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg bg-white border-2 text-gray-900 font-semibold ${
              selectedConference === "all" 
                ? "border-blue-500 bg-blue-50 shadow-blue-200 scale-105" 
                : "border-gray-300 hover:border-gray-400 hover:shadow-xl"
            }`}
          >
            All Conferences
          </button>
          {conferences.map(conference => (
            <button
              key={conference}
              onClick={() => setSelectedConference(conference)}
              className={`px-6 py-3 rounded-lg font-['DM Sans'] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg bg-white border-2 text-gray-900 font-semibold ${
                selectedConference === conference 
                  ? conference === "AFC"
                    ? "border-red-500 bg-red-50 shadow-red-200 scale-105"
                    : "border-blue-500 bg-blue-50 shadow-blue-200 scale-105"
                  : "border-gray-300 hover:border-gray-400 hover:shadow-xl"
              }`}
            >
              {conference}
            </button>
          ))}
        </div>

        {/* Standings Tables */}
        <div>
          {selectedConference === "all" 
            ? conferences.map(conference => renderConferenceSection(conference))
            : renderConferenceSection(selectedConference)
          }
        </div>

        {/* Legend */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-900 font-['DM Sans'] font-semibold mb-4">Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
            <div><span className="font-semibold">W:</span> Wins</div>
            <div><span className="font-semibold">L:</span> Losses</div>
            <div><span className="font-semibold">T:</span> Ties</div>
            <div><span className="font-semibold">PCT:</span> Win Percentage</div>
            <div><span className="font-semibold">PF:</span> Points For</div>
            <div><span className="font-semibold">PA:</span> Points Against</div>
            <div><span className="font-semibold">DIFF:</span> Point Differential</div>
            <div><span className="font-semibold">DIV:</span> Division Record</div>
            <div><span className="font-semibold">CONF:</span> Conference Record</div>
            <div><span className="font-semibold">HOME:</span> Home Record</div>
            <div><span className="font-semibold">AWAY:</span> Away Record</div>
            <div><span className="font-semibold">STREAK:</span> Current Streak</div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
