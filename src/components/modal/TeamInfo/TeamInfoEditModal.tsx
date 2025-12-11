'use client'

import { useState, useEffect } from 'react';
import Modal from '../modal';
import { useUserStore } from '@/store/useUserStore';

interface TeamInfo {
  headCoach?: string;
  stadium?: string;
  established?: string;
}

interface TeamInfoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  teamInfo?: TeamInfo | null;
  onSave: (result: any) => void;
}

export default function TeamInfoEditModal({ 
  isOpen, 
  onClose, 
  teamName, 
  teamInfo, 
  onSave 
}: TeamInfoEditModalProps) {
  const { profile, isAuthenticated } = useUserStore();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !profile?.email) {
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
          ...formData,
          userEmail: profile.email
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
      console.error('Error updating team information:', error);
      alert('Failed to update team information. Please try again.');
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
      title={`Edit Team Info - ${teamName}`}
      size="md"
    >
      <div className="p-6">
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Established
            </label>
            <input
              type="text"
              name="established"
              value={formData.established}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter establishment year"
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
              {loading ? 'Saving...' : 'Save Info'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}