'use client'

import { useState, useEffect } from 'react';
import Modal from '../modal';
import { useUserStore } from '@/store/useUserStore';

interface Video {
  title: string;
  link: string;
  thumbnail?: string;
}

interface ManageVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionType: string;
  editingVideo?: Video | null;
  onSave: (result: any) => void;
}

export default function ManageVideoModal({ 
  isOpen, 
  onClose, 
  sectionType, 
  editingVideo = null, 
  onSave 
}: ManageVideoModalProps) {
  const { profile, isAuthenticated } = useUserStore();
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    thumbnail: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = profile?.role === 'admin';

  // Section type mappings
  const sectionNames: Record<string, string> = {
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

  const extractYouTubeVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      setError('Only administrators can manage videos');
      return;
    }

    if (!formData.title.trim() || !formData.link.trim()) {
      setError('Both title and link are required');
      return;
    }

    // Auto-generate YouTube thumbnail if not provided
    let thumbnailUrl = formData.thumbnail;
    if (!thumbnailUrl && formData.link.includes('youtube')) {
      const videoId = extractYouTubeVideoId(formData.link);
      if (videoId) {
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }

    const requestData = editingVideo 
      ? {
          sectionType,
          originalTitle: editingVideo.title,
          title: formData.title.trim(),
          link: formData.link.trim(),
          thumbnail: thumbnailUrl,
          userEmail: profile?.email
        }
      : {
          sectionType,
          title: formData.title.trim(),
          link: formData.link.trim(),
          thumbnail: thumbnailUrl,
          userEmail: profile?.email
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
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      setError(err.message || `Failed to ${editingVideo ? 'update' : 'add'} video`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin || !editingVideo) return;

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
          sectionType,
          title: editingVideo.title,
          userEmail: profile?.email
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete video');
      }

      const result = await response.json();
      onSave({ deleted: true, ...result });
      onClose();
    } catch (err: any) {
      console.error('Error deleting video:', err);
      setError(err.message || 'Failed to delete video. Please try again.');
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
      title={`${editingVideo ? 'Edit' : 'Add'} Custom Video`}
      size="md"
    >
      <div className="p-6">
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <p className="text-sm text-gray-600">{editingVideo ? 'Editing in:' : 'Adding to:'}</p>
          <p className="font-semibold">{sectionNames[sectionType] || 'Unknown Section'}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter video title"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video Link
            </label>
            <input
              type="url"
              name="link"
              value={formData.link}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://youtube.com/watch?v=..."
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thumbnail URL (Optional)
            </label>
            <input
              type="url"
              name="thumbnail"
              value={formData.thumbnail}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Auto-generated for YouTube videos"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to auto-generate thumbnail for YouTube videos
            </p>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              {editingVideo && isAdmin && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors cursor-pointer"
                  disabled={loading}
                >
                  Delete Video
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
                {loading ? 'Saving...' : (editingVideo ? 'Update Video' : 'Add Video')}
              </button>
            </div>
          </div>
        </form>

        {!isAdmin && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">
            You need administrator privileges to manage videos.
          </div>
        )}
      </div>
    </Modal>
  );
}