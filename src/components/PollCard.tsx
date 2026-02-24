"use client";
import { useState, useEffect, useMemo } from "react";
import { useUserStore } from '@/store/useUserStore';

interface PollOption {
  id: string;
  text: string;
  order: number;
  votes: number;
  percentage: number;
}

interface Poll {
  id: string;
  title: string;
  question: string;
  description?: string;
  status: string;
  allowMultipleVotes?: boolean;
  allow_multiple_votes?: boolean;
  expiresAt?: string;
  expires_at?: string;
  createdAt: string;
  created_at?: string;
  totalVotes: number;
  options: PollOption[];
  isExpired: boolean;
}

interface PollCardProps {
  polls?: Poll[];
  onManagePoll?: () => void;
  onEditPoll?: (poll: Poll) => void;
  onDeletePoll?: (pollId: string) => void;
  onRefresh?: () => void;
  limit?: number;
}

const PollCard: React.FC<PollCardProps> = ({ 
  polls: propPolls = [],
  onManagePoll, 
  onEditPoll, 
  onDeletePoll,
  onRefresh,
  limit = 1 
}) => {
  const { profile } = useUserStore();
  const isAdmin = profile?.role === 'admin';
  
  const [votedPolls, setVotedPolls] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState<Record<string, boolean>>({});

  // Use polls from props, limited by the limit prop
  const displayPolls = useMemo(() => propPolls.slice(0, limit), [propPolls, limit]);

  useEffect(() => {
    const fetchVoteStatuses = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check voting status for each poll (only for logged-in users)
        const userId = profile?.id;
        
        const voteStatusPromises = displayPolls.map(async (poll: Poll) => {
          if (!userId) {
            return { pollId: poll.id, votedOptions: [] };
          }
          
          try {
            const params = new URLSearchParams({
              pollId: poll.id,
              userId
            });
            
            const voteResponse = await fetch(`/api/polls/vote?${params}`);
            if (voteResponse.ok) {
              const voteData = await voteResponse.json();
              return { pollId: poll.id, votedOptions: voteData.votedOptions || [] };
            }
          } catch (err) {
            console.error('Error checking vote status for poll:', poll.id, err);
          }
          return { pollId: poll.id, votedOptions: [] };
        });

        const voteStatuses = await Promise.all(voteStatusPromises);
        const votedPollsMap: Record<string, string[]> = {};
        voteStatuses.forEach(({ pollId, votedOptions }) => {
          votedPollsMap[pollId] = votedOptions;
        });
        
        setVotedPolls(votedPollsMap);
      } catch (err) {
        console.error('Error fetching polls:', err);
        setError(err instanceof Error ? err.message : 'Failed to load polls');
      } finally {
        setIsLoading(false);
      }
    };

    if (displayPolls.length > 0) {
      fetchVoteStatuses();
    } else {
      setIsLoading(false);
    }
  }, [displayPolls, profile?.id]);

  const handleVote = async (pollId: string, optionId: string) => {
    if (voting[pollId]) return;

    // Require user to be logged in to vote
    if (!profile?.id) {
      alert('Please log in to vote on polls');
      return;
    }

    try {
      setVoting(prev => ({ ...prev, [pollId]: true }));

      const userId = profile.id;

      const voteData = {
        pollId,
        optionId,
        userId
      };

      const response = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.alreadyVoted) {
          // Update local state to reflect that user has voted
          setVotedPolls(prev => ({
            ...prev,
            [pollId]: [...(prev[pollId] || []), optionId]
          }));
          return;
        }
        throw new Error(errorData.error || 'Failed to submit vote');
      }

      const result = await response.json();
      
      // Update local state
      setVotedPolls(prev => ({
        ...prev,
        [pollId]: [...(prev[pollId] || []), optionId]
      }));

      // Refresh poll data to get updated vote counts
      if (onRefresh) {
        await onRefresh();
      }

      console.log('Vote submitted successfully:', result.message);
    } catch (err) {
      console.error('Error submitting vote:', err);
      alert(err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setVoting(prev => ({ ...prev, [pollId]: false }));
    }
  };

  const handleDeletePoll = async (pollId: string, pollTitle: string) => {
    if (!isAdmin) return;

    if (!confirm(`Are you sure you want to delete the poll "${pollTitle}"? This will also delete all votes.`)) {
      return;
    }

    try {
      const response = await fetch('/api/manage-polls', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pollId,
          userId: profile?.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete poll');
      }

      // Trigger refresh to update the polls list
      if (onRefresh) {
        await onRefresh();
      }
      
      if (onDeletePoll) {
        onDeletePoll(pollId);
      }

      console.log('Poll deleted successfully');
    } catch (err) {
      console.error('Error deleting poll:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete poll');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️ Error loading polls</div>
          <div className="text-gray-600 text-sm mb-4">{error}</div>
          <button
            onClick={() => onRefresh && onRefresh()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No polls state
  if (displayPolls.length === 0) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📊</div>
          <div className="font-medium mb-2">No Active Polls</div>
          <div className="text-sm">Check back later for new polls!</div>
          {isAdmin && onManagePoll && (
            <button
              onClick={onManagePoll}
              className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors text-sm"
            >
              Create First Poll
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {displayPolls.map((poll) => {
        const hasVoted = votedPolls[poll.id] && votedPolls[poll.id].length > 0;
        const isVoting = voting[poll.id];
        const isExpired = poll.isExpired || poll.status !== 'active';

        return (
          <div key={poll.id} className="bg-white shadow-lg rounded-lg p-6 text-black">
            {/* Poll Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-extrabold mb-2">{poll.title}</h2>
                <p className="text-lg font-medium mb-2">{poll.question}</p>
                {poll.description && (
                  <p className="text-sm text-gray-600 mb-2">{poll.description}</p>
                )}
              </div>
              
              {/* Admin Controls */}
              {isAdmin && (
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => onEditPoll && onEditPoll(poll)}
                    className="bg-yellow-500 text-white px-3 py-1 text-xs rounded hover:bg-yellow-600 transition-colors"
                    title="Edit poll"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePoll(poll.id, poll.title)}
                    className="bg-red-500 text-white px-3 py-1 text-xs rounded hover:bg-red-600 transition-colors"
                    title="Delete poll"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Poll Status Messages */}
            {isExpired && (
              <div className="mb-4 p-3 bg-gray-100 border border-gray-400 text-gray-700 rounded">
                🔒 This poll has ended
              </div>
            )}
            
            {hasVoted && !isExpired && (
              <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                ✅ You have voted in this poll
                {(poll.allowMultipleVotes || poll.allow_multiple_votes) && ' (You can vote again)'}
              </div>
            )}

            {!profile?.id && !isExpired && (
              <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                🔐 Please <a href="/login" className="text-blue-600 hover:text-blue-800 underline">log in</a> to vote on polls
              </div>
            )}

            {/* Poll Options */}
            {poll.options.map((option) => {
              const isSelected = votedPolls[poll.id]?.includes(option.id);
              const canVote = profile?.id && !isExpired && (!hasVoted || poll.allowMultipleVotes || poll.allow_multiple_votes);
              
              return (
                <div
                  key={option.id}
                  onClick={() => canVote ? handleVote(poll.id, option.id) : undefined}
                  className={`mb-3 border rounded p-3 transition ${
                    canVote
                      ? "cursor-pointer hover:bg-gray-100"
                      : isSelected
                      ? "bg-blue-100 border-blue-500 cursor-default"
                      : "bg-gray-50 border-gray-200 cursor-default"
                  } ${isVoting ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium flex-1">{option.text}</div>
                    {isSelected && (
                      <span className="text-blue-500 ml-2">✓</span>
                    )}
                  </div>
                  
                  {(hasVoted || isExpired) && (
                    <div className="text-sm text-gray-600 mt-2">
                      <div className="flex items-center justify-between">
                        <span>{option.percentage}% ({option.votes} votes)</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2 ml-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${option.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Poll Footer */}
            <div className="text-sm text-gray-700 mt-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">Total Votes: {poll.totalVotes}</span>
                  {(poll.expiresAt || poll.expires_at) && (
                    <span className="ml-4 text-gray-500">
                      Expires: {new Date(poll.expiresAt || poll.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                {isVoting && (
                  <div className="text-blue-600 text-xs">
                    Submitting vote...
                  </div>
                )}
              </div>
              
              {(hasVoted || isExpired) && (
                <div className="text-xs text-gray-500 mt-1">
                  {hasVoted && !isExpired && "Thank you for voting! "}
                  {(poll.allowMultipleVotes || poll.allow_multiple_votes) && !isExpired && "You can vote for multiple options."}
                </div>
              )}
            </div>

            {/* Admin Panel for Poll Management */}
            {isAdmin && (
              <div className="mt-4 p-3 bg-gray-50 rounded border text-xs text-gray-600">
                <strong>Admin Info:</strong> Poll ID: {poll.id} | 
                Status: {poll.status} | 
                Multiple Votes: {(poll.allowMultipleVotes || poll.allow_multiple_votes) ? 'Yes' : 'No'} |
                Created: {new Date(poll.createdAt || poll.created_at).toLocaleDateString()}
              </div>
            )}
          </div>
        );
      })}

      {/* Add Poll Button for Admins */}
      {isAdmin && onManagePoll && (
        <div className="text-center">
          <button
            onClick={onManagePoll}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            + Add New Poll
          </button>
        </div>
      )}
    </div>
  );
};

export default PollCard;