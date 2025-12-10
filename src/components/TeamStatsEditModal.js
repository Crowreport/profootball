import { useState, useEffect } from 'react';

export default function TeamStatsEditModal({ isOpen, onClose, teamName, teamStats, onSave }) {
  const [formData, setFormData] = useState({
    wins: '',
    losses: '',
    ties: '',
    divisionPosition: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && teamStats) {
      // Parse the record if it exists (e.g., "12-5-0" -> wins: 12, losses: 5, ties: 0)
      const recordParts = teamStats.record && teamStats.record !== 'W-L-T' 
        ? teamStats.record.split('-') 
        : ['', '', ''];
      
      setFormData({
        wins: recordParts[0] || '',
        losses: recordParts[1] || '',
        ties: recordParts[2] || '',
        divisionPosition: teamStats.divisionPosition || ''
      });
    }
  }, [isOpen, teamStats]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.email) {
      alert('You must be logged in to edit team stats');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/manage-team-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamName,
          wins: parseInt(formData.wins) || 0,
          losses: parseInt(formData.losses) || 0,
          ties: parseInt(formData.ties) || 0,
          divisionPosition: formData.divisionPosition,
          userEmail: user.email
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Team stats updated successfully!');
        onSave(result);
        onClose();
      } else {
        alert(result.error || 'Failed to update team stats');
      }
    } catch (error) {
      console.error('Error updating team stats:', error);
      alert('Failed to update team stats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Team Stats - {teamName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Record (W-L-T)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Wins</label>
                <input
                  type="number"
                  name="wins"
                  value={formData.wins}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  max="17"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Losses</label>
                <input
                  type="number"
                  name="losses"
                  value={formData.losses}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  max="17"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ties</label>
                <input
                  type="number"
                  name="ties"
                  value={formData.ties}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  max="17"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Division Position
            </label>
            <select
              name="divisionPosition"
              value={formData.divisionPosition}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select position</option>
              <option value="1st in Division">1st in Division</option>
              <option value="2nd in Division">2nd in Division</option>
              <option value="3rd in Division">3rd in Division</option>
              <option value="4th in Division">4th in Division</option>
              <option value="Wild Card">Wild Card</option>
              <option value="Out of Playoffs">Out of Playoffs</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 