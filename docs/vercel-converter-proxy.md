# Vercel Backend-Style PPTX Proxy

This gives you a simple Vercel endpoint while keeping heavy conversion in a dedicated converter service.

## What this does

- `POST /api/convert-pptx` on Vercel accepts multipart `file`.
- It forwards the file to an upstream converter URL.
- It returns PDF bytes back to frontend.

## Why this pattern

- Vercel endpoint stays simple and serverless-friendly.
- LibreOffice stays outside Vercel (Docker/service), where binaries are reliable.

## Files

- `api/convert-pptx.js`
- `api/health.js`
- `vercel.json`

## Required env var on Vercel

```bash
PPTX_CONVERTER_UPSTREAM_URL=https://your-real-converter.example.com/convert
```

## Frontend env

Set this in your frontend env (same project):

```bash
VITE_PPTX_CONVERTER_URL=/api/convert-pptx
```

## Quick test

```bash
curl -X POST https://your-vercel-domain/api/convert-pptx \
  -F "file=@/absolute/path/to/deck.pptx" \
  --output converted.pdf
```
