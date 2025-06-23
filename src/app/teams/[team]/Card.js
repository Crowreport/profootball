"use client";

export default function Card({ children, accent }) {
  return (
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
      }}
      onMouseOver={e => {
        e.currentTarget.style.boxShadow = '0 6px 32px 0 rgba(0,0,0,0.13)';
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
      }}
      onMouseOut={e => {
        e.currentTarget.style.boxShadow = '0 2px 16px 0 rgba(0,0,0,0.08)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {children}
    </div>
  );
} 