## Local Development Setup

### Prerequisites
- **Node.js and npm:** This project requires Node.js and npm to be installed on your system.
  - Download and install from [nodejs.org](https://nodejs.org/)
  - Verify installation by running: `node --version` and `npm --version`

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Create a `.env.local` file in the root directory
   - Add your environment variables (see `.env.example` for reference)

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Go to `http://localhost:3000`
   - The local development site should be running

Any questions? Check this README.md for more information.

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


# TASKS 
- [ ] Make sure the title and descriptions are added for all pages
- [ ] Make sure the right icon files are uploaded and the favicon updated for the project
