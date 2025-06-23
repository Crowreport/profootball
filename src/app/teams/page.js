import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "NFL Teams | Pro Football Report",
  description: "Browse NFL teams, view team information, schedules, and stats.",
};

const divisions = {
  "AFC East": [
    { name: "Buffalo Bills", logo: "https://sports.cbsimg.net/fly/images/team-logos/407.svg" },
    { name: "Miami Dolphins", logo: "https://sports.cbsimg.net/fly/images/team-logos/418.svg" },
    { name: "New York Jets", logo: "https://sports.cbsimg.net/fly/images/team-logos/423.svg" },
    { name: "New England Patriots", logo: "https://sports.cbsimg.net/fly/images/team-logos/420.svg" }
  ],
  "AFC North": [
    { name: "Baltimore Ravens", logo: "https://sports.cbsimg.net/fly/images/team-logos/406.svg" },
    { name: "Cincinnati Bengals", logo: "https://sports.cbsimg.net/fly/images/team-logos/410.svg" },
    { name: "Cleveland Browns", logo: "https://sports.cbsimg.net/fly/images/team-logos/434.svg" },
    { name: "Pittsburgh Steelers", logo: "https://sports.cbsimg.net/fly/images/team-logos/426.svg" }
  ],
  "AFC South": [
    { name: "Houston Texans", logo: "https://sports.cbsimg.net/fly/images/team-logos/247415.svg" },
    { name: "Indianapolis Colts", logo: "https://sports.cbsimg.net/fly/images/team-logos/415.svg" },
    { name: "Jacksonville Jaguars", logo: "https://sports.cbsimg.net/fly/images/team-logos/416.svg" },
    { name: "Tennessee Titans", logo: "https://sports.cbsimg.net/fly/images/team-logos/432.svg" }
  ],
  "AFC West": [
    { name: "Denver Broncos", logo: "https://sports.cbsimg.net/fly/images/team-logos/412.svg" },
    { name: "Kansas City Chiefs", logo: "https://sports.cbsimg.net/fly/images/team-logos/417.svg" },
    { name: "Las Vegas Raiders", logo: "https://sports.cbsimg.net/fly/images/team-logos/424.svg" },
    { name: "Los Angeles Chargers", logo: "https://sports.cbsimg.net/fly/images/team-logos/428.svg" }
  ],
  "NFC East": [
    { name: "Dallas Cowboys", logo: "https://sports.cbsimg.net/fly/images/team-logos/411.svg" },
    { name: "New York Giants", logo: "https://sports.cbsimg.net/fly/images/team-logos/422.svg" },
    { name: "Philadelphia Eagles", logo: "https://sports.cbsimg.net/fly/images/team-logos/425.svg" },
    { name: "Washington Commanders", logo: "https://sports.cbsimg.net/fly/images/team-logos/433.svg" }
  ],
  "NFC North": [
    { name: "Chicago Bears", logo: "https://sports.cbsimg.net/fly/images/team-logos/409.svg" },
    { name: "Detroit Lions", logo: "https://sports.cbsimg.net/fly/images/team-logos/413.svg" },
    { name: "Green Bay Packers", logo: "https://sports.cbsimg.net/fly/images/team-logos/414.svg" },
    { name: "Minnesota Vikings", logo: "https://sports.cbsimg.net/fly/images/team-logos/419.svg" }
  ],
  "NFC South": [
    { name: "Atlanta Falcons", logo: "https://sports.cbsimg.net/fly/images/team-logos/405.svg" },
    { name: "Carolina Panthers", logo: "https://sports.cbsimg.net/fly/images/team-logos/408.svg" },
    { name: "New Orleans Saints", logo: "https://sports.cbsimg.net/fly/images/team-logos/421.svg" },
    { name: "Tampa Bay Buccaneers", logo: "https://sports.cbsimg.net/fly/images/team-logos/431.svg" }
  ],
  "NFC West": [
    { name: "Arizona Cardinals", logo: "https://sports.cbsimg.net/fly/images/team-logos/404.svg" },
    { name: "Los Angeles Rams", logo: "https://sports.cbsimg.net/fly/images/team-logos/427.svg" },
    { name: "San Francisco 49ers", logo: "https://sports.cbsimg.net/fly/images/team-logos/429.svg" },
    { name: "Seattle Seahawks", logo: "https://sports.cbsimg.net/fly/images/team-logos/430.svg" }
  ]
};

export default function TeamsPage() {
  return (
    <div>
      <Nav />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold mb-6">NFL Teams</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AFC Divisions */}
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
              <h2 className="text-2xl font-bold text-red-600">AFC</h2>
            </div>
            {Object.entries(divisions)
              .filter(([division]) => division.startsWith("AFC"))
              .map(([division, teams]) => (
                <div key={division} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-gray-100 px-6 py-3">
                    <h3 className="text-xl font-semibold">{division}</h3>
                  </div>
                  <div className="divide-y">
                    {teams.map((team) => (
                      <Link 
                        href={`/teams/${team.name.toLowerCase().replace(/\s+/g, '-')}`}
                        key={team.name}
                        className="block hover:bg-gray-50 transition-colors"
                      >
                        <div className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex items-center space-x-4">
                              <div className="w-8 h-8 relative">
                                <Image
                                  src={team.logo}
                                  alt={`${team.name} logo`}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                              <span className="font-medium">{team.name}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          {/* NFC Divisions */}
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
              <h2 className="text-2xl font-bold text-blue-600">NFC</h2>
            </div>
            {Object.entries(divisions)
              .filter(([division]) => division.startsWith("NFC"))
              .map(([division, teams]) => (
                <div key={division} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-gray-100 px-6 py-3">
                    <h3 className="text-xl font-semibold">{division}</h3>
                  </div>
                  <div className="divide-y">
                    {teams.map((team) => (
                      <Link 
                        href={`/teams/${team.name.toLowerCase().replace(/\s+/g, '-')}`}
                        key={team.name}
                        className="block hover:bg-gray-50 transition-colors"
                      >
                        <div className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex items-center space-x-4">
                              <div className="w-8 h-8 relative">
                                <Image
                                  src={team.logo}
                                  alt={`${team.name} logo`}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                              <span className="font-medium">{team.name}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
