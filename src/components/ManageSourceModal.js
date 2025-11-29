"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function ManageSourceModal({ isOpen, onClose, sourceData = null, editingArticle = null, onSave }) {
  const { isAdmin, user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    link: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin()) {
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
          userEmail: user?.email
        }
      : {
          sourceUrl: sourceUrl,
          title: formData.title.trim(),
          link: formData.link.trim(),
          userEmail: user?.email
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
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err.message || `Failed to ${editingArticle ? 'update' : 'add'} article`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin() || !editingArticle) return;

    if (!confirm('Are you sure you want to delete this custom article?')) {
      return;
    }

    const sourceUrl = sourceData?.url || sourceData?.source?.url || sourceData?.link || sourceData?.source?.link;
    
    if (!sourceUrl) {
      setError('No source URL found. Cannot delete article.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/manage-articles', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceUrl: sourceUrl,
          title: editingArticle.title,
          userEmail: user?.email
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete article');
      }

      onSave({ deleted: true });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete article');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {editingArticle ? 'Edit Custom Article' : 'Add Custom Article'}
          </h2>
          
          {sourceData && (
            <div className="mb-4 p-3 bg-gray-100 rounded">
              <p className="text-sm text-gray-600">{editingArticle ? 'Editing in:' : 'Adding to:'}</p>
              <p className="font-semibold">{sourceData?.title || sourceData?.source?.title || 'Unknown Source'}</p>
              <p className="text-xs text-gray-500">URL: {sourceData?.url || sourceData?.source?.url || sourceData?.link || sourceData?.source?.link || 'No URL found'}</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Article Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Jets' Fields returns, but sidelined day after scare"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Article Link *
              </label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/article"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (editingArticle ? 'Updating...' : 'Adding...') : (editingArticle ? 'Update Article' : 'Add Article')}
              </button>
              
              {editingArticle && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              )}
              
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 