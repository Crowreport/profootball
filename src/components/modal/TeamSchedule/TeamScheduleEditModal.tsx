'use client'

import { useState, useEffect } from 'react';
import Modal from '../modal';
import { useUserStore } from '@/store/useUserStore';

interface ScheduleGame {
  id?: string | null;
  opponent: string;
  date: string;
  time: string;
  isHome: boolean;
}

interface TeamScheduleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  schedule?: ScheduleGame[] | null;
  onSave: (result: any) => void;
}

export default function TeamScheduleEditModal({ 
  isOpen, 
  onClose, 
  teamName, 
  schedule, 
  onSave 
}: TeamScheduleEditModalProps) {
  const { profile, isAuthenticated } = useUserStore();
  const [scheduleList, setScheduleList] = useState<ScheduleGame[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Initialize with existing schedule or create empty ones
      const initialSchedule = schedule && schedule.length > 0 
        ? [...schedule]
        : [];
      
      // Fill up to 17 slots (NFL regular season)
      while (initialSchedule.length < 17) {
        initialSchedule.push({
          id: null,
          opponent: '',
          date: '',
          time: '',
          isHome: true
        });
      }
      
      setScheduleList(initialSchedule);
    }
  }, [isOpen, schedule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !profile?.email) {
      alert('You must be logged in to edit team schedule');
      return;
    }

    // Filter out empty games
    const validGames = scheduleList.filter(game => 
      game.opponent && game.date && game.time
    );

    setLoading(true);
    try {
      const response = await fetch('/api/manage-team-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamName,
          schedules: validGames,
          userId: profile.id
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

  const handleGameChange = (index: number, field: keyof ScheduleGame, value: string | boolean) => {
    const updatedSchedule = [...scheduleList];
    updatedSchedule[index] = {
      ...updatedSchedule[index],
      [field]: value
    };
    setScheduleList(updatedSchedule);
  };

  const clearGame = (index: number) => {
    const updatedSchedule = [...scheduleList];
    updatedSchedule[index] = {
      id: null,
      opponent: '',
      date: '',
      time: '',
      isHome: true
    };
    setScheduleList(updatedSchedule);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Schedule - ${teamName}`}
      size="2xl"
    >
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Add up to 17 games for this team. Leave fields empty to remove a game.
            </p>
            
            <div className="max-h-96 overflow-y-auto space-y-3">
              {scheduleList.map((game, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-700">Week {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => clearGame(index)}
                      className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Opponent
                      </label>
                      <input
                        type="text"
                        value={game.opponent}
                        onChange={(e) => handleGameChange(index, 'opponent', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Patriots"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={game.date}
                        onChange={(e) => handleGameChange(index, 'date', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={game.time}
                        onChange={(e) => handleGameChange(index, 'time', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <select
                        value={game.isHome ? 'home' : 'away'}
                        onChange={(e) => handleGameChange(index, 'isHome', e.target.value === 'home')}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                      >
                        <option value="home">Home</option>
                        <option value="away">Away</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              {loading ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}