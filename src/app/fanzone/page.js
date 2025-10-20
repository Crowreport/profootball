'use client';

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Image from "next/image";
import TeamForumEditModal from "@/components/TeamForumEditModal";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

const conferences = {
  "AFC": [
    { 
      name: "Buffalo Bills", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/407.svg"
    },
    { 
      name: "Miami Dolphins", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/418.svg"
    },
    { 
      name: "New York Jets", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/423.svg"
    },
    { 
      name: "New England Patriots", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/420.svg"
    },
    { 
      name: "Baltimore Ravens", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/406.svg"
    },
    { 
      name: "Cincinnati Bengals", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/410.svg"
    },
    { 
      name: "Cleveland Browns", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/434.svg"
    },
    { 
      name: "Pittsburgh Steelers", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/426.svg",
      forums: [
        { name: "Steelers Nation", url: "https://www.steelernationforum.com/" },
        { name: "TheSteelersFans", url: "https://thesteelersfans.com/forums/" },
        { name: "Steelers Universe", url: "https://www.steelersuniverse.com/forums/forum.php" },
        { name: "Planet Steelers", url: "https://www.planetsteelers.com" },
        { name: "Reddit - r/steelers", url: "https://www.reddit.com/r/steelers/" }
      ]
    },
    { 
      name: "Houston Texans", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/247415.svg"
    },
    { 
      name: "Indianapolis Colts", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/415.svg"
    },
    { 
      name: "Jacksonville Jaguars", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/416.svg"
    },
    { 
      name: "Tennessee Titans", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/432.svg"
    },
    { 
      name: "Denver Broncos", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/412.svg",
      forums: [
        { name: "Broncos Forums", url: "https://www.broncosforums.com/forums/forumdisplay.php?f=6" },
        { name: "Orange Huddle", url: "https://www.broncosboard.com/" },
        { name: "Reddit - r/DenverBroncos", url: "https://www.reddit.com/r/DenverBroncos/" },
        { name: "ProFootballForums – Broncos", url: "https://www.profootballforums.com/forums/denver-broncos-forum.11/" },
        { name: "FootballsFuture – Broncos", url: "https://forums.footballsfuture.com/forum/28-denver-broncos/" }
      ]
    },
    { 
      name: "Kansas City Chiefs", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/417.svg"
    },
    { 
      name: "Las Vegas Raiders", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/424.svg"
    },
    { 
      name: "Los Angeles Chargers", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/428.svg"
    }
  ],
  "NFC": [
    { 
      name: "Dallas Cowboys", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/411.svg",
      forums: [
        { name: "CowboysZone", url: "https://cowboyszone.com/" },
        { name: "Dallas Cowboys Central", url: "https://www.dallascowboyscentral.com/" },
        { name: "Inside The Star Forums", url: "https://boards.insidethestar.com" },
        { name: "Reddit - r/cowboys", url: "https://www.reddit.com/r/cowboys/" },
        { name: "FootballsFuture – Cowboys", url: "https://forums.footballsfuture.com/forum/33-dallas-cowboys/" }
      ]
    },
    { 
      name: "New York Giants", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/422.svg"
    },
    { 
      name: "Philadelphia Eagles", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/425.svg"
    },
    { 
      name: "Washington Commanders", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/433.svg"
    },
    { 
      name: "Chicago Bears", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/409.svg"
    },
    { 
      name: "Detroit Lions", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/413.svg",
      forums: [
        { name: "The Den", url: "https://thedenforum.com/" },
        { name: "LionsRedZone", url: "https://www.lionsredzone.com/" },
        { name: "MotownSports Lions Forum", url: "https://www.motownsports.com/forums/forum/43-the-den/" },
        { name: "Reddit - r/detroitlions", url: "https://www.reddit.com/r/detroitlions/" },
        { name: "DetroitLionsForum.com", url: "https://www.detroitlionsforum.com/forums/" }
      ]
    },
    { 
      name: "Green Bay Packers", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/414.svg",
      forums: [
        { name: "PackerForum.com", url: "https://www.packerforum.com/" },
        { name: "Times Four", url: "https://packers.timesfour.com/forum/green-bay-packers" },
        { name: "Packers-Huddle", url: "https://packers-huddle.com/phpBB/viewforum.php?f=7" },
        { name: "PackerChatters", url: "https://packerchatters.com/" },
        { name: "Reddit - r/GreenBayPackers", url: "https://www.reddit.com/r/GreenBayPackers/" }
      ]
    },
    { 
      name: "Minnesota Vikings", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/419.svg",
      forums: [
        { name: "Purple Pain Forums", url: "https://purplepainforums.com/" },
        { name: "Vikings Territory", url: "https://www.vikingsmessageboard.com/viewforum.php?f=1" },
        { name: "Reddit - r/minnesotavikings", url: "https://www.reddit.com/r/minnesotavikings/" }
      ]
    },
    { 
      name: "Atlanta Falcons", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/405.svg"
    },
    { 
      name: "Carolina Panthers", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/408.svg"
    },
    { 
      name: "New Orleans Saints", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/421.svg"
    },
    { 
      name: "Tampa Bay Buccaneers", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/431.svg"
    },
    { 
      name: "Arizona Cardinals", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/404.svg",
      forums: [
        { name: "Arizona Sports Fans Forum", url: "https://www.arizonasportsfans.com/forum/forums/arizona-cardinals.4/" },
        { name: "Cardinals Free Forums", url: "https://arizonacardinals.freeforums.net/" },
        { name: "Reddit - r/AZCardinals", url: "https://www.reddit.com/r/AZCardinals/" },
        { name: "RealGM Cardinals Board", url: "https://forums.realgm.com/boards/viewforum.php?f=145" }
      ]
    },
    { 
      name: "Los Angeles Rams", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/427.svg"
    },
    { 
      name: "San Francisco 49ers", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/429.svg"
    },
    { 
      name: "Seattle Seahawks", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/430.svg"
    }
  ]
};

