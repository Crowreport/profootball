"use client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Image from "next/image";
import Card from "./Card";
import TeamInfoEditModal from "@/components/TeamInfoEditModal";
import TeamStatsEditModal from "@/components/TeamStatsEditModal";
import TeamScheduleEditModal from "@/components/TeamScheduleEditModal";
import TeamNewsEditModal from "@/components/TeamNewsEditModal";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

// Helper: Map team names to primary colors
const teamColors = {
  "Buffalo Bills": "#00338D",
  "Miami Dolphins": "#008E97",
  "New York Jets": "#125740",
  "New England Patriots": "#002244",
  "Baltimore Ravens": "#241773",
  "Cincinnati Bengals": "#FB4F14",
  "Cleveland Browns": "#311D00",
  "Pittsburgh Steelers": "#FFB612",
  "Houston Texans": "#03202F",
  "Indianapolis Colts": "#003B7B",
  "Jacksonville Jaguars": "#006778",
  "Tennessee Titans": "#4B92DB",
  "Denver Broncos": "#002244",
  "Kansas City Chiefs": "#E31837",
  "Las Vegas Raiders": "#000000",
  "Los Angeles Chargers": "#0080C6",
  "Dallas Cowboys": "#041E42",
  "New York Giants": "#0B2265",
  "Philadelphia Eagles": "#004C54",
  "Washington Commanders": "#5A1414",
  "Chicago Bears": "#0B162A",
  "Detroit Lions": "#0076B6",
  "Green Bay Packers": "#203731",
  "Minnesota Vikings": "#4F2683",
  "Atlanta Falcons": "#A71930",
  "Carolina Panthers": "#0085CA",
  "New Orleans Saints": "#D3BC8D",
  "Tampa Bay Buccaneers": "#D50A0A",
  "Arizona Cardinals": "#97233F",
  "Los Angeles Rams": "#003594",
  "San Francisco 49ers": "#AA0000",
  "Seattle Seahawks": "#002244"
};

// Add a mapping for team conferences/divisions
const teamConference = {
  "Buffalo Bills": "AFC East",
  "Miami Dolphins": "AFC East",
  "New York Jets": "AFC East",
  "New England Patriots": "AFC East",
  "Baltimore Ravens": "AFC North",
  "Cincinnati Bengals": "AFC North",
  "Cleveland Browns": "AFC North",
  "Pittsburgh Steelers": "AFC North",
  "Houston Texans": "AFC South",
  "Indianapolis Colts": "AFC South",
  "Jacksonville Jaguars": "AFC South",
  "Tennessee Titans": "AFC South",
  "Denver Broncos": "AFC West",
  "Kansas City Chiefs": "AFC West",
  "Las Vegas Raiders": "AFC West",
  "Los Angeles Chargers": "AFC West",
  "Dallas Cowboys": "NFC East",
  "New York Giants": "NFC East",
  "Philadelphia Eagles": "NFC East",
  "Washington Commanders": "NFC East",
  "Chicago Bears": "NFC North",
  "Detroit Lions": "NFC North",
  "Green Bay Packers": "NFC North",
  "Minnesota Vikings": "NFC North",
  "Atlanta Falcons": "NFC South",
  "Carolina Panthers": "NFC South",
  "New Orleans Saints": "NFC South",
  "Tampa Bay Buccaneers": "NFC South",
  "Arizona Cardinals": "NFC West",
  "Los Angeles Rams": "NFC West",
  "San Francisco 49ers": "NFC West",
  "Seattle Seahawks": "NFC West"
};

