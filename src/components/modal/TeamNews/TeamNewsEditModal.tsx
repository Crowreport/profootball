'use client'

import { useState, useEffect } from 'react';
import Modal from '../modal';
import { useUserStore } from '@/store/useUserStore';

interface NewsArticle {
  title: string;
  link: string;
}

interface TeamNewsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  newsArticle?: NewsArticle | null;
  onSave: (result: any) => void;
}

export default function TeamNewsEditModal({ 
  isOpen, 
  onClose, 
  teamName, 
  newsArticle, 
  onSave 
}: TeamNewsEditModalProps) {
  const { profile, isAuthenticated } = useUserStore();
  const [formData, setFormData] = useState({
    title: '',
    link: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (newsArticle) {
        // Editing existing article
        setFormData({
          title: newsArticle.title || '',
          link: newsArticle.link || ''
        });
      } else {
        // Adding new article
        setFormData({
          title: '',
          link: ''
        });
      }
    }
  }, [isOpen, newsArticle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !profile?.email) {
      alert('You must be logged in to edit team news');
      return;
    }

    if (!formData.title.trim() || !formData.link.trim()) {
      alert('Please fill in both title and link');
      return;
    }

    setLoading(true);
    try {
      const method = newsArticle ? 'PUT' : 'POST';
      const response = await fetch('/api/manage-team-news', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamName,
          title: formData.title.trim(),
          link: formData.link.trim(),
          originalTitle: newsArticle?.title,
          userEmail: profile.email
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Team news ${newsArticle ? 'updated' : 'added'} successfully!`);
        onSave(result);
        onClose();
      } else {
        alert(result.error || 'Failed to save team news');
      }
    } catch (error) {
      console.error('Error saving team news:', error);
      alert('Failed to save team news. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!newsArticle || !profile?.email) return;
    
    const confirmed = confirm('Are you sure you want to delete this news article?');
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch('/api/manage-team-news', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamName,
          title: newsArticle.title,
          userEmail: profile.email
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Team news deleted successfully!');
        onSave({ deleted: true });
        onClose();
      } else {
        alert(result.error || 'Failed to delete team news');
      }
    } catch (error) {
      console.error('Error deleting team news:', error);
      alert('Failed to delete team news. Please try again.');
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
      title={`${newsArticle ? 'Edit' : 'Add'} Team News - ${teamName}`}
      size="md"
    >
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              News Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter news headline"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              News Link
            </label>
            <input
              type="url"
              name="link"
              value={formData.link}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/news-article"
              required
              disabled={loading}
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              {newsArticle && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors cursor-pointer"
                  disabled={loading}
                >
                  Delete Article
                </button>
              )}
            </div>
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
                disabled={loading}
              >
                {loading ? 'Saving...' : (newsArticle ? 'Update News' : 'Add News')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}