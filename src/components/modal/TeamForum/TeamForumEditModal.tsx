'use client'

import { useState, useEffect } from 'react';
import Modal from '../modal';
import { useUserStore } from '@/store/useUserStore';

interface Forum {
  id: string | null;
  name: string;
  url: string;
}

interface TeamForumEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  forums: Forum[];
  onSave: (result: any) => void;
}

export default function TeamForumEditModal({ 
  isOpen, 
  onClose, 
  teamName, 
  forums, 
  onSave 
}: TeamForumEditModalProps) {
  const { profile, isAuthenticated } = useUserStore();
  const [forumList, setForumList] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Initialize with existing forums or create empty ones
      const initialForums = forums && forums.length > 0 
        ? [...forums]
        : [];
      
      // Fill up to 10 slots
      while (initialForums.length < 10) {
        initialForums.push({
          id: null,
          name: '',
          url: ''
        });
      }
      
      setForumList(initialForums);
    }
  }, [isOpen, forums]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !profile?.email) {
      alert('You must be logged in to edit forums');
      return;
    }

    // Filter out empty forums
    const validForums = forumList.filter(forum => 
      forum.name && forum.url
    );

    setLoading(true);
    try {
      const response = await fetch('/api/manage-team-forums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamName,
          forums: validForums,
          userEmail: profile.email
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Team forums updated successfully!');
        onSave(result);
        onClose();
      } else {
        alert(result.error || 'Failed to update team forums');
      }
    } catch (error) {
      console.error('Error updating team forums:', error);
      alert('Failed to update team forums. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForumChange = (index: number, field: keyof Forum, value: string) => {
    const updatedForums = [...forumList];
    updatedForums[index] = {
      ...updatedForums[index],
      [field]: value
    };
    setForumList(updatedForums);
  };

  const clearForum = (index: number) => {
    const updatedForums = [...forumList];
    updatedForums[index] = {
      id: null,
      name: '',
      url: ''
    };
    setForumList(updatedForums);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Forums - ${teamName}`}
      size="2xl"
    >
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Add up to 10 forums for this team. Leave fields empty to remove a forum.
            </p>
            
            {forumList.map((forum, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-700">Forum {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => clearForum(index)}
                    className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Forum Name
                    </label>
                    <input
                      type="text"
                      value={forum.name}
                      onChange={(e) => handleForumChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., ChiefsPlanet"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Forum URL
                    </label>
                    <input
                      type="url"
                      value={forum.url}
                      onChange={(e) => handleForumChange(index, 'url', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://www.chiefsplanet.com/"
                      disabled={loading}
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
              {loading ? 'Saving...' : 'Save Forums'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}