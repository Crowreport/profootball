'use client'

import { useState, useEffect } from 'react';
import Modal from '../modal';
import { useUserStore } from '@/store/useUserStore';

interface SourceData {
  url?: string;
  link?: string;
  source?: {
    url?: string;
    link?: string;
  };
}

interface Article {
  title: string;
  link: string;
}

interface ManageSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceData?: SourceData | null;
  editingArticle?: Article | null;
  onSave: (result: any) => void;
}

export default function ManageSourceModal({ 
  isOpen, 
  onClose, 
  sourceData = null, 
  editingArticle = null, 
  onSave 
}: ManageSourceModalProps) {
  const { profile, isAuthenticated } = useUserStore();
  const [formData, setFormData] = useState({
    title: '',
    link: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = profile?.role === 'admin';

  // Reset form when modal opens or when editing article changes
  useEffect(() => {
    if (isOpen) {
      if (editingArticle) {
        // Populate form with existing article data for editing
        setFormData({
          title: editingArticle.title || '',
          link: editingArticle.link || ''
        });
      } else {
        // Reset form for new article
        setFormData({
          title: '',
          link: ''
        });
      }
      setError('');
      console.log('Modal opened with sourceData:', sourceData);
      console.log('Editing article:', editingArticle);
    }
  }, [isOpen, sourceData, editingArticle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setError('Only administrators can manage sources');
      return;
    }

    if (!formData.title.trim() || !formData.link.trim()) {
      setError('Both title and link are required');
      return;
    }

    console.log('Full sourceData:', sourceData);
    
    // Extract the source URL - it might be nested in sourceData.source.url
    const sourceUrl = sourceData?.url || sourceData?.source?.url || sourceData?.link || sourceData?.source?.link;
    
    if (!sourceUrl) {
      console.error('No source URL found in sourceData:', sourceData);
      setError('No source URL found. Please try again.');
      return;
    }

    console.log('Using source URL:', sourceUrl);

    const requestData = editingArticle
      ? {
          sourceUrl: sourceUrl,
          originalTitle: editingArticle.title,
          title: formData.title.trim(),
          link: formData.link.trim(),
          userId: profile?.id
        }
      : {
          sourceUrl: sourceUrl,
          title: formData.title.trim(),
          link: formData.link.trim(),
          userId: profile?.id
        };

    console.log('Submitting article with data:', requestData);

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/manage-articles', {
        method: editingArticle ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.error || `Failed to ${editingArticle ? 'update' : 'add'} article`);
      }

      const result = await response.json();
      console.log('Success result:', result);
      onSave(result);
      onClose();
    } catch (error: any) {
      console.error('Error submitting article:', error);
      setError(error.message || 'Failed to save article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingArticle || !isAdmin || !profile?.email) return;

    const confirmed = confirm('Are you sure you want to delete this article?');
    if (!confirmed) return;

    setLoading(true);
    setError('');

    try {
      const sourceUrl = sourceData?.url || sourceData?.source?.url || sourceData?.link || sourceData?.source?.link;
      
      const response = await fetch('/api/manage-articles', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceUrl: sourceUrl,
          title: editingArticle.title,
          userId: profile.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete article');
      }

      const result = await response.json();
      onSave({ deleted: true, ...result });
      onClose();
    } catch (error: any) {
      console.error('Error deleting article:', error);
      setError(error.message || 'Failed to delete article. Please try again.');
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${editingArticle ? 'Edit' : 'Add'} Custom Article`}
      size="md"
    >
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Article Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter article title"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Article Link
            </label>
            <input
              type="url"
              name="link"
              value={formData.link}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/article"
              required
              disabled={loading}
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              {editingArticle && isAdmin && (
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
                disabled={loading || !isAdmin}
              >
                {loading ? 'Saving...' : (editingArticle ? 'Update Article' : 'Add Article')}
              </button>
            </div>
          </div>
        </form>

        {!isAdmin && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">
            You need administrator privileges to manage articles.
          </div>
        )}
      </div>
    </Modal>
  );
}