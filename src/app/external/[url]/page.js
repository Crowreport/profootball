import { redirect } from 'next/navigation';

// Whitelist of allowed domains for redirect
const ALLOWED_DOMAINS = [
  'espn.com',
  'nbcsports.com',
  'yahoo.com',
  'youtube.com',
  'youtu.be',
  'cbssports.com',
  'allaccessfootball.com',
  'foxsports.com',
  'pff.com',
  'nfltraderumors.co',
  'the33rdteam.com',
  'reddit.com',
  'apnews.com',
  'thesportingnews.com',
  'theringer.com',
  'fansided.com',
  'si.com',
  'thedraftnetwork.com',
  'nflspinzone.com',
  'bleacherreport.com',
  'substack.com',
  'nfl.com',
  'sportsnet.ca',
  'yardbarker.com',
  'heavy.com',
  'podcasts.apple.com',
  'rsshub.app',
  'fetchrss.com'
];

/**
 * Check if URL domain is in the allowed whitelist
 * @param {string} urlString - URL to validate
 * @returns {boolean} - true if allowed, false otherwise
 */
function isAllowedDomain(urlString) {
  try {
    const urlObj = new URL(urlString);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check if hostname matches or is subdomain of allowed domains
    return ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch (error) {
    // Invalid URL format
    return false;
  }
}

export default function ExternalPage({ params }) {
  const { url } = params;

  let decodedUrl;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch {
    // If decoding fails, redirect to home
    redirect('/');
  }

  // Ensure URL has protocol
  if (!decodedUrl.startsWith('http')) {
    decodedUrl = `https://${decodedUrl}`;
  }

  // Validate against whitelist
  if (!isAllowedDomain(decodedUrl)) {
    // Redirect to home page if domain is not allowed
    redirect('/');
  }

  redirect(decodedUrl);
}