'use client'

import { useState, useEffect } from 'react';
import Modal from '../modal';
import { useUserStore } from '@/store/useUserStore';

interface TeamStats {
  record?: string;
  divisionPosition?: string;
}

interface TeamStatsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  teamStats?: TeamStats | null;
  onSave: (result: any) => void;
}

export default function TeamStatsEditModal({ 
  isOpen, 
  onClose, 
  teamName, 
  teamStats, 
  onSave 
}: TeamStatsEditModalProps) {
  const { profile, isAuthenticated } = useUserStore();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !profile?.email) {
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
          userEmail: profile.email
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Team Stats - ${teamName}`}
      size="md"
    >
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wins
              </label>
              <input
                type="number"
                name="wins"
                value={formData.wins}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Losses
              </label>
              <input
                type="number"
                name="losses"
                value={formData.losses}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ties
              </label>
              <input
                type="number"
                name="ties"
                value={formData.ties}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Division Position
            </label>
            <input
              type="text"
              name="divisionPosition"
              value={formData.divisionPosition}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 1st in AFC East"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition-colors cursor-pointer"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 cursor-pointer"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Stats'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}