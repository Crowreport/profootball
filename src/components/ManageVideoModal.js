"use client";
import { useState, useEffect } from 'react';

export default function ManageVideoModal({ isOpen, onClose, sectionType, editingVideo = null, onSave }) {
  // Removed useAuth - set default values
  const isAdmin = false;
  const user = null;
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    thumbnail: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Section type mappings
  const sectionNames = {
    'featured-nfl-video': 'Featured NFL Video',
    'nfl-latest-videos': 'NFL Latest Videos',
    'top-nfl-channels': 'Top NFL Channels',
    'up-coming-channels': 'Up & Coming NFL Channels',
    'nfl-podcasts': 'NFL Podcasts'
  };

  // Reset form when modal opens or when editing video changes
  useEffect(() => {
    if (isOpen) {
      if (editingVideo) {
        // Populate form with existing video data for editing
        setFormData({
          title: editingVideo.title || '',
          link: editingVideo.link || '',
          thumbnail: editingVideo.thumbnail || ''
        });
      } else {
        // Reset form for new video
        setFormData({
          title: '',
          link: '',
          thumbnail: ''
        });
      }
      setError('');
      console.log('Video modal opened for section:', sectionType);
      console.log('Editing video:', editingVideo);
    }
  }, [isOpen, sectionType, editingVideo]);

  const extractYouTubeVideoId = (url) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const generateThumbnail = (url) => {
    const videoId = extractYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin()) {
      setError('Only administrators can manage videos');
      return;
    }

    if (!formData.title.trim() || !formData.link.trim()) {
      setError('Both title and link are required');
      return;
    }

    // Auto-generate thumbnail if not provided
    const thumbnail = formData.thumbnail.trim() || generateThumbnail(formData.link);

    const requestData = editingVideo 
      ? {
          sectionType: sectionType,
          originalTitle: editingVideo.title,
          title: formData.title.trim(),
          link: formData.link.trim(),
          thumbnail: thumbnail,
          userEmail: user?.email
        }
      : {
          sectionType: sectionType,
          title: formData.title.trim(),
          link: formData.link.trim(),
          thumbnail: thumbnail,
          userEmail: user?.email
        };

    console.log('Submitting video with data:', requestData);

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/manage-videos', {
        method: editingVideo ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.error || `Failed to ${editingVideo ? 'update' : 'add'} video`);
      }

      const result = await response.json();
      console.log('Success result:', result);
      onSave(result);
      onClose();
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err.message || `Failed to ${editingVideo ? 'update' : 'add'} video`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin() || !editingVideo) return;

    if (!confirm('Are you sure you want to delete this custom video?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/manage-videos', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionType: sectionType,
          title: editingVideo.title,
          userEmail: user?.email
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete video');
      }

      onSave({ deleted: true });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete video');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }} onClick={onClose}>
      <div 
        className="bg-white rounded-lg max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {editingVideo ? 'Edit Custom Video' : 'Add Custom Video'}
          </h2>
          
          <div className="mb-4 p-3 bg-gray-100 rounded">
            <p className="text-sm text-gray-600">{editingVideo ? 'Editing in:' : 'Adding to:'}</p>
            <p className="font-semibold">{sectionNames[sectionType] || 'Unknown Section'}</p>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., NFL Draft: Top QB Prospects Review"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                YouTube Video URL *
              </label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail URL (Optional)
              </label>
              <input
                type="url"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Auto-generated from YouTube if left empty"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to auto-generate from YouTube video
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (editingVideo ? 'Updating...' : 'Adding...') : (editingVideo ? 'Update Video' : 'Add Video')}
              </button>
              
              {editingVideo && (
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
    </div>
  );
} 