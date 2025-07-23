"use client";
import { useState } from "react";

export default function ManageUserArticlesModal({ isOpen, onClose, source, onArticleAdded }) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user-articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceLink: source.link, title, link }),
      });
      if (!res.ok) throw new Error("Failed to add article");
      const newArticle = await res.json();
      onArticleAdded(source.link, newArticle);
      setTitle("");
      setLink("");
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
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Add Article to {source.title}</h2>
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
            placeholder="Link"
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