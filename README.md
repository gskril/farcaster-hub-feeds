# Farcaster Channel Feeds

Easily generate RSS, Atom, and JSON feeds directly from a Farcaster Hub.

## Run Locally

Install the [Vercel CLI](https://vercel.com/docs/cli)

```bash
npm i -g vercel
```

Install dependencies:

```bash
yarn install
```

Run the development server

```bash
vercel dev
```

## Configuration

Every request must specify a data source via one of the following query parameters:

- `hub` — a Farcaster Hub URL including the HTTP port (eg `https://yourfarcasterhub.com`).
- `neynar-api-key` — a [Neynar](https://neynar.com) API key. When present, requests are routed to `https://snapchain-api.neynar.com` with the key passed as the `x-api-key` header.

If neither is provided, the API responds with `400 Bad Request`.

## Deploy

I run this app on Vercel Serverless Functions. There are no environment variables. Feel free to deploy your own instance.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fgskril%2Ffarcaster-hub-feeds&demo-title=Farcaster%20Hub%20Feeds&demo-url=https%3A%2F%2Ffeeds.fcstr.xyz)
