'use client'

import { useState, useEffect } from 'react';
import Modal from '../modal';
import { useUserStore } from '@/store/useUserStore';

interface PollOption {
  id?: string;
  text: string;
  order: number;
}

interface Poll {
  id?: string;
  title: string;
  question: string;
  description?: string;
  status: string;
  allowMultipleVotes?: boolean;
  allow_multiple_votes?: boolean;
  expiresAt?: string;
  expires_at?: string;
  options: PollOption[];
  poll_options?: PollOption[];
}

interface PollManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPoll?: Poll | null;
  onSave: (result: any) => void;
}

export default function PollManagementModal({ 
  isOpen, 
  onClose, 
  editingPoll = null, 
  onSave 
}: PollManagementModalProps) {
  const { profile, isAuthenticated } = useUserStore();
  const [formData, setFormData] = useState<Poll>({
    title: '',
    question: '',
    description: '',
    status: 'active',
    allowMultipleVotes: false,
    expiresAt: '',
    options: [
      { text: '', order: 0 },
      { text: '', order: 1 }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = profile?.role === 'admin';
  const isEditing = editingPoll !== null;

  // Reset form when modal opens or when editing poll changes
  useEffect(() => {
    if (isOpen) {
      if (editingPoll) {
        // Populate form with existing poll data for editing
        setFormData({
          title: editingPoll.title || '',
          question: editingPoll.question || '',
          description: editingPoll.description || '',
          status: editingPoll.status || 'active',
          allowMultipleVotes: editingPoll.allowMultipleVotes || false,
          expiresAt: editingPoll.expiresAt ? new Date(editingPoll.expiresAt).toISOString().slice(0, 16) : '',
          options: editingPoll.options.length > 0 ? editingPoll.options : [
            { text: '', order: 0 },
            { text: '', order: 1 }
          ]
        });
      } else {
        // Reset form for new poll
        setFormData({
          title: '',
          question: '',
          description: '',
          status: 'active',
          allowMultipleVotes: false,
          expiresAt: '',
          options: [
            { text: '', order: 0 },
            { text: '', order: 1 }
          ]
        });
      }
      setError('');
      console.log('Poll management modal opened, editing:', !!editingPoll);
    }
  }, [isOpen, editingPoll]);

  const handleChange = (field: keyof Poll, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], text, order: index };
    setFormData(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const addOption = () => {
    if (formData.options.length >= 10) {
      setError('Maximum 10 options allowed');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { text: '', order: prev.options.length }]
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) {
      setError('Minimum 2 options required');
      return;
    }

    const newOptions = formData.options
      .filter((_, i) => i !== index)
      .map((option, i) => ({ ...option, order: i }));
    
    setFormData(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Title is required';
    if (!formData.question.trim()) return 'Question is required';
    
    const validOptions = formData.options.filter(opt => opt.text.trim());
    if (validOptions.length < 2) return 'At least 2 options are required';

    if (formData.expiresAt) {
      const expiryDate = new Date(formData.expiresAt);
      if (expiryDate <= new Date()) {
        return 'Expiry date must be in the future';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      setError('Only administrators can manage polls');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const validOptions = formData.options
        .filter(opt => opt.text.trim())
        .map((opt, index) => ({
          text: opt.text.trim(),
          order: index
        }));

      const requestData = {
        title: formData.title.trim(),
        question: formData.question.trim(),
        description: formData.description?.trim() || null,
        status: formData.status,
        allowMultipleVotes: formData.allowMultipleVotes,
        expiresAt: formData.expiresAt || null,
        options: validOptions,
        userId: profile?.id,
        ...(isEditing ? { pollId: editingPoll?.id } : {})
      };

      console.log('Submitting poll with data:', requestData);

      const response = await fetch('/api/manage-polls', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} poll`);
      }

      const result = await response.json();
      console.log('Success result:', result);
      onSave(result);
      onClose();
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} poll`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isEditing ? 'Edit' : 'Create'} Poll`}
      size="lg"
    >
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poll Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter poll title"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poll Question *
              </label>
              <input
                type="text"
                value={formData.question}
                onChange={(e) => handleChange('question', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What question are you asking?"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional context or details"
                rows={3}
                disabled={loading}
              />
            </div>
          </div>

          {/* Poll Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Poll Options</h3>
              <button
                type="button"
                onClick={addOption}
                className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600 transition-colors"
                disabled={loading || formData.options.length >= 10}
              >
                Add Option
              </button>
            </div>

            {formData.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Option ${index + 1}`}
                    disabled={loading}
                  />
                </div>
                {formData.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="bg-red-500 text-white px-2 py-2 text-sm rounded hover:bg-red-600 transition-colors"
                    disabled={loading}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            
            <p className="text-xs text-gray-500">
              Minimum 2 options required, maximum 10 options allowed
            </p>
          </div>

          {/* Poll Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Poll Settings</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="ended">Ended</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowMultipleVotes"
                checked={formData.allowMultipleVotes}
                onChange={(e) => handleChange('allowMultipleVotes', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="allowMultipleVotes" className="ml-2 block text-sm text-gray-700">
                Allow multiple votes per user
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => handleChange('expiresAt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for polls that don&apos;t expire
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex space-x-3">
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
                disabled={loading || !isAdmin}
              >
                {loading ? 'Saving...' : (isEditing ? 'Update Poll' : 'Create Poll')}
              </button>
            </div>
          </div>
        </form>

        {!isAdmin && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">
            You need administrator privileges to manage polls.
          </div>
        )}
      </div>
    </Modal>
  );
}