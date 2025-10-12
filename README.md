# Farcaster Hub Feeds

Generate RSS, Atom, and JSON feeds from Farcaster Hub data. Built with Hono and Cloudflare Workers.

## Features

- Generate feeds for Farcaster channels
- Generate feeds for user profiles
- Support for RSS, Atom, and JSON feed formats
- Filter user feeds by parent URL (channel)
- Configurable Farcaster Hub endpoint
- Fast edge deployment with Cloudflare Workers

## Setup

### Prerequisites

- Node.js 18+ or compatible package manager
- Cloudflare account (for deployment)

### Installation

```bash
npm install
```

### Development

Run the development server locally:

```bash
npm run dev
```

This will start Wrangler's local development server at `http://localhost:8787`.

### Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

You'll need to authenticate with Cloudflare on first deployment.

## API Endpoints

### Channel Feeds

Get feeds for a specific Farcaster channel:

```
GET /{feedType}/channel?url={channel_url}
```

**Parameters:**
- `feedType`: Feed format - `rss`, `atom`, or `json`
- `url`: Channel URL (required)
- `hub`: Custom Farcaster Hub URL (optional, defaults to `DEFAULT_HUB` env var)
- `limit`: Maximum number of casts (optional, default: 1000)

**Example:**
```
GET /rss/channel?url=https://warpcast.com/~/channel/farcaster
```

### User Feeds

Get feeds for a specific user by FID:

```
GET /{feedType}/user/{fid}
```

**Parameters:**
- `feedType`: Feed format - `rss`, `atom`, or `json`
- `fid`: Farcaster ID (required, in URL path)
- `parent_url`: Filter casts by channel URL (optional)
- `hub`: Custom Farcaster Hub URL (optional, defaults to `DEFAULT_HUB` env var)
- `limit`: Maximum number of casts (optional, default: 1000)

**Example:**
```
GET /rss/user/3?parent_url=https://warpcast.com/~/channel/farcaster
```

## Configuration

### Environment Variables

Set in `wrangler.toml`:

```toml
[vars]
DEFAULT_HUB = "https://hoyt.farcaster.xyz:2281"
```

Or configure via Cloudflare Dashboard for production secrets.

## Project Structure

```
src/
├── index.ts              # Main Hono app and routes
├── lib/
│   ├── farcaster.ts      # Farcaster Hub API client
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Utility functions
└── routes/
    ├── channel.ts        # Channel feed handler
    └── user.ts           # User feed handler
```

## Migration from Vercel

This project has been refactored from Vercel Serverless Functions to Cloudflare Workers. The old Vercel API routes are in the `api/` directory and can be removed after verifying the new implementation works correctly.

## License

MIT
