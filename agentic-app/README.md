# Veo Video Generator

A Next.js application for orchestrating Google Veo video generation requests. Capture a prompt, optionally attach up to two reference images, and relay everything to the `veo-3.1-generate-preview` model. The UI surfaces the raw API response so you can inspect operation metadata immediately.

## Prerequisites

- Node.js 18+
- Google Generative AI API key with access to Veo models (`GOOGLE_GENAI_API_KEY`)

Create an `.env.local` file based on the provided template:

```bash
cp .env.local.example .env.local
```

Then populate `GOOGLE_GENAI_API_KEY`.

## Local Development

```bash
npm install
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) and submit the form to dispatch a Veo request. The response pane renders the full JSON payload from Google.

## Production Build

```bash
npm run build
npm run start
```

## Deployment

The project is configured for Vercel. Deploy with:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-1eb780d1
```