export default function FanzonePage() {
  const { isAdmin } = useAuth();
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [teamForums, setTeamForums] = useState({});
  const [loading, setLoading] = useState(true);
  const [forumModalOpen, setForumModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    const loadAllTeamForums = async () => {
      setLoading(true);
      const allTeams = [...conferences.AFC, ...conferences.NFC];
      const forumData = {};

      for (const team of allTeams) {
        try {
          const response = await fetch(`/api/manage-team-forums?teamName=${encodeURIComponent(team.name)}`);
          if (response.ok) {
            const data = await response.json();
            forumData[team.name] = data.forums || [];
          } else {
            forumData[team.name] = [];
          }
        } catch (error) {
          console.error(`Error loading forums for ${team.name}:`, error);
          forumData[team.name] = [];
        }
      }

      setTeamForums(forumData);
      setLoading(false);
    };

    loadAllTeamForums();
  }, []);

  const toggleTeam = (teamName) => {
    setExpandedTeam(expandedTeam === teamName ? null : teamName);
  };

  const handleEditForums = (teamName) => {
    setSelectedTeam(teamName);
    setForumModalOpen(true);
  };

  const handleForumSave = (result) => {
    if (selectedTeam) {
      setTeamForums(prev => ({
        ...prev,
        [selectedTeam]: result.forums || []
      }));
    }
  };

  const handleModalClose = () => {
    setForumModalOpen(false);
    setSelectedTeam(null);
  };

  const renderTeamSection = (conference, teams) => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4 rounded-lg mb-6">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 relative">
              <Image
                src={conference === "AFC" 
                  ? "https://sports.cbsimg.net/fly/images/conference/225.svg"
                  : "https://sports.cbsimg.net/fly/images/conference/226.svg"
                }
                alt={`${conference} Logo`}
                fill
                className="object-contain"
              />
            </div>
            <h2 className="text-2xl font-['DM Sans'] font-bold text-white">{conference} Forums</h2>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="divide-y">
          {teams.map((team) => {
            const forums = teamForums[team.name] || [];
            return (
              <div key={team.name} className="group">
                <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-all duration-200">
                  <button
                    onClick={() => toggleTeam(team.name)}
                    className="flex items-center space-x-4 flex-1"
                  >
                    <div className="w-10 h-10 relative group-hover:scale-110 transition-transform duration-200">
                      <Image
                        src={team.logo}
                        alt={`${team.name} logo`}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="font-medium text-lg group-hover:text-blue-600 transition-colors duration-200">
                      {team.name}
                    </span>
                  </button>
                  <div className="flex items-center space-x-3">
                    {isAdmin() && (
                      <button
                        onClick={() => handleEditForums(team.name)}
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                      >
                        Edit Forums
                      </button>
                    )}
                    <button
                      onClick={() => toggleTeam(team.name)}
                      className="flex items-center space-x-2"
                    >
                      <span className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors duration-200">
                        {expandedTeam === team.name ? "Hide Forums" : "View Forums"}
                      </span>
                      <svg
                        className={`w-5 h-5 transform transition-all duration-300 ${
                          expandedTeam === team.name ? "rotate-180 text-blue-600" : "text-gray-400"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedTeam === team.name ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4">
                    {forums.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {forums.map((forum, index) => (
                          <a
                            key={index}
                            href={forum.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/forum flex items-center space-x-3 p-3 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200 cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center group-hover/forum:bg-blue-600 transition-colors duration-200">
                              <svg
                                className="w-4 h-4 text-blue-600 group-hover/forum:text-white transition-colors duration-200"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </div>
                            <span className="text-gray-700 group-hover/forum:text-blue-600 transition-colors duration-200">
                              {forum.name}
                            </span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500">No forums available for this team</p>
                        {isAdmin() && (
                          <p className="text-gray-400 text-sm mt-1">Click &quot;Edit Forums&quot; to add some!</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-[#ECCE8B] min-h-screen">
        <Nav />
        <div className="flex justify-center items-center h-96">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Loading forums...</h2>
            <p>Please wait while we fetch team forums.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AFC Teams */}
          {renderTeamSection("AFC", conferences.AFC)}

          {/* NFC Teams */}
          {renderTeamSection("NFC", conferences.NFC)}
        </div>
      </div>
      <Footer />

      {isAdmin() && (
        <TeamForumEditModal
          isOpen={forumModalOpen}
          onClose={handleModalClose}
          teamName={selectedTeam}
          forums={selectedTeam ? teamForums[selectedTeam] || [] : []}
          onSave={handleForumSave}
        />
      )}
    </div>
  );
}
