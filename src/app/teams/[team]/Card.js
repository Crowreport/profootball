'use client';

import { useState } from 'react';
import ManageContentModal from '@/components/ManageContentModal';

export default function Card({ children, accent, title, teamName }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleManageContent = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 2px 16px 0 rgba(0,0,0,0.08)',
          padding: 28,
          marginBottom: 0,
          transition: 'box-shadow 0.2s, transform 0.2s',
          borderTop: `4px solid ${accent}`,
          minHeight: 120,
          cursor: 'default',
          position: 'relative',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.boxShadow = '0 6px 32px 0 rgba(0,0,0,0.13)';
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 16px 0 rgba(0,0,0,0.08)';
          e.currentTarget.style.transform = 'none';
        }}
      >
        {children}
        <button
          onClick={handleManageContent}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: accent,
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          Manage Content
        </button>
      </div>
      <ManageContentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={title}
        teamName={teamName}
      >
        {children}
      </ManageContentModal>
    </>
  );
} 