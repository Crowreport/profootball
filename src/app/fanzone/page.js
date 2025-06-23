'use client';

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useState } from "react";

const conferences = {
  "AFC": [
    { 
      name: "Buffalo Bills", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/407.svg",
      forums: [
        { name: "Two Bills Drive", url: "https://www.twobillsdrive.com" },
        { name: "Bills Zone", url: "https://www.billszone.com" },
        { name: "Buffalo Range", url: "https://www.buffalorange.com" },
        { name: "Bills Fans", url: "https://www.billsfans.com" },
        { name: "r/buffalobills", url: "https://www.reddit.com/r/buffalobills" }
      ]
    },
    { 
      name: "Miami Dolphins", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/418.svg",
      forums: [
        { name: "Fin Heaven", url: "https://www.finheaven.com" },
        { name: "The Phins", url: "https://www.thephins.com" },
        { name: "The Phinsider", url: "https://www.thephinsider.com/" },
        { name: "r/MiamiDolphins", url: "https://www.reddit.com/r/miamidolphins" },
        { name: "Pro Football Forums - Dolphins", url: "https://www.profootballforums.com/forums/miami-dolphins-forum.20/" }
      ]
    },
    { 
      name: "New York Jets", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/423.svg",
      forums: [
        { name: "JetNation", url: "https://forums.jetnation.com/forum/5-ny-jets-forum/" },
        { name: "TheGangGreen", url: "https://forums.theganggreen.com/" },
        { name: "JetsFansUnited", url: "https://jetsfansunited.com/" },
        { name: "Reddit - r/nyjets", url: "https://www.reddit.com/r/nyjets/" },
        { name: "NY Jets Hampur", url: "https://newyorkjetshampur.com/" }
      ]
    },
    { 
      name: "New England Patriots", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/420.svg",
      forums: [
        { name: "PatsFans.com", url: "https://www.patsfans.com/new-england-patriots/messageboard/" },
        { name: "Patriots Planet", url: "https://www.patriotsplanet.net/BB/" },
        { name: "PatriotsFans Freeforums", url: "https://patriotsfans.freeforums.net/" },
        { name: "Sons of Sam Horn", url: "https://sonsofsamhorn.net/" },
        { name: "Reddit - r/Patriots", url: "https://www.reddit.com/r/Patriots/" }
      ]
    },
    { 
      name: "Baltimore Ravens", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/406.svg",
      forums: [
        { name: "Russell Street Report Forums", url: "https://forum.russellstreetreport.com/" },
        { name: "Purple Flock", url: "https://purpleflock.com/" },
        { name: "Extreme Ravens Forum", url: "https://forums.extremeravens.com/" },
        { name: "Reddit - r/ravens", url: "https://www.reddit.com/r/ravens/" },
        { name: "Baltimore Sports & Life", url: "https://forum.baltimoresportsandlife.com/forum/6-baltimore-ravens/" }
      ]
    },
    { 
      name: "Cincinnati Bengals", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/410.svg",
      forums: [
        { name: "Bengals Board", url: "https://thebengalsboard.com/" },
        { name: "Go-Bengals.com", url: "https://forum.go-bengals.com/" },
        { name: "BengalsZone", url: "https://forums.bengalszone.com/forum/2-cincinnati-bengals/" },
        { name: "Reddit - r/bengals", url: "https://www.reddit.com/r/bengals/" }
      ]
    },
    { 
      name: "Cleveland Browns", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/434.svg",
      forums: [
        { name: "The Browns Board", url: "https://www.thebrownsboard.com/forum/2-the-browns-board/" },
        { name: "Browns Football Talk", url: "https://brownsfootballtalk.com/" },
        { name: "BrownsNation Forum", url: "https://www.brownsnationforum.com/" },
        { name: "Barking Hard", url: "https://www.barkinghard.com/forums/" },
        { name: "Reddit - r/Browns", url: "https://www.reddit.com/r/Browns/" }
      ]
    },
    { 
      name: "Pittsburgh Steelers", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/426.svg",
      forums: [
        { name: "Steelers Nation", url: "https://www.steelernationforum.com/" },
        { name: "TheSteelersFans", url: "https://thesteelersfans.com/forums/" },
        { name: "Steelers Universe", url: "http://www.steelersuniverse.com/forums/forum.php" },
        { name: "Planet Steelers", url: "https://www.planetsteelers.com" },
        { name: "Reddit - r/steelers", url: "https://www.reddit.com/r/steelers/" }
      ]
    },
    { 
      name: "Houston Texans", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/247415.svg",
      forums: [
        { name: "TexansTalk", url: "https://www.texanstalk.com/forums/" },
        { name: "ClutchFans Texans", url: "https://bbs.clutchfans.net/forums/houston-texans.17/" },
        { name: "Battle Red Blog", url: "https://www.battleredblog.com" },
        { name: "Reddit - r/Texans", url: "https://www.reddit.com/r/Texans/" },
        { name: "ProFootballForums – Texans", url: "https://www.profootballforums.com/forums/houston-texans-forum.14/" }
      ]
    },
    { 
      name: "Indianapolis Colts", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/415.svg",
      forums: [
        { name: "Colts Wire Forum", url: "https://coltswire.usatoday.com" },
        { name: "Reddit - r/Colts", url: "https://www.reddit.com/r/Colts/" },
        { name: "Stampede Blue", url: "https://www.stampedeblue.com" }
      ]
    },
    { 
      name: "Jacksonville Jaguars", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/416.svg",
      forums: [
        { name: "Big Cat Country", url: "https://www.bigcatcountry.com" },
        { name: "Reddit - r/Jaguars", url: "https://www.reddit.com/r/Jaguars/" },
        { name: "ProSportsDaily – Jaguars", url: "https://forums.prosportsdaily.com/forumdisplay.php?159-Jacksonville-Jaguars" }
      ]
    },
    { 
      name: "Tennessee Titans", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/432.svg",
      forums: [
        { name: "Titans Report MB", url: "https://www.titansreport.com/forum/4-titans-and-nfl-talk/" },
        { name: "Reddit - r/Tennesseetitans", url: "https://www.reddit.com/r/Tennesseetitans/" },
        { name: "ProFootballForums – Titans", url: "https://www.profootballforums.com/forums/tennessee-titans-forum.32/" },
        { name: "FootballsFuture – Titans", url: "https://forums.footballsfuture.com/forum/26-tennessee-titans/" }
      ]
    },
    { 
      name: "Denver Broncos", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/412.svg",
      forums: [
        { name: "Broncos Forums", url: "http://www.broncosforums.com/forums/forumdisplay.php?f=6" },
        { name: "Orange Huddle", url: "https://www.broncosboard.com/" },
        { name: "Reddit - r/DenverBroncos", url: "https://www.reddit.com/r/DenverBroncos/" },
        { name: "ProFootballForums – Broncos", url: "https://www.profootballforums.com/forums/denver-broncos-forum.11/" },
        { name: "FootballsFuture – Broncos", url: "https://forums.footballsfuture.com/forum/28-denver-broncos/" }
      ]
    },
    { 
      name: "Kansas City Chiefs", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/417.svg",
      forums: [
        { name: "ChiefsPlanet", url: "https://www.chiefsplanet.com/" },
        { name: "Chiefs Coalition", url: "https://www.thechiefscoalition.com/forums" },
        { name: "ChiefsCrowd", url: "https://chiefscrowd.com/" },
        { name: "Reddit - r/KansasCityChiefs", url: "https://www.reddit.com/r/KansasCityChiefs/" },
        { name: "FootballsFuture – Chiefs", url: "https://forums.footballsfuture.com/forum/29-kansas-city-chiefs/" }
      ]
    },
    { 
      name: "Las Vegas Raiders", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/424.svg",
      forums: [
        { name: "Raiders Talk", url: "https://www.raiderstalk.com/" },
        { name: "BlackReign", url: "https://www.blackreign.net/raidernation/index.php" },
        { name: "Reddit - r/Raiders", url: "https://www.reddit.com/r/Raiders/" },
        { name: "Silver & Black Pride", url: "https://www.silverandblackpride.com" }
      ]
    },
    { 
      name: "Los Angeles Chargers", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/428.svg",
      forums: [
        { name: "The Powder Blues", url: "https://www.thepowderblues.com" },
        { name: "Chargers Fans Forum", url: "https://losangeleschargers.proboards.com/" },
        { name: "Reddit - r/Chargers", url: "https://www.reddit.com/r/Chargers/" }
      ]
    }
  ],
  "NFC": [
    { 
      name: "Dallas Cowboys", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/411.svg",
      forums: [
        { name: "CowboysZone", url: "https://cowboyszone.com/" },
        { name: "Dallas Cowboys Central", url: "http://www.dallascowboyscentral.com/" },
        { name: "Inside The Star Forums", url: "https://boards.insidethestar.com" },
        { name: "Reddit - r/cowboys", url: "https://www.reddit.com/r/cowboys/" },
        { name: "FootballsFuture – Cowboys", url: "https://forums.footballsfuture.com/forum/33-dallas-cowboys/" }
      ]
    },
    { 
      name: "New York Giants", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/422.svg",
      forums: [
        { name: "Big Blue Interactive", url: "https://corner.bigblueinteractive.com/index.php" },
        { name: "The Giants Board", url: "https://thegiantsboard.proboards.com/" },
        { name: "Big Blue Huddle", url: "https://giantsfans.net/message_board/index.php" },
        { name: "Reddit - r/NYGiants", url: "https://www.reddit.com/r/NYGiants/" },
        { name: "SportsWrath", url: "https://www.sportswrath.com/forum/12-new-york-giants/" }
      ]
    },
    { 
      name: "Philadelphia Eagles", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/425.svg",
      forums: [
        { name: "Eagles Message Board", url: "https://www.eaglesmessageboard.com/" },
        { name: "IgglePhans", url: "https://www.igglephans.com/" },
        { name: "Reddit - r/eagles", url: "https://www.reddit.com/r/eagles/" }
      ]
    },
    { 
      name: "Washington Commanders", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/433.svg",
      forums: [
        { name: "Burgundy & Gold Obsession", url: "https://www.bgobsession.com/forums/sons-of-washington.4/" },
        { name: "Burgundy & Gold Nation", url: "https://www.burgundyandgoldnation.com" },
        { name: "ExtremeSkins (ESCommanders)", url: "https://escommanders.com/forums/" },
        { name: "Reddit - r/Commanders", url: "https://www.reddit.com/r/Commanders/" },
        { name: "Hogs Haven", url: "https://www.hogshaven.com" }
      ]
    },
    { 
      name: "Chicago Bears", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/409.svg",
      forums: [
        { name: "ChiCitySports Bears Forum", url: "https://forum.chicitysports.com/forums/chicago-bears-forum.31/" },
        { name: "BearsFansOnline", url: "https://www.bearsfansonline.com/forum/viewforum.php?f=2" },
        { name: "Reddit - r/CHIBears", url: "https://www.reddit.com/r/CHIBears/" },
        { name: "FootballsFuture – Bears", url: "https://forums.footballsfuture.com/forum/38-chicago-bears/" }
      ]
    },
    { 
      name: "Detroit Lions", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/413.svg",
      forums: [
        { name: "The Den", url: "https://thedenforum.com/" },
        { name: "LionsRedZone", url: "http://www.lionsredzone.com/" },
        { name: "MotownSports Lions Forum", url: "http://www.motownsports.com/forums/forum/43-the-den/" },
        { name: "Reddit - r/detroitlions", url: "https://www.reddit.com/r/detroitlions/" },
        { name: "DetroitLionsForum.com", url: "http://www.detroitlionsforum.com/forums/" }
      ]
    },
    { 
      name: "Green Bay Packers", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/414.svg",
      forums: [
        { name: "PackerForum.com", url: "https://www.packerforum.com/" },
        { name: "Times Four", url: "https://packers.timesfour.com/forum/green-bay-packers" },
        { name: "Packers-Huddle", url: "https://packers-huddle.com/phpBB/viewforum.php?f=7" },
        { name: "PackerChatters", url: "http://packerchatters.com/" },
        { name: "Reddit - r/GreenBayPackers", url: "https://www.reddit.com/r/GreenBayPackers/" }
      ]
    },
    { 
      name: "Minnesota Vikings", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/419.svg",
      forums: [
        { name: "Purple Pain Forums", url: "https://purplepainforums.com/" },
        { name: "Vikings Territory", url: "http://www.vikingsmessageboard.com/viewforum.php?f=1" },
        { name: "Reddit - r/minnesotavikings", url: "https://www.reddit.com/r/minnesotavikings/" }
      ]
    },
    { 
      name: "Atlanta Falcons", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/405.svg",
      forums: [
        { name: "Hawk Squawk Falcons", url: "https://www.hawksquawk.net/forum/38-atlanta-falcons-forum/" },
        { name: "Reddit - r/falcons", url: "https://www.reddit.com/r/falcons/" },
        { name: "The Falcoholic", url: "https://www.thefalcoholic.com" },
        { name: "FootballsFuture – Falcons", url: "https://forums.footballsfuture.com/forum/48-atlanta-falcons/" }
      ]
    },
    { 
      name: "Carolina Panthers", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/408.svg",
      forums: [
        { name: "Carolina Huddle", url: "https://www.carolinahuddle.com/forum/7-carolina-panthers/" },
        { name: "Carolina Panthers Forum", url: "https://www.carolinapanthersforum.com/forums/carolina-panthers.20/" },
        { name: "Reddit - r/panthers", url: "https://www.reddit.com/r/panthers/" },
        { name: "WRAL Panther Talk", url: "https://www.wralsportsfan.com/panthers/" }
      ]
    },
    { 
      name: "New Orleans Saints", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/421.svg",
      forums: [
        { name: "SaintsReport", url: "https://saintsreport.com/forums/saints-super-forum.4/" },
        { name: "Black&Gold", url: "https://blackandgold.com/saints/" },
        { name: "Reddit - r/Saints", url: "https://www.reddit.com/r/Saints/" },
        { name: "ProFootballForums – Saints", url: "https://www.profootballforums.com/forums/new-orleans-saints-forum.23/" }
      ]
    },
    { 
      name: "Tampa Bay Buccaneers", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/431.svg",
      forums: [
        { name: "Pewter Report Forums", url: "https://www.pewterreport.com/community/" },
        { name: "BuccaneersFan.com Forum", url: "https://www.buccaneersfan.com/" },
        { name: "Reddit - r/buccaneers", url: "https://www.reddit.com/r/buccaneers/" },
        { name: "Bucs Nation", url: "https://www.bucsnation.com" }
      ]
    },
    { 
      name: "Arizona Cardinals", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/404.svg",
      forums: [
        { name: "Arizona Sports Fans Forum", url: "https://www.arizonasportsfans.com/forum/forums/arizona-cardinals.4/" },
        { name: "Cardinals Free Forums", url: "http://arizonacardinals.freeforums.net/" },
        { name: "Reddit - r/AZCardinals", url: "https://www.reddit.com/r/AZCardinals/" },
        { name: "RealGM Cardinals Board", url: "https://forums.realgm.com/boards/viewforum.php?f=145" }
      ]
    },
    { 
      name: "Los Angeles Rams", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/427.svg",
      forums: [
        { name: "Rams On Demand", url: "https://ramsondemand.com/" },
        { name: "RamsFansUnited", url: "https://ramsfansunited.com/" },
        { name: "ClanRam", url: "https://www.clanram.com" },
        { name: "Reddit - r/LosAngelesRams", url: "https://www.reddit.com/r/LosAngelesRams/" },
        { name: "ProFootballForums – Rams", url: "https://www.profootballforums.com/forums/los-angeles-rams-forum.19/" }
      ]
    },
    { 
      name: "San Francisco 49ers", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/429.svg",
      forums: [
        { name: "Reddit - r/49ers", url: "https://www.reddit.com/r/49ers/" },
        { name: "NinersNation", url: "https://www.ninersnation.com" }
      ]
    },
    { 
      name: "Seattle Seahawks", 
      logo: "https://sports.cbsimg.net/fly/images/team-logos/430.svg",
      forums: [
        { name: "Seahawks.net", url: "https://www.seahawks.net/forums/" },
        { name: "Reddit - r/seahawks", url: "https://www.reddit.com/r/seahawks/" },
        { name: "Field Gulls Comments", url: "https://www.fieldgulls.com" },
        { name: "ProFootballForums – Seahawks", url: "https://www.profootballforums.com/forums/seattle-seahawks-forum.30/" }
      ]
    }
  ]
};

