import { useState, useEffect } from 'react';
// Removed AuthContext import

export default function TeamInfoEditModal({ isOpen, onClose, teamName, teamInfo, onSave }) {
  const user = null; // Removed useAuth
  const [formData, setFormData] = useState({
    headCoach: '',
    stadium: '',
    established: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && teamInfo) {
      setFormData({
        headCoach: teamInfo.headCoach || '',
        stadium: teamInfo.stadium || '',
        established: teamInfo.established || ''
      });
    }
  }, [isOpen, teamInfo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.email) {
      alert('You must be logged in to edit team information');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/manage-team-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamName,
          headCoach: formData.headCoach,
          stadium: formData.stadium,
          established: formData.established,
          userEmail: user.email
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Team information updated successfully!');
        onSave(result);
        onClose();
      } else {
        alert(result.error || 'Failed to update team information');
      }
    } catch (error) {
      console.error('Error updating team info:', error);
      alert('Failed to update team information. Please try again.');
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
          <h2 className="text-xl font-bold">Edit Team Info - {teamName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Head Coach
            </label>
            <input
              type="text"
              name="headCoach"
              value={formData.headCoach}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter head coach name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stadium
            </label>
            <input
              type="text"
              name="stadium"
              value={formData.stadium}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter stadium name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Established Year
            </label>
            <input
              type="number"
              name="established"
              value={formData.established}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter establishment year"
              min="1900"
              max="2024"
              required
            />
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