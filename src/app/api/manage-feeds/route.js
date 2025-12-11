import { checkAdminRole } from '@/utils/checkAdminRole';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Get admin emails from environment variable

const FEEDS_FILE_PATH = path.join(process.cwd(), 'data', 'feeds.json');

// Helper function to validate URL format
function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    // Only allow http and https protocols
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

// Helper function to read feeds
function readFeeds() {
  try {
    const feedsData = fs.readFileSync(FEEDS_FILE_PATH, 'utf8');
    return JSON.parse(feedsData);
  } catch (error) {
    console.error('Error reading feeds.json:', error);
    return { feeds: [] };
  }
}

// Helper function to write feeds
function writeFeeds(feedsData) {
  try {
    fs.writeFileSync(FEEDS_FILE_PATH, JSON.stringify(feedsData, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing feeds.json:', error);
    return false;
  }
}

// POST - Add new RSS source
export async function POST(request) {
  try {
    const { title, url, image, isPodcast, isTopChannel, isUpAndComing, userEmail } = await request.json();

    // Check admin authentication
    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    if (!url) {
      return NextResponse.json({ error: 'RSS URL is required' }, { status: 400 });
    }

    // Validate URL format
    if (!isValidUrl(url)) {
      return NextResponse.json({ error: 'Invalid URL format. Must be a valid http or https URL' }, { status: 400 });
    }

    // Validate image URL if provided
    if (image && !isValidUrl(image)) {
      return NextResponse.json({ error: 'Invalid image URL format' }, { status: 400 });
    }

    const feedsData = readFeeds();
    
    // Check if URL already exists
    const existingFeed = feedsData.feeds.find(feed => feed.url === url);
    if (existingFeed) {
      return NextResponse.json({ error: 'RSS source with this URL already exists' }, { status: 409 });
    }

    // Create new feed object
    const newFeed = {
      url,
      image: image || '',
      ...(isPodcast && { isPodcast: true }),
      ...(isTopChannel && { isTopChannel: true }),
      ...(isUpAndComing && { isUpAndComing: true }),
      ...(title && { title })
    };

    // Add to feeds array
    feedsData.feeds.push(newFeed);

    // Write back to file
    if (!writeFeeds(feedsData)) {
      return NextResponse.json({ error: 'Failed to save RSS source' }, { status: 500 });
    }

    return NextResponse.json({ message: 'RSS source added successfully', feed: newFeed });
  } catch (error) {
    console.error('Error adding RSS source:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update existing RSS source
export async function PUT(request) {
  try {
    const { originalUrl, title, url, image, isPodcast, isTopChannel, isUpAndComing, userEmail } = await request.json();

    // Check admin authentication
    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    if (!originalUrl || !url) {
      return NextResponse.json({ error: 'Original URL and new URL are required' }, { status: 400 });
    }

    // Validate URL formats
    if (!isValidUrl(url)) {
      return NextResponse.json({ error: 'Invalid URL format. Must be a valid http or https URL' }, { status: 400 });
    }

    // Validate image URL if provided
    if (image && !isValidUrl(image)) {
      return NextResponse.json({ error: 'Invalid image URL format' }, { status: 400 });
    }

    const feedsData = readFeeds();
    
    // Find the feed to update
    const feedIndex = feedsData.feeds.findIndex(feed => feed.url === originalUrl);
    if (feedIndex === -1) {
      return NextResponse.json({ error: 'RSS source not found' }, { status: 404 });
    }

    // If URL is changing, check if new URL already exists
    if (originalUrl !== url) {
      const existingFeed = feedsData.feeds.find(feed => feed.url === url);
      if (existingFeed) {
        return NextResponse.json({ error: 'RSS source with this URL already exists' }, { status: 409 });
      }
    }

    // Update the feed
    const updatedFeed = {
      url,
      image: image || '',
      ...(isPodcast && { isPodcast: true }),
      ...(isTopChannel && { isTopChannel: true }),
      ...(isUpAndComing && { isUpAndComing: true }),
      ...(title && { title })
    };

    feedsData.feeds[feedIndex] = updatedFeed;

    // Write back to file
    if (!writeFeeds(feedsData)) {
      return NextResponse.json({ error: 'Failed to update RSS source' }, { status: 500 });
    }

    return NextResponse.json({ message: 'RSS source updated successfully', feed: updatedFeed });
  } catch (error) {
    console.error('Error updating RSS source:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove RSS source
export async function DELETE(request) {
  try {
    const { url, userEmail } = await request.json();

    // Check admin authentication
    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    if (!url) {
      return NextResponse.json({ error: 'RSS URL is required' }, { status: 400 });
    }

    const feedsData = readFeeds();
    
    // Find the feed to delete
    const feedIndex = feedsData.feeds.findIndex(feed => feed.url === url);
    if (feedIndex === -1) {
      return NextResponse.json({ error: 'RSS source not found' }, { status: 404 });
    }

    // Remove the feed
    const deletedFeed = feedsData.feeds.splice(feedIndex, 1)[0];

    // Write back to file
    if (!writeFeeds(feedsData)) {
      return NextResponse.json({ error: 'Failed to delete RSS source' }, { status: 500 });
    }

    return NextResponse.json({ message: 'RSS source deleted successfully', feed: deletedFeed });
  } catch (error) {
    console.error('Error deleting RSS source:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 