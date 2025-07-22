"use client";
import React, { useState, useEffect } from 'react';

export default function ManageContentModal({ isOpen, onClose, title, children, teamName }) {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (children) {
      // This is a simple way to extract text content from children
      // A more robust solution might be needed for complex children
      const textContent = React.Children.toArray(children).map(child => {
        if (typeof child === 'string') return child;
        if (child.props && child.props.children) return child.props.children.toString();
        return '';
      }).join('\n');
      setContent(textContent);
    }
  }, [children]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      const response = await fetch('/api/manual-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamName, section: title, content }),
      });

      if (!response.ok) {
        throw new Error('Failed to save content');
      }

      console.log(`Content for ${title} saved successfully`);
      onClose();
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };


  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        width: '500px',
        maxWidth: '90%',
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Manage {title}</h2>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: '100%',
            minHeight: '200px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '0.5rem',
            marginBottom: '1rem',
            color: '#000'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #ccc', background: '#eee', color: '#000' }}>Cancel</button>
          <button onClick={handleSave} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', background: '#0070f3', color: 'white' }}>Save</button>
        </div>
      </div>
    </div>
  );
}