# NFL RSS News Reader

An RSS-based news reader that fetches and displays the latest NFL news from various sources. Built with Next.js, this project allows users to stay updated with the latest NFL headlines in a clean and user-friendly interface.

## Features
- Fetches and parses NFL news from RSS feeds.
- Groups articles by source and displays them with custom feed logos when available.
- Displays headlines, summaries, and links to full articles.
- Responsive and mobile-friendly design.
- Automatic updates at regular intervals.
- Lightweight and optimized for performance.

## Technologies Used
- **Next.js** – Server-side rendering and frontend framework.
- **RSS Parser Library** – For fetching and parsing RSS feeds.
- **Tailwind CSS** – For styling and responsive design.
- **JSON file** – To store feed URLs and associated metadata.


## Configuration
### RSS Feeds
- The different rss feeds are stored in data/feeds.json
- Example:
  ```json
  {
    "feeds": [
      {"url": "https://www.espn.com/espn/rss/nfl/news", "image": ""},
      {"url": "https://www.nbcsports.com/profootballtalk.rss", "image": ""}
    ]
  }
  ```
- If an image URL is provided, it will replace the default feed logo.

### Fetching & Parsing Data
- The API route (`/api/rss/route.js`) fetches RSS data using Fetch API and parses the response.
- Articles are grouped by their source domains.
- Example:
  ```js
  async function fetchRSS() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/rss`, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch RSS data");
    const data = await response.json();
    return data.articles || [];
  }
  ```

  **MAKE SURE TO REPLACEE THE DOMAIN BEFORE HOSTING IN THE EXPORTS FILE "next.config.js**

### Frontend Display
- The home page (`page.js`) fetches articles on the server and groups them by source.
- Articles are displayed dynamically in a grid layout.

### Styling
- The project uses Tailwind CSS for styling.
- A custom font (`Montage.ttf`) is included for the navigation title.


## Usage
- Open `http://localhost:3000` in your browser to view the news reader.
- Click on headlines to read full articles from their sources.
- Modify `feeds.json` to add or remove RSS sources.
- Customize styling via Tailwind classes or `globals.css`.
