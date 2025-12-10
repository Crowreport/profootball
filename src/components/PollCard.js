"use client";
import { useState, useEffect } from "react";

const PollCard = () => {
  const [votes, setVotes] = useState([0, 0, 0, 0, 0]);
  const [votedIndex, setVotedIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const pollQuestion = "Who will win the 2025 Super Bowl?";
  const pollOptions = [
    "Kansas City Chiefs",
    "San Francisco 49ers",
    "Buffalo Bills",
    "Philadelphia Eagles",
    "Other"
  ];

  const POLL_ID = "superbowl_2025_poll"; // Unique ID for this poll
  const VOTES_KEY = `${POLL_ID}_votes`;
  const USER_VOTE_KEY = `${POLL_ID}_user_vote`;

  const totalVotes = votes.reduce((sum, v) => sum + v, 0);

  const loadSavedData = () => {
    try {
      // Load saved vote counts from localStorage
      const savedVotes = localStorage.getItem(VOTES_KEY);
      if (savedVotes) {
        const parsedVotes = JSON.parse(savedVotes);
        setVotes(parsedVotes);
      }

      // Check if user has already voted
      const userVote = localStorage.getItem(USER_VOTE_KEY);
      if (userVote !== null) {
        setVotedIndex(parseInt(userVote));
      }
    } catch (error) {
      console.error('Error loading saved poll data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved data when component mounts
  useEffect(() => {
    loadSavedData();
  }, []);

  const handleVote = (index) => {
    // Prevent voting if already voted
    if (votedIndex !== null) return;

    try {
      // Update vote counts
      const newVotes = [...votes];
      newVotes[index] += 1;
      setVotes(newVotes);
      setVotedIndex(index);

      // Save to localStorage
      localStorage.setItem(VOTES_KEY, JSON.stringify(newVotes));
      localStorage.setItem(USER_VOTE_KEY, index.toString());

      console.log(`User voted for option ${index}: ${pollOptions[index]}`);
    } catch (error) {
      console.error('Error saving vote:', error);
      // If saving fails, revert the vote
      setVotedIndex(null);
    }
  };

  // Reset poll function (for testing - you can remove this)
  const resetPoll = () => {
    localStorage.removeItem(VOTES_KEY);
    localStorage.removeItem(USER_VOTE_KEY);
    setVotes([0, 0, 0, 0, 0]);
    setVotedIndex(null);
    console.log('Poll reset');
  };

  // Loading state (brief flash while checking localStorage)
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

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 text-black">
      <h2 className="text-2xl font-extrabold mb-4">{pollQuestion}</h2>

      {/* Show message if user already voted */}
      {votedIndex !== null && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          ✅ You voted for: <strong>{pollOptions[votedIndex]}</strong>
        </div>
      )}

      {pollOptions.map((option, index) => {
        const percentage = totalVotes === 0 ? 0 : Math.round((votes[index] / totalVotes) * 100);
        const isSelected = votedIndex === index;
        
        return (
          <div
            key={index}
            onClick={() => handleVote(index)}
            className={`mb-3 border rounded p-2 transition ${
              votedIndex !== null
                ? isSelected
                  ? "bg-blue-100 border-blue-500 cursor-default"
                  : "bg-gray-50 border-gray-200 cursor-default"
                : "cursor-pointer hover:bg-gray-100"
            }`}
          >
            <div className="font-medium">{option}</div>
            {votedIndex !== null && (
              <div className="text-sm text-gray-600 mt-1">
                {percentage}% ({votes[index]} votes)
                {isSelected && (
                  <span className="ml-2 text-blue-500">✓</span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {votedIndex !== null && (
        <div className="text-sm text-gray-700 mt-4 font-semibold">
          Total Votes: {totalVotes}
          <br />
          <span className="text-xs text-gray-500 font-normal">
            Thank you for voting! Your vote has been saved.
          </span>
        </div>
      )}

      {/* Reset button for testing (only shows in development mode) */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={resetPoll}
          className="mt-4 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
        >
          Reset Poll (Dev Only)
        </button>
      )}
    </div>
  );
};

export default PollCard;