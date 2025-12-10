import { useState, useEffect } from 'react';
// Removed AuthContext import

// List of all NFL teams for dropdowns
const NFL_TEAMS = [
  'Arizona Cardinals', 'Atlanta Falcons', 'Baltimore Ravens', 'Buffalo Bills',
  'Carolina Panthers', 'Chicago Bears', 'Cincinnati Bengals', 'Cleveland Browns',
  'Dallas Cowboys', 'Denver Broncos', 'Detroit Lions', 'Green Bay Packers',
  'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars', 'Kansas City Chiefs',
  'Las Vegas Raiders', 'Los Angeles Chargers', 'Los Angeles Rams', 'Miami Dolphins',
  'Minnesota Vikings', 'New England Patriots', 'New Orleans Saints', 'New York Giants',
  'New York Jets', 'Philadelphia Eagles', 'Pittsburgh Steelers', 'San Francisco 49ers',
  'Seattle Seahawks', 'Tampa Bay Buccaneers', 'Tennessee Titans', 'Washington Commanders'
];

export default function TeamScheduleEditModal({ isOpen, onClose, teamName, schedules, onSave }) {
  const user = null; // Removed useAuth
  const [scheduleList, setScheduleList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Initialize with existing schedules or create empty ones
      const initialSchedules = schedules && schedules.length > 0 
        ? [...schedules]
        : [];
      
      // Fill up to 10 slots
      while (initialSchedules.length < 10) {
        initialSchedules.push({
          id: null,
          homeTeam: '',
          awayTeam: '',
          location: '',
          gameDate: '',
          gameTime: ''
        });
      }
      
      setScheduleList(initialSchedules);
    }
  }, [isOpen, schedules]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.email) {
      alert('You must be logged in to edit schedules');
      return;
    }

    // Filter out empty schedules
    const validSchedules = scheduleList.filter(schedule => 
      schedule.homeTeam && schedule.awayTeam && schedule.location && schedule.gameDate && schedule.gameTime
    );

    if (validSchedules.length === 0) {
      alert('Please add at least one complete schedule');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/manage-team-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamName,
          schedules: validSchedules,
          userEmail: user.email
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Team schedule updated successfully!');
        onSave(result);
        onClose();
      } else {
        alert(result.error || 'Failed to update team schedule');
      }
    } catch (error) {
      console.error('Error updating team schedule:', error);
      alert('Failed to update team schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleChange = (index, field, value) => {
    const updatedSchedules = [...scheduleList];
    updatedSchedules[index] = {
      ...updatedSchedules[index],
      [field]: value
    };
    setScheduleList(updatedSchedules);
  };

  const clearSchedule = (index) => {
    const updatedSchedules = [...scheduleList];
    updatedSchedules[index] = {
      id: null,
      homeTeam: '',
      awayTeam: '',
      location: '',
      gameDate: '',
      gameTime: ''
    };
    setScheduleList(updatedSchedules);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Schedule - {teamName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Add up to 10 games. Leave fields empty to remove a game from the schedule.
            </p>
            
            {scheduleList.map((schedule, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-700">Game {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => clearSchedule(index)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Home Team
                    </label>
                    <select
                      value={schedule.homeTeam}
                      onChange={(e) => handleScheduleChange(index, 'homeTeam', e.target.value)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select team</option>
                      {NFL_TEAMS.map(team => (
                        <option key={team} value={team}>{team}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Away Team
                    </label>
                    <select
                      value={schedule.awayTeam}
                      onChange={(e) => handleScheduleChange(index, 'awayTeam', e.target.value)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select team</option>
                      {NFL_TEAMS.map(team => (
                        <option key={team} value={team}>{team}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={schedule.location}
                      onChange={(e) => handleScheduleChange(index, 'location', e.target.value)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Stadium name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={schedule.gameDate}
                      onChange={(e) => handleScheduleChange(index, 'gameDate', e.target.value)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={schedule.gameTime}
                      onChange={(e) => handleScheduleChange(index, 'gameTime', e.target.value)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 