// Social media mapping for each team
const teamSocials = {
  "Arizona Cardinals": {
    website: "https://www.azcardinals.com/",
    facebook: "https://www.facebook.com/arizonacardinals",
    instagram: "https://www.instagram.com/azcardinals/",
    snapchat: "https://www.snapchat.com/add/azcardinals",
    twitter: "https://twitter.com/AZCardinals"
  },
  "Atlanta Falcons": {
    website: "https://www.atlantafalcons.com/",
    facebook: "https://www.facebook.com/atlantafalcons",
    instagram: "https://www.instagram.com/atlantafalcons/",
    snapchat: "https://www.snapchat.com/add/atlantafalcons",
    twitter: "https://twitter.com/AtlantaFalcons"
  },
  "Baltimore Ravens": {
    website: "https://www.baltimoreravens.com/",
    facebook: "https://www.facebook.com/baltimoreravens",
    instagram: "https://www.instagram.com/ravens/",
    snapchat: "https://www.snapchat.com/add/bltravens",
    twitter: "https://twitter.com/Ravens"
  },
  "Buffalo Bills": {
    website: "https://www.buffalobills.com/",
    facebook: "https://www.facebook.com/BuffaloBills",
    instagram: "https://www.instagram.com/buffalobills/",
    snapchat: "https://www.snapchat.com/add/BillsNFL",
    twitter: "https://twitter.com/buffalobills"
  },
  "Carolina Panthers": {
    website: "https://www.panthers.com/",
    facebook: "https://www.facebook.com/CarolinaPanthers",
    instagram: "https://www.instagram.com/panthers/",
    snapchat: "https://www.snapchat.com/add/panthers",
    twitter: "https://twitter.com/Panthers"
  },
  "Chicago Bears": {
    website: "https://www.chicagobears.com/",
    facebook: "https://www.facebook.com/ChicagoBears",
    instagram: "https://www.instagram.com/chicagobears/",
    snapchat: "https://www.snapchat.com/add/chicagobears",
    twitter: "https://twitter.com/ChicagoBears"
  },
  "Cincinnati Bengals": {
    website: "https://www.bengals.com/",
    facebook: "https://www.facebook.com/Bengals",
    instagram: "https://www.instagram.com/bengals/",
    snapchat: "https://www.snapchat.com/add/bengals",
    twitter: "https://twitter.com/Bengals"
  },
  "Cleveland Browns": {
    website: "https://www.clevelandbrowns.com/",
    facebook: "https://www.facebook.com/clevelandbrowns",
    instagram: "https://www.instagram.com/clevelandbrowns/",
    snapchat: "https://www.snapchat.com/add/officialbrowns",
    twitter: "https://twitter.com/Browns"
  },
  "Dallas Cowboys": {
    website: "https://www.dallascowboys.com/",
    facebook: "https://www.facebook.com/DallasCowboys",
    instagram: "https://www.instagram.com/dallascowboys/",
    snapchat: "https://www.snapchat.com/add/dallascowboys",
    twitter: "https://twitter.com/dallascowboys"
  },
  "Denver Broncos": {
    website: "https://www.denverbroncos.com/",
    facebook: "https://www.facebook.com/DenverBroncos",
    instagram: "https://www.instagram.com/denverbroncos/",
    snapchat: "https://www.snapchat.com/add/broncos",
    twitter: "https://twitter.com/Broncos"
  },
  "Detroit Lions": {
    website: "https://www.detroitlions.com/",
    facebook: "https://www.facebook.com/DetroitLions",
    instagram: "https://www.instagram.com/detroitlionsnfl/",
    snapchat: "https://www.snapchat.com/add/detroitlionsnfl",
    twitter: "https://twitter.com/Lions"
  },
  "Green Bay Packers": {
    website: "https://www.packers.com/",
    facebook: "https://www.facebook.com/packers",
    instagram: "https://www.instagram.com/packers/",
    snapchat: "https://www.snapchat.com/add/packers",
    twitter: "https://twitter.com/packers"
  },
  "Houston Texans": {
    website: "https://www.houstontexans.com/",
    facebook: "https://www.facebook.com/HoustonTexans",
    instagram: "https://www.instagram.com/houstontexans/",
    snapchat: "https://www.snapchat.com/add/houstontexans",
    twitter: "https://twitter.com/HoustonTexans"
  },
  "Indianapolis Colts": {
    website: "https://www.colts.com/",
    facebook: "https://www.facebook.com/colts",
    instagram: "https://www.instagram.com/colts/",
    snapchat: "https://www.snapchat.com/add/colts",
    twitter: "https://twitter.com/Colts"
  },
  "Jacksonville Jaguars": {
    website: "https://www.jaguars.com/",
    facebook: "https://www.facebook.com/jacksonvillejaguars",
    instagram: "https://www.instagram.com/jaguars/",
    snapchat: "https://www.snapchat.com/add/jaguars",
    twitter: "https://twitter.com/Jaguars"
  },
  "Kansas City Chiefs": {
    website: "https://www.chiefs.com/",
    facebook: "https://www.facebook.com/KansasCityChiefs",
    instagram: "https://www.instagram.com/chiefs/",
    snapchat: "https://www.snapchat.com/add/kcchiefs",
    twitter: "https://twitter.com/Chiefs"
  },
  "Las Vegas Raiders": {
    website: "https://www.raiders.com/",
    facebook: "https://www.facebook.com/Raiders",
    instagram: "https://www.instagram.com/raiders/",
    snapchat: "https://www.snapchat.com/add/raidersofficial",
    twitter: "https://twitter.com/Raiders"
  },
  "Los Angeles Chargers": {
    website: "https://www.chargers.com/",
    facebook: "https://www.facebook.com/chargers",
    instagram: "https://www.instagram.com/chargers/",
    snapchat: "https://www.snapchat.com/add/chargers",
    twitter: "https://twitter.com/chargers"
  },
  "Los Angeles Rams": {
    website: "https://www.therams.com/",
    facebook: "https://www.facebook.com/Rams",
    instagram: "https://www.instagram.com/rams/",
    snapchat: "https://www.snapchat.com/add/ramsnfl",
    twitter: "https://twitter.com/RamsNFL"
  },
  "Miami Dolphins": {
    website: "https://www.miamidolphins.com/",
    facebook: "https://www.facebook.com/MiamiDolphins",
    instagram: "https://www.instagram.com/miamidolphins/",
    snapchat: "https://www.snapchat.com/add/miamidolphins",
    twitter: "https://twitter.com/MiamiDolphins"
  },
  "Minnesota Vikings": {
    website: "https://www.vikings.com/",
    facebook: "https://www.facebook.com/minnesotavikings",
    instagram: "https://www.instagram.com/vikings/",
    snapchat: "https://www.snapchat.com/add/minnesotavikings",
    twitter: "https://twitter.com/Vikings"
  },
  "New England Patriots": {
    website: "https://www.patriots.com/",
    facebook: "https://www.facebook.com/newenglandpatriots",
    instagram: "https://www.instagram.com/patriots/",
    snapchat: "https://www.snapchat.com/add/patriots",
    twitter: "https://twitter.com/Patriots"
  },
  "New Orleans Saints": {
    website: "https://www.neworleanssaints.com/",
    facebook: "https://www.facebook.com/neworleanssaints",
    instagram: "https://www.instagram.com/saints/",
    snapchat: "https://www.snapchat.com/add/saints",
    twitter: "https://twitter.com/Saints"
  },
  "New York Giants": {
    website: "https://www.giants.com/",
    facebook: "https://www.facebook.com/newyorkgiants",
    instagram: "https://www.instagram.com/nygiants/",
    snapchat: "https://www.snapchat.com/add/nygiants",
    twitter: "https://twitter.com/Giants"
  },
  "New York Jets": {
    website: "https://www.newyorkjets.com/",
    facebook: "https://www.facebook.com/jets",
    instagram: "https://www.instagram.com/nyjets/",
    snapchat: "https://www.snapchat.com/add/officialnyjets",
    twitter: "https://twitter.com/nyjets"
  },
  "Philadelphia Eagles": {
    website: "https://www.philadelphiaeagles.com/",
    facebook: "https://www.facebook.com/philadelphiaeagles",
    instagram: "https://www.instagram.com/philadelphiaeagles/",
    snapchat: "https://www.snapchat.com/add/officialeagles",
    twitter: "https://twitter.com/Eagles"
  },
  "Pittsburgh Steelers": {
    website: "https://www.steelers.com/",
    facebook: "https://www.facebook.com/PittsburghSteelers",
    instagram: "https://www.instagram.com/steelers/",
    snapchat: "https://www.snapchat.com/add/steelersofficial",
    twitter: "https://twitter.com/steelers"
  },
  "San Francisco 49ers": {
    website: "https://www.49ers.com/",
    facebook: "https://www.facebook.com/SANFRANCISCO49ERS",
    instagram: "https://www.instagram.com/49ers/",
    snapchat: "https://www.snapchat.com/add/official49ers",
    twitter: "https://twitter.com/49ers"
  },
  "Seattle Seahawks": {
    website: "https://www.seahawks.com/",
    facebook: "https://www.facebook.com/Seahawks",
    instagram: "https://www.instagram.com/seahawks/",
    snapchat: "https://www.snapchat.com/add/seahawks",
    twitter: "https://twitter.com/Seahawks"
  },
  "Tampa Bay Buccaneers": {
    website: "https://www.buccaneers.com/",
    facebook: "https://www.facebook.com/tampabaybuccaneers",
    instagram: "https://www.instagram.com/buccaneers/",
    snapchat: "https://www.snapchat.com/add/buccaneersnfl",
    twitter: "https://twitter.com/Buccaneers"
  },
  "Tennessee Titans": {
    website: "https://www.tennesseetitans.com/",
    facebook: "https://www.facebook.com/titans",
    instagram: "https://www.instagram.com/titans/",
    snapchat: "https://www.snapchat.com/add/titans",
    twitter: "https://twitter.com/Titans"
  },
  "Washington Commanders": {
    website: "https://www.commanders.com/",
    facebook: "https://www.facebook.com/commanders",
    instagram: "https://www.instagram.com/commanders/",
    snapchat: "https://www.snapchat.com/add/commanders",
    twitter: "https://twitter.com/Commanders"
  }
};

