## Week 1 Backend Slice

This repo now includes a thin Flask backend in [backend](/Users/gurbirdhaliwal/Desktop/crowreport/profootball/backend) for the NFL prediction game MVP. It reads and writes through Supabase and uses ESPN as the live schedule provider.

What is intentionally in scope right now:
- real Flask app running locally
- Supabase-backed games table
- repeatable ESPN fetch/import script
- working `GET /api/games`
- seed fallback when the live feed is unavailable or off-season

What is intentionally out of scope right now:
- auth
- scoring/model work
- leaderboard/prizes
- production deployment polish

## Backend Quickstart

Install Python dependencies:

```bash
python3 -m pip install -r backend/requirements.txt
```

Set your live API key in `.env` or your shell:

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Optional ESPN overrides:

```bash
export ESPN_SITE_API_BASE_URL=https://site.api.espn.com/apis/site/v2/sports/football/nfl
export ESPN_CORE_API_BASE_URL=https://sports.core.api.espn.com/v2/sports/football/leagues/nfl
```

Create the Supabase table from the bundled SQL:

```bash
python3 -m backend.scripts.init_db
```

That writes the schema file to [backend/supabase_schema.sql](/Users/gurbirdhaliwal/Desktop/crowreport/profootball/backend/supabase_schema.sql). Run that SQL in the Supabase SQL Editor once.

Pull one week of games into Supabase:

```bash
python3 -m backend.scripts.sync_games --season 2025 --week 1
```

Notes:
- The sync command tries the ESPN site scoreboard API first and falls back to the ESPN core events API.
- If ESPN returns no games, it falls back to the bundled seed file in [backend/data/seed_games.json](/Users/gurbirdhaliwal/Desktop/crowreport/profootball/backend/data/seed_games.json).
- A later live ESPN sync for the same season/week replaces any seed fallback rows for that week.
- The Flask read path expects Supabase to be configured.

Run Flask locally from the repo root:

```bash
flask run
```

Because there is a root [app.py](/Users/gurbirdhaliwal/Desktop/crowreport/profootball/app.py) shim, `flask run` works directly from the project root.

Test the route with `curl`:

```bash
curl "http://127.0.0.1:5000/api/games?season=2025&week=1&limit=4"
```

Example response shape:

```json
{
  "games": [
    {
      "id": "seed-2025-w1-dal-phi",
      "date": "2025-09-05T00:20:00Z",
      "week": 1,
      "status": "scheduled",
      "source": "espn-site-api",
      "homeTeam": {
        "name": "Philadelphia Eagles",
        "record": "0-0"
      },
      "awayTeam": {
        "name": "Dallas Cowboys",
        "record": "0-0"
      }
    }
  ],
  "meta": {
    "count": 1,
    "season": 2025,
    "week": 1,
    "limit": 4,
    "status": null
  }
}
```

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