export default function FanzonePage() {
  const [expandedTeam, setExpandedTeam] = useState(null);

  const toggleTeam = (teamName) => {
    setExpandedTeam(expandedTeam === teamName ? null : teamName);
  };

  return (
    <div>
      <Nav />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold mb-6">Fan Zone</h1>
        <p className="text-lg mb-8 text-gray-600">
          Explore team-specific forums and join the conversation with fellow fans.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AFC Teams */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 relative">
                <Image
                  src="https://sports.cbsimg.net/fly/images/conference/225.svg"
                  alt="AFC Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-red-600">AFC Forums</h2>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="divide-y">
                {conferences["AFC"].map((team) => (
                  <div key={team.name} className="group">
                    <button
                      onClick={() => toggleTeam(team.name)}
                      className="w-full px-6 py-4 hover:bg-gray-50 transition-all duration-200 flex items-center justify-between group-hover:shadow-sm"
                    >
                      <div className="flex items-center space-x-4">
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
                      </div>
                      <div className="flex items-center space-x-3">
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
                      </div>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        expandedTeam === team.name ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4">
                        <div className="grid grid-cols-1 gap-3">
                          {team.forums.map((forum, index) => (
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* NFC Teams */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 relative">
                <Image
                  src="https://sports.cbsimg.net/fly/images/conference/226.svg"
                  alt="NFC Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-blue-600">NFC Forums</h2>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="divide-y">
                {conferences["NFC"].map((team) => (
                  <div key={team.name} className="group">
                    <button
                      onClick={() => toggleTeam(team.name)}
                      className="w-full px-6 py-4 hover:bg-gray-50 transition-all duration-200 flex items-center justify-between group-hover:shadow-sm"
                    >
                      <div className="flex items-center space-x-4">
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
                      </div>
                      <div className="flex items-center space-x-3">
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
                      </div>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        expandedTeam === team.name ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4">
                        <div className="grid grid-cols-1 gap-3">
                          {team.forums.map((forum, index) => (
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
