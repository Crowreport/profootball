'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Card from './Card';

export default function TeamPageContent({ teamName, teamData }) {
  const [content, setContent] = useState({});

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/manual-content?teamName=${encodeURIComponent(teamName)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        const data = await response.json();
        setContent(data);
      } catch (error) {
        console.error('Error fetching content:', error);
      }
    };

    fetchContent();
  }, [teamName]);

  const { accent, conference, socials, logoId } = teamData;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ece9f6 0%, #d1d1d1 100%)',
        paddingBottom: 40,
      }}
    >
      <Nav />
      {/* Team Header Banner */}
      <div
        style={{
          background: `linear-gradient(90deg, ${accent} 60%, #fff 100%)`,
          borderRadius: 16,
          margin: '32px auto 24px',
          maxWidth: 1200,
          boxShadow: '0 6px 32px 0 rgba(0,0,0,0.10)',
          padding: '32px 40px',
          display: 'flex',
          alignItems: 'center',
          gap: 32,
        }}
      >
        <div
          style={{
            width: 110,
            height: 110,
            background: '#fff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)',
          }}
        >
          <Image
            src={`https://sports.cbsimg.net/fly/images/team-logos/${logoId}.svg`}
            alt={`${teamName} logo`}
            width={90}
            height={90}
            style={{ objectFit: 'contain' }}
          />
        </div>
        <div>
          <h1
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: '#fff',
              marginBottom: 8,
              textShadow: '0 2px 8px rgba(0,0,0,0.25), 0 1px 0 #222',
            }}
          >
            {teamName}
          </h1>
          <p
            style={{
              color: '#fff',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 1,
              background: 'rgba(0,0,0,0.15)',
              display: 'inline-block',
              padding: '2px 16px',
              borderRadius: 8,
              textShadow: '0 2px 8px rgba(0,0,0,0.25), 0 1px 0 #222',
              marginTop: 6,
            }}
          >
            {conference}
          </p>
          {/* Social Media Row */}
          <div style={{ display: 'flex', gap: 32, marginTop: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            {socials.website && (
              <a href={socials.website} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@3.13.0/icons/safari.svg" alt="Website" width={20} height={20} style={{ filter: 'invert(1)' }} />
                <span style={{ fontWeight: 500, fontSize: 16 }}>Official Website</span>
              </a>
            )}
            {socials.facebook && (
              <a href={socials.facebook} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg" alt="Facebook" width={20} height={20} style={{ filter: 'invert(1)' }} />
                <span style={{ fontWeight: 500, fontSize: 16 }}>@{teamName.replace(/ /g, '')}</span>
              </a>
            )}
            {socials.instagram && (
              <a href={socials.instagram} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg" alt="Instagram" width={20} height={20} style={{ filter: 'invert(1)' }} />
                <span style={{ fontWeight: 500, fontSize: 16 }}>@{teamName.replace(/ /g, '').toLowerCase()}</span>
              </a>
            )}
            {socials.snapchat && (
              <a href={socials.snapchat} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/snapchat.svg" alt="Snapchat" width={20} height={20} style={{ filter: 'invert(1)' }} />
                <span style={{ fontWeight: 500, fontSize: 16 }}>@BillsNFL</span>
              </a>
            )}
            {socials.twitter && (
              <a href={socials.twitter} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/x.svg" alt="X" width={20} height={20} style={{ filter: 'invert(1)' }} />
                <span style={{ fontWeight: 500, fontSize: 16 }}>@{teamName.replace(/ /g, '').toLowerCase()}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Team Content */}
      <div className="max-w-7xl mx-auto px-4 py-2" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Latest News */}
          <Card accent={accent} title="Latest News" teamName={teamName}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: accent }}>Latest News</h2>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <p className="text-gray-600 mt-2">{content['Latest News'] || 'Latest news and updates about the team...'}</p>
              </div>
            </div>
          </Card>

          {/* Schedule */}
          <Card accent={accent} title="Schedule" teamName={teamName}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: accent }}>Schedule</h2>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <p className="text-gray-600 mt-2">{content['Schedule'] || 'Schedule information will be displayed here...'}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Team Info */}
          <Card accent={accent} title="Team Info" teamName={teamName}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: accent }}>Team Info</h2>
            <div className="space-y-4">
              <p className="text-gray-600">{content['Team Info'] || 'Team info will be displayed here...'}</p>
            </div>
          </Card>

          {/* Stats */}
          <Card accent={accent} title="Team Stats" teamName={teamName}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: accent }}>Team Stats</h2>
            <div className="space-y-4">
              <p className="text-gray-600">{content['Team Stats'] || 'Team stats will be displayed here...'}</p>
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
