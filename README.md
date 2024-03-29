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

## Deploy

I run this app on Vercel Serverless Functions. There are no environment variables and all endpoints allow you to specify a custom Farcaster hub. Feel free to deploy your own instance.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fgskril%2Ffarcaster-hub-feeds&demo-title=Farcaster%20Hub%20Feeds&demo-url=https%3A%2F%2Ffeeds.fcstr.xyz)
