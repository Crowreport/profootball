import { useState, useEffect } from "react";

export default function ManageFeaturedVideoModal({ isOpen, onClose, video, onVideoUpdated, onVideoAdded }) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditMode = !!video;

  useEffect(() => {
    if (isEditMode) {
      setTitle(video.title);
      setLink(video.link);
    } else {
      setTitle("");
      setLink("");
    }
  }, [video, isEditMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = isEditMode ? `/api/featured-video` : '/api/featured-video';
      const method = isEditMode ? 'PUT' : 'POST';
      const body = JSON.stringify(isEditMode ? { id: video.id, title, link } : { title, link });

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to ${isEditMode ? 'update' : 'add'} video`);
      }
      
      const result = await res.json();

      if (isEditMode) {
        onVideoUpdated(result);
      } else {
        onVideoAdded(result);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          {isEditMode ? 'Edit Featured Video' : 'Add Featured Video'}
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
          />
          <input
            type="url"
            placeholder="YouTube Link"
            value={link}
            onChange={e => setLink(e.target.value)}
            required
            style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
          />
          {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #ccc', background: '#eee', color: '#000' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', background: '#0070f3', color: 'white' }}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}