export default function TeamPage({ params }) {
  const { isAdmin } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [teamInfo, setTeamInfo] = useState({
    headCoach: 'Coach Name',
    stadium: 'Stadium Name',
    established: 'Year'
  });
  const [teamStats, setTeamStats] = useState({
    record: 'W-L-T',
    divisionPosition: 'Division Position'
  });
  const [teamSchedule, setTeamSchedule] = useState([]);
  const [teamNews, setTeamNews] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeTeam = async () => {
      try {
        const resolvedParams = await params;
        const name = resolvedParams.team.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        setTeamName(name);

        // Fetch team info, stats, schedule, and news from API
        const [infoResponse, statsResponse, scheduleResponse, newsResponse] = await Promise.all([
          fetch(`/api/manage-team-info?teamName=${encodeURIComponent(name)}`),
          fetch(`/api/manage-team-stats?teamName=${encodeURIComponent(name)}`),
          fetch(`/api/manage-team-schedule?teamName=${encodeURIComponent(name)}`),
          fetch(`/api/manage-team-news?teamName=${encodeURIComponent(name)}`)
        ]);
        
        if (infoResponse.ok) {
          const infoData = await infoResponse.json();
          setTeamInfo(infoData.teamInfo);
        }
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setTeamStats(statsData.teamStats);
        }
        
        if (scheduleResponse.ok) {
          const scheduleData = await scheduleResponse.json();
          setTeamSchedule(scheduleData.schedules);
        }
        
        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          setTeamNews(newsData.newsArticles || []);
        }
      } catch (error) {
        console.error('Error initializing team:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeTeam();
  }, [params]);

  const handleEditTeamInfo = () => {
    setEditModalOpen(true);
  };

  const handleEditTeamStats = () => {
    setStatsModalOpen(true);
  };

  const handleEditSchedule = () => {
    setScheduleModalOpen(true);
  };

  const handleAddNews = () => {
    setEditingNews(null);
    setNewsModalOpen(true);
  };

  const handleEditNews = (newsArticle) => {
    setEditingNews(newsArticle);
    setNewsModalOpen(true);
  };

  const handleTeamInfoSave = (updatedTeamInfo) => {
    setTeamInfo(updatedTeamInfo.teamInfo);
  };

  const handleTeamStatsSave = (updatedTeamStats) => {
    setTeamStats(updatedTeamStats.teamStats);
  };

  const handleScheduleSave = (updatedSchedule) => {
    setTeamSchedule(updatedSchedule.schedules);
  };

  const handleNewsSave = (result) => {
    setTeamNews(result.newsArticles || []);
  };

  const handleModalClose = () => {
    setEditModalOpen(false);
  };

  const handleStatsModalClose = () => {
    setStatsModalOpen(false);
  };

  const handleScheduleModalClose = () => {
    setScheduleModalOpen(false);
  };

  const handleNewsModalClose = () => {
    setNewsModalOpen(false);
    setEditingNews(null);
  };

  const formatDateTime = (date, time) => {
    if (!date || !time) return 'TBD';
    const gameDate = new Date(`${date}T${time}`);
    return gameDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="bg-[#ECCE8B] min-h-screen">
        <Nav />
        <div className="flex justify-center items-center h-96">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Loading team...</h2>
            <p>Please wait while we fetch the team information.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const accent = teamColors[teamName] || '#222';
  const conference = teamConference[teamName] || 'NFL Team';
  const socials = teamSocials[teamName] || {};

  return (
    <div className="bg-[#ECCE8B] min-h-screen">
      <Nav />
      {/* Team Header Banner */}
      <div style={{
        background: `linear-gradient(90deg, ${accent} 60%, #fff 100%)`,
        borderRadius: 16,
        margin: '32px auto 24px',
        maxWidth: 1200,
        boxShadow: '0 6px 32px 0 rgba(0,0,0,0.10)',
        padding: '32px 40px',
        display: 'flex',
        alignItems: 'center',
        gap: 32
      }}>
        <div style={{ width: 110, height: 110, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)' }}>
          <Image
            src={`https://sports.cbsimg.net/fly/images/team-logos/${getTeamLogoId(teamName)}.svg`}
            alt={`${teamName} logo`}
            width={90}
            height={90}
            style={{ objectFit: 'contain' }}
          />
        </div>
        <div>
          <h1 style={{ 
            fontSize: 44, 
            fontWeight: 800, 
            color: '#fff', 
            marginBottom: 8, 
            textShadow: '0 2px 8px rgba(0,0,0,0.25), 0 1px 0 #222' 
          }}>{teamName}</h1>
          <p style={{ 
            color: '#fff', 
            fontSize: 22, 
            fontWeight: 600, 
            letterSpacing: 1, 
            background: 'rgba(0,0,0,0.15)', 
            display: 'inline-block', 
            padding: '2px 16px', 
            borderRadius: 8, 
            textShadow: '0 2px 8px rgba(0,0,0,0.25), 0 1px 0 #222',
            marginTop: 6
          }}>{conference}</p>
          {/* Social Media Row */}
          <div style={{ display: 'flex', gap: 32, marginTop: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            {socials.website && (
              <a href={socials.website} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@3.13.0/icons/safari.svg" alt="Website" width={20} height={20} style={{ filter: 'invert(1)' }} />
                <span style={{ fontWeight: 500, fontSize: 16 }}>Official Website</span>
              </a>
            )}
            {socials.facebook && (
              <a href={socials.facebook} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg" alt="Facebook" width={20} height={20} style={{ filter: 'invert(1)' }} />
                <span style={{ fontWeight: 500, fontSize: 16 }}>@{teamName.replace(/ /g, '')}</span>
              </a>
            )}
            {socials.instagram && (
              <a href={socials.instagram} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg" alt="Instagram" width={20} height={20} style={{ filter: 'invert(1)' }} />
                <span style={{ fontWeight: 500, fontSize: 16 }}>@{teamName.toLowerCase().replace(/ /g, '')}</span>
              </a>
            )}
            {socials.snapchat && (
              <a href={socials.snapchat} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/snapchat.svg" alt="Snapchat" width={20} height={20} style={{ filter: 'invert(1)' }} />
                <span style={{ fontWeight: 500, fontSize: 16 }}>@{teamName.replace(/ /g, '')}</span>
              </a>
            )}
            {socials.twitter && (
              <a href={socials.twitter} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/x.svg" alt="X (Twitter)" width={20} height={20} style={{ filter: 'invert(1)' }} />
                <span style={{ fontWeight: 500, fontSize: 16 }}>@{teamName.toLowerCase().replace(/ /g, '')}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-2" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Latest News */}
          <Card accent={accent}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold" style={{ color: accent }}>Latest News</h2>
              {isAdmin() && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddNews}
                    className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                  >
                    {teamNews && teamNews.length >= 5 ? 'Replace Oldest' : 'Add News'}
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {teamNews && teamNews.length > 0 ? (
                teamNews.map((newsArticle, index) => (
                  <div key={index} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          <a
                            href={newsArticle.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-black hover:underline hover:text-blue-500"
                          >
                            {newsArticle.title}
                          </a>
                        </h3>
                        <span className="text-xs text-gray-500 mt-1 block">
                          {formatDate(newsArticle.updatedAt)}
                        </span>
                      </div>
                      {isAdmin() && (
                        <button
                          onClick={() => handleEditNews(newsArticle)}
                          className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition-colors ml-4"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No news available</p>
                  {isAdmin() && (
                    <p className="text-gray-400 text-sm mt-1">Click &quot;Add News&quot; to create a news article</p>
                  )}
                </div>
              )}
              {teamNews && teamNews.length >= 5 && isAdmin() && (
                <div className="text-center pt-2">
                  <p className="text-xs text-gray-500">
                    Maximum 5 news articles reached. Adding new articles will remove the oldest ones.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Schedule */}
          <Card accent={accent}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold" style={{ color: accent }}>Schedule</h2>
              {isAdmin() && (
                <button
                  onClick={handleEditSchedule}
                  className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="space-y-4">
              {teamSchedule && teamSchedule.length > 0 ? (
                teamSchedule.slice(0, 5).map((game, index) => (
                  <div key={index} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {game.homeTeam} vs {game.awayTeam}
                        </h3>
                        <p className="text-gray-600 text-sm">{game.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatDateTime(game.gameDate, game.gameTime)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No games scheduled</p>
                  {isAdmin() && (
                    <p className="text-gray-400 text-sm mt-1">Click &quot;Edit&quot; to add games</p>
                  )}
                </div>
              )}
              {teamSchedule && teamSchedule.length > 5 && (
                <div className="text-center pt-2">
                  <p className="text-sm text-gray-500">
                    Showing 5 of {teamSchedule.length} games
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Team Info */}
          <Card accent={accent}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold" style={{ color: accent }}>Team Info</h2>
              {isAdmin() && (
                <button
                  onClick={handleEditTeamInfo}
                  className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Head Coach</h3>
                <p className="text-gray-600">{teamInfo.headCoach}</p>
              </div>
              <div>
                <h3 className="font-semibold">Stadium</h3>
                <p className="text-gray-600">{teamInfo.stadium}</p>
              </div>
              <div>
                <h3 className="font-semibold">Established</h3>
                <p className="text-gray-600">{teamInfo.established}</p>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <Card accent={accent}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold" style={{ color: accent }}>Team Stats</h2>
              {isAdmin() && (
                <button
                  onClick={handleEditTeamStats}
                  className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Record</h3>
                <p className="text-gray-600">{teamStats.record}</p>
              </div>
              <div>
                <h3 className="font-semibold">Standings</h3>
                <p className="text-gray-600">{teamStats.divisionPosition}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <Footer />

      {isAdmin() && (
        <>
          <TeamInfoEditModal
            isOpen={editModalOpen}
            onClose={handleModalClose}
            teamName={teamName}
            teamInfo={teamInfo}
            onSave={handleTeamInfoSave}
          />
          <TeamStatsEditModal
            isOpen={statsModalOpen}
            onClose={handleStatsModalClose}
            teamName={teamName}
            teamStats={teamStats}
            onSave={handleTeamStatsSave}
          />
          <TeamScheduleEditModal
            isOpen={scheduleModalOpen}
            onClose={handleScheduleModalClose}
            teamName={teamName}
            schedules={teamSchedule}
            onSave={handleScheduleSave}
          />
          <TeamNewsEditModal
            isOpen={newsModalOpen}
            onClose={handleNewsModalClose}
            teamName={teamName}
            newsArticle={editingNews}
            onSave={handleNewsSave}
          />
        </>
      )}
    </div>
  );
}

// Helper function to get team logo ID
function getTeamLogoId(teamName) {
  const teamLogoMap = {
    "Buffalo Bills": "407",
    "Miami Dolphins": "418",
    "New York Jets": "423",
    "New England Patriots": "420",
    "Baltimore Ravens": "406",
    "Cincinnati Bengals": "410",
    "Cleveland Browns": "434",
    "Pittsburgh Steelers": "426",
    "Houston Texans": "247415",
    "Indianapolis Colts": "415",
    "Jacksonville Jaguars": "416",
    "Tennessee Titans": "432",
    "Denver Broncos": "412",
    "Kansas City Chiefs": "417",
    "Las Vegas Raiders": "424",
    "Los Angeles Chargers": "428",
    "Dallas Cowboys": "411",
    "New York Giants": "422",
    "Philadelphia Eagles": "425",
    "Washington Commanders": "433",
    "Chicago Bears": "409",
    "Detroit Lions": "413",
    "Green Bay Packers": "414",
    "Minnesota Vikings": "419",
    "Atlanta Falcons": "405",
    "Carolina Panthers": "408",
    "New Orleans Saints": "421",
    "Tampa Bay Buccaneers": "431",
    "Arizona Cardinals": "404",
    "Los Angeles Rams": "427",
    "San Francisco 49ers": "429",
    "Seattle Seahawks": "430"
  };
  
  return teamLogoMap[teamName] || "404";
}
